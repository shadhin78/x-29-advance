'use client';

/**
 * X-29 Pace Trend Analytics Modal (features/pace/components/modals/PaceTrendModal.tsx)
 * 
 * 100% Parity with index.html lines 1265-1342 (#pace-trend-modal):
 * - Header (#ptm-title, #ptm-desc)
 * - 3 Stat boxes:
 *   1. Target Pace (#ptm-req-pace)
 *   2. Actual Pace (#ptm-act-pace)
 *   3. Est. Hit (#ptm-est-finish)
 * - Burn-up trajectory SVG/Canvas chart (Required vs Actual vs Estimated)
 */

import React, { useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { PaceGoal, PaceStats } from '@/types/pace';
import { buildPaceTrendChartData } from '@/features/pace/services/paceEngine';

interface PaceTrendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: PaceGoal | null;
  stats: PaceStats | null;
}

export const PaceTrendModal: React.FC<PaceTrendModalProps> = ({
  open,
  onOpenChange,
  goal,
  stats,
}) => {
  if (!goal || !stats) return null;

  const chartData = useMemo(() => {
    return buildPaceTrendChartData(stats, goal, 12);
  }, [stats, goal]);

  const total = stats.total || 1;
  const height = 280;
  const width = 640;
  const paddingX = 40;
  const paddingY = 30;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  // Build SVG polyline points
  const reqPoints = chartData.reqTrajectory
    .map((val, idx) => {
      const x = paddingX + (idx / (chartData.labels.length - 1)) * plotWidth;
      const y = paddingY + plotHeight - (val / total) * plotHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const actValid = chartData.actTrajectory
    .map((val, idx) => ({ val, idx }))
    .filter((pt): pt is { val: number; idx: number } => pt.val !== null);

  const actPoints = actValid
    .map(({ val, idx }) => {
      const x = paddingX + (idx / (chartData.labels.length - 1)) * plotWidth;
      const y = paddingY + plotHeight - (val / total) * plotHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const estValid = chartData.estTrajectory
    .map((val, idx) => ({ val, idx }))
    .filter((pt): pt is { val: number; idx: number } => pt.val !== null);

  const estPoints = estValid
    .map(({ val, idx }) => {
      const x = paddingX + (idx / (chartData.labels.length - 1)) * plotWidth;
      const y = paddingY + plotHeight - (val / total) * plotHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          id="ptm-backdrop"
          className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 animate-in fade-in duration-200"
        />
        <Dialog.Content
          id="ptm-content"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-slate-800 p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-5xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[95vh] mx-3 sm:mx-4 focus:outline-none animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8 border-b border-slate-100 dark:border-slate-700 pb-3 sm:pb-4 md:pb-6 shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-5">
              <div className="p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-inner shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <Dialog.Title
                  id="ptm-title"
                  className="text-base sm:text-xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight"
                >
                  {goal.target} Trend Analysis
                </Dialog.Title>
                <p id="ptm-desc" className="text-[9px] sm:text-[10px] md:text-sm text-slate-500 font-bold mt-0.5 tracking-wide">
                  Burn-up comparison of Required vs Actual trajectories.
                </p>
              </div>
            </div>
            <Dialog.Close className="p-2 sm:p-2.5 md:p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg sm:rounded-xl md:rounded-2xl hover:rotate-90 transition-transform active:scale-95 shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Dialog.Close>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 md:gap-6 mb-4 sm:mb-6 md:mb-8 shrink-0 text-center">
            {/* Target Pace */}
            <div className="p-2.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl md:rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm flex flex-col justify-center">
              <span className="block text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase mb-0.5 sm:mb-1 text-emerald-600 dark:text-emerald-500 tracking-widest leading-tight">
                Target<br className="block sm:hidden" /> Pace
              </span>
              <div className="text-sm sm:text-xl md:text-4xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 sm:mt-1">
                <span id="ptm-req-pace">{stats.reqPace.toFixed(2)}</span>{' '}
                <span className="text-[8px] sm:text-[10px] md:text-sm opacity-60 font-bold">ch/d</span>
              </div>
            </div>

            {/* Actual Pace */}
            <div className="p-2.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl md:rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm flex flex-col justify-center">
              <span className="block text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase mb-0.5 sm:mb-1 text-indigo-600 dark:text-indigo-500 tracking-widest leading-tight">
                Actual<br className="block sm:hidden" /> Pace
              </span>
              <div className="text-sm sm:text-xl md:text-4xl font-black text-indigo-700 dark:text-indigo-400 mt-0.5 sm:mt-1">
                <span id="ptm-act-pace">{stats.curPace.toFixed(2)}</span>{' '}
                <span className="text-[8px] sm:text-[10px] md:text-sm opacity-60 font-bold">ch/d</span>
              </div>
            </div>

            {/* Est. Hit */}
            <div className="p-2.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl md:rounded-2xl border border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-900/10 shadow-sm flex flex-col justify-center">
              <span className="block text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase mb-0.5 sm:mb-1 text-orange-600 dark:text-orange-500 tracking-widest leading-tight">
                Est.<br className="block sm:hidden" /> Hit
              </span>
              <div
                className="text-[10px] sm:text-sm md:text-xl lg:text-2xl font-black text-orange-700 dark:text-orange-400 mt-0.5 sm:mt-1 px-1 break-words sm:whitespace-nowrap"
                id="ptm-est-finish"
              >
                {stats.finishDisplay || stats.projectedFinish}
              </div>
            </div>
          </div>

          {/* Interactive Trajectory SVG Chart */}
          <div className="h-[280px] sm:h-[350px] md:h-[420px] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-4 md:p-6 flex flex-col flex-1 shadow-inner relative">
            <div className="flex items-center justify-end gap-4 mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500" />
                <span>Required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-indigo-500 rounded" />
                <span>Actual</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500" />
                <span>Estimated</span>
              </span>
            </div>

            <div className="relative flex-1 w-full h-full">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = paddingY + plotHeight * (1 - ratio);
                  return (
                    <line
                      key={ratio}
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.15)"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Required Target Trajectory (dashed emerald) */}
                {reqPoints && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    points={reqPoints}
                  />
                )}

                {/* Estimated Trajectory (dashed amber) */}
                {estPoints && (
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    points={estPoints}
                  />
                )}

                {/* Actual Progression (solid indigo) */}
                {actPoints && (
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3.5"
                    points={actPoints}
                  />
                )}
              </svg>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
