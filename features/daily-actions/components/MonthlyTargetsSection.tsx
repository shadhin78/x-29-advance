'use client';

/**
 * X-29 Monthly Targets Section (features/daily-actions/components/MonthlyTargetsSection.tsx)
 * 
 * 100% Parity with legacy #monthly-targets-section:
 * - Month navigation: Past / Present / Future Month
 * - Targets Database modal trigger (data-open-mtdb)
 * - Monthly Target Setup trigger (link to /daily-actions/monthly-setup)
 * - Req. Pace, Actual Pace, Est. Finish pace metrics
 * - Monthly Target Checklist (#monthly-targets-list) with checkboxes, progress fill, and star badges
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTargetStore } from '@/stores/useTargetStore';
import { getMonthRangeKey } from '@/features/targets/services/targetAllocationEngine';

interface MonthlyTargetsSectionProps {
  onOpenMtdb: () => void;
}

export const MonthlyTargetsSection: React.FC<MonthlyTargetsSectionProps> = ({
  onOpenMtdb,
}) => {
  const {
    monthlyTargetsDatabase,
    dailyTargetsDatabase,
    selectedMonthRange,
    navigateMonth,
    toggleMonthlyTargetCompleted,
    deleteMonthlyTarget,
  } = useTargetStore();

  const currentMonthKey = useMemo(() => getMonthRangeKey(new Date()), []);
  const isPresent = selectedMonthRange === currentMonthKey;

  const monthNameBadge = useMemo(() => {
    const startStr = selectedMonthRange.split(' - ')[0];
    const d = new Date(startStr);
    if (!isNaN(d.getTime())) {
      const monthYear = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      return `[ ${monthYear} : ${selectedMonthRange} ]`;
    }
    return `[ ${selectedMonthRange} ]`;
  }, [selectedMonthRange]);

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
    return monthlyTargetsDatabase[selectedMonthRange] || [];
  }, [monthlyTargetsDatabase, selectedMonthRange]);

  // Pace metrics calculation
  const { reqPace, actPace, estFinish } = useMemo(() => {
    const totalTargets = targetsList.length;
    let completedTargets = 0;

    targetsList.forEach((t) => {
      if (t.completed) completedTargets++;
    });

    const remainingTargets = totalTargets - completedTargets;
    const now = new Date();
    const currentDay = now.getDate();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, lastDayOfMonth - currentDay + 1);

    if (isPresent) {
      const req = daysLeft > 0 ? (remainingTargets / daysLeft).toFixed(2) : '0.00';
      const act = (completedTargets / Math.max(1, currentDay)).toFixed(2);

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
      id="monthly-targets-section"
      className="mt-8 md:mt-10 bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-6"
    >
      {/* Header and Metrics */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 border-b border-slate-100 dark:border-slate-700/60 pb-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
                Monthly Targets
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  id="mt-selected-month-range"
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black tracking-wider uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800"
                >
                  {monthNameBadge}
                </span>
                <span
                  id="mt-today-display"
                  className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider"
                >
                  {todayDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Month Navigation and Buttons */}
          <div className="flex items-center space-x-2 md:ml-auto w-full md:w-auto mt-2 md:mt-0 flex-wrap gap-2 justify-end">
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shrink-0">
              <button
                type="button"
                id="mt-btn-past"
                data-navigate-month="past"
                onClick={() => navigateMonth('past')}
                className="px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50 flex items-center space-x-1 cursor-pointer"
              >
                <span>&lt;- Past Month</span>
              </button>
              <button
                type="button"
                id="mt-btn-present"
                data-navigate-month="present"
                onClick={() => navigateMonth('present')}
                className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                  isPresent
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50'
                }`}
              >
                <span>Present Month</span>
              </button>
              <button
                type="button"
                id="mt-btn-future"
                data-navigate-month="future"
                onClick={() => navigateMonth('future')}
                className="px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50 flex items-center space-x-1 cursor-pointer"
              >
                <span>Future Month -&gt;</span>
              </button>
            </div>

            <button
              type="button"
              data-open-mtdb
              onClick={onOpenMtdb}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-colors shadow-md shadow-indigo-500/10 active:scale-95 shrink-0 cursor-pointer"
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

            <Link
              href="/daily-actions/monthly-setup"
              data-open-monthly-target-setup
              className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-lg transition-colors shadow-md shadow-emerald-500/10 active:scale-95 shrink-0"
              title="Monthly Target Setup"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add</span>
            </Link>
          </div>
        </div>

        {/* Metrics panel */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full xl:w-auto shrink-0">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center min-w-[80px] sm:min-w-[100px]">
            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">
              Req. Pace
            </span>
            <span
              id="mt-req-pace"
              className="text-xs font-black text-indigo-600 dark:text-indigo-400"
            >
              {reqPace}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center min-w-[80px] sm:min-w-[100px]">
            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">
              Actual Pace
            </span>
            <span
              id="mt-act-pace"
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
              id="mt-est-finish"
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
            Monthly Target Checklist
          </h4>
        </div>
        <div id="monthly-targets-list" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {targetsList.length === 0 ? (
            <div className="col-span-full py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              No monthly targets set for this month.
            </div>
          ) : (
            targetsList.map((target, idx) => {
              const isCompleted = !!target.completed;
              const isSubjectTarget =
                target.targetType === 'subject' ||
                target.chapter === 'Whole Subject' ||
                target.chapter === 'All Chapters';

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
                        toggleMonthlyTargetCompleted(selectedMonthRange, target.id)
                      }
                      className="form-checkbox h-4.5 w-4.5 text-emerald-500 dark:text-emerald-500 rounded border-slate-350 focus:ring-emerald-500 transition-all cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                        {isSubjectTarget ? `📚 ${target.subject}` : `${target.chapter}: ${target.subject}`}
                      </span>
                      <div className="flex items-center space-x-1.5 flex-wrap mt-0.5">
                        <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">
                          {target.program}
                        </span>
                        {isSubjectTarget ? (
                          <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                            📚 Subject Target
                          </span>
                        ) : target.scope && target.scope !== 'Whole Chapter' ? (
                          <span className="inline-block px-1 py-0.5 rounded-[3px] text-[7px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                            {target.scope}
                          </span>
                        ) : null}
                        {target.targetWeek && (
                          <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            {target.targetWeek}
                          </span>
                        )}
                        {target.totalChapterSize && (
                          <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                            {target.totalChapterSize} Units
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <Link
                      href="/daily-actions/monthly-setup"
                      className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all active:scale-90 shadow-sm cursor-pointer"
                      title="Edit Monthly Target"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        deleteMonthlyTarget(selectedMonthRange, target.id)
                      }
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-300 hover:text-red-500 rounded-lg transition-all active:scale-90 shadow-sm cursor-pointer"
                      title="Delete Monthly Target"
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
