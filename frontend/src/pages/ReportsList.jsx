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
      New: 'bg-orange-50 text-orange-600 border-orange-200',
      Assigned: 'bg-amber-50 text-amber-700 border-amber-200',
      'In Progress': 'bg-amber-50 text-amber-800 border-amber-300',
      Searching: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse',
      'Not Found': 'bg-slate-100 text-slate-500 border-slate-200',
      Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${map[status] || map.New}`}>
        {status === 'Searching' && <Search className="w-3 h-3 animate-spin stroke-[2]" />}
        {status === 'Resolved' && <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2]" />}
        {status === 'Not Found' && <XCircle className="w-3 h-3 text-slate-500 stroke-[2]" />}
        <span>{status}</span>
      </span>
    );
  };

  const filteredReports = reports.filter(r => activeTab === 'All' || r.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">My Reports & Status Tracker</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time status updates on submitted stray animal complaints</p>
        </div>

        {/* Polling / Websocket Toggle Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-heading font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isLivePolling 
                ? 'bg-slate-900 text-amber-400 border-slate-700 shadow-xs' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLivePolling ? 'animate-spin text-amber-400' : ''}`} />
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
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all shrink-0 border cursor-pointer ${
              activeTab === tab
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-heading font-bold text-slate-900">No Reports Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">There are no reports recorded in the system for this filter status. You can submit a new report using the Report Stray Animal form.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-orange-500/30 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-white p-1 border border-slate-100 shadow-inner">
                  <div className="relative rounded-xl overflow-hidden h-44 bg-slate-900">
                    <img src={report.image_url} alt={report.animal_type} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white border border-slate-700">
                        {report.animal_type} ({report.id})
                      </div>
                      {report.is_sos && (
                        <div className="bg-rose-600/95 backdrop-blur-md text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-xs">
                          SOS
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(report.status)}
                    </div>
                    {report.is_ai_generated ? (
                      <div className="absolute bottom-2 left-2 right-2 bg-rose-600/90 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded text-center">
                        🤖 AI-GENERATED IMAGE (FLAGGED)
                      </div>
                    ) : report.is_web_image ? (
                      <div className="absolute bottom-2 left-2 right-2 bg-amber-600/90 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded text-center">
                        🌐 WEB / STOCK IMAGE (FLAGGED)
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] border ${
                      (report.priority || '').toUpperCase() === 'CRITICAL' || (report.priority || '').toUpperCase() === 'EMERGENCY'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : (report.priority || '').toUpperCase() === 'HIGH'
                          ? 'bg-orange-50 text-orange-600 border-orange-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {report.priority} {typeof report.priority_score === 'number' && report.priority_score > 0 ? `(${report.priority_score}/100)` : ''}
                    </span>
                    {report.requires_human_review && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-300">
                        Review Req.
                      </span>
                    )}
                    {report.is_ai_generated && (
                      <span className="bg-rose-100 text-rose-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border border-rose-300">
                        AI Image
                      </span>
                    )}
                    {report.is_web_image && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-300">
                        Web Image
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono">{report.created_at}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{report.description}</p>
                
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Assigned Unit:</span>
                    <strong className="text-slate-900">{report.assigned_to || 'Pending Officer Dispatch'}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Location:</span>
                    <strong className="text-slate-900 truncate max-w-[200px]">{report.address}</strong>
                  </div>
                </div>

                {/* Explainable AI Reasoning Dropdown */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={() => toggleReasoning(report.id)}
                    className="text-[11px] text-orange-600 hover:text-orange-700 font-heading font-bold flex items-center justify-between w-full cursor-pointer"
                  >
                    <span>Explainable AI Reasoning</span>
                    {expandedReasoning[report.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {expandedReasoning[report.id] && (
                    <p className="text-[11px] text-slate-600 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed font-mono">
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
