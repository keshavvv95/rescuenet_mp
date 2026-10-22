import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { 
  ShieldAlert, CheckCircle2, UserPlus, Filter, Clock, MapPin, 
  AlertCircle, Eye, Check, X, Camera, RefreshCw
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE_URL } from '../config/api';

export default function OfficerDashboard() {
  const { userRole, userName, userZone } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('All');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [selectedVolunteerObj, setSelectedVolunteerObj] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [mapInstance, setMapInstance] = useState(null);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/')) {
      const base = API_BASE_URL.replace(/\/api$/, '');
      return `${base}${url}`;
    }
    return url;
  };

  const fetchData = async () => {
    try {
      const [comps, vols] = await Promise.all([
        apiClient.getOfficerComplaints(),
        apiClient.getAvailableVolunteers()
      ]);
      if (Array.isArray(comps)) setComplaints(comps);
      if (Array.isArray(vols)) {
        setVolunteers(vols);
        if (vols.length > 0) {
          setSelectedVolunteer(vols[0].name);
          setSelectedVolunteerObj(vols[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching officer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignVolunteer = async (complaintId) => {
    if (!selectedVolunteer) return;
    try {
      await apiClient.assignVolunteer(complaintId, selectedVolunteer);
      setAssigningId(null);
      fetchData();
    } catch (err) {
      console.error('Error assigning volunteer:', err);
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      await apiClient.updateIncidentStatus(complaintId, newStatus);
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const flaggedCount = complaints.filter(c => c.is_ai_generated || c.is_web_image).length;

  const filtered = complaints.filter(c => {
    if (filterPriority === 'All') return true;
    if (filterPriority === 'FLAGGED') {
      return Boolean(c.is_ai_generated || c.is_web_image);
    }
    const p = (c.priority || '').toUpperCase();
    const target = filterPriority.toUpperCase();
    if (target === 'CRITICAL') return p === 'CRITICAL' || p === 'EMERGENCY';
    if (target === 'HIGH') return p === 'HIGH';
    if (target === 'ROUTINE') return p === 'ROUTINE' || p === 'NORMAL';
    return p === target;
  });

  // Initialize interactive Leaflet map when map view is active
  useEffect(() => {
    if (viewMode === 'map') {
      setTimeout(() => {
        const container = document.getElementById('officer-map');
        if (container && !mapInstance) {
          const map = L.map('officer-map').setView([19.2183, 72.9781], 12);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          filtered.forEach(c => {
            if (c.latitude && c.longitude) {
              const marker = L.marker([c.latitude, c.longitude]).addTo(map);
              const isFlagged = c.is_ai_generated || c.is_web_image;
              const flagLabel = c.is_ai_generated ? '🤖 AI-GENERATED IMAGE (FLAGGED)' : c.is_web_image ? '🌐 WEB / STOCK IMAGE (FLAGGED)' : '';
              marker.bindPopup(`
                <div style="font-family: inherit; padding: 4px; min-width: 175px;">
                  <strong style="color: #0F172A; font-size: 13px;">${c.animal_type} (${c.priority})</strong>
                  ${c.is_sos ? '<p style="margin: 2px 0; font-size: 10px; font-weight: bold; color: #DC2626;">🚨 SOS EMERGENCY</p>' : ''}
                  ${isFlagged ? `<div style="margin: 4px 0; font-size: 10px; font-weight: 800; color: #BE123C; background: #FFE4E6; border: 1px solid #FDA4AF; padding: 3px 6px; border-radius: 6px;">⚠️ ${flagLabel}</div>` : ''}
                  <p style="margin: 4px 0 0; font-size: 11px; color: #64748B;">${c.address || 'Reported Location'}</p>
                  <p style="margin: 2px 0 0; font-size: 10px; font-weight: bold; color: #EA580C;">Status: ${c.status}</p>
                </div>
              `);
            }
          });

          setMapInstance(map);
        }
      }, 100);
    } else {
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null);
      }
    }
  }, [viewMode, filtered]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in-up space-y-6">
      
      {/* Header (Hero Panel in Chatpata Sunset Obsidian) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-950 text-white p-6 rounded-3xl border border-orange-500/30 shadow-xl shadow-orange-500/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ShieldAlert className="w-5 h-5 stroke-[2]" />
            </div>
            <h1 
              style={{ color: '#FACC15' }}
              className="text-2xl font-heading font-extrabold text-[#FACC15] text-cyber-yellow tracking-tight drop-shadow-sm"
            >
              {userRole === 'super_admin' ? 'Priority Dashboard & Triage Queue' : 'Municipal Officer & NGO Rescue Queue'}
            </h1>
          </div>
          <p className="text-xs text-amber-100/90 mt-1">Logged in as: <strong className="text-[#FFB703]">{userName || 'Officer'}</strong> ({userRole})</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle List / Map view */}
          <div className="p-1 bg-slate-800 rounded-xl border border-slate-700 flex text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-heading font-bold transition-all cursor-pointer ${viewMode === 'list' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg font-heading font-bold transition-all cursor-pointer ${viewMode === 'map' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              Interactive Map
            </button>
          </div>

          <a
            href="/verify-camera"
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2]" /> Live Video Verify
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['All', 'CRITICAL', 'HIGH', 'ROUTINE'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold border transition-all cursor-pointer ${
                filterPriority === p
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              {p} {p !== 'All' ? 'Priority' : 'Cases'}
            </button>
          ))}

          {/* AI / Web Flagged Filter Button */}
          <button
            onClick={() => setFilterPriority('FLAGGED')}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              filterPriority === 'FLAGGED'
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span>🤖 Flagged AI / Web</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              filterPriority === 'FLAGGED' ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-900'
            }`}>
              {flaggedCount}
            </span>
          </button>
        </div>
        <span className="text-xs text-slate-500 font-mono">Showing {filtered.length} active complaints</span>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div id="officer-map" className="w-full h-[450px] rounded-2xl border border-slate-200"></div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-orange-500/40 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-white p-1 border border-slate-100 shadow-inner">
                  <div className="relative rounded-xl overflow-hidden h-44 bg-slate-900">
                    <img src={getFullImageUrl(item.image_url)} alt={item.animal_type} className="w-full h-full object-cover" />
                    
                    {/* Top Left Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white border border-slate-700">
                        {item.animal_type} ({item.id})
                      </div>
                      {item.is_sos && (
                        <div className="bg-rose-600/95 backdrop-blur-md text-white text-[10px] font-mono font-black px-2 py-0.5 rounded-md border border-rose-400 shadow-xs flex items-center gap-1 animate-pulse">
                          <span>🚨 SOS EMERGENCY</span>
                        </div>
                      )}
                    </div>

                    {/* Top Right Priority & Review Badges */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                        (item.priority || '').toUpperCase() === 'CRITICAL' || (item.priority || '').toUpperCase() === 'EMERGENCY'
                          ? 'bg-red-500 text-white border-red-600 shadow-xs'
                          : (item.priority || '').toUpperCase() === 'HIGH'
                            ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                            : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      }`}>
                        {item.priority} {typeof item.priority_score === 'number' && `(${item.priority_score})`}
                      </span>
                      {item.requires_human_review && (
                        <span className="bg-red-700 text-white text-[9px] font-mono font-black px-2 py-0.5 rounded-md border border-white/40 shadow-xs animate-pulse">
                          ⚠️ URGENT REVIEW
                        </span>
                      )}
                    </div>

                    {/* Prominent Overlay Badge for AI or Web Image */}
                    {item.is_ai_generated ? (
                      <div className="absolute bottom-2 left-2 right-2 bg-rose-600/95 backdrop-blur-md text-white text-[10px] font-mono font-black px-2.5 py-1 rounded-lg border border-rose-400 shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider">
                        <span className="text-xs">🤖</span>
                        <span>AI-GENERATED IMAGE (FLAGGED)</span>
                      </div>
                    ) : item.is_web_image ? (
                      <div className="absolute bottom-2 left-2 right-2 bg-amber-600/95 backdrop-blur-md text-white text-[10px] font-mono font-black px-2.5 py-1 rounded-lg border border-amber-400 shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider">
                        <span className="text-xs">🌐</span>
                        <span>WEB / STOCK IMAGE (FLAGGED)</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Super Admin Flag Callout Banner */}
                {(item.is_ai_generated || item.is_web_image) && (
                  <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 shadow-xs ${
                    item.is_ai_generated 
                      ? 'bg-rose-50 border-rose-300 text-rose-900' 
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${item.is_ai_generated ? 'text-rose-600' : 'text-amber-600'}`} />
                    <div className="space-y-1">
                      <div className="font-heading font-extrabold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                        <span className="text-rose-700 font-black">
                          {item.is_ai_generated ? '🤖 AI Synthetic Image Flagged' : '🌐 Web / Stock Image Flagged'}
                        </span>
                        {item.is_sos && (
                          <span className="bg-rose-600 text-white text-[9px] font-mono font-black px-1.5 py-0.2 rounded shadow-xs animate-pulse">
                            SOS ALERT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-tight font-medium">
                        {item.is_ai_generated 
                          ? 'Super Admin Alert: This SOS report was generated using an AI synthetic image (diffusion/GAN pattern). Live field camera verification missing.'
                          : 'Super Admin Alert: This SOS report was generated using a downloaded web/stock image. Not a live field photo.'}
                      </p>
                      {item.authenticity_status && (
                        <div className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-300 text-slate-800">
                          Engine Verdict: {item.authenticity_status}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Status: <strong className="text-slate-900 font-bold font-mono">{item.status}</strong></span>
                  <span className="text-slate-400 text-[11px] font-mono">{item.created_at}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{item.description}</p>
                
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <p className="text-[11px] text-slate-600">Assigned Unit: <strong className="text-slate-900">{item.assigned_to || 'Unassigned'}</strong></p>
                  <p className="text-[11px] text-slate-600">Location: <strong className="text-slate-900">{item.address}</strong></p>
                </div>
              </div>

              {/* Officer Control Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {/* Status Update Quick Select */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'Searching')}
                    className={`py-1.5 px-2 font-bold rounded-xl transition-all cursor-pointer ${
                      item.status === 'Searching'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    🔍 Searching
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'Not Found')}
                    className={`py-1.5 px-2 font-bold rounded-xl transition-all cursor-pointer ${
                      item.status === 'Not Found'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    ❌ Not Found
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'Resolved')}
                    className={`py-1.5 px-2 font-bold rounded-xl transition-all cursor-pointer ${
                      item.status === 'Resolved'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    ✓ Resolved
                  </button>
                </div>

                {/* Assign Volunteer Unit Control (Removed when Resolved) */}
                {item.status === 'Resolved' ? (
                  <div className="w-full py-2 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 font-heading font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span>Case Resolved — Closed</span>
                  </div>
                ) : assigningId === item.id ? (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-[11px] font-heading font-bold text-slate-900">Select Available Volunteer</label>
                    <select
                      value={selectedVolunteer}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSelectedVolunteer(name);
                        const volObj = volunteers.find(v => v.name === name);
                        setSelectedVolunteerObj(volObj || null);
                      }}
                      className="block w-full px-3 py-2 text-slate-900 rounded-xl text-xs bg-white border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      {volunteers.length > 0 && volunteers.map((v) => (
                        <option key={v.id} value={v.name}>{v.name} ({v.current_zone || 'Mumbai East'}) - {v.status || 'Available'}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAssigningId(null)}
                        className="w-1/2 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-heading font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAssignVolunteer(item.id)}
                        className="w-1/2 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Confirm Assign
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAssigningId(item.id)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-heading font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-orange-600 stroke-[2]" /> Assign Volunteer Unit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && filtered.length === 0 && (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-heading font-bold text-slate-900">No Complaints in Queue</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">There are currently no active complaints matching your filter criteria in the database.</p>
        </div>
      )}

    </div>
  );
}
