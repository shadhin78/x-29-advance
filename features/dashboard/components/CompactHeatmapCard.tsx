'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTimerStore } from '@/stores/useTimerStore';
import { calculateFocusHeatmap } from '@/features/analytics/services/analyticsService';
import { LayoutGrid, ExternalLink } from 'lucide-react';

export const CompactHeatmapCard: React.FC = () => {
  const { timerLogs } = useTimerStore();

  const { weeks, stats } = useMemo(() => {
    // 60-day compact range
    return calculateFocusHeatmap(timerLogs, 90);
  }, [timerLogs]);

  // Show last 9 weeks for the compact card
  const displayWeeks = weeks.slice(-9);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Focus Heatmap
            </h3>
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-black truncate">
              2 Month Activity
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-[9px] font-black text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/50 px-2 py-0.5 rounded-lg border border-fuchsia-500/20">
            {stats.streak}d streak 🔥
          </span>
          <Link
            href="/analytics"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
            title="Go to Analytics Heatmap"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Compact Heatmap Grid */}
      <div className="flex-1 flex items-center justify-center overflow-hidden py-1">
        <div className="flex gap-1.5">
          {displayWeeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day, dIdx) => {
                let bgClass = 'bg-rose-500/20 border-rose-300/40 dark:bg-rose-950/30';
                if (day.tier === 'rose') bgClass = 'bg-rose-600 border-rose-500';
                if (day.tier === 'blue') bgClass = 'bg-blue-500 border-blue-400';
                if (day.tier === 'green') bgClass = 'bg-emerald-500 border-emerald-400';
                if (day.tier === 'gold') bgClass = 'bg-amber-400 border-amber-300';
                if (day.tier === 'diamond')
                  bgClass = 'bg-gradient-to-tr from-cyan-400 via-sky-300 to-indigo-500 border-cyan-300';

                return (
                  <div
                    key={dIdx}
                    title={`${day.dateKey}: ${day.hours}h`}
                    className={`w-3.5 h-3.5 rounded border ${bgClass} ${
                      day.isFuture ? 'opacity-20' : ''
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
        <span>{stats.activeDays} Active Days</span>
        <span>{stats.gemCount} Diamond Sessions</span>
      </div>
    </div>
  );
};
