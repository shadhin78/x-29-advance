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
import {
  Calendar,
  TrendingUp,
  Clock,
  Layers,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

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
          X Bar — Baseline & Velocity Trends
        </span>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-6 md:gap-10 relative z-10">
        {/* Start Date */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20 backdrop-blur-md">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Start Date
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
              {primaryGoal?.startDate || '--'}
            </span>
          </div>
        </div>

        {/* Days Passed */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 backdrop-blur-md">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Days Passed
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
              {stats ? `${stats.daysElapsed} Days` : '--'}
            </span>
          </div>
        </div>

        {/* Days Remaining */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20 backdrop-blur-md">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Days Remaining
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
              {stats ? `${stats.daysRemaining} Days` : '--'}
            </span>
          </div>
        </div>

        {/* Required Pace */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 rounded-2xl border border-fuchsia-500/20 backdrop-blur-md">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Req. Pace
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
              {stats ? `${stats.reqPace} Ch/Day` : '--'}
            </span>
          </div>
        </div>

        {/* Actual Pace */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Actual Pace
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
              {stats ? `${stats.curPace} Ch/Day` : '--'}
            </span>
          </div>
        </div>

        {/* Est Finish */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Est. Finish
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
              {stats?.projectedFinish ? `${stats.projectedFinish} (${stats.daysNeeded}d @ ${stats.curPace} ch/d)` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Settings Link */}
      <Link
        href="/pace"
        className="relative z-10 flex items-center space-x-2 px-4 py-2.5 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 border border-white/60 dark:border-slate-800/80 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 active:scale-95 transition-all shadow-sm backdrop-blur-sm"
      >
        <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-300" />
        <span>Edit Settings</span>
      </Link>
    </div>
  );
};

export default TrendsBar;
