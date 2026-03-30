import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { Tag, MapPin, User, CheckCircle2, Star } from 'lucide-react';

const HandlerDash = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get('/api/complaints?role=handler', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpdateStatus = async (compId, currentStatus) => {
    const statusFlow = ['Lodged', 'Assigned', 'In-Progress', 'Resolved', 'Closed'];
    const nextStatus = statusFlow[statusFlow.indexOf(currentStatus) + 1] || 'Closed';
    
    if (currentStatus === 'Closed' || currentStatus === 'Resolved') return;

    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(`/api/complaints/${compId}/status`, { status: nextStatus, role: 'handler' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchComplaints();
    } catch (e) {
      console.error(e);
      alert('Error updating status.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Lodged': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30';
      case 'Assigned': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
      case 'In-Progress': return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30';
      case 'Resolved': 
      case 'Closed': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  if (loading) return <div className="dark:text-white">Loading Assignments...</div>;

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Active Assignments</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage and update the status of grievances in your jurisdiction.</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {complaints.map(comp => {
          const isDone = comp.status === 'Resolved' || comp.status === 'Closed';
          return (
            <div key={comp.complaint_id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-shadow p-6 flex items-center justify-between gap-6">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 border-b border-slate-50 dark:border-slate-700/50 pb-2">
                  <span className="font-bold text-slate-800 dark:text-white">#{comp.complaint_id}</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${getStatusColor(comp.status)}`}>
                    {comp.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{comp.description}</h3>
                
                {comp.rating && (
                   <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-100 dark:border-amber-500/20">
                     <div className="flex items-center gap-1 mb-1 text-amber-500">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < comp.rating ? 'currentColor' : 'none'} />)}
                     </div>
                     <p className="text-sm text-slate-600 dark:text-slate-300 italic max-w-xl">"{comp.comments}"</p>
                   </div>
                )}
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><User size={16} className="text-indigo-400" /> {comp.citizen_name}</span>
                  <span className="flex items-center gap-1.5"><Tag size={16} className="text-blue-400" /> {comp.cat_name || 'General'}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={16} className="text-rose-400" /> {comp.gps_location}</span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-6 border-l border-slate-100 dark:border-slate-700">
                {isDone ? (
                   <div className="flex flex-col items-center gap-2 text-emerald-500 dark:text-emerald-400 font-bold px-4">
                     <CheckCircle2 size={32} />
                     <span>Completed</span>
                   </div>
                ) : (
                  <button 
                    onClick={() => handleUpdateStatus(comp.complaint_id, comp.status)}
                    className="bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-500/20 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm"
                  >
                    Mark Next Stage
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {complaints.length === 0 && <p className="text-slate-500 dark:text-slate-400">No active assignments in your ward.</p>}
      </div>
    </div>
  );
};

export default HandlerDash;
