import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { 
  ShieldAlert, MapPin, Users, Flame, CheckCircle2, Clock, 
  Search, XCircle, Camera, ChevronRight, UserPlus, Filter, AlertCircle
} from 'lucide-react';
import L from 'leaflet';

export default function OfficerDashboard() {
  const { userName, userRole } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [selectedVolunteerObj, setSelectedVolunteerObj] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const fetchData = async () => {
    try {
      const comps = await apiClient.getOfficerComplaints();
      if (Array.isArray(comps)) {
        setComplaints(comps.map(c => ({
          id: c.tracking_code || `RN-${c.id}`,
          rawId: c.id,
          animal_type: c.confirmed_animal_type || c.detected_animal_type || 'Stray Animal',
          priority: c.priority || 'Normal',
          status: c.status || 'New',
          address: c.address || 'GPS Coordinates',
          latitude: c.latitude || 19.2183,
          longitude: c.longitude || 73.0868,
          created_at: String(c.created_at || 'Just now'),
          description: c.description || 'Stray animal complaint recorded.',
          image_url: c.photo_url || null,
          assigned_to: c.assigned_volunteer_id ? `Volunteer #${c.assigned_volunteer_id}` : 'Unassigned'

        })));
      }

      const vols = await apiClient.getVolunteersList();
      if (Array.isArray(vols)) {
        setVolunteers(vols);
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
      await apiClient.assignVolunteer({
        complaint_id: complaintId,
        volunteer_name: selectedVolunteer,
        volunteer_id: selectedVolunteerObj ? selectedVolunteerObj.id : null,
        instructions: `Assigned rescue mission to ${selectedVolunteer}`
      });
      fetchData();
      setAssigningId(null);
      setSelectedVolunteer('');
      setSelectedVolunteerObj(null);
    } catch (err) {
      console.error('Error assigning volunteer:', err);
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      await apiClient.updateComplaintStatus({
        complaint_id: complaintId,
        status: newStatus
      });
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };


  const filtered = complaints.filter(c => filterPriority === 'All' || c.priority === filterPriority);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in-up space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Municipal Officer & NGO Rescue Queue</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Logged in as: <strong className="text-blue-400">{userName || 'Officer'}</strong> ({userRole})</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle List / Map view */}
          <div className="p-1 bg-slate-950 rounded-2xl border border-slate-800 flex text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${viewMode === 'list' ? 'bg-blue-500 text-slate-950' : 'text-slate-400'}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${viewMode === 'map' ? 'bg-blue-500 text-slate-950' : 'text-slate-400'}`}
            >
              Interactive Map
            </button>
          </div>

          <a
            href="/verify-camera"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" /> Live Video Verify
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['All', 'Emergency', 'Normal'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterPriority === p
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {p} Priority
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono">Showing {filtered.length} active complaints</span>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="glass-panel p-4 rounded-3xl border border-slate-800">
          <div id="officer-map" className="w-full h-[450px] rounded-2xl"></div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden h-44 bg-slate-950 border border-slate-800">
                  <img src={item.image_url} alt={item.animal_type} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-100 border border-slate-800">
                    {item.animal_type} ({item.id})
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      item.priority === 'Emergency' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Status: <strong className="text-emerald-400">{item.status}</strong></span>
                  <span className="text-slate-400 text-[11px] font-mono">{item.created_at}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{item.description}</p>
                
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
                  <p className="text-[11px] text-slate-400">Assigned Unit: <strong className="text-slate-200">{item.assigned_to || 'Unassigned'}</strong></p>
                  <p className="text-[11px] text-slate-400">Location: <strong className="text-slate-200">{item.address}</strong></p>
                </div>
              </div>

              {/* Officer Control Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                {/* Status Update Quick Select */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'Searching')}
                    className="py-1.5 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold rounded-lg"
                  >
                    🔍 Searching
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'Not Found')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold rounded-lg"
                  >
                    ❌ Not Found
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'Resolved')}
                    className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold rounded-lg"
                  >
                    ✓ Resolved
                  </button>
                </div>

                {/* Assign Volunteer Dropdown */}
                {assigningId === item.id ? (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300">Select Available Volunteer</label>
                    <select
                      value={selectedVolunteer}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSelectedVolunteer(name);
                        const volObj = volunteers.find(v => v.name === name);
                        setSelectedVolunteerObj(volObj || null);
                      }}
                      className="glass-input block w-full px-2 py-1.5 text-slate-100 rounded-xl text-xs bg-slate-900"
                    >
                      {volunteers.length > 0 && volunteers.map((v) => (
                        <option key={v.id} value={v.name}>{v.name} ({v.current_zone || 'Dombivli East'}) - {v.status || 'Available'}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAssigningId(null)}
                        className="w-1/2 py-1.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAssignVolunteer(item.id)}
                        className="w-1/2 py-1.5 bg-blue-500 text-slate-950 font-bold text-xs rounded-xl"
                      >
                        Confirm Assign
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAssigningId(item.id)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-400" /> Assign Volunteer Unit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && filtered.length === 0 && (
        <div className="glass-panel p-10 rounded-3xl border border-slate-800 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Complaints in Queue</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">There are currently no active complaints matching your filter criteria in the database.</p>
        </div>
      )}

    </div>
  );
}
