
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { Message, User } from '../types';
import { Send, User as UserIcon, Search, MoreVertical, Phone, Video, MessageSquare } from 'lucide-react';

const Chat: React.FC = () => {
  const currentUser = StorageService.getCurrentUser()!;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const allUsers = StorageService.getUsers();
    const fs = StorageService.getFriendships();
    const myFriends = fs
      .filter(f => f.status === 'accepted' && (f.user1 === currentUser.regNo || f.user2 === currentUser.regNo))
      .map(f => {
        const friendReg = f.user1 === currentUser.regNo ? f.user2 : f.user1;
        return allUsers.find(u => u.regNo === friendReg)!;
      });
    setFriends(myFriends);
    
    // Calculate unread counts
    const allMsgs = StorageService.getMessages();
    const counts: Record<string, number> = {};
    allMsgs.forEach(m => {
      if (m.receiver === currentUser.regNo && !m.read) {
        counts[m.sender] = (counts[m.sender] || 0) + 1;
      }
    });
    setUnreadCounts(counts);

    if (myFriends.length > 0 && !selectedFriend) setSelectedFriend(myFriends[0]);
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      const allMsgs = StorageService.getMessages();
      
      // Filter messages for current view
      const filtered = allMsgs.filter(m => 
        (m.sender === currentUser.regNo && m.receiver === selectedFriend.regNo) ||
        (m.sender === selectedFriend.regNo && m.receiver === currentUser.regNo)
      ).sort((a, b) => a.timestamp - b.timestamp);
      
      setMessages(filtered);

      // Mark messages as read
      let updated = false;
      const newAllMsgs = allMsgs.map(m => {
        if (m.sender === selectedFriend.regNo && m.receiver === currentUser.regNo && !m.read) {
          updated = true;
          return { ...m, read: true };
        }
        return m;
      });

      if (updated) {
        StorageService.saveMessages(newAllMsgs);
        setUnreadCounts(prev => ({ ...prev, [selectedFriend.regNo]: 0 }));
      }
    }
  }, [selectedFriend]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    const msg: Message = {
      id: Date.now().toString(),
      sender: currentUser.regNo,
      receiver: selectedFriend.regNo,
      text: newMessage,
      timestamp: Date.now(),
      read: false
    };

    const updated = [...StorageService.getMessages(), msg];
    StorageService.saveMessages(updated);
    setMessages([...messages, msg]);
    setNewMessage('');
    
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.regNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] flex bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      {/* Sidebar - Friend List */}
      <aside className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4 px-2">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..." 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredFriends.map(friend => (
            <button
              key={friend.regNo}
              onClick={() => setSelectedFriend(friend)}
              className={`w-full flex items-center space-x-3 p-4 transition-all duration-200 ${
                selectedFriend?.regNo === friend.regNo 
                  ? 'bg-blue-600/10 border-l-4 border-blue-600' 
                  : 'hover:bg-slate-800/50 border-l-4 border-transparent'
              }`}
            >
              <div className="relative">
                <img src={friend.avatar} alt="" className="w-12 h-12 rounded-full ring-2 ring-slate-800" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div className="text-left overflow-hidden flex-1">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-bold text-white truncate">{friend.name}</p>
                  {unreadCounts[friend.regNo] > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-bold rounded-full px-1 shadow-lg shadow-blue-900/50 animate-bounce">
                      {unreadCounts[friend.regNo]}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-xs text-slate-500 truncate flex-1">{friend.regNo}</p>
                  {unreadCounts[friend.regNo] > 0 && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full ml-2"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
          {filteredFriends.length === 0 && (
            <div className="p-12 text-center">
              <UserIcon size={40} className="mx-auto text-slate-700 mb-2 opacity-20" />
              <p className="text-slate-600 text-xs">No active chats found.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-[#0b1222] relative">
        {selectedFriend ? (
          <>
            <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md z-10">
              <div className="flex items-center space-x-3">
                <img src={selectedFriend.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-blue-500/50" />
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedFriend.name}</h3>
                  <div className="flex items-center text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                    Active Now
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-slate-400">
                <button className="hover:text-blue-400 transition-colors"><Phone size={18} /></button>
                <button className="hover:text-blue-400 transition-colors"><Video size={18} /></button>
                <button className="hover:text-white transition-colors"><MoreVertical size={18} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-pattern opacity-95">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-20 select-none">
                  <MessageSquare className="w-16 h-16 mb-2" />
                  <p>Start a new conversation with {selectedFriend.name.split(' ')[0]}</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.sender === currentUser.regNo;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-${isMe ? 'right' : 'left'}-4 duration-300`}
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <div className={`group relative max-w-[75%] p-3.5 rounded-2xl shadow-lg ${
                      isMe 
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                    }`}>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div className={`flex items-center mt-1.5 opacity-60 text-[9px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && <span className="ml-1">✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
              <form 
                onSubmit={handleSend} 
                className="bg-slate-800 border border-slate-700 rounded-2xl flex items-end p-2 transition-all focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50"
              >
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Message..."
                  rows={1}
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white focus:outline-none resize-none overflow-hidden max-h-32"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:grayscale text-white p-2.5 rounded-xl shadow-lg transition-all transform active:scale-95"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-slate-900/20">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <UserIcon size={40} className="opacity-20" />
            </div>
            <h3 className="text-white font-medium">Select a Chat</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">Choose a connection from the left sidebar to start your academic collaboration.</p>
          </div>
        )}
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .bg-pattern {
          background-image: radial-gradient(#1e293b 0.5px, transparent 0.5px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default Chat;
