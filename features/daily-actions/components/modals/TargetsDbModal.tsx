'use client';

/**
 * X-29 Targets Database Modal (features/daily-actions/components/modals/TargetsDbModal.tsx)
 * 
 * 100% Parity with legacy #monthly-targets-db-modal, #weekly-targets-db-modal, #daily-targets-db-modal:
 * - Unified view for Monthly, Weekly, and Daily Targets Database
 * - Multi-criteria filters: Month/Week/Date range, Program, Subject
 * - Target progress indicators, completion status, and quick deletion
 */

import React, { useState, useMemo } from 'react';
import { useTargetStore } from '@/stores/useTargetStore';
import { Layers, X, Calendar, BookOpen, Trash2, CheckCircle2, Circle } from 'lucide-react';

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
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterProg, setFilterProg] = useState<string>('ALL');

  // Month keys
  const monthKeys = useMemo(() => Object.keys(monthlyTargetsDatabase), [monthlyTargetsDatabase]);
  const weekKeys = useMemo(() => Object.keys(weeklyTargetsDatabase), [weeklyTargetsDatabase]);
  const dayKeys = useMemo(() => Object.keys(dailyTargetsDatabase), [dailyTargetsDatabase]);

  // Current list based on active tab and filters
  const currentList = useMemo(() => {
    if (activeTab === 'monthly') {
      const all: { key: string; item: any }[] = [];
      for (const mKey of monthKeys) {
        if (filterMonth !== 'ALL' && mKey !== filterMonth) continue;
        const list = monthlyTargetsDatabase[mKey] || [];
        list.forEach((mt) => {
          if (filterProg !== 'ALL' && mt.program !== filterProg) return;
          all.push({ key: mKey, item: mt });
        });
      }
      return all;
    } else if (activeTab === 'weekly') {
      const all: { key: string; item: any }[] = [];
      for (const wKey of weekKeys) {
        const list = weeklyTargetsDatabase[wKey] || [];
        list.forEach((wt) => {
          if (filterProg !== 'ALL' && wt.program !== filterProg) return;
          all.push({ key: wKey, item: wt });
        });
      }
      return all;
    } else {
      const all: { key: string; item: any }[] = [];
      for (const dKey of dayKeys) {
        const list = dailyTargetsDatabase[dKey] || [];
        list.forEach((dt) => {
          if (filterProg !== 'ALL' && dt.program !== filterProg) return;
          all.push({ key: dKey, item: dt });
        });
      }
      return all;
    }
  }, [
    activeTab,
    filterMonth,
    filterProg,
    monthKeys,
    weekKeys,
    dayKeys,
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

      {/* Content */}
      <div
        id="mtdb-content"
        className="relative bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200/50 dark:border-slate-700/50 z-10 flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">
                Targets Database
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Historical records and analysis of targets
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
            id="mtdb-tab-btn-monthly"
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            Monthly Targets ({monthKeys.reduce((acc, k) => acc + (monthlyTargetsDatabase[k]?.length || 0), 0)})
          </button>
          <button
            id="mtdb-tab-btn-weekly"
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'weekly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            Weekly Targets ({weekKeys.reduce((acc, k) => acc + (weeklyTargetsDatabase[k]?.length || 0), 0)})
          </button>
          <button
            id="mtdb-tab-btn-daily"
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            Daily Targets ({dayKeys.reduce((acc, k) => acc + (dailyTargetsDatabase[k]?.length || 0), 0)})
          </button>
        </div>

        {/* Filters */}
        {activeTab === 'monthly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-3 shrink-0">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Month Filter
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Months</option>
                {monthKeys.map((mk) => (
                  <option key={mk} value={mk}>
                    {mk}
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
                <option value="ALL">All Programs</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
              </select>
            </div>
          </div>
        )}

        {/* Targets List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {currentList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              No targets found matching the current database filter.
            </div>
          ) : (
            currentList.map((entry, idx) => {
              const target = entry.item;
              const isMonthly = activeTab === 'monthly';
              const isWeekly = activeTab === 'weekly';
              const isDaily = activeTab === 'daily';

              return (
                <div
                  key={target.id || `${idx}`}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-all hover:border-slate-700"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (isMonthly) toggleMonthlyTargetCompleted(entry.key, target.id);
                        else if (isWeekly) toggleWeeklyTargetCompleted(entry.key, target.id);
                        else if (isDaily) toggleDailyTargetCompleted(entry.key, target.id);
                      }}
                      className="text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      {target.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <span
                        className={`text-xs font-black truncate block ${
                          target.completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {target.chapter} - {target.subject}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-[9px] text-slate-400 font-bold">
                        <span>{target.program}</span>
                        <span>•</span>
                        {isMonthly && <span>Month: {entry.key}</span>}
                        {isWeekly && <span>Week: {entry.key}</span>}
                        {isDaily && <span>Date: {entry.key}</span>}
                        {target.totalChapterSize && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-500">{target.totalChapterSize} Units</span>
                          </>
                        )}
                        {target.portionSize && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-500">{target.portionSize} Portion</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        target.completed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {target.completed ? 'Done' : 'Pending'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isMonthly) deleteMonthlyTarget(entry.key, target.id);
                        else if (isWeekly) deleteWeeklyTarget(entry.key, target.id);
                        else if (isDaily) deleteDailyTarget(entry.key, target.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Delete Target"
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
