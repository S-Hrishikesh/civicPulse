import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import { ArrowRight, UserPlus } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    street: '',
    zipcode: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post('/api/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/');
    } catch (e) {
      console.error(e);
      alert("Failed to save profile. Make sure all fields are filled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-700/60 transition-colors">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
        <UserPlus size={40} className="mb-4 text-blue-200" />
        <h2 className="text-3xl font-bold mb-2">Complete Your Profile</h2>
        <p className="text-blue-100 font-medium">We need a few details before you can start lodging grievances.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

        <button disabled={loading} type="submit" className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none">
          {loading ? 'Saving...' : 'Finish & Go to Dashboard'} <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
};

export default Onboarding;
