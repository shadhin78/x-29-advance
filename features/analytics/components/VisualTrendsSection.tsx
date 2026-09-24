'use client';

import React from 'react';
import type { TrendTimeFilter } from '@/types/analytics';
import type { DailyHabit } from '@/types/habits';
import type { PaceGoal, PaceStats } from '@/types/pace';
import type { PaceTrendChartData } from '@/features/pace/services/paceEngine';

interface VisualTrendsSectionProps {
  trendTimeframe: TrendTimeFilter;
  setTrendTimeframe: (tf: TrendTimeFilter) => void;
  programTrends: {
    programs: { name: string; color: string; values: number[] }[];
  };
  dailyActionsData: {
    monthName: string;
    dailyCounts: number[];
    habitsBreakdown: { name: string; color: string; count: number }[];
    successRate: number;
    totalFulfilled: number;
  };
  habits: DailyHabit[];
  activePaceGoal: PaceGoal | null;
  activePaceStats: PaceStats | null;
  activePaceChart: PaceTrendChartData | null;
  globalPaceStats: { stats: PaceStats; chart: PaceTrendChartData };
  onOpenSubjectTrend: () => void;
  onOpenYearlyActions: () => void;
}

export const VisualTrendsSection: React.FC<VisualTrendsSectionProps> = ({
  trendTimeframe,
  setTrendTimeframe,
  programTrends,
  dailyActionsData,
  habits,
  activePaceGoal,
  activePaceStats,
  activePaceChart,
  globalPaceStats,
  onOpenSubjectTrend,
  onOpenYearlyActions,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-3 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-4 mb-6 border-b border-slate-100 dark:border-slate-700 gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
            Visual Analysis
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Interactive trends visualization and tracking metrics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Time Range:
          </span>
          <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl shadow-inner border border-slate-200/60 dark:border-slate-700/50">
            {(['1Y', '2Y', '3Y', 'ALL'] as TrendTimeFilter[]).map((tf) => (
              <button
                key={tf}
                id={`tf-${tf}`}
                type="button"
                onClick={() => setTrendTimeframe(tf)}
                className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-black rounded-lg transition-all ${
                  trendTimeframe === tf
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {tf === 'ALL' ? 'Life Time' : tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Program Completion & Daily Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
        {/* Program Completion Trend Card */}
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900/30 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden min-w-0">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                Program Completion Trend
              </h4>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                Cumulative progress percentages over time
              </p>
            </div>
            <button
              id="btn-open-subject-trend"
              data-subject-trend-open
              type="button"
              onClick={onOpenSubjectTrend}
              className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Subject View
            </button>
          </div>

          {/* Declarative SVG Chart */}
          <div
            id="mainChartPrograms"
            className="relative h-[200px] md:h-[280px] mt-auto w-full min-w-0 flex items-end justify-between p-2"
          >
            {programTrends.programs.length > 0 ? (
              <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = 220 - (val / 100) * 200;
                  return (
                    <g key={val}>
                      <line
                        x1="30"
                        y1={y}
                        x2="490"
                        y2={y}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-slate-800 stroke-[1]"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="25"
                        y={y + 3}
                        textAnchor="end"
                        className="text-[8px] fill-slate-400"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Program Trajectory Lines */}
                {programTrends.programs.map((prog, pIdx) => {
                  const numPts = prog.values.length;
                  if (numPts <= 1) return null;
                  const stepX = (490 - 40) / (numPts - 1);
                  const pointsStr = prog.values
                    .map((v: number, i: number) => `${40 + i * stepX},${220 - (Math.min(100, v) / 100) * 200}`)
                    .join(' ');

                  return (
                    <g key={pIdx}>
                      <polyline
                        fill="none"
                        stroke={prog.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={pointsStr}
                      />
                      {prog.values.map((v: number, i: number) => (
                        <circle
                          key={i}
                          cx={40 + i * stepX}
                          cy={220 - (Math.min(100, v) / 100) * 200}
                          r="3"
                          fill={prog.color}
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                No Program Curriculum Data
              </div>
            )}
          </div>

          <div className="mt-4 md:mt-6 flex flex-col gap-3">
            <div id="prog-legend" className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3">
              {programTrends.programs.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-700 dark:text-slate-300">{p.name}</span>
                </div>
              ))}
            </div>
            <div id="prog-comment" className="text-[9px] text-slate-400 dark:text-slate-500 font-medium text-center">
              Track completion progress accumulated by monthly milestone.
            </div>
          </div>
        </div>

        {/* Daily Actions (Month) Card */}
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900/30 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden min-w-0">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="space-y-0.5">
              <h4
                id="daily-actions-month-title"
                className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest"
              >
                Daily Actions ({dailyActionsData.monthName})
              </h4>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                Daily habits tracking and success rate
              </p>
            </div>
            <button
              id="btn-open-yearly-actions"
              data-yearly-actions-open
              type="button"
              onClick={onOpenYearlyActions}
              className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Year View
            </button>
          </div>

          {/* Declarative SVG Bar Chart */}
          <div
            id="monthlyActionsChart"
            className="relative h-[200px] md:h-[280px] mt-auto w-full min-w-0 flex items-end gap-1 p-2"
          >
            {dailyActionsData.dailyCounts.map((count, dIdx) => {
              const maxVal = Math.max(1, habits.length);
              const heightPct = Math.min(100, (count / maxVal) * 100);

              return (
                <div
                  key={dIdx}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      count >= maxVal
                        ? 'bg-emerald-500 group-hover:bg-emerald-400'
                        : count > 0
                        ? 'bg-indigo-500 group-hover:bg-indigo-400'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  />
                  <title>{`Day ${dIdx + 1}: ${count} habits done`}</title>
                  <span className="text-[7px] text-slate-400 mt-1 truncate">
                    {dIdx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 md:mt-6 flex flex-col gap-3">
            <div id="act-legend" className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3">
              {dailyActionsData.habitsBreakdown.map((h, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color }} />
                  <span className="text-slate-700 dark:text-slate-300">
                    {h.name} ({h.count}d)
                  </span>
                </div>
              ))}
            </div>
            <div
              id="daily-actions-msg-bar"
              className="mt-1 text-[9px] font-bold text-center text-emerald-600 dark:text-emerald-400"
            >
              Month Success Rate: {dailyActionsData.successRate}% ({dailyActionsData.totalFulfilled} total fulfillments)
            </div>
            <div id="act-comment" className="text-[9px] text-slate-400 dark:text-slate-500 font-medium text-center">
              Calculated across all registered daily habits in active tracking.
            </div>
          </div>
        </div>
      </div>

      {/* Pacing Trend Charts (X Bar Active Goal & Global Scope Burn-up) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* X Bar Pacing Trend */}
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900/30 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
            <div className="space-y-0.5">
              <h4
                id="spectra-pace-title"
                className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest"
              >
                {activePaceGoal ? `${activePaceGoal.target} Pacing Trend (X Bar)` : 'Active Goal Pacing Trend (X Bar)'}
              </h4>
              <p
                id="spectra-pace-desc"
                className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold"
              >
                Burn-up comparison of Required vs Actual trajectories for active goal
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500">
              <div>
                Req Pace:{' '}
                <span id="spectra-pace-req" className="font-black text-emerald-500">
                  {activePaceStats ? `${activePaceStats.reqPace} Ch/Day` : '--'}
                </span>
              </div>
              <div className="hidden sm:block w-px h-3 bg-slate-200 dark:bg-slate-700" />
              <div>
                Actual Pace:{' '}
                <span id="spectra-pace-act" className="font-black text-indigo-500">
                  {activePaceStats ? `${activePaceStats.curPace} Ch/Day` : '--'}
                </span>
              </div>
              <div className="hidden sm:block w-px h-3 bg-slate-200 dark:bg-slate-700" />
              <div>
                Est Finish:{' '}
                <span id="spectra-pace-finish" className="font-black text-orange-500">
                  {activePaceStats ? activePaceStats.projectedFinish : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Declarative SVG Burn-up Chart */}
          <div
            id="spectraPaceTrendCanvas"
            className="relative h-[200px] md:h-[280px] w-full min-w-0 p-2"
          >
            {activePaceChart ? (
              <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = 220 - (val / 100) * 200;
                  return (
                    <line
                      key={val}
                      x1="30"
                      y1={y}
                      x2="490"
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800 stroke-[1]"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Required Trajectory (Emerald Dashed) */}
                {(() => {
                  const pts = activePaceChart.reqTrajectory;
                  const stepX = (490 - 40) / Math.max(1, pts.length - 1);
                  const total = activePaceStats?.total || 1;
                  const pointsStr = pts
                    .map((v: number, i: number) => `${40 + i * stepX},${220 - (Math.min(total, v) / total) * 200}`)
                    .join(' ');
                  return (
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="5 5"
                      points={pointsStr}
                    />
                  );
                })()}

                {/* Actual Trajectory (Indigo Solid) */}
                {(() => {
                  const pts = activePaceChart.actTrajectory.filter((v: number | null): v is number => v !== null);
                  if (pts.length <= 1) return null;
                  const stepX = (490 - 40) / Math.max(1, activePaceChart.actTrajectory.length - 1);
                  const total = activePaceStats?.total || 1;
                  const pointsStr = pts
                    .map((v: number, i: number) => `${40 + i * stepX},${220 - (Math.min(total, v) / total) * 200}`)
                    .join(' ');
                  return (
                    <polyline
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeLinecap="round"
                      points={pointsStr}
                    />
                  );
                })()}
              </svg>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                No Active Pace Goal Configured
              </div>
            )}
          </div>
        </div>

        {/* Global Scope Trend */}
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900/30 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
            <div className="space-y-0.5">
              <h4
                id="global-pace-title"
                className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest"
              >
                Global Scope Trend
              </h4>
              <p
                id="global-pace-desc"
                className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold"
              >
                Burn-up comparison of Required vs Actual trajectories for global scope
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500">
              <div>
                Req Pace:{' '}
                <span id="global-pace-req" className="font-black text-emerald-500">
                  {globalPaceStats.stats.reqPace} Ch/Day
                </span>
              </div>
              <div className="hidden sm:block w-px h-3 bg-slate-200 dark:bg-slate-700" />
              <div>
                Actual Pace:{' '}
                <span id="global-pace-act" className="font-black text-indigo-500">
                  {globalPaceStats.stats.curPace} Ch/Day
                </span>
              </div>
              <div className="hidden sm:block w-px h-3 bg-slate-200 dark:bg-slate-700" />
              <div>
                Est Finish:{' '}
                <span id="global-pace-finish" className="font-black text-orange-500">
                  {globalPaceStats.stats.projectedFinish}
                </span>
              </div>
            </div>
          </div>

          {/* Declarative SVG Burn-up Chart */}
          <div
            id="globalPaceTrendCanvas"
            className="relative h-[200px] md:h-[280px] w-full min-w-0 p-2"
          >
            <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = 220 - (val / 100) * 200;
                return (
                  <line
                    key={val}
                    x1="30"
                    y1={y}
                    x2="490"
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800 stroke-[1]"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Required Trajectory (Emerald Dashed) */}
              {(() => {
                const pts = globalPaceStats.chart.reqTrajectory;
                const stepX = (490 - 40) / Math.max(1, pts.length - 1);
                const total = globalPaceStats.stats.total || 1;
                const pointsStr = pts
                  .map((v: number, i: number) => `${40 + i * stepX},${220 - (Math.min(total, v) / total) * 200}`)
                  .join(' ');
                return (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    points={pointsStr}
                  />
                );
              })()}

              {/* Actual Trajectory (Indigo Solid) */}
              {(() => {
                const pts = globalPaceStats.chart.actTrajectory.filter((v: number | null): v is number => v !== null);
                if (pts.length <= 1) return null;
                const stepX = (490 - 40) / Math.max(1, globalPaceStats.chart.actTrajectory.length - 1);
                const total = globalPaceStats.stats.total || 1;
                const pointsStr = pts
                  .map((v: number, i: number) => `${40 + i * stepX},${220 - (Math.min(total, v) / total) * 200}`)
                  .join(' ');
                return (
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    points={pointsStr}
                  />
                );
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
