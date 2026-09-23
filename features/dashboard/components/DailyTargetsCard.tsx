'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTargetStore } from '@/stores/useTargetStore';

export const DailyTargetsCard: React.FC = () => {
  const { dailyTargetsDatabase, toggleDailyTargetCompleted } = useTargetStore();
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const targets = useMemo(() => {
    return dailyTargetsDatabase[todayStr] || [];
  }, [dailyTargetsDatabase, todayStr]);

  const completedCount = targets.filter((t) => t.completed).length;
  const pct = targets.length > 0 ? Math.round((completedCount / targets.length) * 100) : 0;

  return (
    <div
      id="dashboard-daily-targets-section"
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col animate-page-enter select-none h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]"
    >
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0 gap-1.5">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-grow flex items-center gap-1.5">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                Daily Targets
              </h3>
              <span
                className="text-[7px] text-slate-400 uppercase tracking-wider block font-black truncate"
                id="db-daily-checklist-date"
              >
                Today
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span
            id="db-daily-checklist-pct"
            className="text-xs font-black text-blue-600 dark:text-blue-400"
          >
            {pct}%
          </span>
          <Link
            href="/daily-actions"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Go to Daily Targets"
            aria-label="Go to Daily Targets"
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
          id="db-daily-checklist-progress"
          className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full" />
        </div>
      </div>

      {/* Targets List */}
      <div
        id="db-daily-targets-checklist"
        className="space-y-1.5 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 text-[10px] flex-1 mt-2"
      >
        {targets.length > 0 ? (
          targets.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleDailyTargetCompleted(todayStr, t.id)}
              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={t.completed}
                  readOnly
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span
                  className={`text-[11px] font-bold truncate ${
                    t.completed
                      ? 'line-through text-slate-400'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {t.chapter}: {t.subject}
                </span>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 ml-2">
                {t.portionSize ? `${t.portionSize} p` : t.track || 'Daily'}
              </span>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-[10px] font-semibold italic">
            No targets configured for today
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTargetsCard;
