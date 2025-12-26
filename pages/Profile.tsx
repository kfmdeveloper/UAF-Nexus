
import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { UserCircle, Shield, GraduationCap, MapPin, Calendar, Edit3, Save, X } from 'lucide-react';

const Profile: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(StorageService.getCurrentUser()!);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(currentUser.bio || "");

  const handleSaveBio = () => {
    const updatedUser = { ...currentUser, bio: editedBio };
    
    // 1. Update Current User in Storage
    StorageService.setCurrentUser(updatedUser);
    
    // 2. Update User in global users list
    const allUsers = StorageService.getUsers();
    const updatedUsers = allUsers.map(u => u.regNo === updatedUser.regNo ? updatedUser : u);
    StorageService.saveUsers(updatedUsers);
    
    // 3. Update local state
    setCurrentUser(updatedUser);
    setIsEditingBio(false);
  };

  const handleCancelBio = () => {
    setEditedBio(currentUser.bio || "");
    setIsEditingBio(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-48 bg-gradient-to-r from-blue-700 to-indigo-900 relative">
          <div className="absolute -bottom-16 left-12">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-32 h-32 rounded-3xl border-4 border-slate-900 object-cover shadow-2xl" 
            />
          </div>
        </div>
        
        <div className="pt-20 pb-10 px-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{currentUser.name}</h1>
            <p className="text-blue-500 font-medium">{currentUser.regNo}</p>
            <div className="flex items-center space-x-4 mt-4 text-slate-400 text-sm">
              <span className="flex items-center"><MapPin size={16} className="mr-1.5" /> Campus Site</span>
              <span className="flex items-center"><Calendar size={16} className="mr-1.5" /> Joined 2024</span>
            </div>
          </div>
          <button className="px-6 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg flex items-center space-x-2 transition-all">
            <Edit3 size={18} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <UserCircle size={22} className="mr-2 text-blue-500" />
                About Me
              </h2>
              {!isEditingBio && (
                <button 
                  onClick={() => setIsEditingBio(true)}
                  className="text-slate-500 hover:text-blue-400 transition-colors flex items-center text-sm font-medium"
                >
                  <Edit3 size={16} className="mr-1" /> Edit Bio
                </button>
              )}
            </div>
            
            {isEditingBio ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32 transition-all text-sm leading-relaxed"
                />
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={handleCancelBio}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center text-sm"
                  >
                    <X size={16} className="mr-1" /> Cancel
                  </button>
                  <button 
                    onClick={handleSaveBio}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center space-x-2 transition-all shadow-lg shadow-blue-900/40 text-sm font-bold"
                  >
                    <Save size={16} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                {currentUser.bio || "Student at UAF. Interested in Graph Theory, Social Computing, and Software Engineering. Part of the Nexus network."}
              </p>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Shield size={22} className="mr-2 text-emerald-500" />
              Academic Credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Department</p>
                <p className="text-white font-bold">{currentUser.department}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Current Status</p>
                <div className="flex items-center text-emerald-400 font-bold">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
                  Active Student
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Project Role</p>
                <p className="text-white font-bold">Network Contributor</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Network Visibility</p>
                <p className="text-white font-bold">Public</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <GraduationCap size={22} className="mr-2 text-indigo-500" />
              Education
            </h2>
            <div className="space-y-6">
              <div className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full">
                <h4 className="text-sm font-bold text-white">University of Agriculture</h4>
                <p className="text-xs text-slate-500">BS Computer Science</p>
                <p className="text-[10px] text-blue-500 mt-1">2021 — 2025</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
