import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, auth } from '../firebase';
import axios from 'axios';
import { LogIn, ShieldCheck, Github, Chrome } from 'lucide-react';

const Login = ({ setRole, role }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      const token = await user.getIdToken();
      
      // Sync with backend
      const response = await axios.post('/api/auth/sync', 
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'needs_onboarding') {
        navigate('/onboarding');
      } else {
        localStorage.setItem('role', role);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError("Failed to sign in. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mx-20 -my-20 z-0"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mx-20 -my-20 z-0"></div>
        
        <div className="p-10 relative z-10 flex flex-col items-center">
          <ShieldCheck size={48} className="text-blue-500 mb-6" />
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Civic<span className="text-blue-500">Pulse</span></h1>
          <p className="text-slate-400 font-medium mb-10 text-center">Your unified grievance redressal platform.</p>

          <div className="w-full mb-8">
            <label className="block text-slate-300 text-sm mb-2 font-semibold">Select Your Role Context</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
              value={role}
              onChange={(e) => {
                  setRole(e.target.value);
                  localStorage.setItem('role', e.target.value);
              }}
            >
              <option value="citizen">Citizen (Report Issues)</option>
              <option value="handler">Ward Official (Resolve Issues)</option>
              <option value="admin">City Admin (Analytics)</option>
            </select>
          </div>

          <button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-4 px-6 rounded-xl hover:bg-slate-100 transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? <div className="animate-spin w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full"></div> : <><Chrome size={20} /> Continue with Google</>}
          </button>
          
          {error && <div className="mt-4 text-red-400 text-sm font-medium">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default Login;
