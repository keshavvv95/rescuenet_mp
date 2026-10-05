import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { CheckSquare, MapPin, Navigation, UploadCloud, CheckCircle2, Flame, Clock, Loader, AlertCircle } from 'lucide-react';

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
      await apiClient.completeVolunteerTask({
        task_id: selectedTask.id,
        completion_photo: completionPhoto,
        resolution_notes: completionNotes
      });
      fetchTasks();
      setSelectedTask(null);
      setCompletionPhoto(null);
      setCompletionNotes('');
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-in-up space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Volunteer Rescue Workstation</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Logged in as: <strong className="text-amber-400">{userName || 'Volunteer'}</strong> (Volunteer Rescuer)</p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          {tasks.filter(t => t.status !== 'Resolved').length} Active Rescues Assigned
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-panel p-10 rounded-3xl border border-slate-800 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Volunteer Tasks Assigned</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">There are currently no active rescue missions assigned to your account. New tasks assigned by officers will appear here in real time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-100">{task.animal_type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Case #{task.case_id}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    task.priority === 'Emergency' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {task.priority}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 text-xs">
                  <p className="text-slate-400">Location: <strong className="text-slate-200">{task.address}</strong></p>
                  <p className="text-slate-400">Assigned: <span className="text-amber-400 font-semibold">{task.assigned_at}</span></p>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-amber-400">Instructions:</strong> {task.instructions}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-slate-800 flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-4 h-4 text-emerald-400" /> Start GPS Nav
                </a>

                {task.status !== 'Resolved' ? (
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="w-1/2 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Complete
                  </button>
                ) : (
                  <div className="w-1/2 py-2.5 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 text-center">
                    ✓ Task Resolved
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Complete Task Drawer / Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 fade-in-up">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="text-base font-extrabold text-slate-100">Complete Rescue: Case #{selectedTask.case_id}</h3>
            
            <form onSubmit={handleCompleteTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rescue Completion Photo *</label>
                <div className="relative border-2 border-dashed border-slate-800 hover:border-amber-400/50 rounded-2xl p-4 bg-slate-950 text-center overflow-hidden">
                  {completionPhoto ? (
                    <img src={completionPhoto} alt="Proof" className="w-full h-40 object-cover rounded-xl" />
                  ) : (
                    <div className="py-4">
                      <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-300">Upload completion photo proof</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Wound treated, dog loaded in shelter mobile van..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="glass-input block w-full px-3 py-2 text-slate-100 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="w-1/3 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20"
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
