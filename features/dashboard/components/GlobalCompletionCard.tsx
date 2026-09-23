'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { calculateCompletionRate } from '@/features/analytics/services/analyticsService';

export const GlobalCompletionCard: React.FC = () => {
  const { getNormalizedSubjects } = useTaxonomyStore();
  const { tasks } = useTaskStore();

  const { totalChapters, completedChapters, pct } = useMemo(() => {
    const subjects = getNormalizedSubjects();
    let total = 0;
    subjects.forEach((s) => {
      total += s.chaptersCount || 0;
    });

    const completed = tasks.filter((t) => t.completed).length;
    const skipped = tasks.filter((t) => t.skipped).length;
    const percentage = calculateCompletionRate(completed, total, skipped);

    return {
      totalChapters: total,
      completedChapters: completed,
      pct: percentage,
    };
  }, [getNormalizedSubjects, tasks]);

  return (
    <div
      id="dashboard-global-completion"
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col animate-page-enter select-none h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]"
    >
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0 gap-1.5">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
              Global Completion
            </h3>
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-black truncate">
              Syllabus Overview
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <Link
            href="/subjects"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Go to Subjects"
            aria-label="Go to Subjects"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Completion Info & Chart Row */}
      <div className="flex-1 flex flex-col justify-between mt-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              id="db-progress-text"
              className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 drop-shadow-sm leading-none"
            >
              {pct}%
            </span>
            <span
              id="db-progress-detail"
              className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 truncate"
            >
              {completedChapters} / {totalChapters} Chapters Completed
            </span>
          </div>
          <Link
            href="/subjects"
            className="relative shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 p-1 rounded-full border border-slate-100 dark:border-slate-800/80 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer group shadow-sm w-14 h-14"
            title="Go to Subjects Page"
          >
            <svg viewBox="0 0 36 36" className="w-11 h-11 max-w-[44px] max-h-[44px] drop-shadow-md">
              <path
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600"
                strokeDasharray={`${pct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800/30 mt-2">
          <div
            id="db-progress-bar"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            style={{ width: `${pct}%` }}
          />
        </div>

        <Link
          href="/subjects"
          className="mt-2.5 w-full py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 active:scale-95 transition-all shadow-sm text-center"
        >
          View Subject Details
        </Link>
      </div>
    </div>
  );
};

export default GlobalCompletionCard;
