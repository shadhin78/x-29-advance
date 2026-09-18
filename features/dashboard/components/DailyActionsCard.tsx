'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { CheckSquare, ExternalLink, CheckCircle2, Circle } from 'lucide-react';

export const DailyActionsCard: React.FC = () => {
  const { habits, toggleHabit } = useDailyActionStore();
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const completedCount = habits.filter((h) => !!h.history[todayStr]).length;
  const pct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-4 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
            Daily Actions
          </h3>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Quick Check-in
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
            {pct}%
          </span>
          <div className="w-16 bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 p-0.5">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <Link
            href="/daily-actions"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
            title="Go to Daily Actions"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-2 flex-1 overflow-y-auto mt-1 pr-0.5 custom-scrollbar text-xs">
        {habits.length > 0 ? (
          habits.map((h) => {
            const isDone = !!h.history[todayStr];
            return (
              <div
                key={h.id}
                onClick={() => toggleHabit(h.id, todayStr)}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold truncate">{h.name}</span>
                </div>
                <span className="text-[9px] font-black uppercase text-amber-500 shrink-0">
                  {h.streak || 0}d 🔥
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs font-bold">
            No habits configured yet.
          </div>
        )}
      </div>
    </div>
  );
};
