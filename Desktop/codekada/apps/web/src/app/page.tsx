'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  HeartPulse, 
  Shield, 
  Activity, 
  Globe, 
  ChevronRight, 
  Stethoscope, 
  Building2, 
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-2 rounded-xl text-white shadow-lg shadow-teal-200">
              <HeartPulse size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-800">
              HALIYA
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <Link href="/triage" className="hover:text-teal-600 transition-colors">Triage Checker</Link>
            <Link href="/dashboard" className="hover:text-teal-600 transition-colors">Public Health</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href={user.role === 'patient' ? '/dashboard/patient' : '/dashboard/facility'} className="text-sm font-bold text-slate-600 hover:text-slate-900">
                  Dashboard
                </Link>
                <button onClick={logout} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-bold text-slate-600 hover:text-slate-900">
                  Login
                </Link>
                <Link href="/auth/signup" className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-teal-100/30 blur-[150px] rounded-full -z-10" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/20 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-100">
              <Shield size={14} />
              Philippine AI Health Triage
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9]">
              The future of <br />
              <span className="text-teal-600 font-black">health triage</span> <br />
              is here.
            </h1>
            <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
              Haliya bridges the gap between symptoms and care. Use our AI to assess urgency, track health trends, and book appointments—all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/triage" className="px-8 py-5 bg-teal-600 text-white rounded-2xl text-lg font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-200 flex items-center justify-center gap-2 group">
                Check My Symptoms
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/facility/register" className="px-8 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                For Health Facilities
                <Building2 size={20} />
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="relative z-10 bg-white rounded-[2rem] p-4 shadow-2xl border border-slate-100 rotate-2">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070" 
                alt="Health App Interface" 
                className="rounded-2xl"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 z-20 bg-teal-600 text-white p-6 rounded-3xl shadow-xl -rotate-3 space-y-2">
              <div className="flex items-center gap-3">
                <Activity size={24} />
                <span className="text-2xl font-bold">99.8%</span>
              </div>
              <p className="text-xs font-medium opacity-80">Classification Accuracy</p>
            </div>
            <div className="absolute -top-10 -right-10 z-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl font-black tracking-tight text-slate-900">How Haliya Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">Streamlining the journey from first symptom to full recovery.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Stethoscope className="text-teal-600" size={32} />}
              title="AI Triage"
              description="Describe how you feel in English or Filipino. Our AI classifies urgency in seconds."
            />
            <FeatureCard 
              icon={<Clock className="text-blue-600" size={32} />}
              title="Instant Booking"
              description="High-risk? Book an appointment immediately at the nearest verified facility."
            />
            <FeatureCard 
              icon={<Globe className="text-purple-600" size={32} />}
              title="Health Intelligence"
              description="Contribute to regional trend tracking to help prevent outbreaks in your community."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <HeartPulse className="text-teal-600" size={32} />
              <span className="text-xl font-black tracking-tighter">HALIYA</span>
            </div>
            <p className="text-slate-500 max-w-xs font-medium italic">Empowering Filipino health through artificial intelligence.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">Platform</h4>
              <ul className="text-slate-500 space-y-2 text-sm font-medium">
                <li><Link href="/triage">Triage Checker</Link></li>
                <li><Link href="/dashboard">Health Pulse</Link></li>
                <li><Link href="/facility/register">For Facilities</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">Company</h4>
              <ul className="text-slate-500 space-y-2 text-sm font-medium">
                <li><Link href="#">About Us</Link></li>
                <li><Link href="#">Contact</Link></li>
                <li><Link href="#">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-400 font-medium">© 2026 Haliya Health. Built for CODEKADA Hackathon.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="p-8 rounded-[2rem] border border-slate-100 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-50 transition-all space-y-6">
      <div className="p-4 bg-slate-50 rounded-2xl w-fit">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
      <p className="text-slate-500 leading-relaxed font-medium">{description}</p>
    </div>
  );
}
