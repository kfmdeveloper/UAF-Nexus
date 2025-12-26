
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, LogIn, ShieldCheck, Database, Info } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { User } from '../types';

const Login: React.FC = () => {
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [importMode, setImportMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = StorageService.getUsers();
    // Normalize case for registration number if needed, but the list uses specific casing
    const user = users.find(u => u.regNo === regNo.trim() && u.password === password);
    
    if (user) {
      StorageService.setCurrentUser(user);
      navigate('/');
    } else {
      setError('Invalid Registration Number or Password. Please check your credentials.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newUsers: User[] = [];
      
      lines.forEach((line, index) => {
        if (index === 0 || !line.trim()) return;
        const [name, reg, dept] = line.split(',').map(s => s.trim());
        if (name && reg) {
          newUsers.push({
            name,
            regNo: reg,
            department: dept || 'Agriculture',
            avatar: `https://picsum.photos/seed/${reg}/200`,
            password: 'khalid', // Default password matches system
            bio: 'University Student'
          });
        }
      });

      const existingUsers = StorageService.getUsers();
      const mergedUsers = [...existingUsers];
      newUsers.forEach(nu => {
        if (!mergedUsers.find(u => u.regNo === nu.regNo)) {
          mergedUsers.push(nu);
        }
      });

      StorageService.saveUsers(mergedUsers);
      alert(`Imported ${newUsers.length} students successfully! Default password is 'khalid'`);
      setImportMode(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-900/40">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">UAF Nexus</h1>
            <p className="text-slate-400 mt-2 text-center">University-Based Social Media Network</p>
          </div>

          {!importMode ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Registration Number</label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-600"
                  placeholder="e.g. 2022-ag-9237"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-600"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start space-x-2">
                  <X className="text-red-500 shrink-0 mt-0.5" size={14} />
                  <p className="text-red-400 text-xs leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-900/30"
              >
                <LogIn size={18} />
                <span>Login Securely</span>
              </button>

              <div className="bg-blue-900/20 border border-blue-800/50 p-3 rounded-lg flex items-center space-x-2 mt-4">
                <Info className="text-blue-400 shrink-0" size={14} />
                <p className="text-blue-300/80 text-[10px] leading-tight">
                  Demo Note: Try <b>2022-ag-9237</b> with <b>khalid</b>.
                </p>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">System Admin</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportMode(true)}
                className="w-full border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all"
              >
                <Database size={18} />
                <span>Import Student Database</span>
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-300 text-sm">
                <p className="font-semibold mb-2">CSV Format Required:</p>
                <code className="block bg-black/30 p-2 rounded text-xs">
                  Name, RegistrationNumber, Department
                </code>
              </div>
              
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors cursor-pointer group relative">
                <Upload className="text-slate-500 group-hover:text-blue-500 mb-4" size={48} />
                <p className="text-slate-300 font-medium">Click to upload or drag & drop</p>
                <p className="text-slate-500 text-sm mt-1">Excel or CSV files accepted</p>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <button
                onClick={() => setImportMode(false)}
                className="w-full text-slate-500 hover:text-white py-2 text-sm"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
        <p className="text-center text-slate-600 text-xs mt-8">
          © 2024 UAF Nexus Academic Project. Built with Graph Theory.
        </p>
      </div>
    </div>
  );
};

// Local X icon fallback
const X = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

export default Login;
