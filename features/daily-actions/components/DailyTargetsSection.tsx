'use client';

/**
 * X-29 Daily Targets Section (features/daily-actions/components/DailyTargetsSection.tsx)
 * 
 * 100% Parity with legacy #daily-targets-setup-section:
 * - Day navigation: Previous Day / Today / Next Day
 * - Targets Database modal trigger (data-open-dtdb)
 * - Daily Target Checklist (#daily-targets-list) with checkbox & portion sizes
 */

import React, { useMemo } from 'react';
import { useTargetStore } from '@/stores/useTargetStore';
import { Trash2 } from 'lucide-react';

interface DailyTargetsSectionProps {
  onOpenDtdb: () => void;
}

export const DailyTargetsSection: React.FC<DailyTargetsSectionProps> = ({
  onOpenDtdb,
}) => {
  const {
    dailyTargetsDatabase,
    selectedDailyDate,
    navigateDay,
    toggleDailyTargetCompleted,
    deleteDailyTarget,
  } = useTargetStore();

  const isToday = useMemo(() => {
    return selectedDailyDate === new Date().toISOString().slice(0, 10);
  }, [selectedDailyDate]);

  const targetsList = useMemo(() => {
    return dailyTargetsDatabase[selectedDailyDate] || [];
  }, [dailyTargetsDatabase, selectedDailyDate]);

  const displayDateText = useMemo(() => {
    const d = new Date(selectedDailyDate);
    if (isNaN(d.getTime())) return selectedDailyDate;
    const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
    const formatted = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${weekday}, ${formatted}`;
  }, [selectedDailyDate]);

  return (
    <div
      id="daily-targets-setup-section"
      className="mt-8 md:mt-10 bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 border-b border-slate-100 dark:border-slate-700/60 pb-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
                Daily Targets
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  id="dt-selected-date"
                  className="text-[10px] text-blue-600 dark:text-blue-400 font-black tracking-wider uppercase bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800"
                >
                  [ {displayDateText} ]
                </span>
              </div>
            </div>
          </div>

          {/* Day Navigation and Buttons */}
          <div className="flex items-center space-x-2 md:ml-auto w-full md:w-auto mt-2 md:mt-0 flex-wrap gap-2 justify-end">
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shrink-0">
              <button
                type="button"
                id="dt-btn-past"
                data-navigate-day="past"
                onClick={() => navigateDay('past')}
                className="px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50 cursor-pointer"
              >
                <span>&lt;- Previous Day</span>
              </button>
              <button
                type="button"
                id="dt-btn-present"
                data-navigate-day="present"
                onClick={() => navigateDay('present')}
                className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                  isToday
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50'
                }`}
              >
                <span>Today</span>
              </button>
              <button
                type="button"
                id="dt-btn-future"
                data-navigate-day="future"
                onClick={() => navigateDay('future')}
                className="px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50 cursor-pointer"
              >
                <span>Next Day -&gt;</span>
              </button>
            </div>

            <button
              type="button"
              data-open-dtdb
              onClick={onOpenDtdb}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-colors shadow-md shadow-blue-500/10 active:scale-95 shrink-0 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
              <span>Targets Database</span>
            </button>
          </div>
        </div>
      </div>

      {/* Targets List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
          <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Daily Target Checklist
          </h4>
        </div>
        <div id="daily-targets-list" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {targetsList.length === 0 ? (
            <div className="col-span-full py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              No daily targets scheduled for this date.
            </div>
          ) : (
            targetsList.map((target, idx) => {
              const isCompleted = !!target.completed;

              return (
                <div
                  key={target.id || `${idx}`}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-500/50'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() =>
                        toggleDailyTargetCompleted(selectedDailyDate, target.id)
                      }
                      className="form-checkbox h-4.5 w-4.5 text-emerald-500 dark:text-emerald-500 rounded border-slate-350 focus:ring-emerald-500 transition-all cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                        {target.chapter}: {target.subject}
                      </span>
                      <div className="flex items-center space-x-1.5 flex-wrap mt-0.5">
                        <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">
                          {target.program}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                          {target.portionSize} Portion
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        deleteDailyTarget(selectedDailyDate, target.id)
                      }
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-300 hover:text-red-500 rounded-lg transition-all active:scale-90 shadow-sm cursor-pointer"
                      title="Delete Daily Target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
