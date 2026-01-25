
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tournament, JoinRequest, GlobalConfig, WithdrawalRequest, WalletAddRequest, UserRole, User } from '../types';
import { DB } from '../db';
import { Plus, Trash2, CheckCircle, XCircle, LayoutDashboard, Wallet, Gamepad2, ScrollText, Image as ImageIcon, X, Settings as SettingsIcon, Save, Upload, Calendar, Key, Trophy, ArrowUpRight, ArrowDownRight, Ban, MessageCircleOff, MessageCircle, Users, Target, ShieldAlert, Award, Clock, MessageSquareText, Zap } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [walletAdds, setWalletAdds] = useState<WalletAddRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<GlobalConfig>({ upiId: '', qrUrl: '', chatDisabled: false, autoPaymentEnabled: false });
  const [showModal, setShowModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState<Tournament | null>(null);
  const [view, setView] = useState<'OVERVIEW' | 'APPROVALS' | 'FINANCES' | 'USERS' | 'SETTINGS'>('OVERVIEW');
  
  const [formData, setFormData] = useState({
    name: '', gameName: 'Free Fire', mode: 'Solo', rules: '', bannerUrl: '', date: '', time: '', day: '', prizePool: '', entryFee: '', maxSlots: 48
  });

  const [settingsData, setSettingsData] = useState<GlobalConfig>(config);
  const [creds, setCreds] = useState({ gameId: '', gamePassword: '' });

  const loadAllData = async () => {
    const ts = await DB.getTournaments();
    const us = await DB.getUsers();
    const c = await DB.getConfig();
    const rs = await DB.getJoinRequests();
    const ws = await DB.getWithdrawals();
    const as = await DB.getWalletAdds();

    setTournaments(ts);
    setRequests(rs);
    setWithdrawals(ws);
    setWalletAdds(as);
    setUsers(us);
    setConfig(c);
    setSettingsData(c);
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await DB.saveConfig(settingsData);
    setConfig(settingsData);
    alert("Protocol Synchronized.");
  };

  const handleUpdateCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showManageModal) return;
    
    const { error } = await DB.supabase
      .from('tournaments')
      .update({ 
        game_id: creds.gameId, 
        game_password: creds.gamePassword,
        status: 'LIVE' 
      })
      .eq('id', showManageModal.id);

    if (!error) {
      alert("Room Credentials Deployed!");
      setShowManageModal(null);
      setCreds({ gameId: '', gamePassword: '' });
      loadAllData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newT: Tournament = { 
      id: Math.random().toString(36).substr(2, 9), 
      ...formData, 
      maxSlots: Number(formData.maxSlots), 
      participants: [], 
      status: 'UPCOMING' 
    };
    await DB.addTournament(newT);
    loadAllData();
    setShowModal(false);
  };

  const handleFinanceAction = async (type: 'WITHDRAW' | 'DEPOSIT', id: string, status: string, userId: string, amount: number) => {
    if (status === 'APPROVED' || status === 'PAID') {
        if (type === 'DEPOSIT') {
            await DB.updateUserBalance(userId, amount);
            await DB.supabase.from('wallet_adds').update({ status: 'APPROVED' }).eq('id', id);
        } else {
            await DB.supabase.from('withdrawals').update({ status: 'PAID' }).eq('id', id);
        }
    } else {
        if (type === 'DEPOSIT') await DB.supabase.from('wallet_adds').update({ status: 'REJECTED' }).eq('id', id);
        else {
            await DB.updateUserBalance(userId, amount); // Return money on rejection
            await DB.supabase.from('withdrawals').update({ status: 'REJECTED' }).eq('id', id);
        }
    }
    loadAllData();
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING');
  const pendingWalletAdds = walletAdds.filter(w => w.status === 'PENDING');

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
           <h1 className="text-3xl font-orbitron font-bold text-white uppercase italic tracking-tighter leading-none">ADMIN'S COMMAND</h1>
           <p className="text-[10px] text-gray-500 font-black uppercase mt-2 tracking-widest">Master Control Protocol</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => setView('OVERVIEW')} className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all cursor-pointer ${view === 'OVERVIEW' ? 'bg-[#ff4d00] text-white border-[#ff4d00]' : 'text-gray-500 border-gray-800 hover:border-white/20'}`}>Arena</button>
          <button onClick={() => setView('APPROVALS')} className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all cursor-pointer ${view === 'APPROVALS' ? 'bg-[#ff4d00] text-white border-[#ff4d00]' : 'text-gray-500 border-gray-800 hover:border-white/20'}`}>Joins ({pendingRequests.length})</button>
          <button onClick={() => setView('FINANCES')} className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all cursor-pointer ${view === 'FINANCES' ? 'bg-[#ff4d00] text-white border-[#ff4d00]' : 'text-gray-500 border-gray-800 hover:border-white/20'}`}>Payments ({pendingWithdrawals.length + pendingWalletAdds.length})</button>
          <button onClick={() => setView('USERS')} className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all cursor-pointer ${view === 'USERS' ? 'bg-[#ff4d00] text-white border-[#ff4d00]' : 'text-gray-500 border-gray-800 hover:border-white/20'}`}>Operators</button>
          <button onClick={() => setView('SETTINGS')} className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all cursor-pointer ${view === 'SETTINGS' ? 'bg-[#ff4d00] text-white border-[#ff4d00]' : 'text-gray-500 border-gray-800 hover:border-white/20'}`}><SettingsIcon size={14} /></button>
          <button onClick={() => setShowModal(true)} className="bg-green-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl cursor-pointer hover:bg-green-700">New Match</button>
        </div>
      </div>

      {view === 'OVERVIEW' && (
        <div className="bg-[#151517] border border-gray-800 rounded-[35px] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-[#0a0a0b] text-gray-600 text-[10px] uppercase font-black">
              <tr><th className="px-8 py-5">Match</th><th className="px-8 py-5">Slots</th><th className="px-8 py-5">Status</th><th className="px-8 py-5">Control</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tournaments.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-white font-black uppercase italic">{t.name}</p>
                    <p className="text-[9px] text-gray-600">{t.date} @ {t.time}</p>
                  </td>
                  <td className="px-8 py-6 text-white font-black">{t.participants.length} / {t.maxSlots}</td>
                  <td className="px-8 py-6"><span className="px-3 py-1 rounded-lg bg-[#ff4d00]/10 text-[#ff4d00] text-[9px] font-black uppercase border border-[#ff4d00]/20">{t.status}</span></td>
                  <td className="px-8 py-6 flex gap-2">
                    <button onClick={() => { setShowManageModal(t); setCreds({ gameId: t.gameId || '', gamePassword: t.gamePassword || '' }); }} className="p-3 bg-gray-800 rounded-xl text-[#ff4d00] hover:bg-gray-700 cursor-pointer"><Key size={16}/></button>
                    <button onClick={() => DB.deleteTournament(t.id)} className="p-3 bg-gray-800 rounded-xl text-red-500 hover:bg-gray-700 cursor-pointer"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'APPROVALS' && (
        <div className="space-y-6">
           <h2 className="text-white font-black uppercase italic">Pending Entry Verifications</h2>
           {pendingRequests.map(r => (
             <div key={r.id} className="bg-[#151517] border border-gray-800 p-8 rounded-[35px] flex justify-between items-center shadow-2xl">
                <div>
                   <p className="text-white font-black text-xl italic uppercase">{r.ffName}</p>
                   <p className="text-xs text-[#ff4d00] font-black uppercase tracking-widest mt-1">UID: {r.ffUid}</p>
                   <p className="text-[9px] text-gray-600 font-bold uppercase mt-2">UTR: {r.utrNumber}</p>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => DB.approveJoinRequest(r.id)} className="px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase cursor-pointer hover:bg-green-700">Approve</button>
                   <button onClick={() => DB.supabase.from('join_requests').update({ status: 'REJECTED' }).eq('id', r.id)} className="px-6 py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase cursor-pointer">Reject</button>
                </div>
             </div>
           ))}
           {pendingRequests.length === 0 && <p className="text-center py-20 text-gray-700 font-black uppercase italic">Clear Queue.</p>}
        </div>
      )}

      {view === 'FINANCES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <div className="space-y-6">
              <h3 className="text-white font-black uppercase italic flex items-center gap-3"><ArrowDownRight className="text-green-500" /> Deposits</h3>
              {pendingWalletAdds.map(a => (
                <div key={a.id} className="bg-[#151517] border border-gray-800 p-6 rounded-[30px] shadow-xl">
                   <div className="flex justify-between items-start mb-4">
                      <div><p className="text-white font-black italic">₹{a.amount}</p><p className="text-[10px] text-gray-500 uppercase font-black">UTR: {a.utr}</p></div>
                      <div className="flex gap-2">
                        <button onClick={() => handleFinanceAction('DEPOSIT', a.id, 'APPROVED', a.userId, a.amount)} className="p-2 bg-green-600 text-white rounded-lg cursor-pointer"><CheckCircle size={16}/></button>
                        <button onClick={() => handleFinanceAction('DEPOSIT', a.id, 'REJECTED', a.userId, a.amount)} className="p-2 bg-red-600 text-white rounded-lg cursor-pointer"><XCircle size={16}/></button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
           <div className="space-y-6">
              <h3 className="text-white font-black uppercase italic flex items-center gap-3"><ArrowUpRight className="text-red-500" /> Withdrawals</h3>
              {pendingWithdrawals.map(w => (
                <div key={w.id} className="bg-[#151517] border border-gray-800 p-6 rounded-[30px] shadow-xl">
                   <div className="flex justify-between items-start mb-4">
                      <div><p className="text-white font-black italic">₹{w.amount}</p><p className="text-[10px] text-[#ff4d00] uppercase font-black">{w.upiId}</p></div>
                      <div className="flex gap-2">
                        <button onClick={() => handleFinanceAction('WITHDRAW', w.id, 'PAID', w.userId, w.amount)} className="p-2 bg-blue-600 text-white rounded-lg cursor-pointer"><CheckCircle size={16}/></button>
                        <button onClick={() => handleFinanceAction('WITHDRAW', w.id, 'REJECTED', w.userId, w.amount)} className="p-2 bg-red-600 text-white rounded-lg cursor-pointer"><XCircle size={16}/></button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {showManageModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl">
          <div className="bg-[#151517] border border-gray-800 w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl relative scale-in-center">
            <button onClick={() => setShowManageModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all cursor-pointer"><X size={24}/></button>
            <div className="p-10 text-center bg-[#1a1a1c] border-b border-gray-800">
              <h3 className="text-xl font-orbitron font-bold text-white uppercase italic tracking-tighter">ROOM AUTH</h3>
            </div>
            <form onSubmit={handleUpdateCreds} className="p-10 space-y-6">
              <input required placeholder="ROOM ID" value={creds.gameId} onChange={e => setCreds({...creds, gameId: e.target.value})} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold" />
              <input required placeholder="PASSWORD" value={creds.gamePassword} onChange={e => setCreds({...creds, gamePassword: e.target.value})} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold" />
              <button type="submit" className="w-full bg-[#ff4d00] text-white py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] italic shadow-2xl hover:bg-orange-600 transition-all cursor-pointer">Live Broadcast Credentials</button>
            </form>
          </div>
        </div>
      )}
      
      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/98 backdrop-blur-xl">
          <div className="bg-[#151517] border border-gray-800 w-full max-w-2xl rounded-[40px] overflow-hidden flex flex-col max-h-[95vh] shadow-2xl relative scale-in-center">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all cursor-pointer"><X size={24} /></button>
            <div className="p-8 border-b border-gray-800 bg-[#1a1a1c]">
              <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter">NEW ARENA</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <input required placeholder="Match Title" className="col-span-2 bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold outline-none focus:border-[#ff4d00]" onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required type="date" className="bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold" onChange={e => setFormData({...formData, date: e.target.value})} />
                <input required type="time" className="bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold" onChange={e => setFormData({...formData, time: e.target.value})} />
                <input placeholder="Entry (₹)" className="bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold" onChange={e => setFormData({...formData, entryFee: e.target.value})} />
                <input placeholder="Prize (₹)" className="bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold" onChange={e => setFormData({...formData, prizePool: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-[#ff4d00] text-white py-6 rounded-[30px] font-black uppercase tracking-widest text-xs italic shadow-2xl hover:bg-orange-600 transition-all cursor-pointer">Deploy Match</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
