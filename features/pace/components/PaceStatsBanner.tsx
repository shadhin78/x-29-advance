'use client';

/**
 * X-29 Pace Stats Banner Component (features/pace/components/PaceStatsBanner.tsx)
 * 
 * 100% Parity with pages/Pace Management/Pace Management.html lines 1-86:
 * - Baseline timeline information banner (#pace-timeline-info)
 * - Required Pace card (#target-req-pace, #target-status-label, #global-days-left)
 * - Actual Velocity card (#current-pace-stat, #global-days-passed)
 * - Estimated Finish Date forecast card (#projected-finish, #global-days-needed)
 * - Button #btn-open-pace-trend-modal triggering Burn-up analytics modal
 */

import React from 'react';
import type { PaceStats, PaceGoal } from '@/types/pace';
import { formatDateResponsive } from '@/features/pace/services/paceEngine';

interface PaceStatsBannerProps {
  stats: PaceStats;
  activeGoal?: PaceGoal;
  onOpenTrendModal?: () => void;
}

export const PaceStatsBanner: React.FC<PaceStatsBannerProps> = React.memo(
  function PaceStatsBanner({ stats, activeGoal, onOpenTrendModal }) {
    const formattedDeadline = activeGoal?.deadline
      ? formatDateResponsive(activeGoal.deadline)
      : 'Oct 31';

    const deadlineShort = activeGoal?.deadline
      ? new Date(activeGoal.deadline).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
      : 'Oct 31';

    return (
      <div id="pace-stats-section" className="w-full space-y-6">
        {/* Global Baseline Info Card */}
        <div className="flex items-center space-x-2 md:space-x-3 bg-slate-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-700 shadow-lg">
          <svg
            className="w-5 h-5 md:w-6 md:h-6 text-blue-500 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div id="pace-timeline-info" className="text-xs sm:text-sm text-slate-300">
            <span className="font-bold text-white">Active Timeline: </span>
            <span className="text-blue-400 font-bold">{activeGoal?.target || 'Global Academic Goal'}</span>
            <span className="text-slate-400"> • </span>
            <span>
              {formatDateResponsive(activeGoal?.startDate || '2026-01-01')} to {formattedDeadline} (
              {stats.totalDays} Total Days)
            </span>
          </div>
        </div>

        {/* Paces Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Card 1: Required Pace */}
          <div className="bg-slate-900 border border-slate-700 p-5 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl md:rounded-[2rem] shadow-xl flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div className="text-white">
              <span
                id="target-status-label"
                className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest drop-shadow-sm"
              >
                Target: {deadlineShort}
              </span>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black mt-1.5 sm:mt-2">
                Required Pace
              </h3>
            </div>
            <div className="mt-4 sm:mt-5 md:mt-6">
              <div
                id="target-req-pace"
                className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-400 drop-shadow-[0_2px_10px_rgba(96,165,250,0.4)]"
              >
                {stats.reqPace.toFixed(2)}{' '}
                <span className="text-xs font-bold text-slate-400 opacity-80">ch/d</span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">
                  To hit deadline
                </span>
                <span
                  id="global-days-left"
                  className="text-[9px] text-blue-400 font-black uppercase tracking-widest"
                >
                  {stats.daysRemaining} Days Left
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Actual Pace */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Current Performance
              </span>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black mt-1.5 sm:mt-2 text-slate-900 dark:text-white">
                Actual Pace
              </h3>
            </div>
            <div className="mt-4 sm:mt-5 md:mt-6">
              <div
                id="current-pace-stat"
                className={`text-2xl sm:text-3xl md:text-4xl font-black ${
                  stats.isBehind ? 'text-amber-500 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                }`}
              >
                {stats.curPace.toFixed(2)}{' '}
                <span className="text-xs font-bold text-slate-400 opacity-80">ch/d</span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">
                  Your current speed
                </span>
                <span
                  id="global-days-passed"
                  className="text-[9px] text-emerald-500 font-black uppercase tracking-widest"
                >
                  {stats.daysElapsed} Days Passed
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Trend Forecast */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-indigo-100 dark:border-indigo-800/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform relative group">
            {onOpenTrendModal && (
              <button
                id="btn-open-pace-trend-modal"
                data-pace-trend-open
                onClick={onOpenTrendModal}
                className="absolute top-4 right-4 p-2.5 bg-indigo-100 dark:bg-indigo-800/60 text-indigo-600 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-all shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:scale-110 active:scale-95"
                title="View Pace Analytics Chart"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </button>
            )}
            <div>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Trend Forecast
              </span>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black mt-1.5 sm:mt-2 text-indigo-950 dark:text-indigo-100">
                Est. Finish
              </h3>
            </div>
            <div className="mt-4 sm:mt-5 md:mt-6">
              <div
                id="projected-finish"
                className="text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400"
              >
                {stats.finishDisplay || stats.projectedFinish}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] text-indigo-400/80 font-bold uppercase tracking-widest block">
                  Based on actual pace
                </span>
                <span
                  id="global-days-needed"
                  className="text-[9px] text-orange-500 font-black uppercase tracking-widest"
                >
                  {stats.estDaysNeededStr || (stats.daysNeeded > 0 ? `${stats.daysNeeded} Days Needed` : 'On Schedule')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
