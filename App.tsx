
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, UserRole } from './types';
import { DB } from './db';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Messages from './pages/Messages';
import { Trophy, MessageSquare, User as UserIcon, LogOut, LayoutDashboard, Lock, User as UserCircle, Wallet, Shield, Zap, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(DB.getCurrentUser());
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBooting, setIsBooting] = useState(true);

  // Persistence Engine: Revalidate session on app start
  useEffect(() => {
    const revalidate = async () => {
      const validUser = await DB.revalidateSession();
      setCurrentUser(validUser);
      // Artificial delay for cool "booting" effect
      setTimeout(() => setIsBooting(false), 2000);
    };
    revalidate();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    if (!loginInput.trim() || !passwordInput.trim()) {
      setError("Credentials required.");
      setLoading(false);
      return;
    }

    if (isRegistering) {
      const result = await DB.register(loginInput, passwordInput);
      if (result.success) {
        alert("Account Initialized! Login to proceed.");
        setIsRegistering(false);
      } else {
        setError(result.message);
      }
    } else {
      const user = await DB.login(loginInput, passwordInput);
      if (user) {
        setCurrentUser(user);
      } else {
        setError("Auth Failed: Check logic or ban status.");
      }
    }
    setLoading(false);
  };

  const handleLogout = () => {
    DB.setCurrentUser(null);
    setCurrentUser(null);
  };

  // Cyber Boot Screen
  if (isBooting) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center font-orbitron overflow-hidden relative">
        <div className="scanner-line"></div>
        <div className="relative mb-10">
           <Trophy size={80} className="text-[#ff4d00] animate-bounce" />
           <div className="absolute inset-0 bg-[#ff4d00]/20 blur-3xl rounded-full"></div>
        </div>
        <h2 className="text-white text-3xl font-bold tracking-[0.5em] mb-2 uppercase italic">Admin's Tournament</h2>
        <div className="flex items-center gap-3 text-[#ff4d00] text-xs font-black uppercase tracking-widest animate-pulse">
           <Terminal size={14} /> Synchronizing Secure Database...
        </div>
        <div className="mt-8 w-64 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
           <div className="h-full bg-[#ff4d00] shadow-[0_0_10px_#ff4d00] w-1/2 animate-[loading-slide_1.5s_infinite]"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-4 font-inter">
        <div className="max-w-md w-full bg-[#151517] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="scanner-line"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff4d00] to-transparent"></div>
          
          <div className="flex justify-center mb-6">
            <div className="bg-[#ff4d00] p-4 rounded-2xl shadow-[0_0_30px_rgba(255,77,0,0.3)]">
              <Shield size={48} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-orbitron font-bold text-center mb-1 text-white italic tracking-tighter uppercase">ADMIN'S TOURNAMENT</h1>
          <p className="text-gray-500 text-center mb-8 text-[9px] font-black uppercase tracking-[0.4em]">Elite Arena OS</p>
          
          <form onSubmit={handleAuth} className="space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-[10px] text-center font-black uppercase italic animate-shake">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2 tracking-widest">
                <UserCircle size={12} className="text-[#ff4d00]" /> Operator Login
              </label>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="User ID"
                className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-[#ff4d00] transition-all font-bold placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2 tracking-widest">
                <Lock size={12} className="text-[#ff4d00]" /> Auth Key
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0a0a0b] border border-gray-700 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-[#ff4d00] transition-all font-bold placeholder:text-gray-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#ff4d00] hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] italic cursor-pointer ${loading ? 'btn-loading' : ''}`}
            >
              {loading ? (
                <> <span className="cyber-loader scale-50"></span> Processing... </>
              ) : (
                <> <Zap size={16} /> {isRegistering ? 'Initialize Session' : 'Authenticate Operator'} </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              className="text-[10px] text-gray-400 hover:text-[#ff4d00] transition-colors uppercase font-black tracking-[0.2em] cursor-pointer"
            >
              {isRegistering ? "Existing Account? Sign In" : "New Operative? Register Account"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col font-inter">
        <header className="bg-[#151517] border-b border-gray-800 sticky top-0 z-50 shadow-2xl backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-[#ff4d00] p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(255,77,0,0.3)]">
                <Trophy className="text-white" size={28} />
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron font-bold text-lg tracking-tighter text-white leading-none uppercase italic">ADMIN'S TOURNAMENT</span>
                <span className="text-[9px] font-black text-[#ff4d00] tracking-widest uppercase mt-1">Pro Arena Elite</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-10">
              <Link to="/" className="text-[10px] font-black text-gray-400 hover:text-[#ff4d00] transition-colors uppercase tracking-[0.3em]">Arena</Link>
              {currentUser.role === UserRole.ADMIN ? (
                <Link to="/admin" className="text-[10px] font-black text-gray-400 hover:text-[#ff4d00] transition-colors flex items-center gap-2 uppercase tracking-[0.3em]">
                  <LayoutDashboard size={14} /> HQ
                </Link>
              ) : (
                <Link to="/dashboard" className="text-[10px] font-black text-gray-400 hover:text-[#ff4d00] transition-colors flex items-center gap-2 uppercase tracking-[0.3em]">
                  <UserIcon size={14} /> Profiler
                </Link>
              )}
              <Link to="/messages" className="text-[10px] font-black text-gray-400 hover:text-[#ff4d00] transition-colors flex items-center gap-2 uppercase tracking-[0.3em]">
                <MessageSquare size={14} /> Comms
              </Link>
            </nav>

            <div className="flex items-center space-x-6">
              <div className="bg-black border border-gray-800 px-5 py-2.5 rounded-2xl flex items-center gap-4 group">
                <Wallet size={18} className="text-[#ff4d00] group-hover:animate-bounce" />
                <div className="flex flex-col text-right">
                  <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none">Wallet</span>
                  <span className="text-sm font-black text-white leading-none mt-1">₹{currentUser.wallet_balance || 0}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-12 h-12 rounded-2xl bg-gray-800/30 flex items-center justify-center text-gray-500 hover:text-red-500 transition-all border border-gray-800 cursor-pointer"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-[#0a0a0b] pb-24 lg:pb-12">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <Routes>
              <Route path="/" element={<Home currentUser={currentUser} />} />
              <Route path="/admin" element={currentUser.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
              <Route path="/dashboard" element={<UserDashboard user={currentUser} />} />
              <Route path="/messages" element={<Messages currentUser={currentUser} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
