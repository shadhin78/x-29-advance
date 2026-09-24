'use client';

/**
 * X-29 Daily Actions Database (DADB) Modal (features/daily-actions/components/modals/DailyActionsDbModal.tsx)
 * 
 * 100% Parity with legacy #daily-actions-db-modal:
 * - 180-Day historical records across all daily habits
 * - Tab 1: Date View (sortable by date or completion %, filterable by habit)
 * - Tab 2: Action View (aggregate completion stats and progress bars)
 * - Tab 3: Trend Chart (interactive 180-day completion trend visualization)
 */

import React, { useState, useMemo } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { Database, X, ArrowUpDown, Filter, BarChart3, Calendar, Flame } from 'lucide-react';

interface DailyActionsDbModalProps {
  isOpen: boolean;
  onClose: () => void;
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
      completedCount: number;
      totalHabits: number;
      pct: number;
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
      const displayDate = `${dayOfWeek} ${dayNum} ${monthShort} ${d.getFullYear()}`;

      let completed = 0;
      const states: Record<string, boolean> = {};

      habits.forEach((h) => {
        const isDone = !!h.history[iso];
        states[h.id] = isDone;
        if (isDone) completed++;
      });

      const pct = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;

      list.push({
        dateStr: iso,
        displayDate,
        dayOfWeek,
        dayNum,
        completedCount: completed,
        totalHabits: habits.length,
        pct,
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
      return {
        ...h,
        count,
        pct,
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
        className="relative bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200/50 dark:border-slate-700/50 z-10 flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">
                Actions Database
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Last 180 Days completion records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:rotate-90 transition-transform active:scale-95 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 flex space-x-2 md:space-x-4 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 pt-1 shrink-0 overflow-x-auto scrollbar-hide">
          <button
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
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Filter:
                </span>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="ALL">All Actions</option>
                  {habits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title || h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" />
                  Sort:
                </span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="desc">Latest First</option>
                  <option value="asc">Oldest First</option>
                  <option value="pct-desc">Highest Completion %</option>
                  <option value="pct-asc">Lowest Completion %</option>
                </select>
              </div>
            </div>

            {/* Date Rows Scroll List */}
            <div
              id="dadb-view-date"
              className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2"
            >
              {filteredDateEntries.map((entry) => (
                <div
                  key={entry.dateStr}
                  className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      {entry.displayDate}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {habits.map((h) => {
                        const isDone = !!entry.actionStates[h.id];
                        return (
                          <span
                            key={h.id}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              isDone
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400 border border-slate-300/40 dark:border-slate-700/40'
                            }`}
                          >
                            {h.title || h.name} {isDone ? '✓' : '✕'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-black font-mono ${
                        entry.pct === 100
                          ? 'text-emerald-500'
                          : entry.pct >= 50
                          ? 'text-amber-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {entry.pct}%
                    </span>
                    <span className="text-[9px] block text-slate-400 font-bold">
                      {entry.completedCount}/{entry.totalHabits} Done
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Action View */}
        {activeTab === 'action' && (
          <div
            id="dadb-view-action"
            className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3"
          >
            {actionStats.map((act) => (
              <div
                key={act.id}
                className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                      {act.title || act.name}
                    </span>
                    {act.track && (
                      <span className="text-[8px] font-black uppercase bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                        {act.track}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                      {act.pct}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1.5">
                      ({act.count} / 180 Days)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
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
