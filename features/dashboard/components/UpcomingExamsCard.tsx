'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useExamStore } from '@/stores/useExamStore';
import type { ExamRoutineItem } from '@/types/exam';
import { Calendar, ExternalLink } from 'lucide-react';

export const UpcomingExamsCard: React.FC = () => {
  const { examRoutine } = useExamStore();

  const sortedUpcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return examRoutine
      .filter((e: ExamRoutineItem) => e.date >= today)
      .sort((a: ExamRoutineItem, b: ExamRoutineItem) => (a.date > b.date ? 1 : -1))
      .slice(0, 3);
  }, [examRoutine]);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-800/40">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Upcoming Exams
            </h3>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-extrabold truncate">
              [ Subject • Date • Routine ]
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50">
            {sortedUpcoming.length} Left
          </span>
          <Link
            href="/exam"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
            title="Go to Exam Routine"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 custom-scrollbar text-[10px]">
        {sortedUpcoming.length > 0 ? (
          sortedUpcoming.map((e: ExamRoutineItem) => (
            <div
              key={e.id}
              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block truncate">
                  {e.subject}
                </span>
                <span className="text-[9px] text-slate-400">
                  {e.date} • {e.time || '10:00 AM'}
                </span>
              </div>
              <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 shrink-0">
                {e.room ? `Room ${e.room}` : 'Scheduled'}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs font-bold">
            No upcoming exams scheduled.
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
        <span>Total Sessions</span>
        <span className="text-slate-900 dark:text-white text-xs font-black">{examRoutine.length}</span>
      </div>
    </div>
  );
};
