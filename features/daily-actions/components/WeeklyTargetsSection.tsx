'use client';

/**
 * X-29 Weekly Targets Section (features/daily-actions/components/WeeklyTargetsSection.tsx)
 * 
 * 100% Parity with legacy #weekly-targets-section:
 * - Week navigation: Past / Present / Future Week
 * - Targets Database modal trigger (data-open-wtdb)
 * - Req. Pace, Actual Pace, Est. Finish metrics
 * - Weekly Target Checklist (#weekly-targets-list)
 */

import React, { useMemo } from 'react';
import { useTargetStore } from '@/stores/useTargetStore';
import { getWeekRangeKey } from '@/features/targets/services/targetAllocationEngine';

interface WeeklyTargetsSectionProps {
  onOpenWtdb: () => void;
}

export const WeeklyTargetsSection: React.FC<WeeklyTargetsSectionProps> = ({
  onOpenWtdb,
}) => {
  const {
    weeklyTargetsDatabase,
    selectedWeekRange,
    navigateWeek,
    toggleWeeklyTargetCompleted,
    deleteWeeklyTarget,
  } = useTargetStore();

  const currentWeekKey = useMemo(() => getWeekRangeKey(new Date()), []);
  const isPresent = selectedWeekRange === currentWeekKey;

  const todayDisplay = useMemo(() => {
    const today = new Date();
    const weekday = today.toLocaleDateString('en-GB', { weekday: 'long' });
    const formatted = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `Today: ${weekday}, ${formatted}`;
  }, []);

  const targetsList = useMemo(() => {
    return weeklyTargetsDatabase[selectedWeekRange] || [];
  }, [weeklyTargetsDatabase, selectedWeekRange]);

  // Pace metrics calculation
  const { reqPace, actPace, estFinish } = useMemo(() => {
    const totalTargets = targetsList.length;
    let completedTargets = 0;

    targetsList.forEach((t) => {
      if (t.completed) completedTargets++;
    });

    const remainingTargets = totalTargets - completedTargets;
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 1 (Mon) to 7 (Sun)
    const daysLeft = Math.max(1, 7 - dayOfWeek + 1);

    if (isPresent) {
      const req = daysLeft > 0 ? (remainingTargets / daysLeft).toFixed(2) : '0.00';
      const act = (completedTargets / Math.max(1, dayOfWeek)).toFixed(2);

      let finish = 'N/A';
      if (remainingTargets === 0 && totalTargets > 0) finish = 'Goal Met';
      else if (parseFloat(act) === 0) finish = 'Infinite';
      else {
        const daysNeeded = remainingTargets / parseFloat(act);
        const estDate = new Date();
        estDate.setDate(estDate.getDate() + Math.ceil(daysNeeded));
        finish = estDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }

      return { reqPace: `${req} Ch/D`, actPace: `${act} Ch/D`, estFinish: finish };
    } else {
      return { reqPace: '0.00 Ch/D', actPace: '0.00 Ch/D', estFinish: 'N/A' };
    }
  }, [targetsList, isPresent]);

  return (
    <div
      id="weekly-targets-section"
      className="mt-8 md:mt-10 bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-6"
    >
      {/* Header and Metrics */}
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
                Weekly Targets
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  id="wt-selected-week-range"
                  className="text-[10px] text-blue-600 dark:text-blue-400 font-black tracking-wider uppercase bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800"
                >
                  [ {selectedWeekRange} ]
                </span>
                <span
                  id="wt-today-display"
                  className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider"
                >
                  {todayDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Week Navigation and Buttons */}
          <div className="flex items-center space-x-2 md:ml-auto w-full md:w-auto mt-2 md:mt-0 flex-wrap gap-2 justify-end">
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shrink-0">
              <button
                type="button"
                id="wt-btn-past"
                data-navigate-week="past"
                onClick={() => navigateWeek('past')}
                className="px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50 flex items-center space-x-1 cursor-pointer"
              >
                <span>&lt;- Past Week</span>
              </button>
              <button
                type="button"
                id="wt-btn-present"
                data-navigate-week="present"
                onClick={() => navigateWeek('present')}
                className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                  isPresent
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50'
                }`}
              >
                <span>Present Week</span>
              </button>
              <button
                type="button"
                id="wt-btn-future"
                data-navigate-week="future"
                onClick={() => navigateWeek('future')}
                className="px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50 flex items-center space-x-1 cursor-pointer"
              >
                <span>Future Week -&gt;</span>
              </button>
            </div>

            <button
              type="button"
              data-open-wtdb
              onClick={onOpenWtdb}
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

        {/* Metrics panel */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full xl:w-auto shrink-0">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center min-w-[80px] sm:min-w-[100px]">
            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">
              Req. Pace
            </span>
            <span
              id="wt-req-pace"
              className="text-xs font-black text-blue-600 dark:text-blue-400"
            >
              {reqPace}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center min-w-[80px] sm:min-w-[100px]">
            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">
              Actual Pace
            </span>
            <span
              id="wt-act-pace"
              className="text-xs font-black text-emerald-600 dark:text-emerald-400"
            >
              {actPace}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center min-w-[80px] sm:min-w-[100px]">
            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">
              Est. Finish
            </span>
            <span
              id="wt-est-finish"
              className="text-xs font-black text-purple-600 dark:text-purple-400"
            >
              {estFinish}
            </span>
          </div>
        </div>
      </div>

      {/* Targets List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
          <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Weekly Target Checklist
          </h4>
        </div>
        <div id="weekly-targets-list" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {targetsList.length === 0 ? (
            <div className="col-span-full py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              No weekly targets set for this week.
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
                        toggleWeeklyTargetCompleted(selectedWeekRange, target.id)
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
                        {target.size && (
                          <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            {target.size} Units
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        deleteWeeklyTarget(selectedWeekRange, target.id)
                      }
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-300 hover:text-red-500 rounded-lg transition-all active:scale-90 shadow-sm cursor-pointer"
                      title="Delete Weekly Target"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
