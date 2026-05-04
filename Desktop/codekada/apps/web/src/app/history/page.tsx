'use client';

import React, { useEffect, useState } from 'react';
import { getHistory } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  History, 
  Calendar, 
  AlertCircle, 
  ChevronRight,
  User,
  Clock,
  RefreshCw,
  Activity
} from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('haliya_session_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await getHistory(token);
        setHistory(data.history);
        setSummary(data.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Symptom History</h1>
          <p className="text-slate-500 font-medium">Your past assessments on this device.</p>
        </div>

        {/* Pattern Summary */}
        {summary && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center gap-6"
          >
            <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl shrink-0">
              <Activity size={32} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">How have I been feeling?</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{summary}</p>
            </div>
          </motion.div>
        )}

        {/* Timeline */}
        <div className="space-y-6">
          {history.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <History size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No history found. Start a triage assessment to see it here.</p>
            </div>
          ) : (
            history.map((session, i) => (
              <motion.div 
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-teal-200 transition-all cursor-pointer group"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getUrgencyStyle(session.urgency_level)}`}>
                      {session.urgency_level}
                    </span>
                    <span className="text-slate-400 text-sm font-medium flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">
                    {session.symptoms_raw}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <User size={14} /> {session.age || 'N/A'}, {session.sex || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle size={14} /> Score: {session.urgency_score}/10
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-teal-500 transition-colors hidden md:block" />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function getUrgencyStyle(level: string) {
  switch (level) {
    case 'self-care': return 'bg-green-50 text-green-600';
    case 'see-doctor': return 'bg-yellow-50 text-yellow-600';
    case 'go-to-er': return 'bg-orange-50 text-orange-600';
    case 'call-emergency': return 'bg-red-50 text-red-600';
    default: return 'bg-slate-50 text-slate-600';
  }
}
