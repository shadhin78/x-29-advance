'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { DailyHabit } from '@/types/habits';

interface YearlyActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: DailyHabit[];
}

export const YearlyActionsModal: React.FC<YearlyActionsModalProps> = ({
  isOpen,
  onClose,
  habits,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Yearly Habits Adherence
            </h3>
            <p className="text-xs text-slate-400">
              Annual cumulative consistency metrics across all active commitments
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {habits.map((habit) => {
            const totalLogged = Object.keys(habit.history || {}).length;
            return (
              <div
                key={habit.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">
                    {habit.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">{habit.desc || 'Daily Commitment'}</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                    {totalLogged} Days
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                    Logged This Year
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
