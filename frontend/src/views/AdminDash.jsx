import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { Activity, MapPin, BarChart3, TrendingUp, Users, Database, Clock, RefreshCw, CheckCircle2, Star } from 'lucide-react';

const AdminDash = () => {
  const [stats, setStats] = useState({ ward_stats: [], category_stats: [], resolved_tasks: [], active_workers: 0 });
  const [loading, setLoading] = useState(true);
  
  // Database Explorer state
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [loadingDb, setLoadingDb] = useState(false);
  
  // Workers Input state
  const [workersInput, setWorkersInput] = useState("");
  const [updatingWorkers, setUpdatingWorkers] = useState(false);
  
  // New Ward State
  const [newWardName, setNewWardName] = useState("");
  
  // Dismiss State
  const [dismissId, setDismissId] = useState("");

  const fetchStats = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get('/api/complaints?role=admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
      setWorkersInput(res.data.active_workers.toString());
      
      // Fetch available database tables for the explorer
      const tablesRes = await axios.get('/api/database/tables?role=admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTables(tablesRes.data);
      if(tablesRes.data.length > 0) handleTableSelect(tablesRes.data[0], token);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdateWorkers = async () => {
    if(!workersInput) return;
    setUpdatingWorkers(true);
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post('/api/settings/workers', { workers: parseInt(workersInput), role: 'admin' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStats();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingWorkers(false);
    }
  };

  const handleTableSelect = async (tableName, tokenOverride = null) => {
    setSelectedTable(tableName);
    setLoadingDb(true);
    try {
      const token = tokenOverride || await auth.currentUser.getIdToken();
      const res = await axios.get(`/api/database/tables/${tableName}?role=admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTableData(res.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingDb(false);
    }
  };

  const handleAddWard = async () => {
    if(!newWardName.trim()) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post('/api/wards', { ward_name: newWardName, role: 'admin' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewWardName("");
      fetchStats(); 
      handleTableSelect('ward', token); 
    } catch (e) {
      console.error(e);
      alert('Failed to add ward');
    }
  };

  const handleDismiss = async () => {
    if(!dismissId.trim()) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(`/api/complaints/${dismissId}/status`, { status: 'Dismissed', role: 'admin' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDismissId("");
      fetchStats();
      alert("Complaint dismissed successfully!");
    } catch (e) {
      console.error(e);
      alert('Failed to dismiss. Verify ID exists.');
    }
  };

  // Helper to calculate actual hours between two timestamps
  const calcHours = (start, end) => {
    if(!start || !end) return "N/A";
    const diffMs = new Date(end) - new Date(start);
    return (diffMs / (1000 * 60 * 60)).toFixed(1);
  };
  
  // Calculate Actual Average Resolution Time from actual db data
  let avgResHours = 0;
  let validTasksCount = 0;
  stats.resolved_tasks.forEach(t => {
      if(t.start_time && t.end_time) {
          const diffMs = new Date(t.end_time) - new Date(t.start_time);
          avgResHours += (diffMs / (1000 * 60 * 60));
          validTasksCount++;
      }
  });
  const avgResolutionDisplay = validTasksCount > 0 ? (avgResHours/validTasksCount).toFixed(1) : 0;

  if (loading) return <div className="dark:text-white">Loading Analytics...</div>;

  const totalComplaints = stats.ward_stats.reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);

  return (
    <div className="pb-10 space-y-10">
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><Activity size={28} /></div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Management Analytics</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">High-level overview of grievance resolutions across the city.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Total Lodged</p>
            <h3 className="text-4xl font-extrabold text-slate-800 dark:text-white">{totalComplaints}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Avg Resolution</p>
            <h3 className="text-4xl font-extrabold text-slate-800 dark:text-white">{avgResolutionDisplay}<span className="text-xl text-slate-500 dark:text-slate-400 ml-1">hrs</span></h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Clock size={28} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-500/20 text-white flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
             <p className="text-sm font-bold text-blue-200 uppercase tracking-wider">Active Staff Input</p>
             <Users size={20} className="text-white/70" />
          </div>
          <div className="flex items-center gap-2">
            <input 
               type="number" 
               className="bg-white/20 text-white placeholder-blue-200 outline-none border border-white/30 rounded-lg px-3 py-1.5 w-20 font-bold text-xl"
               value={workersInput}
               onChange={(e) => setWorkersInput(e.target.value)}
            />
            <button 
               onClick={handleUpdateWorkers}
               disabled={updatingWorkers}
               className="bg-white text-blue-600 text-sm font-bold py-2 px-3 rounded-lg hover:bg-slate-100 transition shadow"
            >
               {updatingWorkers ? '...' : 'Update'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Ward Distribution */}
         <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/60">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><MapPin size={20} className="text-rose-500"/> Distribution by Ward</h3>
            <div className="space-y-5">
              {stats.ward_stats.map((w, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2 text-sm font-bold">
                    <span className="text-slate-700 dark:text-slate-200">{w.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{w.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${(w.value / totalComplaints) * 100}%` }}></div>
                  </div>
                </div>
              ))}
              {stats.ward_stats.length === 0 && <p className="text-slate-400 font-medium">No data available.</p>}
            </div>
            
            {/* Add Ward Input */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
               <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Add Administrative Area</h4>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="e.g. West Ward" 
                   className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                   value={newWardName}
                   onChange={e => setNewWardName(e.target.value)}
                 />
                 <button 
                   onClick={handleAddWard} 
                   className="bg-slate-800 dark:bg-blue-600 hover:bg-slate-700 dark:hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                 >
                   Add Ward
                 </button>
               </div>
            </div>

            {/* Dismiss Grievance block */}
            <div className="mt-8 bg-red-50 dark:bg-rose-500/10 rounded-3xl p-6 border border-red-100 dark:border-rose-500/20 shadow-sm flex flex-col justify-center">
               <h3 className="text-xl font-bold text-red-600 dark:text-rose-400 mb-2 flex items-center gap-2">
                 <Activity size={20} /> Dismiss Grievance
               </h3>
               <p className="text-sm font-medium text-red-500 dark:text-rose-300 mb-4">Force a complaint to a dismissed state.</p>
               <div className="flex gap-2">
                 <input 
                   type="number" 
                   placeholder="Complaint ID..." 
                   className="flex-1 bg-white dark:bg-slate-900 border border-red-200 dark:border-rose-500/30 rounded-lg px-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                   value={dismissId}
                   onChange={e => setDismissId(e.target.value)}
                 />
                 <button 
                   onClick={handleDismiss} 
                   className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                 >
                   Dismiss
                 </button>
               </div>
            </div>
         </div>

         {/* Resolution Times Tracking */}
         <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/60 overflow-y-auto max-h-[350px]">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><CheckCircle2 size={20} className="text-emerald-500"/> Task Resolution Times</h3>
            <div className="space-y-4">
              {stats.resolved_tasks.map((t, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">#{t.complaint_id} - {t.ward_name}</h4>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{t.description}</p>
                  </div>
                  <div className="text-right flex flex-col items-end justify-center">
                     <div>
                       <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{calcHours(t.start_time, t.end_time)}</span>
                       <span className="text-xs font-bold text-emerald-500 ml-1 uppercase">hrs</span>
                     </div>
                     {t.rating && (
                        <div className="flex items-center mt-1 gap-1 text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-500/20" title={t.comments}>
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs font-bold">{t.rating}/5</span>
                        </div>
                     )}
                  </div>
                </div>
              ))}
              {stats.resolved_tasks.length === 0 && <p className="text-slate-400 font-medium">No resolved tasks yet.</p>}
            </div>
         </div>
      </div>
      
      {/* Database Explorer Tab */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/60 mt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-5 mb-6 gap-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Database size={24} className="text-blue-500"/> Live Database Explorer</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Select Table:</span>
            <select 
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-medium text-slate-800 dark:text-white focus:outline-none"
              value={selectedTable}
              onChange={(e) => handleTableSelect(e.target.value)}
            >
              {tables.map(tbl => <option key={tbl} value={tbl}>{tbl.toUpperCase()}</option>)}
            </select>
            <button onClick={() => handleTableSelect(selectedTable)} className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 transition">
               <RefreshCw size={18} className={loadingDb ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
           {loadingDb ? (
             <div className="py-10 text-center text-slate-500 font-medium">Querying {selectedTable.toUpperCase()}...</div>
           ) : tableData && tableData.length > 0 ? (
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr>
                   {Object.keys(tableData[0]).map(col => (
                     <th key={col} className="p-3 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap">{col}</th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {tableData.map((row, i) => (
                   <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                     {Object.values(row).map((val, idx) => (
                       <td key={idx} className="p-3 border-b border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">
                         {val !== null ? String(val) : <span className="text-slate-300 italic">null</span>}
                       </td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
           ) : (
             <div className="py-10 text-center text-slate-500 font-medium">Table is empty.</div>
           )}
        </div>
      </div>

    </div>
  );
};

export default AdminDash;
