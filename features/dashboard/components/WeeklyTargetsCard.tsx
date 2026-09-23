'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTargetStore } from '@/stores/useTargetStore';
import { getWeekRangeKey } from '@/features/targets/services/targetAllocationEngine';

export const WeeklyTargetsCard: React.FC = () => {
  const { weeklyTargetsDatabase, toggleWeeklyTargetCompleted } = useTargetStore();
  const currentWeekKey = useMemo(() => getWeekRangeKey(new Date()), []);

  const targets = useMemo(() => {
    return weeklyTargetsDatabase[currentWeekKey] || [];
  }, [weeklyTargetsDatabase, currentWeekKey]);

  const completedCount = targets.filter((t) => t.completed).length;
  const pct = targets.length > 0 ? Math.round((completedCount / targets.length) * 100) : 0;

  return (
    <div
      id="dashboard-weekly-targets-section"
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col animate-page-enter select-none h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]"
    >
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0 gap-1.5">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-grow flex items-center gap-1.5">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                Weekly Targets
              </h3>
              <span
                className="text-[7px] text-slate-400 uppercase tracking-wider block font-black truncate"
                id="db-weekly-checklist-range"
              >
                {currentWeekKey || 'Present Week'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span
            id="db-weekly-checklist-pct"
            className="text-xs font-black text-emerald-600 dark:text-emerald-400"
          >
            {pct}%
          </span>
          <Link
            href="/daily-actions"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Go to Weekly Targets"
            aria-label="Go to Weekly Targets"
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

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-700/50 h-2.5 rounded-full overflow-hidden mb-2.5 shadow-inner border border-slate-200/50 dark:border-slate-600/30 relative">
        <div
          id="db-weekly-checklist-progress"
          className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full" />
        </div>
      </div>

      {/* Targets List */}
      <div
        id="db-weekly-targets-checklist"
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 text-[10px] flex-1 min-h-0"
      >
        {targets.length > 0 ? (
          targets.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleWeeklyTargetCompleted(currentWeekKey, t.id)}
              className={`flex items-center justify-between p-2 md:p-2.5 rounded-xl border font-black transition-all duration-300 active:scale-95 text-left w-full gap-1.5 h-full cursor-pointer ${
                t.completed
                  ? 'text-white border-transparent'
                  : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-900/60'
              }`}
              style={
                t.completed
                  ? {
                      backgroundColor: '#10b981cc',
                      borderColor: '#10b981',
                      color: 'white',
                      boxShadow: '0 4px 12px #10b98133',
                    }
                  : undefined
              }
            >
              <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                <div
                  className={`p-1 rounded-lg shrink-0 ${
                    t.completed
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="min-w-0 leading-tight">
                  <span
                    className={`block text-[10px] md:text-xs font-black truncate ${
                      t.completed ? 'line-through opacity-75' : ''
                    }`}
                  >
                    {t.chapter}: {t.subject}
                  </span>
                  <span
                    className={`block text-[8px] md:text-[9px] uppercase font-bold tracking-widest truncate ${
                      t.completed ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {t.size ? `${t.size} size` : 'Whole Chapter'} | {t.program || 'Target'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    t.completed
                      ? 'border-white bg-white/20'
                      : 'border-slate-300 dark:border-slate-600 bg-transparent'
                  }`}
                >
                  <svg
                    className={`w-2.5 h-2.5 text-white ${t.completed ? 'block' : 'hidden'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-slate-400 font-bold uppercase text-[9px] tracking-widest flex flex-col items-center justify-center">
            <span>No Weekly Targets Set</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyTargetsCard;
