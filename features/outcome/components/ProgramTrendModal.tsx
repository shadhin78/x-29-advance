'use client';

/**
 * X-29 Program Progression Trend Modal (features/outcome/components/ProgramTrendModal.tsx)
 * 
 * Displays historical results, target tracking, and performance trajectory
 * for a specific academic program.
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, TrendingUp, Award, Calendar, CheckCircle2 } from 'lucide-react';
import type { SuccessResult } from '@/types/outcome';

interface ProgramTrendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programName: string;
  results: SuccessResult[];
  targetCGPA?: string;
  targetGrade?: string;
}

export const ProgramTrendModal: React.FC<ProgramTrendModalProps> = ({
  open,
  onOpenChange,
  programName,
  results,
  targetCGPA,
  targetGrade,
}) => {
  const programResults = results
    .filter((r) => r.title === programName)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const overallResults = programResults.filter((r) => !r.subject);
  const latestOverall = overallResults[0];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl z-50 text-slate-900 dark:text-white focus:outline-none animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-black leading-tight">
                  {programName} Progression Trend
                </Dialog.Title>
                <Dialog.Description className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Academic Performance & History
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                Latest Score
              </span>
              <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1 block">
                {latestOverall?.value ? `CGPA ${latestOverall.value}` : latestOverall?.grade ? `Grade ${latestOverall.grade}` : '—'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                Target Benchmark
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                {targetCGPA && targetCGPA !== 'none' ? `CGPA ${targetCGPA}` : targetGrade ? `Grade ${targetGrade}` : 'None'}
              </span>
            </div>
          </div>

          {/* History List */}
          <div className="mt-6 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
              Logged Records ({programResults.length})
            </span>

            {programResults.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recorded results found for this program.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {programResults.map((r) => {
                  const dateStr = r.date
                    ? new Date(r.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';
                  return (
                    <div
                      key={r.id}
                      className="p-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {r.subject ? r.subject : 'Overall Program'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{dateStr}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 dark:text-white">
                          {r.value ? `${r.value}` : ''} {r.grade ? `(${r.grade})` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
