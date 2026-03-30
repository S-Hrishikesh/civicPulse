import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { User, Save } from 'lucide-react';

const Profile = () => {
  const [formData, setFormData] = useState({ fname: '', lname: '', street: '', zipcode: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get('/api/profile', { headers: { Authorization: `Bearer ${token}` }});
      if (res.data) setFormData({
        fname: res.data.fname || '',
        lname: res.data.lname || '',
        street: res.data.street || '',
        zipcode: res.data.zipcode || '',
        phone: res.data.phone || ''
      });
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put('/api/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Profile updated successfully!');
    } catch(err) {
      setMsg('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="dark:text-white">Loading Profile...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-700/60 transition-colors">
      <div className="p-8 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl"><User size={28} /></div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Profile</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Update your citizen details here.</p>
        </div>
      </div>
      
      <form onSubmit={handleUpdate} className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">First Name</label>
            <input required type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors"
              value={formData.fname} onChange={e => setFormData({...formData, fname: e.target.value})} />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">Last Name</label>
            <input required type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors"
              value={formData.lname} onChange={e => setFormData({...formData, lname: e.target.value})} />
          </div>
        </div>

        <div>
           <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">Phone Number</label>
           <input required type="tel" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors"
             value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>

        <div>
           <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">Street Address</label>
           <input required type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors"
             value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
        </div>

        <div>
           <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">Zip Code</label>
           <input required type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors"
             value={formData.zipcode} onChange={e => setFormData({...formData, zipcode: e.target.value})} />
        </div>

        {msg && <p className={`font-semibold text-sm ${msg.includes('success') ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{msg}</p>}

        <button disabled={saving} type="submit" className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-slate-900/20 dark:shadow-blue-500/20 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none">
          <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
