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
import { Zap, ExternalLink } from 'lucide-react';

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
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-800/40">
            <Zap className="w-4 h-4" />
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
        <Link
          href="/pace"
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
          title="Go to Pace Management"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* 2x2 Metric Box Grid */}
      <div className="grid grid-cols-2 gap-2 flex-1 py-0.5">
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-2.5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Req. Pace
          </span>
          <div className="text-sm md:text-base font-black text-slate-900 dark:text-white">
            {stats ? `${stats.reqPace} ch/d` : '0.00'}
          </div>
          <div className="text-[9px] text-blue-500 font-extrabold uppercase">
            {stats ? `${stats.daysRemaining} days left` : '--'}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-2.5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Actual Pace
          </span>
          <div className="text-sm md:text-base font-black text-slate-900 dark:text-white">
            {stats ? `${stats.curPace} ch/d` : '0.00'}
          </div>
          <div className="text-[9px] text-emerald-500 font-extrabold uppercase">
            {stats ? `${stats.daysElapsed} days passed` : '--'}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-2.5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Est. Finish
          </span>
          <div className="text-sm md:text-base font-black text-slate-900 dark:text-white truncate">
            {stats ? stats.projectedFinish : '--'}
          </div>
          <div className="text-[9px] text-indigo-500 font-extrabold uppercase">
            {stats ? `${stats.daysNeeded} days needed` : '--'}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-2.5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
            Global Baseline
          </span>
          <div className="text-xs md:text-sm font-black text-slate-900 dark:text-white truncate">
            {primaryGoal ? primaryGoal.target : 'Global Syllabus'}
          </div>
          <div className="text-[9px] text-slate-400 uppercase font-extrabold">
            {stats ? stats.status.toUpperCase() : 'NO GOAL'}
          </div>
        </div>
      </div>
    </div>
  );
};
