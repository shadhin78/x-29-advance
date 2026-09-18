'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { calculateCompletionRate } from '@/features/analytics/services/analyticsService';
import { BookOpen, ExternalLink } from 'lucide-react';

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
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Global Completion
            </h3>
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-black truncate">
              Syllabus Overview
            </span>
          </div>
        </div>
        <Link
          href="/subjects"
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
          title="Go to Subjects"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-between py-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              {pct}%
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 block">
              {completedChapters} / {totalChapters} Chapters Completed
            </span>
          </div>
          {/* Progress Mini Radial SVG */}
          <svg viewBox="0 0 36 36" className="w-12 h-12">
            <path
              className="text-slate-100 dark:text-slate-700"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-indigo-600 transition-all duration-1000 ease-out"
              strokeDasharray={`${pct}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800/30">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <Link
          href="/subjects"
          className="w-full py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          View Subject Details
        </Link>
      </div>
    </div>
  );
};
