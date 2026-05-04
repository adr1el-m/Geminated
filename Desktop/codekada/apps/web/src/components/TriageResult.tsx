'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Stethoscope, 
  PhoneCall, 
  RefreshCcw,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { TriageResponse } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface TriageResultProps {
  result: TriageResponse;
  onReset: () => void;
}

const URGENCY_CONFIG = {
  'self-care': {
    color: 'bg-green-500',
    icon: CheckCircle2,
    label: 'Self-Care at Home',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  'clinic': {
    color: 'bg-yellow-500',
    icon: Stethoscope,
    label: 'Consult a Doctor',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  'er': {
    color: 'bg-orange-500',
    icon: AlertTriangle,
    label: 'Go to Urgent Care / ER',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  'emergency': {
    color: 'bg-red-500',
    icon: PhoneCall,
    label: 'EMERGENCY: CALL 911',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

export default function TriageResult({ result, onReset }: TriageResultProps) {
  const router = useRouter();
  const config = URGENCY_CONFIG[result.urgency_level] || URGENCY_CONFIG['self-care'];
  const Icon = config.icon;

  const handleBookClick = () => {
    const params = new URLSearchParams({
      symptoms: result.summary,
      score: result.urgency_score.toString(),
      explanation: result.explanation,
      book: 'true'
    });
    router.push(`/dashboard/patient?${params.toString()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-6 pb-20"
    >
      {/* Urgency Header */}
      <div className={`p-8 rounded-3xl border-2 ${config.bgColor} ${config.borderColor} shadow-sm`}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`p-4 ${config.color} rounded-2xl text-white shadow-lg`}>
            <Icon size={40} />
          </div>
          
          <div className="space-y-1">
            <span className={`text-xs font-bold uppercase tracking-widest ${config.textColor}`}>
              Triage Classification
            </span>
            <h2 className={`text-3xl font-black ${config.textColor}`}>
              {config.label}
            </h2>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-1">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < result.urgency_score ? config.color : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-600">
              Severity: {result.urgency_score}/10
            </span>
          </div>

          <p className="text-slate-700 text-lg leading-relaxed mt-4 max-w-lg font-medium">
            {result.summary}
          </p>
          <p className="text-slate-500 text-sm leading-relaxed mt-2 max-w-lg">
            {result.explanation}
          </p>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Info className="text-teal-500" size={20} />
          Recommended Next Steps
        </h3>
        <ul className="space-y-4">
          {(result.next_steps || []).map((action, i) => (
            <motion.li 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl"
            >
              <div className="mt-1 w-2 h-2 rounded-full bg-teal-500 shrink-0" />
              <span className="text-slate-600 font-medium">{action}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Warning Notice */}
      <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
        <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          Important Disclaimer
        </h3>
        <p className="text-red-600 text-sm font-medium">
          This is an AI triage classification. If you feel your condition is critical, 
          seek professional medical help immediately regardless of this result.
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onReset}
          className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCcw size={20} />
          Start New Assessment
        </button>
        <button
          onClick={handleBookClick}
          className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center justify-center gap-2 group"
        >
          Book Appointment
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
