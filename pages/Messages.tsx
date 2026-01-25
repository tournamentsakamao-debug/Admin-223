
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, UserRole, GlobalConfig } from '../types';
import { DB } from '../db';
import { Send, User as UserIcon, Shield, Search, Lock, MessageCircleOff, Ban, ShieldOff, AlertTriangle } from 'lucide-react';

interface MessagesProps {
  currentUser: User;
}

const Messages: React.FC<MessagesProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [availableContacts, setAvailableContacts] = useState<User[]>([]);
  const [config, setConfig] = useState<GlobalConfig>({ upiId: '', qrUrl: '', chatDisabled: false, autoPaymentEnabled: false });
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const ADMIN_ID = DB.getAdminId();

  const loadData = async () => {
    const allUsers = await DB.getUsers();
    const currentConfig = await DB.getConfig();
    setConfig(currentConfig);
    
    // Check if there's a target chat requested from another page
    const targetChat = DB.getTargetChat();

    let contacts: User[] = [];
    if (currentUser.role === UserRole.ADMIN) {
      contacts = allUsers.filter(u => u.role !== UserRole.ADMIN);
      setAvailableContacts(contacts);
      
      if (targetChat) {
        setActiveContactId(targetChat);
        DB.setTargetChat(null); // Clear it after use
      } else if (!activeContactId && contacts.length > 0) {
        setActiveContactId(contacts[0].id);
      }
    } else {
      setActiveContactId(ADMIN_ID);
    }

    if (activeContactId) {
      const msgs = await DB.getMessages(currentUser.id, activeContactId);
      setMessages(msgs);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); 
    return () => clearInterval(interval);
  }, [currentUser.role, activeContactId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeContactId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeContactId) return;
    
    const freshUser = DB.getCurrentUser();
    if (currentUser.role !== UserRole.ADMIN && (config.chatDisabled || freshUser?.is_blocked || freshUser?.is_chat_blocked)) {
       alert("Chat disabled for your account.");
       return;
    }

    const newMsg: Message = { 
      id: Math.random().toString(36).substr(2, 9), 
      senderId: currentUser.id, 
      senderName: currentUser.username, 
      receiverId: activeContactId, 
      text: input, 
      timestamp: Date.now(), 
      read: false 
    };
    
    await DB.addMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  const handleBanUser = async (uid: string) => {
    if (confirm("Permanently ban this user from the entire app?")) {
      await DB.toggleUserBlock(uid);
      loadData();
    }
  };

  const handleToggleChatBlock = async (uid: string) => {
    await DB.toggleChatBlock(uid);
    loadData();
  };

  const filteredMessages = messages.filter(m => 
    (m.senderId === currentUser.id && m.receiverId === activeContactId) || 
    (m.senderId === activeContactId && m.receiverId === currentUser.id)
  );
  
  const activeContact = availableContacts.find(c => c.id === activeContactId);
  const displayContacts = availableContacts.filter(c => c.username.toLowerCase().includes(searchQuery.toLowerCase()));

  const isUserBlockedFromChat = currentUser.role !== UserRole.ADMIN && (config.chatDisabled || currentUser.is_chat_blocked || currentUser.is_blocked);

  return (
    <div className="h-[calc(100vh-14rem)] flex bg-[#151517] border border-gray-800 rounded-[40px] overflow-hidden shadow-2xl relative">
      {currentUser.role === UserRole.ADMIN && (
        <div className="w-72 border-r border-gray-800 bg-[#1a1a1c] hidden md:flex flex-col">
          <div className="p-8 border-b border-gray-800">
            <h3 className="font-orbitron font-bold text-white text-[10px] uppercase tracking-[0.3em] mb-4">Message Inbox</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-600" size={14} />
              <input 
                placeholder="Find player..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full bg-[#0a0a0b] border border-gray-800 rounded-xl py-2.5 pl-9 pr-4 text-[11px] text-white focus:outline-none focus:border-[#ff4d00] transition-all" 
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {displayContacts.length === 0 ? (
               <p className="p-8 text-center text-gray-600 text-[9px] uppercase font-black">No operators found...</p>
            ) : displayContacts.map(u => (
              <button 
                key={u.id} 
                onClick={() => setActiveContactId(u.id)} 
                className={`w-full p-6 flex items-center gap-4 hover:bg-white/5 transition-all text-left border-b border-gray-800/50 cursor-pointer ${activeContactId === u.id ? 'bg-[#ff4d00]/10 border-r-2 border-r-[#ff4d00]' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-800 bg-gray-900 relative">
                  <UserIcon size={18} className={activeContactId === u.id ? 'text-[#ff4d00]' : 'text-gray-600'} />
                  {u.is_blocked && <div className="absolute -top-1 -right-1 bg-red-600 w-3 h-3 rounded-full border-2 border-[#151517]"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-[11px] truncate uppercase italic ${activeContactId === u.id ? 'text-[#ff4d00]' : 'text-white'}`}>{u.username}</p>
                  {u.is_chat_blocked && <p className="text-[8px] text-red-500 font-bold uppercase">Chat Blocked</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d0f]">
        <div className="p-6 border-b border-gray-800 bg-[#151517] flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#ff4d00]/10 border border-[#ff4d00]/20 flex items-center justify-center">
                <Shield className="text-[#ff4d00]" size={24} />
             </div>
             <div>
                <h3 className="text-white font-black text-lg uppercase italic tracking-tighter">
                   {currentUser.role === UserRole.ADMIN ? (activeContact?.username || 'Select Player') : 'Admin Support'}
                </h3>
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Live Operator Chat</p>
             </div>
          </div>

          {currentUser.role === UserRole.ADMIN && activeContact && (
            <div className="flex items-center gap-3">
               <button 
                onClick={() => handleToggleChatBlock(activeContact.id)}
                title={activeContact.is_chat_blocked ? "Unblock Chat" : "Block Chat"}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${activeContact.is_chat_blocked ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}
               >
                 {activeContact.is_chat_blocked ? <Shield size={18} /> : <MessageCircleOff size={18} />}
               </button>
               <button 
                onClick={() => handleBanUser(activeContact.id)}
                title="Permanently Ban"
                className={`p-3 rounded-xl border transition-all cursor-pointer ${activeContact.is_blocked ? 'bg-red-600 text-white' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
               >
                 <Ban size={18} />
               </button>
            </div>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {filteredMessages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <MessageCircleOff size={64} className="mb-4 text-gray-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Secure conversation started</p>
             </div>
          ) : filteredMessages.map((m) => {
            const isMe = m.senderId === currentUser.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg ${isMe ? 'bg-[#ff4d00] text-white rounded-br-none' : 'bg-[#1a1a1c] border border-gray-800 text-gray-200 rounded-bl-none'}`}>
                  <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                  <p className="text-[9px] font-black uppercase mt-2 opacity-60 text-right italic">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-[#151517] border-t border-gray-800">
          {isUserBlockedFromChat ? (
            <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl flex items-center justify-center gap-4">
               <ShieldOff size={22} className="text-red-500" />
               <div className="text-left">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Messaging Restricted</p>
                  <p className="text-[8px] text-red-500/60 font-bold uppercase">Your chat privileges have been suspended by Admin.</p>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-4">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Type your message..." 
                className="flex-1 bg-[#0a0a0b] border border-gray-800 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none focus:border-[#ff4d00] text-sm shadow-inner" 
              />
              <button 
                type="submit" 
                disabled={!input.trim() || !activeContactId} 
                className="bg-[#ff4d00] text-white px-10 rounded-2xl transition-all shadow-[0_0_20px_rgba(255,77,0,0.3)] disabled:opacity-20 flex items-center justify-center cursor-pointer hover:bg-orange-600 active:scale-95"
              >
                <Send size={22} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
