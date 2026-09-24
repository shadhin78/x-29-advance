'use client';

/**
 * X-29 Goal Details Modal (features/pace/components/modals/GoalDetailsModal.tsx)
 * 
 * 100% Parity with index.html lines 1400-1474 (#goal-details-modal):
 * - Header with Target Breakdown title (#gdm-title) and dates (#gdm-dates)
 * - 3 Primary Stat boxes:
 *   1. Required Pace (#gdm-stat-req)
 *   2. Actual Pace (#gdm-stat-cur)
 *   3. Chapters Left (#gdm-stat-rem)
 * - Included Subjects Breakdown list (#gdm-scope-list) with completion status
 */

import React, { useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { PaceGoal, PaceStats } from '@/types/pace';
import { formatDateResponsive } from '@/features/pace/services/paceEngine';

interface GoalDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: PaceGoal | null;
  stats: PaceStats | null;
  subjectStats: Record<string, { totalChapters: number; completedChapters: number }>;
}

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
  open,
  onOpenChange,
  goal,
  stats,
  subjectStats,
}) => {
  const targetedSubjectsList = useMemo(() => {
    if (!goal) return [];
    if (goal.subjects && goal.subjects.length > 0) return goal.subjects;
    return Object.keys(subjectStats);
  }, [goal, subjectStats]);

  if (!goal || !stats) return null;

  const startDateFormatted = formatDateResponsive(goal.startDate);
  const targetDateFormatted = formatDateResponsive(goal.deadline);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          id="gdm-backdrop"
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 animate-in fade-in duration-200"
        />
        <Dialog.Content
          id="gdm-content"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-slate-800 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-4xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[90vh] mx-4 focus:outline-none animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-100 dark:border-slate-700 pb-4 md:pb-6 shrink-0">
            <div className="flex items-center space-x-3 md:space-x-5">
              <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shadow-inner">
                <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <Dialog.Title
                  id="gdm-title"
                  className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                >
                  {goal.target}
                </Dialog.Title>
                <p id="gdm-dates" className="text-[10px] sm:text-xs md:text-sm text-slate-500 font-bold mt-0.5 md:mt-1">
                  Timeline: {startDateFormatted} - {targetDateFormatted} ({stats.totalDays} Days)
                </p>
              </div>
            </div>
            <Dialog.Close className="p-2.5 md:p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl md:rounded-2xl hover:rotate-90 transition-transform active:scale-95">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Dialog.Close>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 md:mb-8 shrink-0 text-center">
            {/* 1. Required */}
            <div className="p-3 sm:p-5 rounded-xl md:rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm flex flex-col justify-center">
              <span className="block text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase mb-1 text-emerald-600 dark:text-emerald-500 tracking-widest leading-tight">
                Required<br className="block sm:hidden" /> Pace
              </span>
              <div
                id="gdm-stat-req"
                className="text-xl sm:text-3xl md:text-5xl font-black text-emerald-700 dark:text-emerald-400 leading-none mt-1 sm:mt-2"
              >
                {stats.reqPace.toFixed(2)}{' '}
                <span className="text-[9px] sm:text-sm font-bold opacity-60">Ch/D</span>
              </div>
            </div>

            {/* 2. Actual */}
            <div className="p-3 sm:p-5 rounded-xl md:rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm flex flex-col justify-center">
              <span className="block text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase mb-1 text-indigo-600 dark:text-indigo-500 tracking-widest leading-tight">
                Actual<br className="block sm:hidden" /> Pace
              </span>
              <div
                id="gdm-stat-cur"
                className="text-xl sm:text-3xl md:text-5xl font-black text-indigo-700 dark:text-indigo-400 leading-none mt-1 sm:mt-2"
              >
                {stats.curPace.toFixed(2)}{' '}
                <span className="text-[9px] sm:text-sm font-bold opacity-60">Ch/D</span>
              </div>
            </div>

            {/* 3. Remaining */}
            <div className="p-3 sm:p-5 rounded-xl md:rounded-2xl border border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-900/10 shadow-sm flex flex-col justify-center">
              <span className="block text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase mb-1 text-orange-600 dark:text-orange-500 tracking-widest leading-tight">
                Chapters<br className="block sm:hidden" /> Left
              </span>
              <div
                id="gdm-stat-rem"
                className="text-xl sm:text-3xl md:text-5xl font-black text-orange-700 dark:text-orange-400 leading-none mt-1 sm:mt-2"
              >
                {stats.remaining}{' '}
                <span className="text-[9px] sm:text-sm font-bold opacity-60">/ {stats.total}</span>
              </div>
            </div>
          </div>

          {/* Included Subjects List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-700 pb-2 shrink-0">
              Included Subjects & Breakdown
            </h4>
            <div id="gdm-scope-list" className="flex flex-col gap-2.5 pb-4">
              {targetedSubjectsList.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No specific subjects scoped.</p>
              ) : (
                targetedSubjectsList.map((subName) => {
                  const s = subjectStats[subName] || { totalChapters: 0, completedChapters: 0 };
                  const pct = s.totalChapters > 0 ? Math.round((s.completedChapters / s.totalChapters) * 100) : 0;
                  return (
                    <div
                      key={subName}
                      className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {subName}
                          </span>
                          <span className="text-[10px] font-black text-slate-500">
                            {s.completedChapters} / {s.totalChapters} Ch ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
