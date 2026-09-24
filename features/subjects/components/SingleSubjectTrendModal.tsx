'use client';

/**
 * X-29 Single Subject Trend Modal (features/subjects/components/SingleSubjectTrendModal.tsx)
 * 
 * Recreates legacy #single-subject-trend-modal from js/features/analytics/singleSubjectTrend.js.
 * Displays subject velocity, completion fraction, and history.
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, TrendingUp, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { getSubjectColor } from '@/features/taxonomy/services/taxonomyService';

interface SingleSubjectTrendModalProps {
  subject: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalChapters: number;
  completedChapters: number;
}

export const SingleSubjectTrendModal: React.FC<SingleSubjectTrendModalProps> = ({
  subject,
  open,
  onOpenChange,
  totalChapters,
  completedChapters,
}) => {
  if (!subject) return null;

  const percentage = totalChapters > 0 ? Math.min(100, Math.round((completedChapters / totalChapters) * 100)) : 0;
  const remaining = Math.max(0, totalChapters - completedChapters);
  const color = getSubjectColor(subject);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white flex flex-col focus:outline-none animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>Subject Trend & Analytics</span>
              </span>
              <Dialog.Title className="text-lg sm:text-xl font-black text-white mt-0.5">
                {subject}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Metrics Overview */}
          <div className="py-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Completed
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {completedChapters}
                </span>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Remaining
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {remaining}
                </span>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Completion
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-mono font-bold text-slate-400">
                <span>Overall Progress</span>
                <span>{completedChapters} / {totalChapters} Ch</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
