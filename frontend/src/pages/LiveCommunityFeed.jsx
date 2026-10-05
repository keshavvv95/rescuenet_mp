import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { 
  Radio, ThumbsUp, MapPin, Plus, MessageSquare, ShieldCheck, Image, Send, 
  CheckCircle2, AlertCircle, Flame, Heart, Sparkles, Navigation, ArrowRight
} from 'lucide-react';

export default function LiveCommunityFeed() {
  const { userZone, userName } = useAuth();
  const [activeTab, setActiveTab] = useState('All Cases');
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const data = await apiClient.getFeedSightings(userZone || 'Dombivli East');
      if (Array.isArray(data)) {
        setFeedItems(data);
      } else {
        setFeedItems([]);
      }
    } catch (err) {
      console.error('Error fetching feed sightings:', err);
      setFeedItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [userZone]);

  const handleUpvote = (id) => {
    setFeedItems(prev => prev.map(item => item.id === id ? { ...item, upvotes: (item.upvotes || 0) + 1 } : item));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 fade-in-up">
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">

        {/* Top Status Header Bar */}
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            {userZone || "Dombivli East — Zone Net"}
          </span>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
            60s AVG DISPATCH
          </span>
        </div>

        {/* Instant AI Triage Callout Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 rounded-3xl p-5 text-white shadow-lg shadow-rose-600/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider">
              ⚡ INSTANT AI TRIAGE • Dombivli Civic Net
            </span>
          </div>
          <h2 className="text-xl font-black leading-tight">
            Report Injured Stray
          </h2>
          <p className="text-xs opacity-90 leading-snug">
            Instant AI veterinary triage. Nearest Dombivli volunteers squad alerted in &lt;60s.
          </p>
          <a href="/" className="inline-flex items-center gap-1.5 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs px-5 py-2.5 rounded-2xl shadow-md transition-all">
            <span>Tap for Field Rescue</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>



        {/* Feed Sightings Cards */}
        <div className="space-y-4">
          {feedItems.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Community Sightings</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">There are currently no active animal sightings reported in this zone.</p>
            </div>
          ) : (
            feedItems.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              
              {/* Author & Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                    {item.author_name.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                      {item.author_name}
                      {item.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.time_ago || item.sighting_time} • {item.distance || '0.8 km'} • {item.location}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border font-mono tracking-wider ${item.status_bg || 'bg-rose-100 text-rose-700 border-rose-300'}`}>
                  ● {item.status_tag || 'ACTIVE REPORT'}
                </span>
              </div>

              {/* Photo Banner with AI Overlay */}
              {item.photo_url && (
                <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img src={item.photo_url} alt="Sighting" className="w-full h-full object-cover" />
                  
                  {item.ai_tag && (
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border border-slate-700">
                      {item.ai_tag}
                    </div>
                  )}

                  {item.triage_score && (
                    <div className="absolute top-3 right-3 bg-rose-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-black">
                      Triage {item.triage_score}
                    </div>
                  )}
                </div>
              )}

              {/* Caption */}
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {item.description || item.notes}
              </p>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleUpvote(item.id)}
                    className="flex items-center gap-1.5 hover:text-emerald-700 font-bold text-slate-700"
                  >
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    <span>Verify ({item.upvotes || 12})</span>
                  </button>
                  <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span>{item.comments || 4} comments</span>
                  </span>
                </div>
              </div>

            </div>
          )))}
        </div>

      </div>
    </div>
  );
}
