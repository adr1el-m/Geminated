'use client';

import React, { useEffect, useState } from 'react';
import { 
  getDashboardSummary, 
  getByRegion, 
  getTrend, 
  getActiveAlerts,
  DashboardSummary,
  RegionStat,
  TrendData,
  Alert
} from '@/lib/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  Activity, Users, AlertTriangle, Map as MapIcon, 
  TrendingUp, Calendar, RefreshCw 
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet (SSR issues)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

import 'leaflet/dist/leaflet.css';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, r, t, a] = await Promise.all([
        getDashboardSummary(),
        getByRegion(),
        getTrend(),
        getActiveAlerts()
      ]);
      setSummary(s);
      setRegions(r);
      setTrend(t);
      setAlerts(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Public Health Dashboard</h1>
            <p className="text-slate-500 font-medium">Real-time symptom trends and outbreak monitoring across the Philippines.</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        {/* Alert Banner */}
        {alerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-6 flex items-start gap-4"
          >
            <div className="p-3 bg-orange-500 rounded-2xl text-white">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-800">Active Health Warnings</h3>
              <div className="space-y-2 mt-2">
                {alerts.map(alert => (
                  <p key={alert.id} className="text-orange-700 font-medium">
                    ⚠️ {alert.message} ({alert.region})
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<Users className="text-blue-600" />} 
            label="Total Reports Today" 
            value={summary?.total_reports_today || 0} 
            bgColor="bg-blue-50"
          />
          <StatCard 
            icon={<Activity className="text-teal-600" />} 
            label="Average Urgency" 
            value={`${summary?.avg_urgency_score || 0}/10`} 
            bgColor="bg-teal-50"
          />
          <StatCard 
            icon={<AlertTriangle className="text-orange-600" />} 
            label="Most Affected Region" 
            value={summary?.most_affected_region || "None"} 
            bgColor="bg-orange-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map View */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MapIcon size={20} className="text-teal-500" />
              Regional Report Density
            </h3>
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-100">
              <MapContainer 
                center={[12.8797, 121.7740]} 
                zoom={6} 
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {regions.map((reg, i) => (
                  <CircleMarker 
                    key={i}
                    center={getCoords(reg.region)}
                    radius={Math.sqrt(reg.report_count) * 10}
                    pathOptions={{ 
                      color: reg.avg_urgency > 7 ? '#ef4444' : '#0d9488',
                      fillOpacity: 0.6
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-bold">{reg.region}</p>
                        <p>Reports: {reg.report_count}</p>
                        <p>Avg Urgency: {reg.avg_urgency}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-teal-500" />
              7-Day Report Trend
            </h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0d9488" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Symptoms & Regional Table */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-teal-500" />
            Regional Statistics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                  <th className="pb-4">Region</th>
                  <th className="pb-4">Reports</th>
                  <th className="pb-4">Avg Urgency</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {regions.map((reg, i) => (
                  <tr key={i} className="text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-bold text-slate-800">{reg.region}</td>
                    <td className="py-4">{reg.report_count}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${reg.avg_urgency > 7 ? 'bg-red-500' : 'bg-teal-500'}`}
                            style={{ width: `${reg.avg_urgency * 10}%` }}
                          />
                        </div>
                        {reg.avg_urgency}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        reg.avg_urgency > 7 ? 'bg-red-50 bg-red-600' : 'bg-teal-50 text-teal-600'
                      }`}>
                        {reg.avg_urgency > 7 ? 'High Risk' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, bgColor }: any) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center gap-6">
      <div className={`p-4 ${bgColor} rounded-2xl`}>
        {React.cloneElement(icon, { size: 32 })}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

// Simple coordinate mapper for PH regions
function getCoords(region: string): [number, number] {
  const regions: any = {
    "Metro Manila": [14.5995, 120.9842],
    "Ilocos Region": [17.5705, 120.3871],
    "Cagayan Valley": [17.6132, 121.7271],
    "Central Luzon": [15.4828, 120.7120],
    "CALABARZON": [14.1008, 121.0794],
    "MIMAROPA": [12.9996, 121.0188],
    "Bicol Region": [13.4115, 123.3345],
    "Western Visayas": [10.7202, 122.5621],
    "Central Visayas": [10.3157, 123.8854],
    "Eastern Visayas": [11.2444, 125.0033],
    "Zamboanga Peninsula": [7.8430, 123.1946],
    "Northern Mindanao": [8.4542, 124.6319],
    "Davao Region": [7.1907, 125.4553],
    "SOCCSKSARGEN": [6.5235, 124.8426],
    "Caraga": [9.0478, 125.8093],
    "BARMM": [7.2096, 124.2417],
    "Cordillera Administrative Region": [17.4124, 120.9184]
  };
  return regions[region] || [12.8797, 121.7740];
}
