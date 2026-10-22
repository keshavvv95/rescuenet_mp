import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import {
  CheckSquare, MapPin, Navigation, Clock, UploadCloud,
  CheckCircle2, AlertCircle, Camera, ChevronRight, Check
} from 'lucide-react';

export default function VolunteerDashboard() {
  const { userName } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await apiClient.getVolunteerTasks();
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching volunteer tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompletionPhoto(URL.createObjectURL(file));
    }
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);

    try {
      await apiClient.updateIncidentStatus(selectedTask.id, 'Resolved');
      setSelectedTask(null);
      setCompletionPhoto(null);
      setCompletionNotes('');
      fetchTasks();
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-in-up space-y-6">
      {/* Hero Workstation Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-950 p-6 rounded-3xl border border-orange-500/30 shadow-xl shadow-orange-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <CheckSquare className="w-5 h-5 stroke-[2]" />
            </div>
            <h1 
              style={{ color: '#FACC15' }}
              className="text-2xl font-heading font-extrabold text-[#FACC15] text-cyber-yellow tracking-tight drop-shadow-sm"
            >
              Volunteer Rescue Workstation
            </h1>
          </div>
          <p className="text-xs text-amber-100/90 mt-1">Logged in as: <strong className="text-[#FFB703]">{userName || 'Volunteer'}</strong> (Volunteer Rescuer)</p>
        </div>

        <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-orange-500/20 text-amber-300 border border-orange-500/40 shadow-xs">
          {tasks.filter(t => t.status !== 'Resolved').length} Active Rescues Assigned
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-heading font-bold text-slate-900">No Volunteer Tasks Assigned</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">There are currently no active rescue missions assigned to your account. New tasks assigned by officers will appear here in real time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-orange-500/40 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-extrabold text-slate-900">{task.animal_type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Case #{task.case_id}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    (task.priority || '').toUpperCase() === 'CRITICAL' || (task.priority || '').toUpperCase() === 'EMERGENCY'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : (task.priority || '').toUpperCase() === 'HIGH'
                        ? 'bg-orange-50 text-orange-600 border-orange-200'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {task.priority}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <p className="text-slate-600">Location: <strong className="text-slate-900">{task.address}</strong></p>
                  <p className="text-slate-600">Assigned: <span className="text-orange-600 font-bold font-mono">{task.assigned_at}</span></p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">Instructions:</strong> {task.instructions}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Navigation className="w-4 h-4 text-orange-600 stroke-[2]" /> Start GPS Nav
                </a>

                {task.status !== 'Resolved' ? (
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="w-1/2 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white stroke-[2]" /> Mark Complete
                  </button>
                ) : (
                  <div className="w-1/2 py-2.5 bg-emerald-50 text-emerald-700 font-heading font-bold text-xs rounded-xl border border-emerald-200 text-center">
                    ✓ Task Resolved
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 fade-in-up">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-heading font-extrabold text-slate-900">Complete Rescue: Case #{selectedTask.case_id}</h3>
            
            <form onSubmit={handleCompleteTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-heading font-bold text-slate-900 mb-1.5">Rescue Completion Photo *</label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl p-4 bg-slate-50 text-center overflow-hidden transition-all">
                  {completionPhoto ? (
                    <img src={completionPhoto} alt="Proof" className="w-full h-44 object-contain rounded-xl bg-slate-900" />
                  ) : (
                    <div className="py-4">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1 stroke-[1.5]" />
                      <p className="text-xs font-heading font-bold text-slate-800">Upload completion photo proof</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-900 mb-1.5">Resolution Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Wound treated, dog loaded in shelter mobile van..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-slate-900 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-heading font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                >
                  {submitting ? 'Updating Status...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
