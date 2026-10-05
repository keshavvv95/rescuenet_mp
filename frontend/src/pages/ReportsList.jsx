import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Calendar, MapPin, AlertCircle, Info, Clock, Loader, Flame, Users, 
  ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Search, XCircle
} from 'lucide-react';

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [expandedReasoning, setExpandedReasoning] = useState({});

  const fetchReports = async () => {
    try {
      const data = await apiClient.getMyReports();
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Polling for live updates from backend DB
  useEffect(() => {
    if (!isLivePolling) return;
    const interval = setInterval(() => {
      fetchReports();
    }, 10000);
    return () => clearInterval(interval);
  }, [isLivePolling]);


  const toggleReasoning = (id) => {
    setExpandedReasoning((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status) => {
    const map = {
      New: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Assigned: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'In Progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      Searching: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 animate-pulse',
      'Not Found': 'bg-slate-700/40 text-slate-400 border-slate-600/30',
      Resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${map[status] || map.New}`}>
        {status === 'Searching' && <Search className="w-3 h-3 animate-spin" />}
        {status === 'Resolved' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
        {status === 'Not Found' && <XCircle className="w-3 h-3 text-slate-400" />}
        <span>{status}</span>
      </span>
    );
  };

  const filteredReports = reports.filter(r => activeTab === 'All' || r.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">My Reports & Status Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time status updates on submitted stray animal complaints</p>
        </div>

        {/* Polling / Websocket Toggle Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              isLivePolling 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLivePolling ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLivePolling ? 'Live Polling Active' : 'Polling Paused'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {['All', 'New', 'Assigned', 'In Progress', 'Searching', 'Not Found', 'Resolved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
              activeTab === tab
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards List */}
      {filteredReports.length === 0 ? (
        <div className="glass-panel p-10 rounded-3xl border border-slate-800 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">There are no reports recorded in the system for this filter status. You can submit a new report using the Report Stray Animal form.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => (
            <div key={report.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden h-44 bg-slate-950 border border-slate-800">
                  <img src={report.image_url} alt={report.animal_type} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-100 border border-slate-800">
                    {report.animal_type} ({report.id})
                  </div>
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(report.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold border ${
                    report.priority === 'Emergency' 
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {report.priority} Priority
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">{report.created_at}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{report.description}</p>
                
                <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Assigned Unit:</span>
                    <strong className="text-slate-200">{report.assigned_to || 'Pending Officer Dispatch'}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Location:</span>
                    <strong className="text-slate-200">{report.address}</strong>
                  </div>
                </div>

                {/* Explainable AI Reasoning Dropdown */}
                <div className="border-t border-slate-800/80 pt-3">
                  <button
                    onClick={() => toggleReasoning(report.id)}
                    className="text-[11px] text-emerald-400 hover:underline font-semibold flex items-center justify-between w-full"
                  >
                    <span>Explainable AI Reasoning</span>
                    {expandedReasoning[report.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {expandedReasoning[report.id] && (
                    <p className="text-[11px] text-slate-400 mt-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 leading-relaxed font-mono">
                      {report.ai_reasoning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ReportsList;
