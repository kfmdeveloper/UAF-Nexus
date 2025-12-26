
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Friendship, User } from '../types';
import { Check, X, UserMinus, UserCheck, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Friends: React.FC = () => {
  const currentUser = StorageService.getCurrentUser()!;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'current' | 'requests'>('current');
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<(User & { requester: string })[]>([]);

  const loadData = () => {
    const allUsers = StorageService.getUsers();
    const allFriendships = StorageService.getFriendships();

    const myFriends = allFriendships
      .filter(f => f.status === 'accepted' && (f.user1 === currentUser.regNo || f.user2 === currentUser.regNo))
      .map(f => {
        const friendReg = f.user1 === currentUser.regNo ? f.user2 : f.user1;
        return allUsers.find(u => u.regNo === friendReg)!;
      });

    const pendingRequests = allFriendships
      .filter(f => f.status === 'pending' && f.user2 === currentUser.regNo)
      .map(f => {
        const sender = allUsers.find(u => u.regNo === f.user1)!;
        return { ...sender, requester: f.user1 };
      });

    setFriends(myFriends);
    setRequests(pendingRequests);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = (senderReg: string, action: 'accept' | 'reject') => {
    const fs = StorageService.getFriendships();
    let updated: Friendship[];
    
    if (action === 'accept') {
      updated = fs.map(f => (f.user1 === senderReg && f.user2 === currentUser.regNo) ? { ...f, status: 'accepted' as const } : f);
    } else {
      updated = fs.filter(f => !(f.user1 === senderReg && f.user2 === currentUser.regNo));
    }

    StorageService.saveFriendships(updated);
    loadData();
  };

  const removeFriend = (regNo: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    const fs = StorageService.getFriendships();
    const updated = fs.filter(f => !((f.user1 === regNo && f.user2 === currentUser.regNo) || (f.user2 === regNo && f.user1 === currentUser.regNo)));
    StorageService.saveFriendships(updated);
    loadData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-white">Relationship Manager</h1>
        <p className="text-slate-400 text-sm">Manage your academic and social circles.</p>
      </header>

      <div className="flex space-x-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('current')}
          className={`pb-4 px-2 font-medium transition-all relative ${
            activeTab === 'current' ? 'text-blue-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          My Friends ({friends.length})
          {activeTab === 'current' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-4 px-2 font-medium transition-all relative ${
            activeTab === 'requests' ? 'text-blue-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          Requests ({requests.length})
          {requests.length > 0 && <span className="ml-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">New</span>}
          {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'current' ? (
          friends.map(friend => (
            <div key={friend.regNo} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center group hover:border-blue-500/50 transition-all">
              <img src={friend.avatar} alt="" className="w-20 h-20 rounded-full border-2 border-slate-800 mb-4 group-hover:scale-105 transition-transform" />
              <h3 className="text-white font-bold">{friend.name}</h3>
              <p className="text-xs text-slate-500 mb-1">{friend.regNo}</p>
              <p className="text-xs text-blue-400 mb-6">{friend.department}</p>
              
              <div className="flex space-x-2 w-full">
                <button 
                  onClick={() => navigate('/chat')}
                  className="flex-1 flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-colors"
                >
                  <MessageSquare size={16} />
                  <span className="text-xs font-semibold">Message</span>
                </button>
                <button 
                  onClick={() => removeFriend(friend.regNo)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <UserMinus size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          requests.map(request => (
            <div key={request.regNo} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
              <img src={request.avatar} alt="" className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm">{request.name}</h3>
                <p className="text-xs text-slate-500">{request.regNo}</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleAction(request.regNo, 'accept')}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-900/20"
                >
                  <Check size={18} />
                </button>
                <button 
                  onClick={() => handleAction(request.regNo, 'reject')}
                  className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))
        )}

        {((activeTab === 'current' && friends.length === 0) || (activeTab === 'requests' && requests.length === 0)) && (
          <div className="col-span-full py-20 text-center text-slate-600 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800">
            <UserCheck size={48} className="mx-auto mb-4 opacity-20" />
            <p>No connections found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
