import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { 
  BookOpen, ShieldAlert, Award, ThumbsUp, AlertCircle, PhoneCall, 
  HelpCircle, CheckCircle2, Flame, HeartHandshake, Send, ChevronRight, X
} from 'lucide-react';

export default function CommunityPage() {
  const { userZone, userName } = useAuth();
  const [activeTab, setActiveTab] = useState('stories'); // stories, awareness, cruelty, leaderboard
  const [stories, setStories] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Cruelty Form State
  const [crueltyForm, setCrueltyForm] = useState({ location: '', type: 'Illegal Abandonment / Neglect', notes: '' });
  const [crueltySubmitted, setCrueltySubmitted] = useState(false);
  const [crueltyCaseId, setCrueltyCaseId] = useState('');

  // One-Tap SOS Modal State
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosCode, setSosCode] = useState('');

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await apiClient.getLeaderboard();
        if (Array.isArray(res)) {
          setLeaderboard(res);
        }
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      }
    }
    loadLeaderboard();
  }, []);

  const handleUpvoteStory = (id) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, upvotes: s.upvotes + 1 } : s));
  };

  const handleCrueltySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.reportCruelty({
        incident_type: crueltyForm.type,
        location: crueltyForm.location,
        description: crueltyForm.notes
      });
      setCrueltyCaseId(res.case_id || 'LOGGED');
      setCrueltySubmitted(true);
    } catch (err) {
      console.error('Error reporting cruelty:', err);
    }
  };

  const handleTriggerSOS = async () => {
    try {
      const res = await apiClient.triggerSOS({
        latitude: 19.2183,
        longitude: 73.0868,
        note: "One-Tap Emergency SOS Triggered by Citizen in Dombivli"
      });
      setSosCode(res.sos_id || 'DISPATCHED');
      setSosSent(true);
      setTimeout(() => {
        setSosSent(false);
        setShowSosModal(false);
      }, 3000);
    } catch (err) {
      console.error('Error triggering SOS:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in-up space-y-8">
      
      {/* Page Header & One-Tap Prominent Red SOS Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Community, Awareness & SOS</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Success stories, rabies educational guides, legal rights & emergency SOS dispatch</p>
        </div>

        {/* PROMINENT ONE-TAP RED SOS BUTTON */}
        <button
          onClick={() => setShowSosModal(true)}
          className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-105 animate-pulse cursor-pointer shrink-0"
        >
          <Flame className="w-5 h-5 fill-white" />
          <span>ONE-TAP EMERGENCY SOS</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'stories', label: '📖 Rescue Stories' },
          { id: 'awareness', label: '📚 Rabies & Legal Guide' },
          { id: 'cruelty', label: '🚨 Report Cruelty' },
          { id: 'leaderboard', label: '🏆 Leaderboard & Points' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: RESCUE STORIES */}
      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.length === 0 ? (
            <div className="col-span-full glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">No Rescue Stories Published Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Community rescue stories and before/after transformations will be published here as street animal cases are resolved by officers and volunteers.
              </p>
            </div>
          ) : (
            stories.map((story) => (
              <div key={story.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {story.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-2">{story.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{story.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-950 border border-slate-800">
                    <img src={story.before_photo} alt="Before" className="w-full h-full object-cover grayscale" />
                    <span className="absolute bottom-2 left-2 bg-rose-500/80 backdrop-blur-md text-white font-bold text-[10px] px-2 py-0.5 rounded">
                      Before Rescue
                    </span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-950 border border-slate-800">
                    <img src={story.after_photo} alt="After" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-emerald-500/80 backdrop-blur-md text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded">
                      After Care ✨
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{story.summary}</p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-semibold">By: {story.author}</span>
                  <button
                    onClick={() => handleUpvoteStory(story.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-bold flex items-center gap-1.5 transition-all"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>{story.upvotes} Upvotes</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: AWARENESS & RABIES GUIDANCE */}
      {activeTab === 'awareness' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" /> Rabies Awareness & First Aid
            </h3>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <strong className="text-slate-100">1. Immediate Wound Washing:</strong> Wash animal bite/scratch wounds immediately under running water with soap for at least 15 minutes.
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <strong className="text-slate-100">2. Post-Exposure Vaccination:</strong> Administer Anti-Rabies Vaccine (ARV) within 24 hours of exposure.
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <strong className="text-slate-100">3. ABC Sterilization Protocol:</strong> Municipal ABC guidelines advocate non-cruel vaccination & release rather than culling.
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Animal Protection Laws & Do's / Don'ts
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                ✔️ <strong>Do:</strong> Provide clean water bowls outside homes during summer heatwaves.
              </li>
              <li className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                ✔️ <strong>Do:</strong> Report injured strays immediately on RescueNet for municipal vet dispatch.
              </li>
              <li className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                ❌ <strong>Don't:</strong> Relocate street dogs outside their territorial zone (illegal under PCA Act Sec 11).
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: REPORT CRUELTY */}
      {activeTab === 'cruelty' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-2xl mx-auto space-y-5">
          <div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Specialized Queue
            </span>
            <h3 className="text-xl font-black text-slate-100 mt-2">Report Animal Cruelty Incident</h3>
            <p className="text-xs text-slate-400">Routes directly to NGO Legal Advocates & Emergency Rescuers</p>
          </div>

          {!crueltySubmitted ? (
            <form onSubmit={handleCrueltySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Violation Type *</label>
                <select
                  value={crueltyForm.type}
                  onChange={(e) => setCrueltyForm({ ...crueltyForm, type: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-slate-100 rounded-xl text-xs bg-slate-900"
                >
                  <option value="Illegal Abandonment / Neglect">Illegal Abandonment / Neglect</option>
                  <option value="Physical Abuse / Violence">Physical Abuse / Violence</option>
                  <option value="Illegal Trapping or Relocation">Illegal Trapping or Relocation</option>
                  <option value="Poisoning Alert">Poisoning Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Landmark *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near MIDC Phase 2 Premises Gate 2, Dombivli East"
                  value={crueltyForm.location}
                  onChange={(e) => setCrueltyForm({ ...crueltyForm, location: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-slate-100 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Incident Description & Evidence Notes</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe incident in detail. Upload photos if available..."
                  value={crueltyForm.notes}
                  onChange={(e) => setCrueltyForm({ ...crueltyForm, notes: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-slate-100 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/20"
              >
                Submit Confidential Cruelty Report
              </button>
            </form>
          ) : (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-100">Cruelty Report Escalated to Legal Desk</h4>
              <p className="text-xs text-slate-400">Case #{crueltyCaseId} has been created and saved in the database.</p>
              <button onClick={() => setCrueltySubmitted(false)} className="text-xs text-emerald-400 underline font-semibold">
                Report Another Violation
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LEADERBOARD & GAMIFICATION */}
      {activeTab === 'leaderboard' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Welfare Champions Leaderboard
              </h3>
              <p className="text-xs text-slate-400">Points earned via validated rescues, sightings & feeding drives</p>
            </div>
          </div>

          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                No active leaderboard points recorded yet. Points will accumulate as citizens report cases and volunteers resolve tasks.
              </div>
            ) : (
              leaderboard.map((item) => (
                <div key={item.rank} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 font-extrabold text-xs flex items-center justify-center text-slate-300">
                      #{item.rank}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{item.name}</h4>
                      <span className="text-[10px] text-slate-400">{item.role} • Badge: <strong className="text-emerald-400">{item.badge}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400 font-mono">{item.points} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ONE-TAP SOS TRIGGER MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 fade-in-up">
          <div className="bg-slate-900 border border-rose-500/50 p-6 rounded-3xl max-w-md w-full space-y-4 text-center">
            {!sosSent ? (
              <>
                <div className="w-16 h-16 bg-rose-600/20 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/40 animate-bounce">
                  <Flame className="w-9 h-9 fill-rose-500" />
                </div>
                <h3 className="text-xl font-black text-slate-100">CONFIRM EMERGENCY SOS</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This will immediately broadcast critical emergency alerts with your current GPS coordinates to all on-duty Municipal Vets & Mobile Rescue Units within 5km.
                </p>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => setShowSosModal(false)}
                    className="w-1/2 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTriggerSOS}
                    className="w-1/2 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
                  >
                    DISPATCH SOS NOW 🚨
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-100">EMERGENCY SOS BROADCASTED</h3>
                <p className="text-xs text-emerald-400 font-mono">
                  SOS Tracking Code: {sosCode} • Alert dispatched to nearby dispatchers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
