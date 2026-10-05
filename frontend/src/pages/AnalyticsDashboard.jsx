import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { BarChart3, Download, MapPin, TrendingUp, Clock, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';

export default function AnalyticsDashboard() {
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [exporting, setExporting] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    total_reports: 0,
    resolved_cases: 0,
    avg_resolution_time_hrs: 0,
    emergency_ratio_percent: 0,
    complaints_by_zone: []
  });

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await apiClient.getAnalyticsOverview();
        if (res) {
          setAnalyticsData(res);
        }
      } catch (err) {
        console.error('Error loading analytics overview:', err);
      }
    }
    loadAnalytics();
  }, []);

  const data = analyticsData;

  // Filter zone data if specific zone selected
  const filteredZones = selectedZone === 'All Zones'
    ? data.complaints_by_zone
    : data.complaints_by_zone.filter(z => z.zone === selectedZone || z.code === selectedZone);

  const maxZoneCount = Math.max(1, ...filteredZones.map(z => z.count));
  const totalFilteredReports = selectedZone === 'All Zones' 
    ? data.total_reports 
    : (filteredZones[0]?.count || 0);

  const resolutionRate = data.total_reports > 0 ? Math.round((data.resolved_cases / data.total_reports) * 100) : 0;

  // Leaflet Map Density Initialization - Centered precisely on Dombivli City (19.2183, 73.0868)
  useEffect(() => {
    const container = L.DomUtil.get('analytics-heat-map');
    if (container != null) {
      container._leaflet_id = null;
    }

    const map = L.map('analytics-heat-map').setView([19.2183, 73.0868], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Plot markers at exact geocoded Dombivli zone coordinates
    data.complaints_by_zone.forEach((z) => {
      const lat = z.latitude || (z.code?.includes('-E-') ? 19.2136 : 19.2221);
      const lng = z.longitude || (z.code?.includes('-E-') ? 73.0927 : 73.0809);
      
      const isSelected = selectedZone === 'All Zones' || selectedZone === z.zone;
      if (isSelected) {
        L.circleMarker([lat, lng], {
          radius: Math.min(25, 8 + z.count * 3),
          color: z.color || '#3b82f6',
          fillColor: z.color || '#3b82f6',
          fillOpacity: 0.6
        }).bindPopup(`<b>${z.zone}</b><br/>Code: ${z.code}<br/>Recorded Cases: ${z.count}`).addTo(map);
      }
    });

    return () => {
      map.remove();
    };
  }, [data, selectedZone]);

  const handleExportCSV = () => {
    setExporting(true);
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,Zone Code,Zone Name,Latitude,Longitude,Total Complaints\n" +
        data.complaints_by_zone.map(z => `"${z.code}","${z.zone}",${z.latitude},${z.longitude},${z.count}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `RescueNet_Dombivli_Analytics_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in-up space-y-6">
      
      {/* Header & Controls */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Admin Analytics & Dombivli Zone Density Map</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real SQL aggregated complaint density across Dombivli municipal zones (PIN 421201/421202)</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="glass-input px-3 py-2 text-slate-100 rounded-xl text-xs bg-slate-900"
          >
            <option value="All Zones">All 12 Dombivli Municipal Zones</option>
            {data.complaints_by_zone.map((z) => (
              <option key={z.code || z.zone} value={z.zone}>
                {z.zone} ({z.count} cases)
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export Report (CSV)'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Complaints</span>
          <div className="text-2xl font-black text-slate-100">{totalFilteredReports}</div>
          <p className="text-[11px] text-slate-400">Database query result</p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved Cases</span>
          <div className="text-2xl font-black text-emerald-400">{data.resolved_cases}</div>
          <p className="text-[11px] text-slate-400">{resolutionRate}% resolution rate</p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Resolution Time</span>
          <div className="text-2xl font-black text-indigo-400">{data.avg_resolution_time_hrs} hrs</div>
          <p className="text-[11px] text-emerald-400">Calculated dispatch speed</p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Ratio</span>
          <div className="text-2xl font-black text-rose-400">{data.emergency_ratio_percent}%</div>
          <p className="text-[11px] text-slate-400">Critical emergency cases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints by Zone Chart Visual */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> Complaint Volume by Zone (Dombivli)
          </h3>

          <div className="space-y-3 pt-2 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredZones.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No reports yet in this zone</p>
            ) : (
              filteredZones.map((z) => {
                const percent = Math.round((z.count / maxZoneCount) * 100);
                return (
                  <div key={z.code || z.zone} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>{z.zone}</span>
                      <strong className="font-mono text-slate-100">{z.count} cases</strong>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      {z.count > 0 ? (
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: z.color }}></div>
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
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400" /> Dombivli City Geospatial Density Map (Leaflet)
          </h3>
          <div id="analytics-heat-map" className="w-full h-[320px] rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}
