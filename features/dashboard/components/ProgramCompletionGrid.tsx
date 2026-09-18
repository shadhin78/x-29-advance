'use client';

import React, { useMemo } from 'react';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { calculateCompletionRate } from '@/features/analytics/services/analyticsService';
import { Layers } from 'lucide-react';

export const ProgramCompletionGrid: React.FC = () => {
  const { tracks, customPrograms, getNormalizedSubjects } = useTaxonomyStore();
  const { tasks } = useTaskStore();

  const programProgressList = useMemo(() => {
    const subjects = getNormalizedSubjects();
    const map: Record<string, { total: number; completed: number; skipped: number; track: string }> =
      {};

    subjects.forEach((s) => {
      const prog = s.program || 'General';
      if (!map[prog]) {
        map[prog] = { total: 0, completed: 0, skipped: 0, track: s.trackName || 'Main' };
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

    return Object.entries(map).map(([name, data]) => {
      const pct = calculateCompletionRate(data.completed, data.total, data.skipped);
      return {
        name,
        track: data.track,
        total: data.total,
        completed: data.completed,
        pct,
      };
    });
  }, [getNormalizedSubjects, tasks]);

  return (
    <div className="mt-8 space-y-4">
      <div className="space-y-0.5">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
          Program Completion
        </h2>
        <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">
          Overall progress for all enrolled study programs
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {programProgressList.length > 0 ? (
          programProgressList.map((p) => (
            <div
              key={p.name}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:border-indigo-500/30 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                    {p.track}
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {p.pct}%
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {p.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {p.completed} of {p.total} chapters finished
                </p>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, p.pct)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-bold">
            No study programs configured.
          </div>
        )}
      </div>
    </div>
  );
};
