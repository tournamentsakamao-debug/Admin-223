
import React, { useState, useEffect } from 'react';
import { User, Tournament, GlobalConfig, WithdrawalRequest, WalletAddRequest } from '../types';
import { DB } from '../db';
import { Award, Shield, Target, Trophy, Wallet, ArrowUpCircle, ArrowDownCircle, X, Key, CheckCircle2, Clock, Calendar, ShieldCheck, History, Timer, AlertTriangle, ChevronRight, Ban, Info } from 'lucide-react';

interface UserDashboardProps {
  user: User;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user: initialUser }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [deposits, setDeposits] = useState<WalletAddRequest[]>([]);
  const [showWalletModal, setShowWalletModal] = useState<'WITHDRAW' | 'DEPOSIT' | null>(null);
  const [config, setConfig] = useState<GlobalConfig>({ upiId: '', qrUrl: '', chatDisabled: false, autoPaymentEnabled: false });
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositUtr, setDepositUtr] = useState('');

  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAllData = async () => {
    const freshUser = await DB.revalidateSession();
    if (freshUser) setUser(freshUser);

    const ts = await DB.getTournaments();
    setMyTournaments(ts.filter(t => t.participants.some(p => p.userId === initialUser.id)));
    
    const ws = await DB.getWithdrawals();
    setWithdrawals(ws);
    
    const ds = await DB.getWalletAdds();
    setDeposits(ds);

    const cfg = await DB.getConfig();
    setConfig(cfg);
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 5000);
    return () => clearInterval(interval);
  }, [initialUser.id]);

  useEffect(() => {
    const updateCd = () => {
      const freshUser = DB.getCurrentUser();
      if (!freshUser) return;
      const cd = DB.checkTxCooldown(freshUser);
      if (!cd.canProceed && cd.timeLeft) {
        const totalSec = Math.floor(cd.timeLeft / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(null);
      }
    };
    updateCd();
    const t = setInterval(updateCd, 1000);
    return () => clearInterval(t);
  }, [user.last_tx_at]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Invalid amount.");
      return;
    }
    if (!upiId.trim()) {
      alert("Enter UPI ID.");
      return;
    }

    if (amt > user.wallet_balance) {
      alert("Insufficient funds.");
      return;
    }

    setIsSubmitting(true);
    const success = await DB.requestWithdrawal(user.id, user.username, amt, upiId);
    if (success) {
      alert("Withdrawal requested! Approval pending.");
      setShowWalletModal(null);
      setWithdrawAmount('');
      setUpiId('');
      await loadAllData();
    } else {
      alert("Wait for transaction cooldown.");
    }
    setIsSubmitting(false);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0 || !depositUtr.trim()) {
      alert("Invalid details.");
      return;
    }

    setIsSubmitting(true);
    const success = await DB.requestWalletAdd(user.id, amt, depositUtr);
    if (success) {
      alert("Proof submitted! Verification in progress.");
      setShowWalletModal(null);
      setDepositAmount('');
      setDepositUtr('');
      await loadAllData();
    } else {
      alert("Transaction failed.");
    }
    setIsSubmitting(false);
  };

  const allLogs = [...withdrawals, ...deposits].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-10 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-[#151517] border border-gray-800 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
          <div className="scanner-line"></div>
          <div className="w-36 h-36 rounded-[35px] bg-gradient-to-tr from-[#ff4d00] to-orange-400 flex items-center justify-center border-8 border-gray-900 shadow-2xl">
            <Shield size={60} className="text-white" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-orbitron font-bold text-white uppercase italic tracking-tighter leading-none">{user.username}</h1>
            <p className="text-[#ff4d00] font-black tracking-[0.4em] text-[10px] mb-8 mt-4 uppercase">Operator Level Account</p>
          </div>
        </div>

        <div className="bg-[#151517] border border-gray-800 rounded-[40px] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {user.is_blocked && (
            <div className="absolute inset-0 bg-red-900/60 backdrop-blur-md rounded-[40px] flex flex-col items-center justify-center z-[100] p-6 text-center">
              <Ban size={48} className="text-white mb-4" />
              <p className="font-black text-white uppercase italic tracking-widest text-lg">ACCESS REVOKED</p>
            </div>
          )}
          
          <div>
             <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Available Credit</p>
                <Wallet size={16} className="text-[#ff4d00]" />
             </div>
             <h3 className="text-5xl font-black text-white italic">₹{user.wallet_balance || 0}</h3>
          </div>
          
          <div className="mt-8 space-y-4">
            {timeLeft && (
              <div className="bg-[#ff4d00]/10 border border-[#ff4d00]/20 rounded-2xl p-4 flex items-center justify-center gap-3 text-[#ff4d00] animate-pulse">
                <Timer size={16} />
                <span className="text-[11px] font-black uppercase tracking-widest">Locked: {timeLeft}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
               <button 
                onClick={() => setShowWalletModal('DEPOSIT')} 
                disabled={!!timeLeft || user.is_blocked} 
                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border transition-all cursor-pointer group ${timeLeft || user.is_blocked ? 'opacity-20 grayscale cursor-not-allowed' : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-600 hover:text-white hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]'}`}
               >
                 <ArrowDownCircle size={24}/>
                 <span className="text-[10px] font-black uppercase tracking-wider">Deposit</span>
               </button>
               <button 
                onClick={() => setShowWalletModal('WITHDRAW')} 
                disabled={!!timeLeft || user.is_blocked} 
                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border transition-all cursor-pointer group ${timeLeft || user.is_blocked ? 'opacity-20 grayscale cursor-not-allowed' : 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/20 hover:bg-[#ff4d00] hover:text-white hover:shadow-[0_0_20px_rgba(255,77,0,0.3)]'}`}
               >
                 <ArrowUpCircle size={24}/>
                 <span className="text-[10px] font-black uppercase tracking-wider">Withdraw</span>
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="space-y-8">
           <div className="flex items-center gap-4 border-b border-gray-800 pb-6"><Trophy className="text-[#ff4d00]" size={24} /><h2 className="text-xl font-bold font-orbitron text-white uppercase italic tracking-tighter">Mission History</h2></div>
           <div className="space-y-6">
             {myTournaments.map(t => (
               <div key={t.id} className="bg-[#151517] border border-gray-800 p-8 rounded-[35px] flex flex-col shadow-xl hover:border-white/10 transition-all">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase italic">{t.name}</h3>
                      <p className="text-[9px] text-[#ff4d00] font-black uppercase mt-1 tracking-widest">{t.gameName} • {t.mode}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${t.status === 'LIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/20'}`}>{t.status}</span>
                 </div>
                 {t.status === 'LIVE' && t.gameId && (
                   <div className="bg-black/60 p-6 rounded-3xl border border-gray-800 flex justify-around text-center mt-2">
                     <div><p className="text-[8px] text-gray-600 font-black uppercase mb-1">Room ID</p><p className="text-xl font-black text-white font-mono">{t.gameId}</p></div>
                     <div className="w-px h-10 bg-gray-800"></div>
                     <div><p className="text-[8px] text-gray-600 font-black uppercase mb-1">Auth Code</p><p className="text-xl font-black text-[#ff4d00] font-mono">{t.gamePassword}</p></div>
                   </div>
                 )}
               </div>
             ))}
             {myTournaments.length === 0 && <p className="text-center py-20 bg-[#151517] rounded-[35px] border border-dashed border-gray-800 text-gray-700 font-black uppercase text-xs">No active missions found.</p>}
           </div>
        </div>

        <div className="space-y-8">
           <div className="flex items-center gap-4 border-b border-gray-800 pb-6"><History className="text-[#ff4d00]" size={24} /><h2 className="text-xl font-bold font-orbitron text-white uppercase italic tracking-tighter">Finance Logs</h2></div>
           <div className="space-y-4">
             {allLogs.map(log => (
               <div key={log.id} className="bg-[#151517] border border-gray-800 p-6 rounded-3xl flex items-center justify-between shadow-lg hover:bg-white/5 transition-all">
                 <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-2xl ${'upiId' in log ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{ 'upiId' in log ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}</div>
                   <div>
                     <p className="text-sm font-black text-white uppercase italic">{'upiId' in log ? 'Out' : 'In'}</p>
                     <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tight">{new Date(log.timestamp).toLocaleString()}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className={`text-sm font-black italic ${'upiId' in log ? 'text-red-500' : 'text-green-500'}`}>{ 'upiId' in log ? '-' : '+' }₹{log.amount}</p>
                   <p className={`text-[8px] font-black uppercase mt-1 px-2 py-0.5 rounded-full border inline-block ${log.status === 'PENDING' ? 'text-yellow-500 border-yellow-500/20' : (log.status === 'PAID' || log.status === 'APPROVED') ? 'text-green-500 border-green-500/20' : 'text-red-500 border-red-500/20'}`}>{log.status}</p>
                 </div>
               </div>
             ))}
             {allLogs.length === 0 && <p className="text-center py-20 bg-[#151517] rounded-[35px] border border-dashed border-gray-800 text-gray-700 font-black uppercase text-xs">No logs found.</p>}
           </div>
        </div>
      </div>

      {showWalletModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl transition-all duration-300">
          <div className="bg-[#151517] border border-gray-800 w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl relative scale-in-center">
            <div className="scanner-line"></div>
            <button onClick={() => !isSubmitting && setShowWalletModal(null)} className="absolute top-6 right-6 text-gray-400 cursor-pointer hover:text-white transition-all"><X size={24}/></button>
            <div className="p-10 text-center bg-[#1a1a1c] border-b border-gray-800">
              <h3 className="text-2xl font-orbitron font-bold text-white uppercase italic tracking-tighter">{showWalletModal}</h3>
            </div>
            <div className="p-10 space-y-6">
              {showWalletModal === 'DEPOSIT' ? (
                <form onSubmit={handleDeposit} className="space-y-6">
                  <div className="bg-white p-4 rounded-3xl w-44 h-44 mx-auto border-8 border-gray-900 overflow-hidden shadow-2xl">
                    {config.qrUrl ? <img src={config.qrUrl} className="w-full h-full object-contain" /> : <div className="h-full flex flex-col items-center justify-center text-gray-400 font-black uppercase text-[10px]"><Info size={24} className="mb-2" />N/A</div>}
                  </div>
                  <div className="bg-black/60 p-4 rounded-2xl border border-gray-800 text-center">
                     <p className="text-[9px] text-gray-600 font-black uppercase mb-1">Admin UPI</p>
                     <p className="text-xs text-white font-mono">{config.upiId}</p>
                  </div>
                  <div className="space-y-4">
                    <input required type="number" step="any" placeholder="Amount (₹)" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold outline-none focus:border-green-500" />
                    <input required placeholder="UTR Number" value={depositUtr} onChange={(e) => setDepositUtr(e.target.value)} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold outline-none focus:border-green-500" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className={`w-full bg-green-600 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-[10px] italic shadow-xl cursor-pointer hover:bg-green-700 transition-all ${isSubmitting ? 'btn-loading' : ''}`}>
                    {isSubmitting ? "Processing..." : "Deploy Proof"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-6">
                  <div className="bg-black/30 p-6 rounded-3xl border border-[#ff4d00]/20 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] text-gray-600 font-black uppercase">Balance</p>
                        <p className="text-3xl font-black text-white italic">₹{user.wallet_balance}</p>
                     </div>
                     <Wallet size={32} className="text-[#ff4d00] opacity-30" />
                  </div>
                  <div className="space-y-4">
                    <input required type="number" step="any" placeholder="Withdrawal (₹)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold outline-none focus:border-[#ff4d00]" />
                    <input required placeholder="Target UPI" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold outline-none focus:border-[#ff4d00]" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className={`w-full bg-[#ff4d00] text-white font-black py-5 rounded-3xl uppercase tracking-widest text-[10px] italic shadow-xl cursor-pointer hover:bg-orange-700 transition-all ${isSubmitting ? 'btn-loading' : ''}`}>
                    {isSubmitting ? "Verifying..." : "Initialize Transfer"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
