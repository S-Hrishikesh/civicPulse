import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, LogOut, ShieldCheck, Moon, Sun } from 'lucide-react';
import { logout } from '../firebase';

const Sidebar = ({ role, isDark, setIsDark }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col h-full shadow-2xl relative z-20">
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-blue-500"><ShieldCheck size={32} /></span>
          <span>Civic<span className="text-blue-400">Pulse</span></span>
        </h1>
        <div className="mt-3 text-xs text-blue-400/80 uppercase font-bold tracking-[0.2em] bg-blue-500/10 inline-block px-3 py-1 rounded-full">{role}</div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link to="/" className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-blue-600/10 text-blue-400 font-medium transition-colors border border-blue-500/20 shadow-sm">
          <Home size={20} /> Dashboard
        </Link>
        
        {role === 'citizen' && (
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white font-medium">
            <User size={20} /> My Profile
          </Link>
        )}
      </nav>

      <div className="p-6 bg-slate-900 border-t border-slate-800 rounded-b-xl pb-8 flex flex-col gap-3">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="flex items-center justify-between px-4 py-3 w-full rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-all duration-300 font-semibold border border-slate-700/50 hover:bg-slate-800"
        >
          <span className="flex items-center gap-3">
            {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-blue-400" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
        
        <button onClick={handleLogout} className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 font-semibold shadow-sm hover:shadow-rose-500/25">
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
