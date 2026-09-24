'use client';

/**
 * X-29 Daily Actions Database (DADB) Modal (features/daily-actions/components/modals/DailyActionsDbModal.tsx)
 * 
 * 100% Visual & Behavioral Parity with legacy #daily-actions-db-modal & dadbModal.js:
 * - 180-Day historical records across all daily habits
 * - Tab 1: Date View (sortable by date or completion %, filterable by habit, with colored habit pills & stat badge)
 * - Tab 2: Action View (per-action colored cards with progress bars and completion counts)
 * - Tab 3: Trend Chart (180-day completion trend visualization)
 * - Zero Lucide icon imports: 100% raw SVG icons matching legacy
 */

import React, { useState, useMemo } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import type { DailyHabit } from '@/types/habits';

interface DailyActionsDbModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_MAP: Record<
  string,
  {
    borderLt: string;
    bgLt: string;
    text: string;
    iconBg: string;
    btn: string;
  }
> = {
  blue: {
    borderLt: 'border-blue-200 dark:border-blue-800/50',
    bgLt: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    btn: 'bg-blue-500',
  },
  indigo: {
    borderLt: 'border-indigo-200 dark:border-indigo-800/50',
    bgLt: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-500',
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/30',
    btn: 'bg-indigo-500',
  },
  emerald: {
    borderLt: 'border-emerald-200 dark:border-emerald-800/50',
    bgLt: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    btn: 'bg-emerald-500',
  },
  orange: {
    borderLt: 'border-orange-200 dark:border-orange-800/50',
    bgLt: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-900/30',
    btn: 'bg-orange-500',
  },
  purple: {
    borderLt: 'border-purple-200 dark:border-purple-800/50',
    bgLt: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-500',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    btn: 'bg-purple-500',
  },
  rose: {
    borderLt: 'border-rose-200 dark:border-rose-800/50',
    bgLt: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-500',
    iconBg: 'bg-rose-50 dark:bg-rose-900/30',
    btn: 'bg-rose-500',
  },
  cyan: {
    borderLt: 'border-cyan-200 dark:border-cyan-800/50',
    bgLt: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-500',
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/30',
    btn: 'bg-cyan-500',
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
      </>
    );
  }
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  );
}

export const DailyActionsDbModal: React.FC<DailyActionsDbModalProps> = ({ isOpen, onClose }) => {
  const { habits } = useDailyActionStore();

  const [activeTab, setActiveTab] = useState<'date' | 'action' | 'trend'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'pct-desc' | 'pct-asc'>('desc');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  // Compute 180-day history array
  const history180Days = useMemo(() => {
    const list: {
      dateStr: string;
      displayDate: string;
      dayOfWeek: string;
      dayNum: string;
      isToday: boolean;
      completedCount: number;
      totalHabits: number;
      pct: number;
      pctColor: string;
      bgClass: string;
      completedHabits: DailyHabit[];
      actionStates: Record<string, boolean>;
    }[] = [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < 180; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayOfWeek = d.toLocaleDateString('en-GB', { weekday: 'short' });
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthShort = d.toLocaleDateString('en-GB', { month: 'short' });
      const displayDate = `${dayOfWeek}, ${dayNum} ${monthShort} ${d.getFullYear()}`;
      const isToday = i === 0;

      let completed = 0;
      const states: Record<string, boolean> = {};
      const completedHabitsList: DailyHabit[] = [];

      habits.forEach((h) => {
        const isDone = !!h.history[iso];
        states[h.id] = isDone;
        if (isDone) {
          completed++;
          completedHabitsList.push(h);
        }
      });

      const pct = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;

      let bgClass = 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700';
      let pctColor = 'text-slate-500 dark:text-slate-400';

      if (pct > 0 && pct <= 25) {
        pctColor = 'text-red-500';
        bgClass = 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50';
      } else if (pct > 25 && pct <= 50) {
        pctColor = 'text-orange-500';
        bgClass = 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/50';
      } else if (pct > 50 && pct <= 75) {
        pctColor = 'text-lime-500';
        bgClass = 'bg-lime-50/50 dark:bg-lime-900/10 border-lime-100 dark:border-lime-800/50';
      } else if (pct > 75) {
        pctColor = 'text-emerald-500';
        bgClass = 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50';
      }

      list.push({
        dateStr: iso,
        displayDate,
        dayOfWeek,
        dayNum,
        isToday,
        completedCount: completed,
        totalHabits: habits.length,
        pct,
        pctColor,
        bgClass,
        completedHabits: completedHabitsList,
        actionStates: states,
      });
    }

    return list;
  }, [habits]);

  // Filter and sort for Date View
  const filteredDateEntries = useMemo(() => {
    let result = [...history180Days];

    if (filterAction !== 'ALL') {
      result = result.filter((entry) => !!entry.actionStates[filterAction]);
    }

    if (sortOrder === 'asc') {
      result.reverse();
    } else if (sortOrder === 'pct-desc') {
      result.sort((a, b) => b.pct - a.pct);
    } else if (sortOrder === 'pct-asc') {
      result.sort((a, b) => a.pct - b.pct);
    }

    return result;
  }, [history180Days, filterAction, sortOrder]);

  // Aggregate stats for Action View
  const actionStats = useMemo(() => {
    return habits.map((h) => {
      let count = 0;
      history180Days.forEach((day) => {
        if (day.actionStates[h.id]) count++;
      });
      const pct = Math.round((count / 180) * 100);
      const cMap = COLOR_MAP[h.color || 'blue'] || COLOR_MAP.blue;
      return {
        ...h,
        count,
        pct,
        cMap,
      };
    });
  }, [habits, history180Days]);

  if (!isOpen) return null;

  return (
    <div
      id="daily-actions-db-modal"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
    >
      {/* Backdrop */}
      <div
        id="dadb-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl transition-opacity duration-300"
      />

      {/* Modal Container */}
      <div
        id="dadb-content"
        className="relative bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200/50 dark:border-slate-700/50 z-10 flex flex-col max-h-[85vh] mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Actions Database</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Last 180 Days completion records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:rotate-90 transition-transform active:scale-95 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 flex space-x-2 md:space-x-4 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 pt-1 shrink-0 overflow-x-auto scrollbar-hide">
          <button
            type="button"
            id="dadb-tab-btn-date"
            onClick={() => setActiveTab('date')}
            className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'date'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            Date View
          </button>
          <button
            type="button"
            id="dadb-tab-btn-action"
            onClick={() => setActiveTab('action')}
            className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'action'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            Action View
          </button>
          <button
            type="button"
            id="dadb-tab-btn-trend"
            onClick={() => setActiveTab('trend')}
            className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'trend'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            Trend Chart
          </button>
        </div>

        {/* Tab 1: Date View */}
        {activeTab === 'date' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-3">
            {/* Filter and Sort Toolbar */}
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:block">
                Date Log (Last 180 Days)
              </span>
              <div className="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[9px] font-black uppercase tracking-widest transition-colors text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 outline-none cursor-pointer sm:max-w-[160px] md:max-w-[200px] truncate appearance-none pr-6"
                  >
                    <option value="ALL">Filter: All Actions</option>
                    {habits.map((h) => (
                      <option key={h.id} value={h.id}>
                        Filter: {h.title || h.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const states: ('desc' | 'asc' | 'pct-desc' | 'pct-asc')[] = [
                      'desc',
                      'asc',
                      'pct-desc',
                      'pct-asc',
                    ];
                    const next = states[(states.indexOf(sortOrder) + 1) % states.length];
                    setSortOrder(next);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[9px] font-black uppercase tracking-widest transition-colors text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  <span>
                    Sort:{' '}
                    {sortOrder === 'asc'
                      ? 'Oldest First'
                      : sortOrder === 'pct-desc'
                      ? 'Highest %'
                      : sortOrder === 'pct-asc'
                      ? 'Lowest %'
                      : 'Latest First'}
                  </span>
                </button>
              </div>
            </div>

            {/* Date Rows Scroll List */}
            <div
              id="dadb-view-date"
              className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2"
            >
              {filteredDateEntries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl mt-2">
                  No actions matching your filter recorded yet in the last 180 days.
                </div>
              ) : (
                filteredDateEntries.map((entry) => (
                  <div
                    key={entry.dateStr}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border ${entry.bgClass} shadow-sm mb-1 transition-all`}
                  >
                    <div className="flex flex-col pr-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          {entry.displayDate}
                        </span>
                        {entry.isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-blue-500 text-white shadow-sm">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.completedHabits.length > 0 ? (
                          entry.completedHabits.map((act) => {
                            const cMap = COLOR_MAP[act.color || 'blue'] || COLOR_MAP.blue;
                            return (
                              <span
                                key={act.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold ${cMap.iconBg} ${cMap.text} border ${cMap.borderLt}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${cMap.btn}`} />
                                {act.title || act.name}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic">
                            No completed actions recorded
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center shrink-0 ml-3 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-[3.5rem]">
                      <span className={`text-xs md:text-sm font-black ${entry.pctColor}`}>{entry.pct}%</span>
                      <span className="text-[7px] uppercase font-bold text-slate-400 tracking-wider">
                        {entry.completedCount}/{entry.totalHabits}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Action View */}
        {activeTab === 'action' && (
          <div
            id="dadb-view-action"
            className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 gap-3.5"
          >
            {actionStats.map((act) => (
              <div
                key={act.id}
                className={`p-4 rounded-2xl border ${act.cMap.borderLt} ${act.cMap.bgLt} shadow-sm flex flex-col gap-2.5 transition-all`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-2 rounded-xl ${act.cMap.iconBg} ${act.cMap.text} shrink-0 border ${act.cMap.borderLt}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {renderActionIcon(act.icon, act.title || act.name)}
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs md:text-sm font-black ${act.cMap.text} truncate block`}>
                        {act.title || act.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {act.startDate && (
                          <span className="text-[8px] font-bold text-slate-400">Since {act.startDate}</span>
                        )}
                        {act.track && (
                          <span className="text-[7px] font-black uppercase px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {act.track}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs md:text-sm font-black ${act.cMap.text}`}>{act.pct}%</span>
                    <span className="text-[7px] uppercase font-bold text-slate-400 tracking-wider block">
                      {act.count}/180 Days
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${act.cMap.btn}`}
                    style={{ width: `${act.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Trend Chart */}
        {activeTab === 'trend' && (
          <div id="dadb-view-trend" className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                180-Day Completion Trend (Daily %)
              </span>
              <span className="text-[10px] text-emerald-400 font-black">
                {history180Days.filter((d) => d.pct >= 80).length} High Adherence Days
              </span>
            </div>

            {/* SVG Interactive Trend Bar Chart */}
            <div className="flex-1 flex items-end gap-[2px] pt-4 pb-2 px-1 overflow-x-auto custom-scrollbar">
              {[...history180Days].reverse().map((d) => {
                const heightPct = Math.max(4, d.pct);
                let barColor = 'bg-slate-700/50';
                if (d.pct === 100) barColor = 'bg-emerald-500';
                else if (d.pct >= 75) barColor = 'bg-lime-500';
                else if (d.pct >= 50) barColor = 'bg-amber-400';
                else if (d.pct >= 25) barColor = 'bg-orange-500';
                else if (d.pct > 0) barColor = 'bg-rose-500';

                return (
                  <div
                    key={d.dateStr}
                    title={`${d.displayDate}: ${d.pct}% (${d.completedCount}/${d.totalHabits})`}
                    className="flex-1 min-w-[3px] max-w-[6px] h-full flex items-end group relative cursor-pointer"
                  >
                    <div
                      className={`w-full rounded-t-[1px] transition-all group-hover:opacity-80 group-hover:scale-y-105 ${barColor}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-400">
              <span>180 Days Ago</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-500" /> 100%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-amber-400" /> 50%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-rose-500" /> &lt;50%
                </span>
              </div>
              <span>Today</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
