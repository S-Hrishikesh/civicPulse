import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './views/Login';
import Onboarding from './views/Onboarding';
import CitizenDash from './views/CitizenDash';
import HandlerDash from './views/HandlerDash';
import AdminDash from './views/AdminDash';
import Profile from './views/Profile';
import { auth } from './firebase';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(localStorage.getItem('role') || 'citizen'); 
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium dark:bg-slate-950">Loading CivicPulse...</div>;

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
        {user && <Sidebar role={role} isDark={isDark} setIsDark={setIsDark} />}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative w-full">
          <div className="max-w-6xl mx-auto w-full h-full">
            <Routes>
              <Route path="/login" element={!user ? <Login setRole={setRole} role={role} /> : <Navigate to="/" />} />
              <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/" element={
                !user ? <Navigate to="/login" /> :
                role === 'citizen' ? <CitizenDash /> :
                role === 'handler' ? <HandlerDash /> :
                <AdminDash />
              } />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
