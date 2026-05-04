'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Check, 
  X, 
  RefreshCw, 
  AlertTriangle,
  Building2,
  LogOut,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function FacilityDashboard() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'all'>('pending');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/appointments/my-appointments', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/appointments/${id}/status?status=${status}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filteredAppointments = appointments.filter(appt => {
    if (activeTab === 'all') return true;
    return appt.status === activeTab;
  });

  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 p-8 hidden lg:flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
            <Building2 size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-800">HALIYA HUB</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold transition-all">
            <Calendar size={20} />
            Queue Manager
          </button>
          <Link href="/dashboard" className="flex items-center gap-3 p-4 text-slate-500 hover:bg-slate-50 rounded-2xl font-bold transition-all">
            <AlertTriangle size={20} />
            Health Alerts
          </Link>
        </nav>

        <button 
          onClick={logout}
          className="flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-all"
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{user?.name}</h1>
            <p className="text-slate-500 font-medium">Healthcare Facility Dashboard • Central Management</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-4 bg-white text-slate-400 rounded-2xl hover:text-slate-600 transition-all border border-slate-100 shadow-sm">
              <Bell size={20} />
            </button>
            <div className="bg-blue-600 px-6 py-4 rounded-2xl flex items-center gap-2 text-white font-bold shadow-xl shadow-blue-100">
              <RefreshCw size={18} />
              Live Sync Active
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit mb-8 border border-slate-200">
          {['pending', 'confirmed', 'all'].map((tab: any) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">Patient Appointment Queue</h2>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search patient..."
                className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-8 py-6">Patient</th>
                  <th className="px-8 py-6">Symptoms Summary</th>
                  <th className="px-8 py-6">Why Urgent?</th>
                  <th className="px-8 py-6">Risk Score</th>
                  <th className="px-8 py-6">Date & Time</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium">
                      No appointments found in this category.
                    </td>
                  </tr>
                ) : (
                  (filteredAppointments || []).map((appt) => (
                    <motion.tr 
                      key={appt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${getUrgencyBg(appt.triage_score)} ${getUrgencyText(appt.triage_score)}`}>
                            {appt.patient_name?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{appt.patient_name}</p>
                            <p className="text-xs text-slate-400 font-medium">ID: {appt.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 max-w-[200px]">
                        <p className="text-slate-600 text-sm font-bold truncate">{appt.symptoms_summary}</p>
                      </td>
                      <td className="px-8 py-6 max-w-xs">
                        <p className="text-slate-500 text-xs font-medium italic">
                          {appt.triage_explanation || "No AI explanation available."}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getUrgencyIndicator(appt.triage_score)}`} />
                            <span className={`text-sm font-black ${getUrgencyText(appt.triage_score)}`}>
                              {appt.triage_score}/10
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
                            {getUrgencyLabel(appt.triage_score)}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-800">
                          {new Date(appt.appointment_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-400 font-bold">
                          {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {appt.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => updateStatus(appt.id, 'confirmed')}
                              className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => updateStatus(appt.id, 'cancelled')}
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${getStatusStyle(appt.status)}`}>
                            {appt.status}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function getUrgencyIndicator(score: number) {
  if (score >= 9) return 'bg-red-600 animate-ping';
  if (score >= 7) return 'bg-orange-500';
  if (score >= 4) return 'bg-blue-500';
  return 'bg-teal-500';
}

function getUrgencyBg(score: number) {
  if (score >= 9) return 'bg-red-50';
  if (score >= 7) return 'bg-orange-50';
  if (score >= 4) return 'bg-blue-50';
  return 'bg-teal-50';
}

function getUrgencyText(score: number) {
  if (score >= 9) return 'text-red-600';
  if (score >= 7) return 'text-orange-600';
  if (score >= 4) return 'text-blue-600';
  return 'text-teal-600';
}

function getUrgencyLabel(score: number) {
  if (score >= 9) return 'CRITICAL / ER';
  if (score >= 7) return 'URGENT CARE';
  if (score >= 4) return 'CLINICAL';
  return 'ROUTINE';
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-green-50 text-green-600';
    case 'cancelled': return 'bg-red-50 text-red-600';
    default: return 'bg-slate-50 text-slate-600';
  }
}
