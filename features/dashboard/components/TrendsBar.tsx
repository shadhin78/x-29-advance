'use client';

/**
 * X-29 Trends Bar / X Bar Component (features/dashboard/components/TrendsBar.tsx)
 * 
 * Replicates the legacy bottom X Bar:
 * - Start Date
 * - Days Passed
 * - Days Remaining
 * - Required Pace
 * - Actual Pace
 * - Estimated Finish Date
 * - Link to Pace Settings
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePaceStore } from '@/stores/usePaceStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import {
  calculatePaceStats,
  resolveTargetedSubjects,
} from '@/features/pace/services/paceEngine';

export const TrendsBar: React.FC = () => {
  const { paceGoals } = usePaceStore();
  const { getNormalizedSubjects } = useTaxonomyStore();
  const { tasks } = useTaskStore();

  const primaryGoal = paceGoals[0];

  const stats = useMemo(() => {
    if (!primaryGoal) return null;
    const subjects = getNormalizedSubjects();
    const syllabusList = subjects.map((s) => ({
      subject: s.name,
      program: s.program,
    }));
    const targeted = resolveTargetedSubjects(primaryGoal, syllabusList);

    const subjectStatsMap: Record<string, { totalChapters: number; completedChapters: number }> = {};
    subjects.forEach((s) => {
      const completed = tasks.filter((t) => t.subject === s.name && t.completed).length;
      subjectStatsMap[s.name] = {
        totalChapters: s.chaptersCount || 0,
        completedChapters: completed,
      };
    });

    return calculatePaceStats(primaryGoal, targeted, subjectStatsMap);
  }, [primaryGoal, getNormalizedSubjects, tasks]);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-5 md:p-6 mb-6 flex flex-wrap items-center justify-between gap-5 relative z-10 w-full animate-page-enter shadow-sm select-none">
      {/* Header Label */}
      <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-1">
        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          X Bar
        </span>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-6 md:gap-10 relative z-10">
        {/* Start Date */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20 backdrop-blur-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Start Date
            </span>
            <span
              id="trends-bar-start-date"
              className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200"
            >
              {primaryGoal?.startDate || '--'}
            </span>
          </div>
        </div>

        {/* Days Passed */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 backdrop-blur-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Days Passed
            </span>
            <span
              id="trends-bar-days-passed"
              className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200"
            >
              {stats ? `${stats.daysElapsed}` : '--'}
            </span>
          </div>
        </div>

        {/* Days Remaining */}
        <div id="trends-bar-days-remain-container" className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20 backdrop-blur-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Days Remaining
            </span>
            <span
              id="trends-bar-days-remaining"
              className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200"
            >
              {stats ? `${stats.daysRemaining}` : '--'}
            </span>
          </div>
        </div>

        {/* Required Pace */}
        <div id="trends-bar-req-pace-container" className="flex items-center space-x-3">
          <div className="p-2.5 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 rounded-2xl border border-fuchsia-500/20 backdrop-blur-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Req. Pace
            </span>
            <span
              id="trends-bar-req-pace"
              className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200"
            >
              {stats ? `${stats.reqPace}` : '--'}
            </span>
          </div>
        </div>

        {/* Actual Pace */}
        <div id="trends-bar-actual-pace-container" className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Actual Pace
            </span>
            <span
              id="trends-bar-actual-pace"
              className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200"
            >
              {stats ? `${stats.curPace}` : '--'}
            </span>
          </div>
        </div>

        {/* Est Finish */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 backdrop-blur-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Est. Finish
            </span>
            <span
              id="trends-bar-est-finish"
              className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200"
            >
              {stats?.projectedFinish ? `${stats.projectedFinish}` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Settings Link */}
      <Link
        href="/pace"
        id="btn-open-trends-settings"
        className="relative z-10 flex items-center space-x-2 px-4 py-2.5 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 border border-white/60 dark:border-slate-800/80 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 active:scale-95 transition-all shadow-sm backdrop-blur-sm"
      >
        <svg
          className="w-4 h-4 text-slate-500 dark:text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span>Edit Settings</span>
      </Link>
    </div>
  );
};

export default TrendsBar;
