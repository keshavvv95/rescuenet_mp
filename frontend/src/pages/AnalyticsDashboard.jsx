import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  BarChart3, MapPin, Download, CheckCircle, Clock, AlertTriangle, 
  Layers, Users, Calendar, Filter, RefreshCw
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function AnalyticsDashboard() {
  const [data, setData] = useState({
    total_complaints: 0,
    total_reports: 0,
    resolved_cases: 0,
    avg_resolution_time_hrs: 0,
    emergency_ratio_percent: 0,
    complaints_by_zone: [],
    recent_hotspots: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [exporting, setExporting] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await apiClient.getCivicAnalytics();
      if (res) {
        setData({
          total_complaints: res.total_complaints ?? res.total_reports ?? 0,
          total_reports: res.total_reports ?? res.total_complaints ?? 0,
          resolved_cases: res.resolved_cases ?? 0,
          avg_resolution_time_hrs: res.avg_resolution_time_hrs ?? 0,
          emergency_ratio_percent: res.emergency_ratio_percent ?? 0,
          complaints_by_zone: Array.isArray(res.complaints_by_zone) ? res.complaints_by_zone : [],
          recent_hotspots: Array.isArray(res.recent_hotspots) ? res.recent_hotspots : []
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const handleFocus = () => fetchAnalytics();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(fetchAnalytics, 15000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchAnalytics]);

  // Initialize Mumbai density map
  useEffect(() => {
    if (loading) return;
    const container = document.getElementById('analytics-heat-map');
    if (container && !mapInstance) {
      const map = L.map('analytics-heat-map').setView([19.2183, 72.9781], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Plot zone coordinates
      data.complaints_by_zone.forEach((z) => {
        const markerLat = z.lat ?? z.latitude;
        const markerLng = z.lng ?? z.longitude;
        if (markerLat && markerLng) {
          const radius = Math.max(10, Math.min(35, (z.count || 0) * 3));
          const circle = L.circleMarker([markerLat, markerLng], {
            radius: radius,
            color: '#FF5722',
            fillColor: '#FF9F1C',
            fillOpacity: 0.6,
            weight: 2
          }).addTo(map);

          circle.bindPopup(`
            <div style="font-family: inherit; padding: 4px;">
              <strong style="font-size: 13px; color: #0F172A;">${z.zone}</strong>
              <p style="margin: 4px 0 0; font-size: 11px; color: #EA580C; font-weight: bold;">${z.count} Complaints Logged</p>
            </div>
          `);
        }
      });

      setMapInstance(map);
    }
  }, [loading, data, mapInstance]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await apiClient.downloadAnalyticsExport();
    } catch (err) {
      console.error('CSV Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const filteredZones = selectedZone === 'All Zones'
    ? data.complaints_by_zone
    : data.complaints_by_zone.filter(z => z.zone === selectedZone);

  const totalFilteredReports = selectedZone === 'All Zones'
    ? (data.total_complaints ?? data.total_reports ?? filteredZones.reduce((acc, curr) => acc + curr.count, 0))
    : filteredZones.reduce((acc, curr) => acc + curr.count, 0);

  const maxZoneCount = Math.max(...data.complaints_by_zone.map(z => z.count), 1);
  const totalComplaintsNum = data.total_complaints ?? data.total_reports ?? 0;
  const resolutionRate = totalComplaintsNum > 0 
    ? Math.round((data.resolved_cases / totalComplaintsNum) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in-up space-y-6">
      
      {/* Header & Controls (Chatpata Sunset Obsidian Hero) */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-950 text-white p-6 rounded-3xl border border-orange-500/30 shadow-xl shadow-orange-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <BarChart3 className="w-5 h-5 stroke-[2]" />
            </div>
            <h1 
              style={{ color: '#FACC15' }}
              className="text-2xl font-heading font-extrabold text-[#FACC15] text-cyber-yellow tracking-tight drop-shadow-sm"
            >
              Admin Analytics & Mumbai Zone Density Map
            </h1>
          </div>
          <p className="text-xs text-amber-100/90 mt-1">Real SQL aggregated complaint density across Mumbai municipal zones (PIN 421201/421202)</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3.5 py-2 text-white rounded-xl text-xs bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="All Zones" className="bg-slate-900 text-white">All 12 Mumbai Municipal Zones</option>
            {data.complaints_by_zone.map((z) => (
              <option key={z.code || z.zone} value={z.zone} className="bg-slate-900 text-white">
                {z.zone} ({z.count} cases)
              </option>
            ))}
          </select>

          <button
            onClick={fetchAnalytics}
            title="Refresh database statistics"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-heading font-bold text-xs rounded-xl border border-slate-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2]" /> {exporting ? 'Exporting...' : 'Export Report (CSV)'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Complaints</span>
          <div className="text-3xl font-heading font-extrabold text-amber-400">{totalFilteredReports}</div>
          <p className="text-[11px] text-slate-400">Database query result</p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Resolved Cases</span>
          <div className="text-3xl font-heading font-extrabold text-emerald-400">{data.resolved_cases}</div>
          <p className="text-[11px] text-slate-400">{resolutionRate}% resolution rate</p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Avg Resolution Time</span>
          <div className="text-3xl font-heading font-extrabold text-amber-400">{data.avg_resolution_time_hrs} hrs</div>
          <p className="text-[11px] text-amber-300">Calculated dispatch speed</p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Emergency Ratio</span>
          <div className="text-3xl font-heading font-extrabold text-orange-500">{data.emergency_ratio_percent}%</div>
          <p className="text-[11px] text-slate-400">Critical emergency cases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints by Zone Chart Visual */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-600 stroke-[2]" /> Complaint Volume by Zone (Mumbai)
          </h3>

          <div className="space-y-3 pt-2 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredZones.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No reports yet in this zone</p>
            ) : (
              filteredZones.map((z) => {
                const percent = Math.round((z.count / maxZoneCount) * 100);
                return (
                  <div key={z.code || z.zone} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-800">
                      <span className="font-medium">{z.zone}</span>
                      <strong className="font-mono text-orange-600">{z.count} cases</strong>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      {z.count > 0 ? (
                        <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: `${percent}%` }}></div>
                      ) : (
                        <div className="h-full w-0 bg-transparent"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600 stroke-[2]" /> Mumbai City Geospatial Density Map (Leaflet)
          </h3>
          <div id="analytics-heat-map" className="w-full h-[320px] rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    </div>
  );
}
