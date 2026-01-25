
import { createClient } from '@supabase/supabase-js';
import { Tournament, User, Message, UserRole, JoinRequest, GlobalConfig, WithdrawalRequest, WalletAddRequest, ParticipantInfo } from './types';

const SUPABASE_URL = 'https://tzymckfxeatibiuhvqwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eW1ja2Z4ZWF0aWJpdWh2cXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzE3NTMsImV4cCI6MjA4NDkwNzc1M30.N6KxcDLi1o54RKEGf6ZDzj3J2t50gy0YAPMiEOJQ3yQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const KEYS = {
  CURRENT_USER: 'at_curr_user_v3',
  TARGET_CHAT: 'at_target_chat'
};

const ADMIN_ID = '00000000-0000-0000-0000-000000000000';
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
    const { data, error } = await supabase.from('users')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('password', password)
      .single();
      
    if (error) {
        console.error("Login Error:", error.message);
        return null;
    }

    if (data) {
      if (data.is_blocked) return null;
      DB.setCurrentUser(data);
      return data;
    }
    return null;
  },

  register: async (username, password): Promise<{ success: boolean; message: string }> => {
    const cleanUsername = username.trim().toLowerCase();
    
    // Check if exists
    const { data: existing } = await supabase.from('users').select('id').eq('username', cleanUsername).single();
    if (existing) return { success: false, message: "Username Taken." };
    
    const { error } = await supabase.from('users').insert([{
      username: cleanUsername,
      password: password,
      role: 'PLAYER',
      wallet_balance: 0
    }]);

    if (error) return { success: false, message: "Reg Failed: " + error.message };
    return { success: true, message: "Reg Successful! Login Now." };
  },

  getTournaments: async (): Promise<Tournament[]> => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*, participants(*)')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    
    return data.map(t => ({
      id: t.id,
      name: t.name,
      gameName: t.game_name,
      mode: t.mode,
      rules: t.rules,
      bannerUrl: t.banner_url,
      date: t.date,
      time: t.time,
      day: t.day || 'Daily',
      prizePool: t.prize_pool,
      entryFee: t.entry_fee,
      maxSlots: t.max_slots,
      status: t.status,
      gameId: t.game_id,
      gamePassword: t.game_password,
      winnerId: t.winner_id,
      participants: (t.participants || []).map((p: any) => ({
        userId: p.user_id,
        ffName: p.ff_name,
        ffUid: p.ff_uid,
        slotNo: p.slot_no
      }))
    }));
  },

  getUsers: async (): Promise<User[]> => {
    const { data } = await supabase.from('users').select('*').order('username', { ascending: true });
    return data || [];
  },

  getConfig: async (): Promise<GlobalConfig> => {
    const { data } = await supabase.from('config').select('*').eq('id', 1).single();
    return data ? {
        upiId: data.upi_id,
        qrUrl: data.qr_url,
        chatDisabled: data.chat_disabled,
        autoPaymentEnabled: data.auto_payment_enabled
    } : { upiId: 'admin@upi', qrUrl: '', chatDisabled: false, autoPaymentEnabled: false };
  },

  saveConfig: async (config: GlobalConfig) => {
    const { error } = await supabase.from('config').upsert([{
        id: 1,
        upi_id: config.upiId,
        qr_url: config.qrUrl,
        chat_disabled: config.chatDisabled,
        auto_payment_enabled: config.autoPaymentEnabled
    }]);
    return !error;
  },

  updateUserBalance: async (userId: string, amount: number) => {
    const { data: user } = await supabase.from('users').select('wallet_balance').eq('id', userId).single();
    if (!user) return false;

    const newBalance = cleanMath(parseCleanNumber(user.wallet_balance) + amount);
    if (newBalance < 0) return false;

    const { error } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance, last_tx_at: new Date().toISOString() })
      .eq('id', userId);
    
    return !error;
  },

  getJoinRequests: async (): Promise<JoinRequest[]> => {
    const user = DB.getCurrentUser();
    if (!user) return [];
    let query = supabase.from('join_requests').select('*').order('timestamp', { ascending: false });
    if (user.role !== 'ADMIN') query = query.eq('user_id', user.id);
    const { data } = await query;
    return (data || []).map(r => ({
      id: r.id,
      tournamentId: r.tournament_id,
      userId: r.user_id,
      ffName: r.ff_name,
      ffUid: r.ff_uid,
      utrNumber: r.utr_number,
      timestamp: r.timestamp,
      status: r.status
    }));
  },

  createJoinRequest: async (data: any, payViaWallet: boolean) => {
    const user = DB.getCurrentUser();
    if (!user) return { success: false, message: "No Auth." };

    if (payViaWallet) {
      const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', data.tournamentId).single();
      const fee = parseCleanNumber(tournament.entry_fee);
      const success = await DB.updateUserBalance(user.id, -fee);
      if (!success) return { success: false, message: "Low Balance." };

      await supabase.from('participants').insert([{
        tournament_id: data.tournamentId,
        user_id: user.id,
        ff_name: data.ffName,
        ff_uid: data.ffUid
      }]);
      return { success: true, message: "Joined Match!" };
    }

    const { error } = await supabase.from('join_requests').insert([{ 
        tournament_id: data.tournamentId,
        user_id: user.id,
        ff_name: data.ffName,
        ff_uid: data.ffUid,
        utr_number: data.utrNumber,
        timestamp: Date.now(), 
        status: 'PENDING' 
    }]);
    return error ? { success: false, message: "Proof Fail." } : { success: true, message: "Proof Sent." };
  },

  getWithdrawals: async (): Promise<WithdrawalRequest[]> => {
    const user = DB.getCurrentUser();
    if (!user) return [];
    let query = supabase.from('withdrawals').select('*').order('timestamp', { ascending: false });
    if (user.role !== 'ADMIN') query = query.eq('user_id', user.id);
    const { data } = await query;
    return (data || []).map(w => ({
      id: w.id,
      userId: w.user_id,
      username: w.username,
      amount: w.amount,
      upiId: w.upi_id,
      timestamp: w.timestamp,
      status: w.status
    }));
  },

  getWalletAdds: async (): Promise<WalletAddRequest[]> => {
    const user = DB.getCurrentUser();
    if (!user) return [];
    let query = supabase.from('wallet_adds').select('*').order('timestamp', { ascending: false });
    if (user.role !== 'ADMIN') query = query.eq('user_id', user.id);
    const { data } = await query;
    return (data || []).map(a => ({
      id: a.id,
      userId: a.user_id,
      amount: a.amount,
      utr: a.utr,
      timestamp: a.timestamp,
      status: a.status
    }));
  },

  addTournament: async (t: Tournament) => {
    const { error } = await supabase.from('tournaments').insert([{
      id: t.id,
      name: t.name,
      game_name: t.gameName,
      mode: t.mode,
      rules: t.rules,
      banner_url: t.bannerUrl,
      date: t.date,
      time: t.time,
      day: t.day || 'Daily',
      prize_pool: t.prizePool,
      entry_fee: t.entryFee,
      max_slots: t.maxSlots,
      status: t.status
    }]);
    return !error;
  },

  deleteTournament: async (id: string) => {
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    return !error;
  },

  approveJoinRequest: async (requestId: string) => {
    const { data: req } = await supabase.from('join_requests').select('*').eq('id', requestId).single();
    if (!req) return false;
    await supabase.from('participants').insert([{
      tournament_id: req.tournament_id,
      user_id: req.user_id,
      ff_name: req.ff_name,
      ff_uid: req.ff_uid
    }]);
    await supabase.from('join_requests').update({ status: 'APPROVED' }).eq('id', requestId);
    return true;
  },

  requestWithdrawal: async (userId: string, username: string, amount: number, upiId: string) => {
    const user = DB.getCurrentUser();
    if (!user) return false;
    const success = await DB.updateUserBalance(userId, -amount);
    if (!success) return false;
    const { error } = await supabase.from('withdrawals').insert([{
      user_id: userId,
      username: username,
      amount: amount,
      upi_id: upiId,
      timestamp: Date.now(),
      status: 'PENDING'
    }]);
    return !error;
  },

  requestWalletAdd: async (userId: string, amount: number, utr: string) => {
    const { error } = await supabase.from('wallet_adds').insert([{
      user_id: userId,
      amount: amount,
      utr: utr,
      timestamp: Date.now(),
      status: 'PENDING'
    }]);
    return !error;
  },

  getMessages: async (u1: string, u2: string): Promise<Message[]> => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${u1},receiver_id.eq.${u2}),and(sender_id.eq.${u2},receiver_id.eq.${u1})`)
      .order('timestamp', { ascending: true });
    return (data || []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      receiverId: m.receiver_id,
      text: m.text,
      timestamp: m.timestamp,
      read: m.read
    }));
  },

  addMessage: async (m: Message) => {
    const { error } = await supabase.from('messages').insert([{
      sender_id: m.senderId,
      sender_name: m.senderName,
      receiver_id: m.receiverId,
      text: m.text,
      timestamp: m.timestamp,
      read: m.read
    }]);
    return !error;
  },

  toggleUserBlock: async (userId: string) => {
    const { data: user } = await supabase.from('users').select('is_blocked').eq('id', userId).single();
    if (!user) return false;
    const { error } = await supabase.from('users').update({ is_blocked: !user.is_blocked }).eq('id', userId);
    return !error;
  },

  toggleChatBlock: async (userId: string) => {
    const { data: user } = await supabase.from('users').select('is_chat_blocked').eq('id', userId).single();
    if (!user) return false;
    const { error } = await supabase.from('users').update({ is_chat_blocked: !user.is_chat_blocked }).eq('id', userId);
    return !error;
  },

  getAdminId: () => ADMIN_ID,
  
  checkTxCooldown: (user: User) => {
    if (user.role === 'ADMIN') return { canProceed: true };
    const last = new Date(user.last_tx_at || 0).getTime();
    const diff = Date.now() - last;
    if (diff < TX_COOLDOWN) return { canProceed: false, timeLeft: TX_COOLDOWN - diff };
    return { canProceed: true };
  }
};
