'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useExamStore } from '@/stores/useExamStore';
import type { ExamRoutineItem } from '@/types/exam';

export const UpcomingExamsCard: React.FC = () => {
  const { examRoutine } = useExamStore();

  const sortedUpcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return examRoutine
      .filter((e: ExamRoutineItem) => e.date >= today && !e.completed)
      .sort((a: ExamRoutineItem, b: ExamRoutineItem) => (a.date > b.date ? 1 : -1));
  }, [examRoutine]);

  return (
    <div
      id="dashboard-upcoming-exams-section"
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col animate-page-enter select-none h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]"
    >
      {/* Card Header */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0 gap-1.5">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl shrink-0 border border-rose-100 dark:border-rose-800/40 shadow-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Upcoming Exams
            </h3>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-extrabold truncate">
              [ Subject • Date • Countdown ]
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span
            id="db-upcoming-exams-count-badge"
            className={
              sortedUpcoming.length > 0
                ? 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50 shadow-xs'
                : 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }
          >
            {sortedUpcoming.length > 0 ? `${sortedUpcoming.length} Upcoming` : 'No Exams'}
          </span>
          <Link
            href="/exam"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Go to Exam Routine Page"
            aria-label="Go to Exam Routine Page"
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

      {/* Mini Upcoming Exams List (Scrollable) */}
      <div
        id="db-upcoming-exams-list"
        className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar text-[10px] mt-1"
      >
        {sortedUpcoming.length > 0 ? (
          sortedUpcoming.map((ex: ExamRoutineItem) => {
            const todayDate = new Date();
            const examDate = new Date(ex.date);
            const diffDays = Math.ceil(
              (examDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const cdText = diffDays <= 0 ? 'Today' : `${diffDays}d left`;

            return (
              <div
                key={ex.id}
                className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 select-none shadow-2xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: '#f43f5e', boxShadow: '0 0 6px #f43f5e' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                        {ex.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
                      <span className="text-rose-500/80 font-black truncate max-w-[90px] sm:max-w-[120px]">
                        {ex.program || 'Custom'}
                      </span>
                      <span>•</span>
                      <span className="truncate">
                        {ex.date}
                        {ex.time ? ` ${ex.time}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shrink-0 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>{cdText}</span>
                </span>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-4 text-center select-none">
            <span className="text-2xl mb-1.5 opacity-60">🎓</span>
            <p className="text-xs font-black text-slate-600 dark:text-slate-300">No upcoming exams</p>
            <p className="text-[9px] text-slate-400 mt-0.5 mb-2.5">Schedule subjects & exam routine</p>
            <Link
              href="/exam"
              className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Schedule Exam</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingExamsCard;
