'use client';

/**
 * X-29 Pace Stats Banner Component (features/pace/components/PaceStatsBanner.tsx)
 * 
 * Top metrics banner displaying:
 * - Baseline timeline information
 * - Required Pace card
 * - Actual Velocity card
 * - Estimated Finish Date forecast card
 */

import React from 'react';
import type { PaceStats, PaceGoal } from '@/types/pace';
import { Gauge, Clock, TrendingUp, Info, Calendar } from 'lucide-react';

interface PaceStatsBannerProps {
  stats: PaceStats;
  activeGoal?: PaceGoal;
}

export const PaceStatsBanner: React.FC<PaceStatsBannerProps> = React.memo(
  function PaceStatsBanner({ stats, activeGoal }) {
    return (
      <div className="w-full space-y-4">
        {/* Baseline Info Card */}
        <div className="flex items-center space-x-3 bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-sm">
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="text-xs sm:text-sm text-slate-300">
            <span className="font-bold text-white">Active Timeline: </span>
            <span className="text-blue-400 font-bold">{activeGoal?.target || 'Global Timeline'}</span>
            <span className="text-slate-400"> • </span>
            <span>
              {activeGoal?.startDate || '2026-01-01'} to {activeGoal?.deadline || '2026-10-31'} (
              {stats.totalDays} Total Days)
            </span>
          </div>
        </div>

        {/* 3 Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* 1. Required Pace */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">
                Target: {activeGoal?.deadline || '2026-10-31'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">Required Pace</h3>
            </div>
            <div className="mt-4 sm:mt-5">
              <div className="text-3xl sm:text-4xl font-black text-blue-400 font-mono">
                {stats.reqPace}{' '}
                <span className="text-xs font-bold text-slate-400">Ch/Day</span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs">
                <span className="text-slate-400 font-medium">To hit deadline</span>
                <span className="text-blue-400 font-black uppercase">
                  {stats.daysRemaining} Days Left
                </span>
              </div>
            </div>
          </div>

          {/* 2. Actual Pace */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Current Performance
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">Actual Pace</h3>
            </div>
            <div className="mt-4 sm:mt-5">
              <div
                className={`text-3xl sm:text-4xl font-black font-mono ${
                  stats.isBehind ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {stats.curPace}{' '}
                <span className="text-xs font-bold text-slate-400">Ch/Day</span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs">
                <span className="text-slate-400 font-medium">Your current speed</span>
                <span className="text-emerald-400 font-black uppercase">
                  {stats.daysElapsed} Days Passed
                </span>
              </div>
            </div>
          </div>

          {/* 3. Trend Forecast */}
          <div className="bg-indigo-950/20 border border-indigo-900/40 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-between hover:border-indigo-800/60 transition-all">
            <div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                Trend Forecast
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">Est. Finish</h3>
            </div>
            <div className="mt-4 sm:mt-5">
              <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
                {stats.projectedFinish}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs">
                <span className="text-slate-400 font-medium">Based on actual pace</span>
                <span className="text-amber-400 font-black uppercase">
                  {stats.daysNeeded > 0 ? `${stats.daysNeeded} Days Needed` : 'On Schedule'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
