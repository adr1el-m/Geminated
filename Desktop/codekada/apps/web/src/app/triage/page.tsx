'use client';

import { useState } from 'react';
import SymptomForm from '@/components/SymptomForm';
import TriageResult from '@/components/TriageResult';
import { getTriage, TriageRequest, TriageResponse } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Shield, Activity, Globe, LayoutDashboard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'English' | 'Filipino'>('English');

  // Get or create session token
  const getSessionToken = () => {
    if (typeof window === 'undefined') return '';
    let token = localStorage.getItem('haliya_session_token');
    if (!token) {
      token = uuidv4();
      localStorage.setItem('haliya_session_token', token);
    }
    return token;
  };

  const handleTriageSubmit = async (data: TriageRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getSessionToken();
      const triageResult = await getTriage({ 
        ...data, 
        session_token: token,
        language: language
      });
      setResult(triageResult);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const t = {
    English: {
      title: "HALIYA",
      checker: "Checker",
      dashboard: "Health Dashboard",
      history: "History",
      signIn: "Sign In",
      heroTitle: "Your first screen for",
      heroHighlight: "better healthcare.",
      heroDesc: "Haliya uses advanced AI to assess your symptoms and guide you to the right level of care—instantly and anonymously.",
      privacyTitle: "Privacy First",
      realtime: "Real-time Analysis",
      community: "Community Health"
    },
    Filipino: {
      title: "HALIYA",
      checker: "Suriin",
      dashboard: "Dashboard ng Kalusugan",
      history: "Kasaysayan",
      signIn: "Mag-login",
      heroTitle: "Ang iyong unang hakbang para sa",
      heroHighlight: "mas mabuting kalusugan.",
      heroDesc: "Ginagamit ng Haliya ang advanced AI para suriin ang iyong mga sintomas at gabayan ka sa tamang antas ng pangangalaga—agad-agad at anonimo.",
      privacyTitle: "Protektado ang Datos",
      realtime: "Mabilis na Pagsusuri",
      community: "Kalusugan ng Bayan"
    }
  }[language];

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header / Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-teal-600 p-2 rounded-xl text-white shadow-lg shadow-teal-200">
              <HeartPulse size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-800">
              {t.title}
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <Link href="/triage" className="text-teal-600">{t.checker}</Link>
            <Link href="/dashboard" className="hover:text-slate-800 transition-colors">{t.dashboard}</Link>
            <Link href="/history" className="hover:text-slate-800 transition-colors">{t.history}</Link>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLanguage(l => l === 'English' ? 'Filipino' : 'English')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              <Globe size={14} />
              {language === 'English' ? 'EN' : 'FIL'}
            </button>
            {user ? (
              <Link href={user.role === 'patient' ? '/dashboard/patient' : '/dashboard/facility'} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            ) : (
              <Link href="/auth/login" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
                {t.signIn}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section (Only show when no result) */}
      <AnimatePresence>
        {!result && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-16 pb-12 px-6"
          >
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-100">
                <Shield size={14} />
                Intelligent Pre-Hospital Triage
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                {t.heroTitle} <br />
                <span className="text-teal-600">{t.heroHighlight}</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                {t.heroDesc}
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <section className="px-6 py-12 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-teal-200/20 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 font-medium">
              <Shield className="shrink-0" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!result ? (
              <SymptomForm 
                key="form"
                isLoading={isLoading} 
                onSubmit={handleTriageSubmit} 
              />
            ) : (
              <TriageResult 
                key="result"
                result={result} 
                onReset={handleReset} 
              />
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Features Row */}
      {!result && (
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 text-blue-600 w-fit rounded-2xl">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold">Real-time Analysis</h3>
                <p className="text-slate-500 leading-relaxed">
                  Get instant feedback on symptom severity using Groq's high-speed AI processing.
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 text-purple-600 w-fit rounded-2xl">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold">Privacy First</h3>
                <p className="text-slate-500 leading-relaxed">
                  Your assessments are anonymous. We only track regional trends to protect communities.
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-teal-50 text-teal-600 w-fit rounded-2xl">
                  <Globe size={24} />
                </div>
                <h3 className="text-xl font-bold">Community Health</h3>
                <p className="text-slate-500 leading-relaxed">
                  By using Haliya, you contribute to early outbreak detection in your region.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <HeartPulse size={20} />
            <span className="font-bold tracking-tighter">HALIYA</span>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            © 2026 Haliya Health. Built for CODEKADA Hackathon.
          </div>
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-teal-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-teal-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-teal-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
