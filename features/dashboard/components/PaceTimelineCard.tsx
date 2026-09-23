'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePaceStore } from '@/stores/usePaceStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import {
  calculatePaceStats,
  resolveTargetedSubjects,
} from '@/features/pace/services/paceEngine';

export const PaceTimelineCard: React.FC = () => {
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

    const subjectStatsMap: Record<string, { totalChapters: number; completedChapters: number }> =
      {};
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
    <div
      id="dashboard-pace-section"
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col animate-page-enter select-none h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]"
    >
      {/* Card Header */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0 gap-1.5">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 border border-indigo-100 dark:border-indigo-800/40 shadow-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Pace & Timeline
            </h3>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-extrabold truncate">
              Overview & Baseline
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <Link
            href="/pace"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Go to Pace Management"
            aria-label="Go to Pace Management"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 2x2 Metric Box Grid */}
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 py-0.5">
        {/* Required Pace Block */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-2.5 rounded-2xl flex flex-col justify-between leading-tight min-h-0 hover:border-indigo-500/30 transition-colors">
          <div className="min-w-0">
            <span className="block text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider leading-none mb-0.5 truncate">
              Req. Pace
            </span>
            <div id="db-target-req-pace" className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white mt-1 truncate tracking-tight">
              {stats ? `${stats.reqPace} ch/d` : '--'}
            </div>
          </div>
          <div id="db-global-days-left" className="text-[9px] md:text-[10px] text-blue-500 dark:text-blue-400 font-extrabold uppercase tracking-wider mt-0.5 truncate">
            {stats ? `${stats.daysRemaining} days left` : '--'}
          </div>
        </div>

        {/* Actual Pace Block */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-2.5 rounded-2xl flex flex-col justify-between leading-tight min-h-0 hover:border-emerald-500/30 transition-colors">
          <div className="min-w-0">
            <span className="block text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider leading-none mb-0.5 truncate">
              Actual Pace
            </span>
            <div id="db-current-pace-stat" className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white mt-1 truncate tracking-tight">
              {stats ? `${stats.curPace} ch/d` : '--'}
            </div>
          </div>
          <div id="db-global-days-passed" className="text-[9px] md:text-[10px] text-emerald-500 dark:text-emerald-400 font-extrabold uppercase tracking-wider mt-0.5 truncate">
            {stats ? `${stats.daysElapsed} days passed` : '--'}
          </div>
        </div>

        {/* Est. Finish Block */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-2.5 rounded-2xl flex flex-col justify-between leading-tight min-h-0 hover:border-indigo-500/30 transition-colors">
          <div className="min-w-0">
            <span className="block text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider leading-none mb-0.5 truncate">
              Est. Finish
            </span>
            <div id="db-projected-finish" className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white mt-1 truncate tracking-tight">
              {stats ? stats.projectedFinish : '--'}
            </div>
          </div>
          <div id="db-global-days-needed" className="text-[9px] md:text-[10px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-wider mt-0.5 truncate">
            {stats ? `${stats.daysNeeded} days needed` : '--'}
          </div>
        </div>

        {/* Global Baseline Block */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-2.5 rounded-2xl flex flex-col justify-between leading-tight min-h-0 hover:border-fuchsia-500/30 transition-colors">
          <div className="min-w-0">
            <span className="block text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider leading-none mb-0.5 truncate">
              Global Baseline
            </span>
            <div id="db-pace-timeline-info" className="text-xs sm:text-xs md:text-sm font-black text-slate-900 dark:text-white mt-1 truncate tracking-tight">
              {primaryGoal ? primaryGoal.target : 'Global Syllabus'}
            </div>
          </div>
          <div id="db-target-status-label" className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mt-0.5 truncate">
            {stats ? stats.status.toUpperCase() : 'NO GOAL'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaceTimelineCard;
