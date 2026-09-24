'use client';

/**
 * X-29 Targets Database Modal (features/daily-actions/components/modals/TargetsDbModal.tsx)
 * 
 * 100% Visual & Behavioral Parity with legacy #monthly-targets-db-modal, #weekly-targets-db-modal, #daily-targets-db-modal:
 * - Table layout with Status, Range, Program, Subject, Chapter, and Delete columns
 * - Multi-criteria filters: Range/Month filter, Program filter, Status filter
 * - Checkbox toggles for completion status
 * - Raw SVG icons matching legacy: calendar/layers icon, close icon, and trash/delete icon
 * - Zero Lucide icon imports
 */

import React, { useState, useMemo } from 'react';
import { useTargetStore } from '@/stores/useTargetStore';

interface TargetsDbModalProps {
  isOpen: boolean;
  initialTab?: 'monthly' | 'weekly' | 'daily';
  onClose: () => void;
}

export const TargetsDbModal: React.FC<TargetsDbModalProps> = ({
  isOpen,
  initialTab = 'monthly',
  onClose,
}) => {
  const {
    monthlyTargetsDatabase,
    weeklyTargetsDatabase,
    dailyTargetsDatabase,
    deleteMonthlyTarget,
    deleteWeeklyTarget,
    deleteDailyTarget,
    toggleMonthlyTargetCompleted,
    toggleWeeklyTargetCompleted,
    toggleDailyTargetCompleted,
  } = useTargetStore();

  const [activeTab, setActiveTab] = useState<'monthly' | 'weekly' | 'daily'>(initialTab);
  const [filterRange, setFilterRange] = useState<string>('all');
  const [filterProg, setFilterProg] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'non-completed'>('all');

  // Available keys for active tab
  const monthKeys = useMemo(() => Object.keys(monthlyTargetsDatabase), [monthlyTargetsDatabase]);
  const weekKeys = useMemo(() => Object.keys(weeklyTargetsDatabase), [weeklyTargetsDatabase]);
  const dayKeys = useMemo(() => Object.keys(dailyTargetsDatabase), [dailyTargetsDatabase]);

  const activeKeys = useMemo(() => {
    if (activeTab === 'monthly') return monthKeys;
    if (activeTab === 'weekly') return weekKeys;
    return dayKeys;
  }, [activeTab, monthKeys, weekKeys, dayKeys]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const rows: { key: string; item: any }[] = [];

    const db =
      activeTab === 'monthly'
        ? monthlyTargetsDatabase
        : activeTab === 'weekly'
        ? weeklyTargetsDatabase
        : dailyTargetsDatabase;

    Object.keys(db).forEach((key) => {
      if (filterRange !== 'all' && key !== filterRange) return;

      const list = db[key] || [];
      list.forEach((target) => {
        if (filterProg !== 'all' && target.program !== filterProg) return;
        if (filterStatus === 'completed' && !target.completed) return;
        if (filterStatus === 'non-completed' && target.completed) return;

        rows.push({ key, item: target });
      });
    });

    return rows;
  }, [
    activeTab,
    filterRange,
    filterProg,
    filterStatus,
    monthlyTargetsDatabase,
    weeklyTargetsDatabase,
    dailyTargetsDatabase,
  ]);

  if (!isOpen) return null;

  return (
    <div
      id="monthly-targets-db-modal"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
    >
      {/* Backdrop */}
      <div
        id="mtdb-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl transition-opacity duration-300"
      />

      {/* Modal Container */}
      <div
        id="mtdb-content"
        className="relative bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200/50 dark:border-slate-700/50 z-10 flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
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
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
                {activeTab === 'monthly'
                  ? 'Monthly Targets'
                  : activeTab === 'weekly'
                  ? 'Weekly Targets'
                  : 'Daily Targets'}{' '}
                Database
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Historical records and analysis of targets
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
            id="mtdb-tab-btn-monthly"
            onClick={() => {
              setActiveTab('monthly');
              setFilterRange('all');
            }}
            className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            Monthly Targets ({monthKeys.reduce((acc, k) => acc + (monthlyTargetsDatabase[k]?.length || 0), 0)})
          </button>
          <button
            type="button"
            id="mtdb-tab-btn-weekly"
            onClick={() => {
              setActiveTab('weekly');
              setFilterRange('all');
            }}
            className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'weekly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            Weekly Targets ({weekKeys.reduce((acc, k) => acc + (weeklyTargetsDatabase[k]?.length || 0), 0)})
          </button>
          <button
            type="button"
            id="mtdb-tab-btn-daily"
            onClick={() => {
              setActiveTab('daily');
              setFilterRange('all');
            }}
            className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            Daily Targets ({dayKeys.reduce((acc, k) => acc + (dailyTargetsDatabase[k]?.length || 0), 0)})
          </button>
        </div>

        {/* Tab Content: Filters & Table */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shrink-0">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                {activeTab === 'monthly' ? 'Month Filter' : activeTab === 'weekly' ? 'Week Filter' : 'Date Filter'}
              </label>
              <select
                value={filterRange}
                onChange={(e) => setFilterRange(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Ranges</option>
                {activeKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 w-full">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Program Filter
              </label>
              <select
                value={filterProg}
                onChange={(e) => setFilterProg(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Programs</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 w-full">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Status Filter
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="non-completed">Non-Completed</option>
              </select>
            </div>
          </div>

          {/* Database List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">
                    {activeTab === 'monthly'
                      ? 'Month Range'
                      : activeTab === 'weekly'
                      ? 'Week Range'
                      : 'Date'}
                  </th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Chapter</th>
                  <th className="py-3 px-4 w-12 text-center">Delete</th>
                </tr>
              </thead>
              <tbody
                id="mtdb-targets-tbody"
                className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold"
              >
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400"
                    >
                      No matching targets found in database.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(({ key, item: target }) => {
                    const isSubjectTarget =
                      target.targetType === 'subject' ||
                      target.chapter === 'Whole Subject' ||
                      target.chapter === 'All Chapters';

                    const displaySub = (target.subject || '')
                      .replace((target.program || '') + ' - ', '')
                      .replace((target.program || '') + ' ', '');

                    return (
                      <tr
                        key={target.id || `${key}-${target.chapter}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!target.completed}
                            onChange={() => {
                              if (activeTab === 'monthly') {
                                toggleMonthlyTargetCompleted(key, target.id);
                              } else if (activeTab === 'weekly') {
                                toggleWeeklyTargetCompleted(key, target.id);
                              } else {
                                toggleDailyTargetCompleted(key, target.id);
                              }
                            }}
                            className="form-checkbox h-4 w-4 text-emerald-500 rounded cursor-pointer accent-emerald-500"
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-500 dark:text-slate-400 text-[10px]">
                          {key}
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px] text-slate-400">
                          {target.program}
                        </td>
                        <td
                          className="py-3 px-4 truncate max-w-[140px]"
                          title={target.subject}
                        >
                          {displaySub}
                        </td>
                        <td className="py-3 px-4">
                          {isSubjectTarget ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                              📚 Whole Subject
                            </span>
                          ) : (
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                              {target.chapter}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeTab === 'monthly') {
                                deleteMonthlyTarget(key, target.id);
                              } else if (activeTab === 'weekly') {
                                deleteWeeklyTarget(key, target.id);
                              } else {
                                deleteDailyTarget(key, target.id);
                              }
                            }}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded transition-all active:scale-90 shadow-sm"
                            title="Delete Target"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
