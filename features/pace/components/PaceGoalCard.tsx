'use client';

/**
 * X-29 Pace Goal Card (features/pace/components/PaceGoalCard.tsx)
 * 
 * Individual timeline goal scorecard showing target scope, progress bar,
 * actual vs required velocity, and projected completion status.
 */

import React from 'react';
import type { PaceGoal, PaceStats } from '@/types/pace';
import { Target, Calendar, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

interface PaceGoalCardProps {
  goal: PaceGoal;
  stats: PaceStats;
  isActive: boolean;
  onSetActive: (id: string) => void;
  onEdit: (goal: PaceGoal) => void;
  onDelete: (id: string) => void;
}

export const PaceGoalCard: React.FC<PaceGoalCardProps> = React.memo(function PaceGoalCard({
  goal,
  stats,
  isActive,
  onSetActive,
  onEdit,
  onDelete,
}) {
  const isBehind = stats.isBehind;

  let typeBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (goal.type === 'bundle') typeBadgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  if (goal.type === 'program') typeBadgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  if (goal.type === 'subject') typeBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  return (
    <div
      className={`glass-card rounded-3xl p-5 sm:p-6 border transition-all flex flex-col justify-between relative group hover:shadow-xl ${
        isActive
          ? 'border-orange-500/80 bg-slate-900/90 shadow-orange-500/5'
          : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
      }`}
    >
      {isActive && (
        <div className="absolute -top-3 right-5 bg-orange-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md">
          Active Timeline
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeBadgeColor}`}
              >
                {goal.type} Goal
              </span>
            </div>
            <h4 className="text-base font-black text-white mt-1 leading-tight">{goal.target}</h4>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {goal.startDate} – {goal.deadline}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Edit Goal Dates"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Delete Goal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="py-4 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-400">
              {stats.completed} / {stats.total} Ch
            </span>
            <span className="text-white font-mono">{stats.percentage}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isBehind
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                  : 'bg-gradient-to-r from-blue-500 to-emerald-500'
              }`}
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* Velocity Grid */}
        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              Velocity
            </span>
            <span className="text-xs font-black text-white font-mono">
              {stats.curPace} <span className="text-[8px] text-slate-400">Ch/D</span>
            </span>
          </div>

          <div
            className={`p-2 rounded-xl border ${
              isBehind
                ? 'bg-rose-950/20 border-rose-900/40 text-rose-400'
                : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
            }`}
          >
            <span className="block text-[8px] font-black uppercase tracking-widest opacity-80 mb-0.5">
              Required
            </span>
            <span className="text-xs font-black font-mono">
              {stats.reqPace} <span className="text-[8px] opacity-70">Ch/D</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold">
        <span className="text-slate-400">{stats.daysRemaining} Days Left</span>
        {!isActive && (
          <button
            onClick={() => onSetActive(goal.id)}
            className="text-orange-400 hover:text-orange-300 font-black uppercase tracking-wider"
          >
            Set Active
          </button>
        )}
      </div>
    </div>
  );
});
