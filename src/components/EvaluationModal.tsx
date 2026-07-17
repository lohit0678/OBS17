import React, { useState, useEffect } from 'react';
import { X, BookOpen, User } from 'lucide-react';
import { useAcademicData } from '../context/AcademicDataContext';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  experimentIndex: number;
  initialType: 'observation' | 'record';
}

export default function EvaluationModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  experimentIndex,
  initialType,
}: EvaluationModalProps) {
  const { evaluateDirect } = useAcademicData();
  const [action, setAction] = useState<'observation_only' | 'both' | 'record_only'>('observation_only');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default selection based on where they clicked
  useEffect(() => {
    if (initialType === 'record') {
      setAction('record_only');
    } else {
      setAction('observation_only');
    }
  }, [initialType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await evaluateDirect(studentId, experimentIndex, action);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scale-up">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Digital Evaluator Portal</p>
              <h3 className="text-lg font-black tracking-tight mt-0.5">Experiment {experimentIndex}</h3>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Info */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Student Name</p>
              <p className="text-sm font-black text-slate-800">{studentName}</p>
            </div>
          </div>

          {/* Action Choice */}
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Choose Action</p>
            
            <div className="space-y-2.5">
              <label className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                action === 'observation_only' 
                  ? 'bg-emerald-50/75 border-emerald-300 shadow-sm' 
                  : 'bg-white border-slate-100 hover:bg-slate-50/50'
              }`}>
                <input 
                  type="radio" 
                  name="evaluationAction" 
                  value="observation_only" 
                  checked={action === 'observation_only'} 
                  onChange={() => setAction('observation_only')}
                  className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-sm text-slate-800">Observation Completed</p>
                  <p className="text-xs text-slate-400 font-medium">Result: Observation <span className="text-emerald-600 font-bold">✓</span>, Record remains pending</p>
                </div>
              </label>

              <label className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                action === 'both' 
                  ? 'bg-indigo-50/75 border-indigo-300 shadow-sm' 
                  : 'bg-white border-slate-100 hover:bg-slate-50/50'
              }`}>
                <input 
                  type="radio" 
                  name="evaluationAction" 
                  value="both" 
                  checked={action === 'both'} 
                  onChange={() => setAction('both')}
                  className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-sm text-slate-800">Observation + Record Completed</p>
                  <p className="text-xs text-slate-400 font-medium">Result: Observation <span className="text-emerald-600 font-bold">✓</span> & Record <span className="text-indigo-600 font-bold">✓</span> completed concurrently</p>
                </div>
              </label>

              <label className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                action === 'record_only' 
                  ? 'bg-indigo-50/75 border-indigo-300 shadow-sm' 
                  : 'bg-white border-slate-100 hover:bg-slate-50/50'
              }`}>
                <input 
                  type="radio" 
                  name="evaluationAction" 
                  value="record_only" 
                  checked={action === 'record_only'} 
                  onChange={() => setAction('record_only')}
                  className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-sm text-slate-800">Record Completed</p>
                  <p className="text-xs text-slate-400 font-medium">Result: Record <span className="text-indigo-600 font-bold">✓</span>, Observation remains untouched</p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-sm rounded-xl transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-[#0B192C] text-white font-extrabold text-sm rounded-xl transition cursor-pointer text-center shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
