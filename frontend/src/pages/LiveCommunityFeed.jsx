import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import {
  Radio, ThumbsUp, MapPin, Plus, MessageSquare, ShieldCheck, Image, Send,
  CheckCircle2, AlertCircle, Flame, Heart, Sparkles, Navigation, ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function LiveCommunityFeed() {
  const { userZone, userName } = useAuth();
  const [activeTab, setActiveTab] = useState('All Cases');
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState(userZone || "Mumbai East — Zone Net");

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Just now';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString();
    } catch {
      return timeStr;
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/')) {
      const base = API_BASE_URL.replace(/\/api$/, '');
      return `${base}${url}`;
    }
    return url;
  };

  const fetchFeed = async () => {
    try {
      const data = await apiClient.getFeedSightings();
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
    const fetchLocation = async () => {
      import('../services/locationHelper').then(async ({ getCurrentLocation }) => {
        const loc = await getCurrentLocation();
        if (loc && loc.address) {
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.latitude}&lon=${loc.longitude}&format=json`);
            const data = await response.json();
            if (data && data.display_name) {
               setLiveLocation(data.display_name.split(',').slice(0, 3).join(', '));
            } else {
               setLiveLocation(loc.address);
            }
          } catch (err) {
            setLiveLocation(loc.address);
          }
        }
      });
    };
    fetchLocation();
    fetchFeed();

    // Auto-refresh live feed periodically and on window focus
    const interval = setInterval(fetchFeed, 8000);
    const handleFocus = () => fetchFeed();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userZone]);

  const handleUpvote = async (id) => {
    try {
      const res = await apiClient.corroborateSighting(id);
      if (res && res.success) {
        setFeedItems(prev => prev.map(item => item.id === id ? {
          ...item,
          corroboration_count: res.new_count,
          has_upvoted: res.has_upvoted
        } : item));
      }
    } catch (err) {
      console.error("Failed to verify/corroborate:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 fade-in-up">
      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

        {/* Top Status Header Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500">
          <span className="flex items-center gap-2 text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
            {liveLocation}
          </span>
          <span className="bg-orange-500/10 text-orange-600 border border-orange-500/30 px-3 py-1 rounded-full uppercase text-[10px] tracking-wider font-extrabold">
            60s AVG DISPATCH
          </span>
        </div>

        {/* Hero Section: Chatpata Sunset Obsidian */}
        <div className="bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-950 rounded-3xl p-6 text-white border border-orange-500/30 shadow-xl shadow-orange-500/10 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="bg-orange-500/20 text-amber-300 border border-orange-500/40 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              ⚡ INSTANT AI TRIAGE • Live Loc Net
            </span>
          </div>
          <h2 
            style={{ color: '#FACC15' }}
            className="text-2xl font-heading font-extrabold text-[#FACC15] text-cyber-yellow leading-tight drop-shadow-md"
          >
            Report Injured Stray
          </h2>
          <p className="text-xs text-amber-100/90 leading-relaxed max-w-md">
            Instant AI veterinary triage with automated consensus. Nearest Mumbai volunteers squad alerted in &lt;60s.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-orange-500/25 transition-all active:scale-95"
          >
            <span>Tap for Field Rescue</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </a>
        </div>

        {/* Feed Sightings Cards */}
        <div className="space-y-4">
          {feedItems.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
              <h3 className="text-base font-heading font-bold text-slate-900">No Community Sightings</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">There are currently no active animal sightings reported in this zone.</p>
            </div>
          ) : (
            feedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 shadow-sm hover:shadow-md transition-all">

                {/* Author & Status Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-heading font-bold text-xs shadow-xs">
                      {item.author_name ? item.author_name.substring(0, 2) : 'RN'}
                    </div>
                    <div>
                      <h4 className="text-xs font-heading font-extrabold text-slate-900 flex items-center gap-1">
                        {item.author_name}
                        {item.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {formatTime(item.sighting_time)} • {item.location}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border tracking-wider bg-orange-50 text-orange-600 border-orange-200">
                    ● {item.animal_type ? `${item.animal_type.toUpperCase()} RESCUE ALERT` : 'ACTIVE SOS REPORT'}
                  </span>
                </div>

                {/* Animal Photography */}
                {item.photo_url && (
                  <div className="relative rounded-2xl overflow-hidden bg-white p-1 border border-slate-100 shadow-inner">
                    <div className="relative h-56 rounded-xl overflow-hidden bg-slate-900">
                      <img src={getFullImageUrl(item.photo_url)} alt="Sighting" className="w-full h-full object-cover" />

                      {item.ai_tag && (
                        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border border-slate-700 shadow-md">
                          {item.ai_tag}
                        </div>
                      )}

                      {typeof item.triage_score === 'number' && item.triage_score > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <div className={`text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-black shadow-md ${
                            (item.priority || '').toUpperCase() === 'CRITICAL'
                              ? 'bg-red-600'
                              : (item.priority || '').toUpperCase() === 'HIGH'
                                ? 'bg-orange-500'
                                : 'bg-emerald-600'
                          }`}>
                            {item.priority || 'TRIAGE'} {item.triage_score}/100
                          </div>
                          {item.requires_human_review && (
                            <div className="bg-red-700 text-white px-1.5 py-1 rounded-lg text-[9px] font-mono font-bold shadow-md animate-pulse">
                              Review
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Caption / Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description || item.notes}
                </p>

                {/* Action Buttons Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleUpvote(item.id)}
                      className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${item.has_upvoted ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                      <ThumbsUp className={`w-4 h-4 stroke-[1.75] ${item.has_upvoted ? 'fill-orange-500 text-orange-500' : 'text-slate-500'}`} />
                      <span>Verify ({item.corroboration_count || 0})</span>
                    </button>
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <MessageSquare className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                      <span>{item.comments || 0} comments</span>
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
