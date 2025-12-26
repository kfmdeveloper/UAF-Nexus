
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Share2, 
  MessageSquare, 
  UserCircle, 
  LogOut, 
  Rss,
  Menu,
  X,
  Network,
  Zap,
  Activity
} from 'lucide-react';
import { StorageService } from '../services/storageService';

const NavItem = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => 
      `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const navigate = useNavigate();
  const currentUser = StorageService.getCurrentUser();

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    navigate('/login');
  };

  // Simulate Real-Time Campus Connection Updates
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      const users = StorageService.getUsers();
      if (users.length < 2) return;

      // Randomly pick an event type
      const roll = Math.random();
      if (roll > 0.7) {
        const u1 = users[Math.floor(Math.random() * users.length)];
        const u2 = users[Math.floor(Math.random() * users.length)];
        if (u1.regNo === u2.regNo) return;

        const messages = [
          `New connection: ${u1.name} and ${u2.name} are now linked in the Nexus.`,
          `${u1.name} just posted a new campus update.`,
          `Edge optimization: New mutual path found via ${u1.name}.`,
          `Network Sync: ${u2.name} joined a new study group cluster.`
        ];
        
        setNotification(messages[Math.floor(Math.random() * messages.length)]);
        setTimeout(() => setNotification(null), 5000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser]);

  if (!currentUser) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">
      {/* Real-time Ticker / Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="bg-slate-900 border border-blue-500/30 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 backdrop-blur-xl ring-1 ring-white/10">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <Zap size={14} className="text-white fill-white" />
            </div>
            <p className="text-sm font-medium tracking-tight whitespace-nowrap">{notification}</p>
            <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-slate-800 rounded-md text-white shadow-xl"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/20">
                N
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                UAF Nexus
              </h1>
            </div>

            <nav className="space-y-2">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/feed" icon={Rss} label="Feed" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/friends" icon={Users} label="Friends" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/graph" icon={Network} label="Network Graph" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/chat" icon={MessageSquare} label="Messages" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/profile" icon={UserCircle} label="My Profile" onClick={() => setSidebarOpen(false)} />
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-slate-800">
            <div className="flex items-center space-x-3 mb-4 p-2 bg-slate-800/50 rounded-lg group">
              <div className="relative">
                <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full border-2 border-blue-500" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold truncate text-white">{currentUser.name}</p>
                <div className="flex items-center text-[10px] text-slate-500 truncate">
                  <Activity size={10} className="mr-1 text-emerald-500" /> Live Node
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0a0f1e] relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
