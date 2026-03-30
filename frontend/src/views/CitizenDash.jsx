import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import ProgressBar from '../components/ProgressBar';
import { Plus, MapPin, Tag, LayoutList, Star } from 'lucide-react';

const CitizenDash = () => {
  const [complaints, setComplaints] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [newComp, setNewComp] = useState({ description: '', gps_location: '', category_id: 1, ward_id: 1 });

  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comments: '' });

  const fetchComplaints = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      
      const compRes = await axios.get('/api/complaints?role=citizen', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(compRes.data);

      const wardRes = await axios.get('/api/wards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWards(wardRes.data);
      if(wardRes.data.length > 0 && newComp.ward_id === 1) {
          setNewComp(prev => ({...prev, ward_id: wardRes.data[0].ward_id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post('/api/complaints', newComp, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setNewComp({ description: '', gps_location: '', category_id: 1, ward_id: wards.length > 0 ? wards[0].ward_id : 1 });
      fetchComplaints();
    } catch (e) {
      console.error(e);
      alert('Error creating complaint.');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(`/api/complaints/${feedbackModal}/feedback`, feedbackData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackModal(null);
      setFeedbackData({ rating: 5, comments: '' });
      fetchComplaints();
    } catch (e) {
      console.error(e);
      alert('Error submitting feedback.');
    }
  };

  if (loading) return <div className="dark:text-white mt-10 text-center font-bold text-xl">Loading Complaints...</div>;

  return (
    <div className="pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">My Grievances</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Track the resolution progress of your lodged issues.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} className="stroke-[3px]" /> Lodge New Complaint
        </button>
      </div>

      <div className="space-y-6">
        {complaints.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col items-center">
            <LayoutList size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
             <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Complaints Lodged Yet</h3>
             <p className="text-slate-500 dark:text-slate-400 mt-2">When you lodge a new complaint, it will appear here for tracking.</p>
          </div>
        ) : (
          complaints.map(comp => (
            <div key={comp.complaint_id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/60 overflow-hidden relative">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">ID: #{comp.complaint_id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">{comp.description}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5"><Tag size={16} className="text-blue-500 dark:text-blue-400" /> {comp.cat_name || 'General'}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-orange-500 dark:text-orange-400" /> {comp.ward_name || 'Unassigned Ward'}</span>
                  </div>
                </div>
                
                {/* Check for Feedback button rendering */}
                {(comp.status === 'Resolved' || comp.status === 'Closed') && (
                  <div className="mt-4 md:mt-0">
                    {comp.rating ? (
                       <div className="flex flex-col items-end">
                         <div className="flex items-center gap-1 text-amber-500 mb-1">
                            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < comp.rating ? 'currentColor' : 'none'} />)}
                         </div>
                         <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{comp.comments}"</p>
                       </div>
                    ) : (
                       <button onClick={() => setFeedbackModal(comp.complaint_id)} className="bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-400 px-4 py-2 font-bold text-sm rounded-lg transition-colors flex items-center gap-2">
                         <Star size={18} /> Leave Feedback
                       </button>
                    )}
                  </div>
                )}
              </div>
              <div className="p-2 bg-white dark:bg-slate-800">
                {comp.status === 'Dismissed' ? (
                  <div className="p-4 mx-2 mb-2 bg-red-50 dark:bg-rose-500/10 border border-red-100 dark:border-rose-500/20 rounded-xl text-center">
                     <p className="text-red-600 dark:text-rose-400 font-bold text-lg">⚠️ Request Dismissed by Administrator</p>
                     <p className="text-sm text-red-500 dark:text-rose-300 mt-1">This grievance was reviewed and permanently dismissed.</p>
                  </div>
                ) : (
                  <ProgressBar currentStatus={comp.status} />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lodge Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgb(0,0,0,0.4)] max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">New Grievance</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Provide details about the issue you are facing.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea required rows="4" className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 resize-none"
                  value={newComp.description} onChange={e => setNewComp({...newComp, description: e.target.value})} placeholder="Describe the problem clearly..."></textarea>
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Location/Landmark</label>
                 <input required type="text" className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                   value={newComp.gps_location} onChange={e => setNewComp({...newComp, gps_location: e.target.value})} placeholder="e.g. Main St. Cross" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                  <select className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                     value={newComp.category_id} onChange={e => setNewComp({...newComp, category_id: Number(e.target.value)})}>
                    <option value={1}>Water & Sanitation</option>
                    <option value={2}>Roads & Traffic</option>
                    <option value={3}>Electricity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ward</label>
                  <select className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                     value={newComp.ward_id} onChange={e => setNewComp({...newComp, ward_id: Number(e.target.value)})}>
                    {wards.map(w => (
                        <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all">Submit Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgb(0,0,0,0.4)] max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-700">
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Rate Resolution</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">How was your experience?</p>
              
              <div className="flex justify-center gap-2 mb-6 cursor-pointer">
                 {[1,2,3,4,5].map(star => (
                    <Star 
                       key={star} 
                       size={36} 
                       onClick={() => setFeedbackData({...feedbackData, rating: star})}
                       className={`${feedbackData.rating >= star ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-300 dark:text-slate-600'} transition-all hover:scale-125`}
                    />
                 ))}
              </div>

              <textarea rows="3" required className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 resize-none mb-6 text-sm"
                  value={feedbackData.comments} onChange={e => setFeedbackData({...feedbackData, comments: e.target.value})} placeholder="Optional comments on the resolution..."></textarea>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setFeedbackModal(null)} className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">Skip</button>
                <button type="button" onClick={handleFeedbackSubmit} disabled={!feedbackData.comments} className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50">Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CitizenDash;
