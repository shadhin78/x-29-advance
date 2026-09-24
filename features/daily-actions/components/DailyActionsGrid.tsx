'use client';

/**
 * X-29 Daily Actions Grid (features/daily-actions/components/DailyActionsGrid.tsx)
 * 
 * 100% Parity with legacy #daily-actions-grid and dailyTracker.js:
 * - Action cards with raw SVG icons, title, description, start date badge, track badge
 * - Analytics button (opens Action Analytics modal) and Edit button
 * - YES / NO toggle button bar with glowing active gradients
 * - 180-Day mini heatmap scrollable grid (4 columns) per action card with clickable squares
 */

import React, { useMemo } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import type { DailyHabit } from '@/types/habits';

interface DailyActionsGridProps {
  onOpenAnalytics: (actionId: string) => void;
  onOpenEdit: (actionId: string) => void;
}

const COLOR_MAP: Record<
  string,
  {
    border: string;
    iconBg: string;
    text: string;
    borderLt: string;
    iconColor: string;
    hex: string;
    bgLt: string;
  }
> = {
  blue: {
    border: 'border-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-500',
    borderLt: 'border-blue-200 dark:border-blue-800/50',
    iconColor: 'text-blue-500',
    hex: '#3b82f6',
    bgLt: 'bg-blue-50 dark:bg-blue-900/30',
  },
  indigo: {
    border: 'border-indigo-500',
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-500',
    borderLt: 'border-indigo-200 dark:border-indigo-800/50',
    iconColor: 'text-indigo-500',
    hex: '#6366f1',
    bgLt: 'bg-indigo-50 dark:bg-indigo-900/30',
  },
  emerald: {
    border: 'border-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-500',
    borderLt: 'border-emerald-200 dark:border-emerald-800/50',
    iconColor: 'text-emerald-500',
    hex: '#10b981',
    bgLt: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  orange: {
    border: 'border-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-500',
    borderLt: 'border-orange-200 dark:border-orange-800/50',
    iconColor: 'text-orange-500',
    hex: '#f97316',
    bgLt: 'bg-orange-50 dark:bg-orange-900/30',
  },
  purple: {
    border: 'border-purple-500',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-500',
    borderLt: 'border-purple-200 dark:border-purple-800/50',
    iconColor: 'text-purple-500',
    hex: '#8b5cf6',
    bgLt: 'bg-purple-50 dark:bg-purple-900/30',
  },
  rose: {
    border: 'border-rose-500',
    iconBg: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-500',
    borderLt: 'border-rose-200 dark:border-rose-800/50',
    iconColor: 'text-rose-500',
    hex: '#f43f5e',
    bgLt: 'bg-rose-50 dark:bg-rose-900/30',
  },
  cyan: {
    border: 'border-cyan-500',
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/30',
    text: 'text-cyan-500',
    borderLt: 'border-cyan-200 dark:border-cyan-800/50',
    iconColor: 'text-cyan-500',
    hex: '#06b6d4',
    bgLt: 'bg-cyan-50 dark:bg-cyan-900/30',
  },
};

function renderActionIcon(icon?: string, title: string = '') {
  const term = (icon || title).toLowerCase();
  if (term.includes('briefcase') || term.includes('professional') || term.includes('job')) {
    return (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    );
  }
  if (
    term.includes('academic') ||
    term.includes('study') ||
    term.includes('book') ||
    term.includes('education') ||
    term.includes('grad')
  ) {
    return (
      <>
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 14l9-5-9-5-9 5 9 5zm0 0v6M12 20a11.95 11.95 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479M12 20a11.95 11.95 0 006.824-2.998 12.083 12.083 0 00-.665-6.479"
        />
      </>
    );
  }
  if (
    term.includes('gym') ||
    term.includes('health') ||
    term.includes('workout') ||
    term.includes('fitness') ||
    term.includes('sport')
  ) {
    return (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
      />
    );
  }
  if (
    term.includes('freelance') ||
    term.includes('code') ||
    term.includes('work') ||
    term.includes('dev')
  ) {
    return (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    );
  }
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  );
}

export const DailyActionsGrid: React.FC<DailyActionsGridProps> = ({
  onOpenAnalytics,
  onOpenEdit,
}) => {
  const { habits, setDailyState, toggleHabit } = useDailyActionStore();

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Sorted actions
  const sortedActions = useMemo(() => {
    return [...habits].sort(
      (a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999)
    );
  }, [habits]);

  // Generate 180 days backwards from today
  const last180Days = useMemo(() => {
    const list: { iso: string; monthAbbr: string; dateNum: string }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < 180; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      list.push({
        iso,
        monthAbbr: d.toLocaleDateString('en-US', { month: 'short' }),
        dateNum: String(d.getDate()),
      });
    }

    return list;
  }, []);

  return (
    <div
      id="daily-actions-grid"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 items-stretch mb-8"
    >
      {sortedActions.map((cfg) => {
        const state = cfg.history[todayStr];
        const cMap = COLOR_MAP[cfg.color || 'blue'] || COLOR_MAP.blue;

        const borderClass =
          state === true
            ? `${cMap.border} shadow-lg`
            : state === false
            ? 'border-red-500 shadow-lg shadow-red-500/10'
            : 'border-slate-200 dark:border-slate-700';

        const yesClass =
          state === true
            ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.5)] scale-105'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600';

        const noClass =
          state === false
            ? 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)] scale-105'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600';

        return (
          <div
            key={cfg.id}
            id={`daily-action-card-${cfg.id}`}
            data-action-id={cfg.id}
            className={`bg-white dark:bg-slate-800 p-4 sm:p-5 lg:p-6 rounded-2xl md:rounded-[2rem] shadow-sm flex flex-col transition-all duration-300 min-h-[290px] border-2 ${borderClass} min-w-0`}
          >
            {/* Card Header */}
            <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div
                  className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl border ${cMap.iconBg} ${cMap.text} ${cMap.borderLt} shrink-0`}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {renderActionIcon(cfg.icon, cfg.title || cfg.name)}
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-xs sm:text-sm md:text-base tracking-tight text-slate-800 dark:text-slate-100 truncate">
                    {cfg.title || cfg.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">
                      {cfg.desc || cfg.question || ''}
                    </p>
                    {cfg.startDate && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 shrink-0">
                        Start: {cfg.startDate}
                      </span>
                    )}
                    {cfg.track && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/30 shrink-0">
                        {cfg.track}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Analytics & Edit */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenAnalytics(cfg.id)}
                  className="group flex items-center justify-center p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0 cursor-pointer"
                  title="Analytics"
                >
                  <svg
                    className={`w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-400 group-hover:${cMap.iconColor} transition-colors`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEdit(cfg.id)}
                  className="group flex items-center justify-center p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0 cursor-pointer"
                  title="Edit Action"
                >
                  <svg
                    className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-400 group-hover:text-blue-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* YES / NO Toggle Bar */}
            <div className="flex gap-2 mb-3 sm:mb-4 p-1 md:p-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                id={`btn-action-yes-${cfg.id}`}
                onClick={() => setDailyState(cfg.id, true, todayStr)}
                className={`flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 cursor-pointer ${yesClass}`}
              >
                YES
              </button>
              <button
                type="button"
                id={`btn-action-no-${cfg.id}`}
                onClick={() => setDailyState(cfg.id, false, todayStr)}
                className={`flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 cursor-pointer ${noClass}`}
              >
                NO
              </button>
            </div>

            {/* 180-Day Mini-Heatmap Log Grid */}
            <div
              id={`dt-log-${cfg.id}`}
              className="flex flex-col flex-1 min-h-0 pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-2"
            >
              <div
                className="grid grid-cols-4 gap-1 sm:gap-1.5 lg:gap-2 overflow-y-auto custom-scrollbar flex-1 pr-1 pb-1 content-start mt-2"
                style={{ maxHeight: '180px', minHeight: '150px' }}
              >
                {last180Days.map((day) => {
                  const done = cfg.history[day.iso] === true;
                  const bgClass = done
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.4)] border-transparent'
                    : 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)] border-transparent';

                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => toggleHabit(cfg.id, day.iso)}
                      title={`${day.iso} (${day.monthAbbr} ${day.dateNum}): ${done ? 'YES' : 'NO'}`}
                      className={`flex flex-col items-center justify-center p-1.5 md:p-2 rounded-xl border active:scale-90 transition-all duration-200 hover:scale-105 ${bgClass} w-full aspect-square focus:outline-none cursor-pointer`}
                    >
                      <span className="text-[7px] md:text-[8px] uppercase font-black opacity-90 mb-0.5 select-none pointer-events-none">
                        {day.monthAbbr}
                      </span>
                      <span className="text-xs md:text-sm font-black leading-none select-none pointer-events-none">
                        {day.dateNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
