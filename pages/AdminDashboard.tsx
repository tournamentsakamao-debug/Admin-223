
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
  const [showParticipantsModal, setShowParticipantsModal] = useState<Tournament | null>(null);
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
    
    // Fetch related financial and registration data via DB helper methods
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
    const interval = setInterval(loadAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'banner' | 'qr') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (field === 'banner') setFormData(prev => ({ ...prev, bannerUrl: base64String }));
        else setSettingsData(prev => ({ ...prev, qrUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await DB.saveConfig(settingsData);
    setConfig(settingsData);
    alert("System settings updated successfully!");
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

  const handleSetWinner = async (tId: string, userId: string, name: string) => {
    const t = tournaments.find(x => x.id === tId);
    if (!t) return;
    if (confirm(`Declare ${name} as the Winner?`)) {
      await DB.setWinner(tId, userId, t.prizePool);
      loadAllData();
      alert("Prize money distributed successfully!");
    }
  };

  const toggleBlock = async (uid: string) => {
    await DB.toggleUserBlock(uid);
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
          <button onClick={() => setView('FINANCES')} className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all cursor-pointer ${view === 'FINANCES' ? 'bg-[#ff4d00] text-white border-[#ff4d00]' : 'text-gray-500 border-gray-800 hover:border-white/20'}`}>Payments</button>
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
                    <button onClick={() => setShowManageModal(t)} className="p-3 bg-gray-800 rounded-xl text-[#ff4d00] hover:bg-gray-700 cursor-pointer"><Key size={16}/></button>
                    <button onClick={() => DB.deleteTournament(t.id)} className="p-3 bg-gray-800 rounded-xl text-red-500 hover:bg-gray-700 cursor-pointer"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'USERS' && (
        <div className="bg-[#151517] border border-gray-800 rounded-[35px] overflow-hidden shadow-2xl">
           <div className="p-8 bg-[#1a1a1c] border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-white font-black uppercase italic">Registered Operators</h2>
              <div className="text-[9px] text-gray-500 font-black uppercase">Total: {users.length}</div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-xs">
                <thead><tr className="bg-[#0a0a0b] text-gray-600 uppercase font-black text-[9px]"><th className="px-8 py-4">Username</th><th className="px-8 py-4">Wallet</th><th className="px-8 py-4">Status</th><th className="px-8 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-800">
                   {users.filter(u => u.role !== UserRole.ADMIN).map(u => (
                     <tr key={u.id} className="hover:bg-white/5 transition-all">
                       <td className="px-8 py-6 text-white font-black italic uppercase tracking-tight">{u.username}</td>
                       <td className="px-8 py-6 text-green-500 font-black italic">₹{u.wallet_balance}</td>
                       <td className="px-8 py-6">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${u.is_blocked ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                           {u.is_blocked ? 'Banned' : 'Active'}
                         </span>
                       </td>
                       <td className="px-8 py-6 flex items-center justify-end gap-3">
                         <button onClick={() => toggleBlock(u.id)} className={`p-3 rounded-xl transition-all cursor-pointer ${u.is_blocked ? 'bg-green-600 text-white' : 'bg-red-600/10 text-red-500 border border-red-500/20'}`}>
                           <Ban size={16} />
                         </button>
                         <button onClick={() => { DB.setTargetChat(u.id); navigate('/messages'); }} className="p-3 bg-[#ff4d00]/10 text-[#ff4d00] rounded-xl border border-[#ff4d00]/20 hover:bg-[#ff4d00] hover:text-white transition-all cursor-pointer">
                            <MessageSquareText size={16} />
                         </button>
                       </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {view === 'SETTINGS' && (
        <div className="bg-[#151517] border border-gray-800 rounded-[35px] p-10 max-w-2xl mx-auto shadow-2xl">
           <form onSubmit={handleSaveSettings} className="space-y-8">
             <h3 className="text-xl font-orbitron font-bold text-white uppercase italic tracking-tighter mb-4">Core Protocols</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Master UPI ID</label>
                   <input value={settingsData.upiId} onChange={e => setSettingsData({...settingsData, upiId: e.target.value})} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold outline-none focus:border-[#ff4d00]" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Automation Mode</label>
                   <button 
                    type="button"
                    onClick={() => setSettingsData({...settingsData, autoPaymentEnabled: !settingsData.autoPaymentEnabled})}
                    className={`w-full flex items-center justify-center gap-3 p-5 rounded-2xl font-black text-[10px] uppercase transition-all ${settingsData.autoPaymentEnabled ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                   >
                     <Zap size={14} /> {settingsData.autoPaymentEnabled ? 'Auto-Pay Active' : 'Manual Mode Only'}
                   </button>
                </div>
             </div>
             <button type="submit" className="w-full bg-[#ff4d00] text-white py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] italic shadow-2xl hover:bg-orange-600 transition-all cursor-pointer">Commit Protocol Updates</button>
           </form>
        </div>
      )}
      
      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/98 backdrop-blur-xl">
          <div className="bg-[#151517] border border-gray-800 w-full max-w-2xl rounded-[40px] overflow-hidden flex flex-col max-h-[95vh] shadow-2xl relative scale-in-center">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all cursor-pointer"><X size={24} /></button>
            <div className="p-8 border-b border-gray-800 bg-[#1a1a1c]">
              <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter">NEW ARENA</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
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
