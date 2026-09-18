'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTargetStore } from '@/stores/useTargetStore';
import { CalendarCheck, ExternalLink, CheckCircle2, Circle } from 'lucide-react';

export const DailyTargetsCard: React.FC = () => {
  const { dailyTargetsDatabase, toggleDailyTargetCompleted } = useTargetStore();
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const targets = useMemo(() => {
    return dailyTargetsDatabase[todayStr] || [];
  }, [dailyTargetsDatabase, todayStr]);

  const completedCount = targets.filter((t) => t.completed).length;
  const pct = targets.length > 0 ? Math.round((completedCount / targets.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Daily Targets
            </h3>
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-black truncate">
              Today: {todayStr}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-xs font-black text-blue-600 dark:text-blue-400">{pct}%</span>
          <Link
            href="/daily-actions"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
            title="Go to Daily Actions"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden mb-2 relative">
        <div
          className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 text-xs custom-scrollbar">
        {targets.length > 0 ? (
          targets.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleDailyTargetCompleted(todayStr, t.id)}
              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {t.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span
                  className={`text-[11px] font-bold truncate ${
                    t.completed
                      ? 'line-through text-slate-400'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {t.subject} - Ch. {t.chapter}
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 shrink-0">
                {t.portionSize}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs font-bold">
            No targets scheduled for today.
          </div>
        )}
      </div>
    </div>
  );
};
