
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { graphService } from '../services/graphService';
import { User, Recommendation, Friendship } from '../types';
import { UserPlus, Clock, Users as UsersIcon, ChevronRight, TrendingUp, Share2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const currentUser = StorageService.getCurrentUser()!;
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const recommendations = graphService.getRecommendations(currentUser.regNo);
    setRecs(recommendations.slice(0, 4));

    const friendships = StorageService.getFriendships();
    const myFriends = friendships.filter(f => 
      f.status === 'accepted' && (f.user1 === currentUser.regNo || f.user2 === currentUser.regNo)
    ).length;
    
    const pending = friendships.filter(f => 
      f.status === 'pending' && f.user2 === currentUser.regNo
    ).length;

    setFriendCount(myFriends);
    setPendingCount(pending);
  }, [currentUser.regNo]);

  const sendRequest = (targetRegNo: string) => {
    const existing = StorageService.getFriendships();
    
    // Don't send duplicate requests
    if (existing.some(f => (f.user1 === currentUser.regNo && f.user2 === targetRegNo) || (f.user1 === targetRegNo && f.user2 === currentUser.regNo))) {
      return;
    }

    const newRequest: Friendship = {
      user1: currentUser.regNo,
      user2: targetRegNo,
      requester: currentUser.regNo,
      status: 'pending'
    };
    StorageService.saveFriendships([...existing, newRequest]);
    setRecs(prev => prev.filter(r => r.user.regNo !== targetRegNo));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {currentUser.name}</h1>
          <p className="text-slate-400 mt-1">Connectivity Status: <span className="text-blue-400 font-medium">UAF Nexus Node Active</span></p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-xs backdrop-blur-sm">
          <Clock size={16} className="text-blue-500" />
          <span className="text-slate-400">Network Syncing: <span className="text-slate-200">Just now</span></span>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-default">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <UsersIcon size={80} className="text-blue-500" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Campus Connections</p>
          <p className="text-5xl font-bold text-white mt-3 tracking-tighter">{friendCount}</p>
          <div className="mt-5 flex items-center text-[10px] text-blue-400 font-bold uppercase tracking-wider">
            <TrendingUp size={12} className="mr-1.5" />
            Graph Edge Degree
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-all cursor-default">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={80} className="text-orange-500" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Pending Syncs</p>
          <p className="text-5xl font-bold text-white mt-3 tracking-tighter">{pendingCount}</p>
          <Link to="/friends" className="mt-5 inline-flex items-center text-[10px] text-orange-400 hover:text-orange-300 transition-colors font-bold uppercase tracking-wider">
            Review requests <ChevronRight size={12} className="ml-1" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-6 rounded-2xl shadow-xl shadow-blue-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={80} className="text-white" />
          </div>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Network Density</p>
          <p className="text-5xl font-bold text-white mt-3 tracking-tighter">
            {(friendCount > 0 ? (friendCount * 100 / (StorageService.getUsers().length || 1)).toFixed(1) : 0)}%
          </p>
          <p className="text-blue-200/80 text-[10px] mt-5 leading-relaxed font-medium uppercase tracking-wider">
            Global Hub Proximity active
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recommended Friends - Enhanced AI Logic */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center tracking-tight">
              <Sparkles size={20} className="mr-2.5 text-blue-400" />
              Nexus Recommendations
            </h2>
            <Link to="/graph" className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider">Analyze Network</Link>
          </div>
          <div className="p-4 space-y-3">
            {recs.length > 0 ? recs.map((rec, idx) => (
              <div 
                key={rec.user.regNo} 
                className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-700/50 group animate-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={rec.user.avatar} alt={rec.user.name} className="w-12 h-12 rounded-full ring-2 ring-slate-800 transition-transform group-hover:scale-105" />
                    <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-1 shadow-lg shadow-blue-900/20">
                      <TrendingUp size={8} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-tight">{rec.user.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{rec.user.department}</p>
                    <div className="mt-1.5 flex items-center space-x-2">
                      <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-bold">
                        {rec.mutualCount > 0 ? `${rec.mutualCount} Mutuals` : 'Similar Profile'}
                      </span>
                      {rec.user.department === currentUser.department && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold">
                          Same Dept
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => sendRequest(rec.user.regNo)}
                  className="p-2.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-md active:scale-95"
                  title="Connect"
                >
                  <UserPlus size={18} />
                </button>
              </div>
            )) : (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm font-medium">Network mapping complete.</p>
                <p className="text-slate-600 text-xs mt-1">Discovering new potential academic nodes...</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Feed Preview */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center tracking-tight">
              <Megaphone size={20} className="mr-2.5 text-indigo-400" />
              Nexus Bulletins
            </h2>
            <Link to="/feed" className="text-xs font-bold text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-wider">Open Feed</Link>
          </div>
          <div className="p-6 space-y-8">
            <div className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-0 before:w-[2px] before:bg-blue-600/50">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                <Clock size={10} className="mr-1" /> Just Now
              </p>
              <h4 className="text-sm font-bold text-slate-200 tracking-tight leading-snug">Project "UAF Nexus" V1.2 Deployment Success</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Graph processing engines optimized. Chat latency reduced by 40% across campus clusters.</p>
            </div>
            <div className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-0 before:w-[2px] before:bg-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                <Clock size={10} className="mr-1" /> Yesterday
              </p>
              <h4 className="text-sm font-bold text-slate-300 tracking-tight leading-snug">Agriculture Data Science Seminar</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Join Professor Khalid for a deep dive into social networks in precision ag...</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// Local icon fallback
const Megaphone = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
  </svg>
);

export default Dashboard;
