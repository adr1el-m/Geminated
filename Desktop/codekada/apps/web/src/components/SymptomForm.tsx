'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Thermometer, AlertCircle, Clock, User, ChevronRight, X } from 'lucide-react';
import { TriageRequest } from '@/lib/api';

interface SymptomFormProps {
  onSubmit: (data: TriageRequest) => void;
  isLoading: boolean;
}

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Shortness of breath', 'Fatigue', 
  'Headache', 'Loss of taste/smell', 'Sore throat', 
  'Nausea', 'Chest pain', 'Dizziness'
];

export default function SymptomForm({ onSubmit, isLoading }: SymptomFormProps) {
  const [mode, setMode] = useState<'text' | 'chips'>('text');
  const [symptomsText, setSymptomsText] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [age, setAge] = useState<string>('');
  const [sex, setSex] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [conditions, setConditions] = useState<string>('');

  const toggleSymptom = (symptom: string) => {
    setSelectedChips(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom) 
        : [...prev, symptom]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSymptoms = mode === 'text' 
      ? symptomsText 
      : selectedChips.join(', ');
    
    onSubmit({
      symptoms: finalSymptoms,
      age: age ? parseInt(age) : undefined,
      sex: sex || undefined,
      duration: duration || undefined,
      conditions: conditions ? conditions.split(',').map(c => c.trim()) : [],
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-8 border border-teal-50 max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-500 rounded-2xl text-white">
          <Activity size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Symptom Checker</h2>
          <p className="text-slate-500 text-sm">Tell us how you're feeling for an AI-powered triage.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Input Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'text' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Describe in words
          </button>
          <button
            type="button"
            onClick={() => setMode('chips')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'chips' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Select symptoms
          </button>
        </div>

        {/* Symptoms Input */}
        <AnimatePresence mode="wait">
          {mode === 'text' ? (
            <motion.div
              key="text-input"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertCircle size={16} className="text-teal-500" />
                What are your symptoms?
              </label>
              <textarea
                value={symptomsText}
                onChange={(e) => setSymptomsText(e.target.value)}
                placeholder="Describe your symptoms (e.g., 'I have a sharp pain in my chest and a dry cough since yesterday...')"
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none text-slate-700"
                required={mode === 'text'}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chip-input"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Thermometer size={16} className="text-teal-500" />
                Select all that apply
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      selectedChips.includes(symptom)
                        ? 'bg-teal-500 border-teal-500 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User size={16} className="text-teal-500" />
              Age & Sex
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-20 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-slate-700"
              />
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-slate-700"
              >
                <option value="">Sex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock size={16} className="text-teal-500" />
              Duration
            </label>
            <input
              type="text"
              placeholder="How long? (e.g., 2 days)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-slate-700"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Pre-existing Conditions</label>
            <input
              type="text"
              placeholder="Asthma, Hypertension, Diabetes, etc. (comma separated)"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-slate-700"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || (mode === 'text' ? !symptomsText : selectedChips.length === 0)}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-teal-200 transition-all flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <>
              Check My Symptoms
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
