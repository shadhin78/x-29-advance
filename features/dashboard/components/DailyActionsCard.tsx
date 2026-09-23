'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useDailyActionStore } from '@/stores/useDailyActionStore';

export const DailyActionsCard: React.FC = () => {
  const { habits, toggleHabit } = useDailyActionStore();
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const completedCount = habits.filter((h) => !!h.history[todayStr]).length;
  const pct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
  const count = habits.length;
  const cols = Math.min(4, Math.max(1, count));

  return (
    <div
      id="dashboard-daily-actions-section"
      className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-4 shadow-sm flex flex-col select-none h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]"
    >
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2 mb-2 gap-1.5">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Daily Actions
          </h3>
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Quick Check-in
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span
            id="dashboard-daily-actions-percent"
            className="text-[10px] font-black text-slate-700 dark:text-slate-200"
          >
            {pct}%
          </span>
          <div className="w-16 bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 p-0.5">
            <div
              id="dashboard-daily-actions-progress"
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <Link
            href="/daily-actions"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Go to Daily Actions"
            aria-label="Go to Daily Actions"
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

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 text-center p-3 text-slate-400 dark:text-slate-500">
          <span className="text-xl mb-1">🎯</span>
          <p className="text-[10px] font-bold">No daily actions configured</p>
          <Link
            href="/daily-actions"
            className="mt-2 text-[9px] font-black text-blue-500 hover:underline"
          >
            Add Daily Actions →
          </Link>
        </div>
      ) : (
        <div
          id="dashboard-daily-actions-compact"
          className="grid gap-2 flex-1 min-h-0 overflow-y-auto mt-2 pr-0.5 custom-scrollbar"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: count <= 4 ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)',
            gridAutoRows: count <= 8 ? 'unset' : 'minmax(58px, 1fr)',
            height: '100%',
          }}
        >
          {habits.map((h) => {
            const isActive = !!h.history[todayStr];
            return (
              <button
                key={h.id}
                id={`dashboard-daily-action-btn-${h.id}`}
                onClick={() => toggleHabit(h.id, todayStr)}
                className={`flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border font-black transition-all duration-300 active:scale-95 text-left w-full h-full min-h-[58px] cursor-pointer ${
                  isActive
                    ? 'text-white border-transparent'
                    : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: '#3b82f6',
                        borderColor: '#3b82f6',
                        color: 'white',
                        boxShadow: '0 4px 12px #3b82f633',
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div
                    className={`p-1 rounded-lg shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-50 text-blue-500 border-blue-200 border'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="dashboard-action-badge shrink-0">
                    {isActive ? (
                      <span className="flex h-4 w-4 rounded-full bg-white text-emerald-500 items-center justify-center shadow-sm text-[8px] font-black">
                        ✓
                      </span>
                    ) : (
                      <span className="flex h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 items-center justify-center text-[7px] font-black">
                        ✕
                      </span>
                    )}
                  </div>
                </div>
                <div className="min-w-0 w-full">
                  <span className="block text-[10px] sm:text-[11px] font-black truncate leading-tight">
                    {h.name}
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="dashboard-action-status-text text-[7px] uppercase tracking-wider font-extrabold opacity-80">
                      {isActive ? 'YES' : 'NO'}
                    </span>
                    <span className="text-[7px] font-black opacity-75">{h.streak || 0}d 🔥</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DailyActionsCard;
