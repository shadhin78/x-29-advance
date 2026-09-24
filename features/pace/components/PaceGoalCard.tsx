'use client';

/**
 * X-29 Pace Goal Card (features/pace/components/PaceGoalCard.tsx)
 * 
 * 100% Parity with legacy js/features/pace/paceManager.js renderPaceGoals:
 * - Active Timeline badge (#active-timeline-badge)
 * - 4 action buttons on hover:
 *   1. Pace Trend Chart (openPaceTrendModal)
 *   2. Target Breakdown Details (openGoalDetailsModal)
 *   3. Edit Goal Dates (openEditPaceModal)
 *   4. Remove Goal (requestDeletePaceGoal)
 * - Dot color based on goal type (program -> violet, bundle -> orange, global -> blue, subject -> indigo)
 * - Timeline dates, subtitle items, progress bar with conditional gradient
 * - Velocity & Required stat boxes
 * - Footer: countdown status & Est. finish
 */

import React from 'react';
import type { PaceGoal, PaceStats } from '@/types/pace';
import { formatDateResponsive } from '@/features/pace/services/paceEngine';

interface PaceGoalCardProps {
  goal: PaceGoal;
  stats: PaceStats;
  isActive: boolean;
  onSetActive: (id: string) => void;
  onOpenTrend: (goal: PaceGoal) => void;
  onOpenDetails: (goal: PaceGoal) => void;
  onEdit: (goal: PaceGoal) => void;
  onDelete: (id: string) => void;
}

export const PaceGoalCard: React.FC<PaceGoalCardProps> = React.memo(function PaceGoalCard({
  goal,
  stats,
  isActive,
  onSetActive,
  onOpenTrend,
  onOpenDetails,
  onEdit,
  onDelete,
}) {
  const isBehind = stats.isBehind;
  const reqColor = isBehind ? 'text-red-500' : 'text-emerald-500';
  const reqBg = isBehind
    ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'
    : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';

  let goalColorClass = 'bg-indigo-500';
  if (goal.type === 'program') goalColorClass = 'bg-violet-500';
  if (goal.type === 'bundle') goalColorClass = 'bg-orange-500';
  if (goal.type === 'global') goalColorClass = 'bg-blue-500';

  let subText: React.ReactNode = null;
  if (goal.type === 'bundle') {
    if (goal.subjects && goal.subjects.length > 0) {
      subText = (
        <div
          className="text-[8px] font-bold text-slate-500 dark:text-slate-400 mt-1 line-clamp-1"
          title={goal.subjects.join(', ')}
        >
          {goal.subjects.join(', ')}
        </div>
      );
    } else if (goal.programs && goal.programs.length > 0) {
      subText = (
        <div
          className="text-[8px] font-bold text-violet-500 dark:text-violet-400 mt-1 line-clamp-1"
          title={goal.programs.join(', ')}
        >
          {goal.programs.join(', ')}
        </div>
      );
    }
  } else if (goal.type === 'global') {
    const isManual = Boolean(goal.subjects?.length || goal.secondaryPaces?.length);
    subText = isManual ? (
      <div className="text-[8px] font-bold text-blue-500 dark:text-blue-400 mt-1 line-clamp-1">
        Manual Global Target
      </div>
    ) : (
      <div className="text-[8px] font-bold text-blue-500 dark:text-blue-400 mt-1 line-clamp-1">
        Aggregates explicitly targeted subjects
      </div>
    );
  }

  const startDateFormatted = formatDateResponsive(goal.startDate);
  const targetDateFormatted = formatDateResponsive(goal.deadline);

  return (
    <div
      onClick={() => {
        if (!isActive) onSetActive(goal.id);
      }}
      className={`bg-white dark:bg-slate-800 p-4 md:p-5 rounded-[1.25rem] border ${
        isActive
          ? 'border-orange-500 shadow-md scale-[1.02]'
          : 'border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer'
      } relative group hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between`}
    >
      {/* Active Timeline Badge */}
      {isActive && (
        <div
          id="active-timeline-badge"
          className="absolute -top-2.5 right-4 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm z-10"
        >
          Active Timeline
        </div>
      )}

      {/* Hover Action Buttons */}
      <div className="absolute top-3.5 right-3.5 flex space-x-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenTrend(goal);
          }}
          className="text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
          title="View Pace Trend Chart"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(goal);
          }}
          className="text-slate-400 hover:text-emerald-500 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
          title="View Target Details"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(goal);
          }}
          className="text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
          title="Edit Goal Dates"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(goal.id);
          }}
          className="text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
          title="Remove Goal"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Goal Header */}
      <div className="mb-3 pr-24">
        <div className="flex items-center space-x-1.5 mb-1">
          <div className={`w-1.5 h-1.5 rounded-full ${goalColorClass}`} />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
            {goal.type} Goal
          </span>
        </div>
        <h4 className="font-black text-sm md:text-base text-slate-800 dark:text-slate-100 truncate tracking-tight">
          {goal.target}
        </h4>
        <p className="text-[9px] font-bold text-slate-500 tracking-wider mt-0.5">
          Timeline:{' '}
          <span className="text-indigo-500 dark:text-indigo-400">{startDateFormatted}</span> -{' '}
          <span className="text-orange-500">{targetDateFormatted}</span>
        </p>
        {subText}
      </div>

      {/* Progress & Metrics */}
      <div>
        <div className="flex justify-between items-end mb-1">
          <span className="text-[9px] font-bold text-slate-400">
            {Math.round(stats.completed)} / {stats.total} Ch
          </span>
          <span className="text-[9px] font-black text-slate-500">{stats.percentage}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-600/50 mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBehind
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
            }`}
            style={{ width: `${stats.percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30">
            <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              Velocity
            </span>
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
              {stats.curPace.toFixed(2)}{' '}
              <span className="text-[7px] text-slate-400 font-bold">Ch/Day</span>
            </span>
          </div>
          <div className="p-2 rounded-xl border ${reqBg}">
            <span className={`block text-[8px] font-black uppercase tracking-widest ${reqColor} opacity-70 mb-0.5`}>
              Required
            </span>
            <span className={`text-[11px] font-black ${reqColor}`}>
              {stats.reqPace.toFixed(2)}{' '}
              <span className="text-[7px] font-bold">Ch/Day</span>
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[9px] font-bold">
          <span className="text-slate-400">{stats.timeGoalCountdownStr || `${stats.daysRemaining} Days Left`}</span>
          <span className="text-slate-500 dark:text-slate-300">
            Est: {stats.finishDisplay || stats.projectedFinish}
          </span>
        </div>
      </div>
    </div>
  );
});
