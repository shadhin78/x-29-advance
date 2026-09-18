'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTargetStore } from '@/stores/useTargetStore';
import { Target, ExternalLink, CheckCircle2, Circle } from 'lucide-react';

export const MonthlyTargetsCard: React.FC = () => {
  const { monthlyTargetsDatabase, selectedMonthRange, toggleMonthlyTargetCompleted } =
    useTargetStore();

  const targets = useMemo(() => {
    return monthlyTargetsDatabase[selectedMonthRange] || [];
  }, [monthlyTargetsDatabase, selectedMonthRange]);

  const completedCount = targets.filter((t) => t.completed).length;
  const pct = targets.length > 0 ? Math.round((completedCount / targets.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Monthly Targets
            </h3>
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-black truncate">
              {selectedMonthRange || 'Current Month'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{pct}%</span>
          <Link
            href="/daily-actions/monthly-setup"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
            title="Go to Monthly Target Studio"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden mb-2 relative">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Targets List */}
      <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 text-xs custom-scrollbar">
        {targets.length > 0 ? (
          targets.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleMonthlyTargetCompleted(selectedMonthRange, t.id)}
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
              <span className="text-[9px] font-black uppercase text-indigo-500 px-1.5 py-0.5 rounded bg-indigo-500/10 shrink-0">
                {t.totalChapterSize} size
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs font-bold">
            No targets configured for this month.
          </div>
        )}
      </div>
    </div>
  );
};
