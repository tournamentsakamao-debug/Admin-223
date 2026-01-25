
import { createClient } from '@supabase/supabase-js';
import { Tournament, User, Message, UserRole, JoinRequest, GlobalConfig, WithdrawalRequest, WalletAddRequest } from './types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const KEYS = {
  CURRENT_USER: 'at_curr_user_v2',
  TARGET_CHAT: 'at_target_chat'
};

const ADMIN_ID = 'ADMIN_GLOBAL_ID';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'prounknown055@gmail.com'; // Master Admin Password
const TX_COOLDOWN = 5 * 60 * 60 * 1000;

const cleanMath = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

const parseCleanNumber = (val: any): number => {
  if (typeof val === 'number') return isFinite(val) ? val : 0;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const PaymentEngine = {
  createRazorpayOrder: async (amount: number, userId: string) => {
    const safeAmount = parseCleanNumber(amount);
    if (safeAmount <= 0) return { success: false, message: "Invalid amount" };
    
    console.log(`[PAYMENT-ENGINE] Preparing order for Operator: ${userId} Amount: ₹${safeAmount}`);
    await new Promise(r => setTimeout(r, 1200));
    return {
      success: true,
      orderId: `order_${Math.random().toString(36).substr(2, 9)}`,
      amount: safeAmount * 100,
      currency: "INR"
    };
  }
};

export const DB = {
  supabase,

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setCurrentUser: (u: User | null) => {
    if (u) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(u));
    else localStorage.removeItem(KEYS.CURRENT_USER);
  },

  revalidateSession: async (): Promise<User | null> => {
    const localUser = DB.getCurrentUser();
    if (!localUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', localUser.id)
      .single();

    if (error || !data || data.is_blocked) {
      DB.setCurrentUser(null);
      return null;
    }

    DB.setCurrentUser(data);
    return data;
  },

  setTargetChat: (userId: string | null) => {
    if (userId) localStorage.setItem(KEYS.TARGET_CHAT, userId);
    else localStorage.removeItem(KEYS.TARGET_CHAT);
  },
  getTargetChat: () => localStorage.getItem(KEYS.TARGET_CHAT),

  login: async (username, password): Promise<User | null> => {
    const { data } = await supabase.from('users')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('password', password)
      .single();
      
    if (data) {
      if (data.is_blocked) return null;
      DB.setCurrentUser(data);
      return data;
    }
    return null;
  },

  register: async (username, password): Promise<{ success: boolean; message: string }> => {
    const cleanUsername = username.trim().toLowerCase();
    
    // Loopholes Prevention: Cannot register as admin or with admin username
    if (cleanUsername === ADMIN_USERNAME) {
      return { success: false, message: "Username reserved." };
    }

    const { data: existing } = await supabase.from('users').select('*').eq('username', cleanUsername).single();
    if (existing) return { success: false, message: "Username already exists." };
    
    const { error } = await supabase.from('users').insert([{
      username: cleanUsername,
      password,
      role: UserRole.PLAYER, // Force all registrations to PLAYER role
      wallet_balance: 0,
      joined_at: new Date().toISOString()
    }]);
    return error ? { success: false, message: "Registration failed." } : { success: true, message: "Registration successful!" };
  },

  getTournaments: async (): Promise<Tournament[]> => {
    const { data } = await supabase.from('tournaments').select('*, participants(*)').order('date', { ascending: false });
    return data || [];
  },

  // Security check for Admin-only functions
  isAdmin: (user: User | null) => user?.role === UserRole.ADMIN,

  addTournament: async (t: Tournament) => {
    const user = DB.getCurrentUser();
    if (!DB.isAdmin(user)) return false;

    const { error } = await supabase.from('tournaments').insert([{
        id: t.id,
        name: t.name,
        gameName: t.gameName,
        mode: t.mode,
        rules: t.rules,
        bannerUrl: t.bannerUrl,
        date: t.date,
        time: t.time,
        day: t.day,
        prizePool: t.prizePool,
        entryFee: t.entryFee,
        maxSlots: t.maxSlots,
        status: t.status
    }]);
    return !error;
  },

  deleteTournament: async (id: string) => {
    const user = DB.getCurrentUser();
    if (!DB.isAdmin(user)) return false;
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    return !error;
  },

  getUsers: async (): Promise<User[]> => {
    const user = DB.getCurrentUser();
    if (!DB.isAdmin(user)) return [];
    const { data } = await supabase.from('users').select('*').order('username', { ascending: true });
    return data || [];
  },

  toggleUserBlock: async (uid: string) => {
    const user = DB.getCurrentUser();
    if (!DB.isAdmin(user)) return false;
    const { data: target } = await supabase.from('users').select('is_blocked, role').eq('id', uid).single();
    if (!target || target.role === UserRole.ADMIN) return false; // Cannot block an admin

    const { error } = await supabase.from('users').update({ is_blocked: !target.is_blocked }).eq('id', uid);
    return !error;
  },

  toggleChatBlock: async (uid: string) => {
    const user = DB.getCurrentUser();
    if (!DB.isAdmin(user)) return false;
    const { data: target } = await supabase.from('users').select('is_chat_blocked').eq('id', uid).single();
    if (!target) return false;
    const { error } = await supabase.from('users').update({ is_chat_blocked: !target.is_chat_blocked }).eq('id', uid);
    return !error;
  },

  getConfig: async (): Promise<GlobalConfig> => {
    const { data } = await supabase.from('config').select('*').single();
    return data || { upiId: 'admin@upi', qrUrl: '', chatDisabled: false, autoPaymentEnabled: false };
  },

  saveConfig: async (config: GlobalConfig) => {
    const user = DB.getCurrentUser();
    if (!DB.isAdmin(user)) return false;
    const { error } = await supabase.from('config').upsert([config]);
    return !error;
  },

  updateUserBalance: async (userId: string, amount: number) => {
    const actor = DB.getCurrentUser();
    // Security: Only Admin can update balance OR system (simulated as current user reducing their own for join)
    // For joining a match, we allow a user to subtract their OWN balance
    if (!actor) return false;
    if (actor.role !== UserRole.ADMIN && actor.id !== userId) return false;
    if (actor.role !== UserRole.ADMIN && amount > 0) return false; // Non-admins can only subtract (spend)

    const { data: user } = await supabase.from('users').select('wallet_balance').eq('id', userId).single();
    if (!user) return false;

    const newBalance = cleanMath(parseCleanNumber(user.wallet_balance) + amount);
    if (newBalance < 0) return false; // Glitch prevention: Never allow negative balance

    const { error } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance, last_tx_at: new Date().toISOString() })
      .eq('id', userId);
    
    const local = DB.getCurrentUser();
    if (local && local.id === userId) {
      local.wallet_balance = newBalance;
      DB.setCurrentUser(local);
    }
    return !error;
  },

  getJoinRequests: async (): Promise<JoinRequest[]> => {
    const user = DB.getCurrentUser();
    if (!user) return [];
    
    let query = supabase.from('join_requests').select('*').order('timestamp', { ascending: false });
    if (user.role !== UserRole.ADMIN) {
      query = query.eq('userId', user.id);
    }
    const { data } = await query;
    return data || [];
  },

  createJoinRequest: async (data: any, payViaWallet: boolean) => {
    const user = DB.getCurrentUser();
    if (!user || user.is_blocked) return { success: false, message: "Account disabled." };

    if (payViaWallet) {
      const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', data.tournamentId).single();
      const fee = parseCleanNumber(tournament.entryFee);
      
      const success = await DB.updateUserBalance(user.id, -fee);
      if (!success) return { success: false, message: "Insufficient balance." };

      await supabase.from('participants').insert([{
        tournament_id: data.tournamentId,
        user_id: user.id,
        ff_name: data.ffName,
        ff_uid: data.ffUid
      }]);
      return { success: true, message: "Joined successfully!" };
    }

    const { error } = await supabase.from('join_requests').insert([{ ...data, timestamp: Date.now(), status: 'PENDING' }]);
    return error ? { success: false, message: "Error submitting proof." } : { success: true, message: "Sent for verification." };
  },

  approveJoinRequest: async (id: string) => {
    const user = DB.getCurrentUser();
    if (!DB.isAdmin(user)) return false;

    const { data: req } = await supabase.from('join_requests').select('*').eq('id', id).single();
    if (!req) return false;
    
    await supabase.from('participants').insert([{
      tournament_id: req.tournamentId,
      user_id: req.userId,
      ff_name: req.ffName,
      ff_uid: req.ffUid
    }]);
    await supabase.from('join_requests').update({ status: 'APPROVED' }).eq('id', id);
    return true;
  },

  getWithdrawals: async (): Promise<WithdrawalRequest[]> => {
    const user = DB.getCurrentUser();
    if (!user) return [];
    let query = supabase.from('withdrawals').select('*').order('timestamp', { ascending: false });
    if (user.role !== UserRole.ADMIN) {
      query = query.eq('userId', user.id);
    }
    const { data } = await query;
    return data || [];
  },

  requestWithdrawal: async (userId: string, username: string, amount: number, upiId: string) => {
    const safeAmount = parseCleanNumber(amount);
    if (safeAmount <= 0) return false;

    const success = await DB.updateUserBalance(userId, -safeAmount);
    if (!success) return false;

    await supabase.from('withdrawals').insert([{
      userId, username, amount: safeAmount, upiId, timestamp: Date.now(), status: 'PENDING'
    }]);
    return true;
  },

  getWalletAdds: async (): Promise<WalletAddRequest[]> => {
    const user = DB.getCurrentUser();
    if (!user) return [];
    let query = supabase.from('wallet_adds').select('*').order('timestamp', { ascending: false });
    if (user.role !== UserRole.ADMIN) {
      query = query.eq('userId', user.id);
    }
    const { data } = await query;
    return data || [];
  },

  requestWalletAdd: async (userId: string, amount: number, utr: string) => {
    const safeAmount = parseCleanNumber(amount);
    if (safeAmount <= 0) return false;

    const { error } = await supabase.from('wallet_adds').insert([{
      userId, amount: safeAmount, utr, timestamp: Date.now(), status: 'PENDING'
    }]);
    return !error;
  },

  setWinner: async (tId: string, winnerUserId: string, prize: string) => {
    const user = DB.getCurrentUser();
    if (!DB.isAdmin(user)) return false;

    const prizeAmt = parseCleanNumber(prize);
    await supabase.from('tournaments').update({ status: 'COMPLETED', winnerId: winnerUserId }).eq('id', tId);
    return await DB.updateUserBalance(winnerUserId, prizeAmt);
  },

  getMessages: async (uid1: string, uid2: string): Promise<Message[]> => {
    const user = DB.getCurrentUser();
    if (!user) return [];
    // Ensure user only fetches their own messages unless they are admin
    if (user.role !== UserRole.ADMIN && user.id !== uid1 && user.id !== uid2) return [];

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${uid1},receiver_id.eq.${uid2}),and(sender_id.eq.${uid2},receiver_id.eq.${uid1})`)
      .order('timestamp', { ascending: true });
    return data || [];
  },

  addMessage: async (msg: any) => {
    const user = DB.getCurrentUser();
    if (!user || user.is_blocked) return;
    await supabase.from('messages').insert([msg]);
  },

  getAdminId: () => ADMIN_ID,
  
  checkTxCooldown: (user: User) => {
    if (user.role === UserRole.ADMIN) return { canProceed: true };
    const last = new Date(user.last_tx_at || 0).getTime();
    const diff = Date.now() - last;
    if (diff < TX_COOLDOWN) return { canProceed: false, timeLeft: TX_COOLDOWN - diff };
    return { canProceed: true };
  }
};
