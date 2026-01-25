
import React, { useState, useEffect } from 'react';
import { Tournament, User, JoinRequest, GlobalConfig } from '../types';
// Fix: Removed non-existent PaymentEngine import from '../db'
import { DB } from '../db';
import { Calendar, Clock, Users, QrCode, CheckCircle2, X, Info, Gamepad2, Layers, Wallet, Key, Star, ShieldCheck, Target, Award, Trophy, Zap } from 'lucide-react';

interface HomeProps {
  currentUser: User;
}

const Home: React.FC<HomeProps> = ({ currentUser }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [config, setConfig] = useState<GlobalConfig>({ upiId: '', qrUrl: '', chatDisabled: false, autoPaymentEnabled: false });
  const [showPayModal, setShowPayModal] = useState<Tournament | null>(null);
  const [showRulesModal, setShowRulesModal] = useState<Tournament | null>(null);
  const [showCredsModal, setShowCredsModal] = useState<Tournament | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [ffName, setFfName] = useState('');
  const [ffUid, setFfUid] = useState('');
  const [utr, setUtr] = useState('');
  const [payViaWallet, setPayViaWallet] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const ts = await DB.getTournaments();
      const rs = await DB.getJoinRequests();
      const cfg = await DB.getConfig();
      setTournaments(ts);
      setRequests(rs);
      setConfig(cfg);
      setLoading(false);
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || isProcessing) return;

    if (!ffName.trim() || !ffUid.trim() || (!payViaWallet && !utr.trim())) {
      alert("Fill all operative data.");
      return;
    }

    setIsProcessing(true);
    
    // Future Payment Logic Hook
    if (!payViaWallet && config.autoPaymentEnabled) {
       console.log("Triggering future Auto-Payment Flow...");
       // Fix: PaymentEngine is not currently implemented or exported in db.ts
       // const order = await PaymentEngine.createRazorpayOrder(parseFloat(showPayModal.entryFee), currentUser.id);
    }

    const res = await DB.createJoinRequest({
      tournamentId: showPayModal.id,
      userId: currentUser.id,
      ffName,
      ffUid,
      utrNumber: payViaWallet ? 'WALLET_AUTH' : utr,
    }, payViaWallet);

    if (res.success) {
      alert(res.message);
      setShowPayModal(null);
      setFfName(''); setFfUid(''); setUtr('');
      setPayViaWallet(false);
    } else {
      alert(res.message);
    }
    setIsProcessing(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] font-orbitron">
      <span className="cyber-loader mb-6"></span>
      <p className="text-[#ff4d00] animate-pulse text-xs font-black uppercase tracking-[0.3em]">Synching Arena Protocol...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-10">
      <div className="relative rounded-[40px] overflow-hidden h-64 md:h-80 flex items-center px-6 md:px-12 border border-gray-800 shadow-2xl">
        <div className="scanner-line"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent z-10" />
        <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale" />
        <div className="relative z-20">
          <div className="flex items-center gap-3 text-[#ff4d00] font-black text-[9px] mb-4 uppercase tracking-[0.4em] bg-black/80 w-fit px-5 py-2 rounded-full border border-[#ff4d00]/30 backdrop-blur-xl">
            <Zap size={14} className="animate-pulse" /> Elite Arena Hub
          </div>
          <h1 className="text-4xl md:text-7xl font-orbitron font-bold text-white mb-2 italic tracking-tighter uppercase">Admin's Tournament</h1>
          <p className="text-gray-400 max-w-lg text-sm md:text-lg font-medium italic opacity-70">Battle for Glory. Withdraw in Seconds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {tournaments.map((t) => {
          const joined = t.participants.some(p => p.userId === currentUser.id);
          const full = t.participants.length >= t.maxSlots;
          const req = requests.find(r => r.tournamentId === t.id && r.userId === currentUser.id);

          return (
            <div key={t.id} className="bg-[#151517] border border-gray-800 rounded-[35px] overflow-hidden group shadow-2xl flex flex-col hover:border-[#ff4d00]/50 transition-all relative">
              {joined && (
                <div className="absolute top-5 right-5 z-10 bg-green-500 text-white font-black text-[9px] px-4 py-2 rounded-xl shadow-xl uppercase tracking-widest flex items-center gap-2 italic">
                  <CheckCircle2 size={12} /> Entry Valid
                </div>
              )}
              <div className="h-44 relative">
                <img src={t.bannerUrl || `https://picsum.photos/seed/${t.id}/600/300`} className="w-full h-full object-cover brightness-75 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#151517] to-transparent"></div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-4 group-hover:text-[#ff4d00] transition-colors">{t.name}</h3>
                
                <div className="bg-black/50 rounded-3xl p-6 border border-gray-800/50 mb-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-[#ff4d00]" />
                      <p className="text-sm font-black text-white italic">{t.date}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-[#ff4d00] tracking-widest">{t.time}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-800/50 flex justify-between">
                    <span className="text-[10px] font-black text-gray-500 uppercase">{t.participants.length} / {t.maxSlots} Players</span>
                    <button onClick={() => setShowRulesModal(t)} className="text-[10px] font-black text-[#ff4d00] uppercase tracking-widest hover:glow">Rules</button>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black p-4 rounded-2xl border border-gray-800">
                      <p className="text-[8px] text-gray-600 uppercase font-black">Prize</p>
                      <p className="text-lg font-black text-green-500">₹{t.prizePool}</p>
                    </div>
                    <div className="bg-black p-4 rounded-2xl border border-gray-800">
                      <p className="text-[8px] text-gray-600 uppercase font-black">Entry</p>
                      <p className="text-lg font-black text-white">₹{t.entryFee}</p>
                    </div>
                  </div>

                  {joined ? (
                    t.status === 'LIVE' ? (
                      <button onClick={() => setShowCredsModal(t)} className="w-full bg-[#ff4d00] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase italic tracking-widest shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all">
                        <Key size={18} /> Access Room
                      </button>
                    ) : (
                      <div className="w-full bg-green-500/10 text-green-500 font-black py-4 rounded-2xl text-center border border-green-500/20 text-[10px] uppercase tracking-widest italic">Wait for ID/Pass</div>
                    )
                  ) : req?.status === 'PENDING' ? (
                    <div className="w-full bg-yellow-500/10 text-yellow-500 font-black py-4 rounded-2xl text-center border border-yellow-500/20 text-[10px] uppercase tracking-widest italic animate-pulse">Verification Lab</div>
                  ) : full ? (
                    <div className="w-full bg-red-500/10 text-red-500 font-black py-4 rounded-2xl text-center border border-red-500/20 text-[10px] uppercase tracking-widest italic">Arena Closed</div>
                  ) : (
                    <button onClick={() => setShowPayModal(t)} className="w-full bg-[#ff4d00] text-white font-black py-4 rounded-2xl text-[11px] uppercase italic tracking-[0.2em] shadow-xl cursor-pointer hover:bg-orange-600 active:scale-95 transition-all">Secure Slot</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pay Modal with Cool Buffering */}
      {showPayModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
          <div className="bg-[#151517] border border-gray-800 w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl relative">
            <div className="scanner-line"></div>
            <button onClick={() => !isProcessing && setShowPayModal(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white cursor-pointer transition-all"><X size={24}/></button>
            <div className="p-10 text-center bg-[#1a1a1c] border-b border-gray-800">
              <h3 className="text-xl font-orbitron font-bold text-white uppercase italic tracking-tighter">SECURE PAYMENT: ₹{showPayModal.entryFee}</h3>
            </div>
            <div className="p-10 space-y-6">
              <button 
                onClick={() => setPayViaWallet(!payViaWallet)} 
                className={`w-full p-6 rounded-3xl border flex items-center justify-between transition-all cursor-pointer ${payViaWallet ? 'bg-[#ff4d00]/10 border-[#ff4d00] shadow-[0_0_20px_rgba(255,77,0,0.2)]' : 'bg-black/40 border-gray-800'}`}
              >
                <div className="flex items-center gap-4">
                  <Wallet className={payViaWallet ? 'text-[#ff4d00]' : 'text-gray-500'} />
                  <div className="text-left font-black uppercase"><p className="text-[10px] text-white">Elite Wallet</p><p className="text-[8px] text-gray-500">Balance: ₹{currentUser.wallet_balance}</p></div>
                </div>
                {payViaWallet && <CheckCircle2 size={16} className="text-[#ff4d00]" />}
              </button>

              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <input required placeholder="In-Game Operative Name" value={ffName} onChange={e => setFfName(e.target.value)} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold text-xs focus:border-[#ff4d00] outline-none" />
                <input required placeholder="Player UID" value={ffUid} onChange={e => setFfUid(e.target.value)} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold text-xs focus:border-[#ff4d00] outline-none" />
                {!payViaWallet && <input required placeholder="Transaction Reference (UTR)" value={utr} onChange={e => setUtr(e.target.value)} className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl p-5 text-white font-bold text-xs focus:border-[#ff4d00] outline-none" />}
                
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className={`w-full text-white font-black py-5 rounded-3xl uppercase text-[10px] tracking-[0.3em] italic shadow-2xl transition-all cursor-pointer ${isProcessing ? 'btn-loading bg-gray-700' : 'bg-[#ff4d00] hover:bg-orange-600'}`}
                >
                  {isProcessing ? "Authorizing Match..." : (payViaWallet ? 'Confirm & Join' : 'Deploy Proof')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
