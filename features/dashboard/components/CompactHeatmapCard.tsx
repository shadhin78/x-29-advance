'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTimerStore } from '@/stores/useTimerStore';
import { calculateFocusHeatmap } from '@/features/analytics/services/analyticsService';

export const CompactHeatmapCard: React.FC = () => {
  const { timerLogs } = useTimerStore();

  const { weeks, stats } = useMemo(() => {
    return calculateFocusHeatmap(timerLogs, 90);
  }, [timerLogs]);

  // Show last 9 weeks for the compact card
  const displayWeeks = weeks.slice(-9);

  return (
    <div
      id="dashboard-heatmap-section"
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col animate-page-enter select-none h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]"
    >
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0 gap-1.5">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
              Focus Heatmap
            </h3>
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-black truncate">
              2 Month Grid
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <div
            id="dash-hm-selected-detail"
            className="text-[9px] font-black text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50/80 dark:bg-fuchsia-950/50 px-2 py-0.5 rounded-lg border border-fuchsia-500/20 shadow-sm flex items-center gap-1"
          >
            {stats.streak}d streak 🔥
          </div>
          <Link
            href="/analytics"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Go to Analytics Heatmap"
            aria-label="Go to Analytics Heatmap"
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

      {/* Compact Heatmap Grid Area */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden py-1 w-full min-h-0">
        <div id="dashboard-focus-heatmap-grid" className="w-full h-full flex flex-col justify-between">
          <div className="flex gap-1.5 items-center justify-center h-full">
            {displayWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dIdx) => {
                  let bgClass = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                  if (day.tier === 'rose') bgClass = 'bg-rose-500/20 border-rose-400/40 text-rose-500';
                  if (day.tier === 'blue') bgClass = 'bg-blue-500/30 border-blue-400/50 text-blue-400';
                  if (day.tier === 'green') bgClass = 'bg-emerald-500/40 border-emerald-400/60 text-emerald-300';
                  if (day.tier === 'gold') bgClass = 'bg-amber-500/60 border-amber-300 animate-gold-pulse';
                  if (day.tier === 'diamond') bgClass = 'animate-diamond-shimmer border-cyan-300';

                  return (
                    <div
                      key={dIdx}
                      title={`${day.dateKey}: ${day.hours}h`}
                      className={`w-3.5 h-3.5 rounded-sm border ${bgClass} ${
                        day.isFuture ? 'opacity-20' : ''
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactHeatmapCard;
