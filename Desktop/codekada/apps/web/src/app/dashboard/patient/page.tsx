'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  HeartPulse,
  LogOut,
  User as UserIcon,
  Building2,
  X,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PatientDashboardContent() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  
  // Booking Form State
  const [selectedFacility, setSelectedFacility] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [triageScore, setTriageScore] = useState<number | null>(null);
  const [triageExplanation, setTriageExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('book') === 'true') {
      setShowBooking(true);
      const incomingSymptoms = searchParams.get('symptoms');
      const score = searchParams.get('score');
      const explanation = searchParams.get('explanation');
      if (incomingSymptoms) setSymptoms(incomingSymptoms);
      if (score) setTriageScore(parseInt(score));
      if (explanation) setTriageExplanation(explanation);
    }
  }, [searchParams]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [apptRes, facRes] = await Promise.all([
        fetch('http://localhost:3000/api/appointments/my-appointments', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }),
        fetch('http://localhost:3000/api/appointments/facilities', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
      ]);
      if (apptRes.status === 401 || apptRes.status === 403 || facRes.status === 401 || facRes.status === 403) {
        logout();
        return;
      }
      
      const appts = await apptRes.json();
      const facs = await facRes.json();
      setAppointments(Array.isArray(appts) ? appts : []);
      setFacilities(Array.isArray(facs) ? facs : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3000/api/appointments/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          facility_id: selectedFacility,
          appointment_date: apptDate,
          symptoms_summary: symptoms,
          triage_score: triageScore || 5,
          triage_explanation: triageExplanation
        }),
      });
      
      if (response.ok) {
        setShowBooking(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 p-8 hidden lg:flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="bg-teal-600 p-2 rounded-xl text-white">
            <HeartPulse size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter">HALIYA</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard/patient" className="flex items-center gap-3 p-4 bg-teal-50 text-teal-700 rounded-2xl font-bold">
            <Calendar size={20} />
            Appointments
          </Link>
          <Link href="/triage" className="flex items-center gap-3 p-4 text-slate-500 hover:bg-slate-50 rounded-2xl font-bold transition-all">
            <Stethoscope size={20} />
            Symptom Checker
          </Link>
          <Link href="/history" className="flex items-center gap-3 p-4 text-slate-500 hover:bg-slate-50 rounded-2xl font-bold transition-all">
            <Clock size={20} />
            My History
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
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hello, {user?.name}</h1>
            <p className="text-slate-500 font-medium">Manage your healthcare journey and appointments.</p>
          </div>
          <button 
            onClick={() => setShowBooking(true)}
            className="flex items-center gap-2 px-6 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-100"
          >
            <Plus size={20} />
            Book New Appointment
          </button>
        </header>

        {/* Appointments Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Your Appointments</h2>
          
          {appointments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No appointments scheduled yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(appointments || []).map((appt) => (
                <motion.div 
                  key={appt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Building2 size={24} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyle(appt.status)}`}>
                      {appt.status}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{appt.facility_name}</h3>
                    <p className="text-slate-500 text-sm font-medium flex items-center gap-1">
                      <MapPin size={14} /> Local Health Center
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-sm font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-teal-500" />
                      {new Date(appt.appointment_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-teal-500" />
                      {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Book Appointment</h3>
              <button onClick={() => setShowBooking(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleBook} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Select Facility</label>
                <select 
                  required
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                >
                  <option value="">Choose a hospital or clinic</option>
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.location})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Date & Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Brief Symptoms</label>
                <textarea 
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Why are you visiting?"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium h-24 resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-teal-600 text-white rounded-2xl text-lg font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-2 group disabled:bg-teal-400"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : (
                  <>Confirm Booking <ArrowRight size={20} /></>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-50 text-yellow-600';
    case 'confirmed': return 'bg-green-50 text-green-600';
    case 'cancelled': return 'bg-red-50 text-red-600';
    default: return 'bg-slate-50 text-slate-600';
  }
}

export default function PatientDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>}>
      <PatientDashboardContent />
    </Suspense>
  );
}
