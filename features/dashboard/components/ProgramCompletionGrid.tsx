'use client';

/**
 * X-29 Program Completion Grid Component (features/dashboard/components/ProgramCompletionGrid.tsx)
 * 
 * Replicates the legacy Program Completion section with exact circular progress gauges:
 * - Displays all enrolled study programs
 * - Shows completed chapters vs total chapters per program
 * - Renders circular SVG progress ring with canonical color accents and shadows
 */

import React, { useMemo } from 'react';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { calculateCompletionRate } from '@/features/analytics/services/analyticsService';

const PROGRAM_COLORS = [
  'text-indigo-500',
  'text-emerald-500',
  'text-violet-500',
  'text-rose-500',
  'text-amber-500',
  'text-cyan-500',
];

const PROGRAM_SHADOWS = [
  'shadow-[0_0_15px_rgba(99,102,241,0.3)]',
  'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
  'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
];

export const ProgramCompletionGrid: React.FC = () => {
  const { getNormalizedSubjects } = useTaxonomyStore();
  const { tasks } = useTaskStore();

  const programProgressList = useMemo(() => {
    const subjects = getNormalizedSubjects();
    const map: Record<string, { total: number; completed: number; skipped: number }> = {};

    subjects.forEach((s) => {
      const prog = s.program || 'General';
      if (!map[prog]) {
        map[prog] = { total: 0, completed: 0, skipped: 0 };
      }
      map[prog].total += s.chaptersCount || 0;
    });

    tasks.forEach((t) => {
      const sub = subjects.find((s) => s.name === t.subject);
      const prog = sub?.program || 'General';
      if (map[prog]) {
        if (t.completed) map[prog].completed++;
        if (t.skipped) map[prog].skipped++;
      }
    });

    return Object.entries(map).map(([name, data], idx) => {
      const pct = calculateCompletionRate(data.completed, data.total, data.skipped);
      const color = PROGRAM_COLORS[idx % PROGRAM_COLORS.length];
      const shadow = PROGRAM_SHADOWS[idx % PROGRAM_SHADOWS.length];
      return {
        name,
        total: data.total,
        completed: data.completed,
        pct,
        color,
        shadow,
      };
    });
  }, [getNormalizedSubjects, tasks]);

  if (programProgressList.length === 0) return null;

  return (
    <div className="mt-8 space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Program Completion
          </h2>
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">
            Overall progress for all enrolled study programs
          </p>
        </div>
      </div>

      <div
        id="category-progress-container"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8 md:mb-10"
      >
        {programProgressList.map((p) => (
          <div
            key={p.name}
            className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between group"
          >
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                {p.name}
              </h3>
              <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">
                {p.completed} / {p.total} Chapters
              </p>
            </div>
            <div
              className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 ${p.shadow} rounded-full bg-white dark:bg-slate-800 shrink-0 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer border-0 p-0`}
              title="View Subject Completions"
            >
              <svg
                className="w-full h-full transform -rotate-90 drop-shadow-md"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-slate-100 dark:text-slate-700/50"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={p.color}
                  strokeWidth="3.5"
                  strokeDasharray={`${p.pct}, 100`}
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className={`absolute text-[9px] md:text-[10px] font-black ${p.color}`}>
                {p.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgramCompletionGrid;
