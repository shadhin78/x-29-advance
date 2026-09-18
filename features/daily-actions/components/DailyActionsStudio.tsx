'use client';

/**
 * X-29 Daily Actions Studio Component (features/daily-actions/components/DailyActionsStudio.tsx)
 * 
 * Manages daily execution workflow:
 * - Today's scheduled targets & checklist items
 * - Recurring daily habits tracker with streak indicators
 * - Memory-efficient completion heatmap
 * - Direct navigation to Monthly Target Setup Studio
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { useTargetStore } from '@/stores/useTargetStore';
import {
  CalendarCheck2,
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Layers,
  ArrowRight,
  Trash2,
} from 'lucide-react';

export const DailyActionsStudio: React.FC = () => {
  const { habits, initFromStorage: initHabits, toggleHabit, addHabit, deleteHabit } =
    useDailyActionStore();

  const { dailyTargetsDatabase, initFromStorage: initTargets, toggleDailyTargetCompleted } =
    useTargetStore();

  const [todayStr, setTodayStr] = useState('');
  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
    initHabits();
    initTargets();
    setTodayStr(new Date().toISOString().slice(0, 10));
  }, [initHabits, initTargets]);

  // Today's daily target items
  const todayTargets = useMemo(() => {
    if (!todayStr) return [];
    return dailyTargetsDatabase[todayStr] || [];
  }, [todayStr, dailyTargetsDatabase]);

  // Calculate past 30 days for efficient heatmap
  const past30Days = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      list.push(d.toISOString().slice(0, 10));
    }
    return list;
  }, []);

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit(newHabitName.trim());
    setNewHabitName('');
  };

  const todayCompletedHabitsCount = useMemo(() => {
    if (!todayStr) return 0;
    return habits.filter((h) => !!h.history[todayStr]).length;
  }, [habits, todayStr]);

  const todayCompletedTargetsCount = useMemo(() => {
    return todayTargets.filter((t) => !!t.completed).length;
  }, [todayTargets]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Daily Execution Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Today&apos;s Actions & Targets
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Date: <span className="text-white font-mono font-bold">{todayStr}</span> •{' '}
            {todayCompletedHabitsCount} of {habits.length} Habits Completed •{' '}
            {todayCompletedTargetsCount} of {todayTargets.length} Targets Done
          </p>
        </div>

        <Link
          href="/daily-actions/monthly-setup"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Layers className="w-4 h-4" />
          <span>Monthly Target Setup Studio</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Daily Targets for Today */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <CalendarCheck2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Today&apos;s Chapter Targets
              </h2>
            </div>
            <span className="text-[10px] font-black bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-slate-400">
              {todayTargets.length} Assigned
            </span>
          </div>

          {todayTargets.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
              <p className="text-xs font-bold text-slate-400">No chapter targets scheduled for today.</p>
              <Link
                href="/daily-actions/monthly-setup"
                className="text-[11px] font-black uppercase tracking-wider text-blue-400 hover:underline mt-2 inline-block"
              >
                + Plan Targets in Monthly Studio
              </Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {todayTargets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleDailyTargetCompleted(todayStr, t.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    t.completed
                      ? 'bg-slate-950/40 border-slate-900 opacity-60'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          t.completed ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {t.chapter}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {t.subject} • {t.portionSize} Portion
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Recurring Habits Tracker */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Daily Habits Tracker
              </h2>
            </div>
            <span className="text-[10px] font-black bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-slate-400">
              {todayCompletedHabitsCount} / {habits.length} Done
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {habits.map((h) => {
              const isChecked = !!h.history[todayStr];
              return (
                <div
                  key={h.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <label className="flex items-center space-x-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleHabit(h.id, todayStr)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span
                      className={`text-xs font-bold ${
                        isChecked ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {h.name}
                    </span>
                  </label>

                  <button
                    onClick={() => deleteHabit(h.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Habit Form */}
          <form onSubmit={handleAddHabit} className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              placeholder="Add new habit..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Memory-Efficient Activity Heatmap (Past 30 Days) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
          30-Day Activity Heatmap
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2">
          {past30Days.map((d) => {
            const count = habits.filter((h) => !!h.history[d]).length;
            let bg = 'bg-slate-950 border-slate-800';
            if (count >= 4) bg = 'bg-emerald-500 border-emerald-400 text-slate-950 font-black';
            else if (count >= 2) bg = 'bg-emerald-700 border-emerald-600 text-white font-bold';
            else if (count === 1) bg = 'bg-emerald-950 border-emerald-800 text-emerald-400';

            return (
              <div
                key={d}
                title={`${d}: ${count} habits completed`}
                className={`h-10 rounded-xl border flex flex-col items-center justify-center text-[9px] transition-all hover:scale-105 select-none ${bg}`}
              >
                <span className="opacity-80 leading-none">{d.slice(8)}</span>
                <span className="text-[8px] font-bold mt-0.5">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
