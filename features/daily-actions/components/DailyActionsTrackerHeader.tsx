'use client';

/**
 * X-29 Daily Actions Tracker Header (features/daily-actions/components/DailyActionsTrackerHeader.tsx)
 * 
 * 100% Visual & Behavioral Parity with legacy #daily-actions-tracker header:
 * - "Daily Actions Tracker" title
 * - #btn-open-dadb: Database button that opens DADB modal
 * - #daily-actions-percent: Progress percentage
 * - #daily-actions-progress: Smooth glow progress bar (red -> orange -> yellow -> lime -> green)
 */

import React, { useMemo } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';

interface DailyActionsTrackerHeaderProps {
  onOpenDadb: () => void;
}

export const DailyActionsTrackerHeader: React.FC<DailyActionsTrackerHeaderProps> = ({
  onOpenDadb,
}) => {
  const { habits } = useDailyActionStore();

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const { completedCount, totalCount, percentage, barGlowClass } = useMemo(() => {
    const total = habits.length;
    if (total === 0) {
      return {
        completedCount: 0,
        totalCount: 0,
        percentage: 0,
        barGlowClass: 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]',
      };
    }

    let completed = 0;
    habits.forEach((h) => {
      if (h.history[todayStr]) completed++;
    });

    const pct = Math.round((completed / total) * 100);

    let glow = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]';
    if (pct >= 25) glow = 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]';
    if (pct >= 50) glow = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]';
    if (pct >= 75) glow = 'bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.8)]';
    if (pct === 100) glow = 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]';

    return {
      completedCount: completed,
      totalCount: total,
      percentage: pct,
      barGlowClass: glow,
    };
  }, [habits, todayStr]);

  return (
    <div className="mb-5 sm:mb-6 md:mb-8 bg-white dark:bg-slate-800 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col gap-2 sm:gap-3 md:gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
            Daily Actions Tracker
          </h3>
          <button
            type="button"
            data-open-dadb
            id="btn-open-dadb"
            onClick={onOpenDadb}
            className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-1 rounded shadow-sm hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors border border-blue-200 dark:border-blue-800 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
            <span className="hidden sm:block">Database</span>
          </button>
        </div>
        <span
          id="daily-actions-percent"
          className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100"
        >
          {percentage}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-100 dark:bg-slate-900 h-3 sm:h-4 md:h-5 rounded-full overflow-hidden shadow-inner p-0.5 md:p-1 border border-slate-200 dark:border-slate-800">
        <div
          id="daily-actions-progress"
          className={`h-full rounded-full transition-all duration-500 ease-out ${barGlowClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
