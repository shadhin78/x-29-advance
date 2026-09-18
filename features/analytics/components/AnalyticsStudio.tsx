'use client';

/**
 * X-29 Analytics Studio Component (features/analytics/components/AnalyticsStudio.tsx)
 * 
 * Provides visual intelligence across all domains:
 * - Summary KPI cards (completion %, actions count, streak, days remaining)
 * - Concentric circular chapter progress polar map (Declarative React SVG)
 * - Radial habit radar grid (Declarative React SVG)
 * - GitHub-style daywise focus matrix heatmap with tier stats and day inspector
 * - Focus analytics trend chart comparing focus duration to daily target
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { useTimerStore } from '@/stores/useTimerStore';
import { useTargetStore } from '@/stores/useTargetStore';
import { usePaceStore } from '@/stores/usePaceStore';
import {
  calculateDaysRemaining,
  calculateFocusHeatmap,
  calculatePolarArc,
  calculateChapterMap,
  calculateHabitRadar,
} from '@/features/analytics/services/analyticsService';
import type { FocusHeatmapRange, FocusDayData } from '@/types/analytics';
import type { Track, Program, NormalizedSubject } from '@/types/taxonomy';
import {
  TrendingUp,
  Flame,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from 'lucide-react';

export const AnalyticsStudio: React.FC = () => {
  const { tracks, customPrograms, getNormalizedSubjects, initFromStorage: initTaxonomy } =
    useTaxonomyStore();
  const { tasks, initFromStorage: initTasks } = useTaskStore();
  const { habits, initFromStorage: initHabits } = useDailyActionStore();
  const { timerLogs, initFromStorage: initTimer } = useTimerStore();
  const { dailyTargetsDatabase, initFromStorage: initTargets } = useTargetStore();
  const { paceGoals, initFromStorage: initPace } = usePaceStore();

  useEffect(() => {
    initTaxonomy();
    initTasks();
    initHabits();
    initTimer();
    initTargets();
    initPace();
  }, [initTaxonomy, initTasks, initHabits, initTimer, initTargets, initPace]);

  // 1. Chapter Map Filter State
  const [chapterFilter, setChapterFilter] = useState('global');
  const [hoveredChapter, setHoveredChapter] = useState<{
    subject: string;
    chapterNum: number;
    status: string;
  } | null>(null);

  // 2. Habit Radar Month State
  const [radarDate, setRadarDate] = useState(() => new Date());

  // 3. Heatmap Range State
  const [heatmapRange, setHeatmapRange] = useState<FocusHeatmapRange>(365);
  const [selectedDay, setSelectedDay] = useState<FocusDayData | null>(null);

  // 4. Focus Chart Timeframe State
  const [focusTimeframe, setFocusTimeframe] = useState<7 | 30 | 180>(30);

  const normalizedSubjects = useMemo(() => {
    return getNormalizedSubjects();
  }, [getNormalizedSubjects, tracks]);

  // Computed Chapter Map
  const { chapters: chapterItems, stats: chapterStats } = useMemo(() => {
    return calculateChapterMap(normalizedSubjects, tasks, chapterFilter);
  }, [normalizedSubjects, tasks, chapterFilter]);

  // Computed Habit Radar
  const radarData = useMemo(() => {
    return calculateHabitRadar(habits, radarDate);
  }, [habits, radarDate]);

  // Computed Focus Heatmap
  const { weeks: heatmapWeeks, stats: heatmapStats } = useMemo(() => {
    return calculateFocusHeatmap(timerLogs, heatmapRange);
  }, [timerLogs, heatmapRange]);

  // Global KPI Calculations
  const kpi = useMemo(() => {
    // Total actions logged across habits and targets
    let totalActions = 0;
    habits.forEach((h) => {
      totalActions += Object.keys(h.history || {}).length;
    });
    Object.values(dailyTargetsDatabase).forEach((list) => {
      totalActions += list.filter((t) => t.completed).length;
    });

    // Days remaining on earliest active pace goal or standard deadline
    let minDaysRemaining = 0;
    if (paceGoals.length > 0) {
      const days = paceGoals
        .map((g) => calculateDaysRemaining(g.deadline))
        .filter((d) => d > 0);
      minDaysRemaining = days.length > 0 ? Math.min(...days) : 0;
    }

    return {
      avgCompletion: chapterStats.completionPercentage,
      totalActions,
      activeStreak: heatmapStats.streak,
      daysRemaining: minDaysRemaining || 30,
    };
  }, [chapterStats, habits, dailyTargetsDatabase, paceGoals, heatmapStats]);

  // Focus Trend Chart Data
  const focusChartData = useMemo(() => {
    const list: { dateStr: string; label: string; hours: number; target: number }[] = [];
    const now = new Date();
    const dayMap: Record<string, number> = {};

    timerLogs.forEach((log) => {
      if (!log.date) return;
      const d = new Date(log.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dayMap[key] = (dayMap[key] || 0) + (log.duration || 0);
    });

    for (let i = focusTimeframe - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hours = parseFloat(((dayMap[key] || 0) / 3600).toFixed(2));
      list.push({
        dateStr: key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        hours,
        target: 4.0, // standard baseline target
      });
    }

    const totalFocusHours = list.reduce((acc, curr) => acc + curr.hours, 0);
    const avgFocusHours = list.length > 0 ? parseFloat((totalFocusHours / list.length).toFixed(2)) : 0;
    const peak = list.reduce((max, curr) => (curr.hours > max.hours ? curr : max), {
      dateStr: 'None',
      label: '',
      hours: 0,
      target: 4,
    });
    const successDays = list.filter((l) => l.hours >= l.target).length;
    const successRate = list.length > 0 ? Math.round((successDays / list.length) * 100) : 0;

    return {
      days: list,
      totalFocusHours: parseFloat(totalFocusHours.toFixed(1)),
      avgFocusHours,
      peakHours: peak.hours,
      peakDate: peak.dateStr,
      successRate,
      successDays,
    };
  }, [timerLogs, focusTimeframe]);

  // Polar Concentric Map Geometry
  const polarSvgSegments = useMemo(() => {
    const total = chapterItems.length;
    if (total === 0) return [];

    let numRings = 4;
    if (total <= 45) numRings = 1;
    else if (total <= 90) numRings = 2;
    else if (total <= 180) numRings = 3;
    else if (total <= 280) numRings = 4;
    else numRings = 5;

    const baseInnerRadius = 60;
    const baseOuterRadius = 180;
    const ringThickness = (baseOuterRadius - baseInnerRadius) / numRings;

    const itemsPerRing = Math.ceil(total / numRings);
    const segments: Array<{
      path: string;
      color: string;
      item: (typeof chapterItems)[0];
    }> = [];

    for (let r = 0; r < numRings; r++) {
      const ringStartIdx = r * itemsPerRing;
      const ringEndIdx = Math.min(total, (r + 1) * itemsPerRing);
      const countInRing = ringEndIdx - ringStartIdx;
      if (countInRing <= 0) continue;

      const rInner = baseInnerRadius + r * ringThickness + 2;
      const rOuter = baseInnerRadius + (r + 1) * ringThickness - 2;

      const angleStep = (2 * Math.PI) / countInRing;
      const gap = Math.min(0.04, angleStep * 0.12);

      for (let i = 0; i < countInRing; i++) {
        const item = chapterItems[ringStartIdx + i];
        const theta1 = -Math.PI / 2 + i * angleStep + gap;
        const theta2 = -Math.PI / 2 + (i + 1) * angleStep - gap;

        const path = calculatePolarArc(220, 220, rInner, rOuter, theta1, theta2);

        let color = '#f43f5e'; // incomplete rose
        if (item.status === 'complete') color = '#10b981'; // complete emerald
        if (item.status === 'skip') color = '#64748b'; // skipped slate

        segments.push({ path, color, item });
      }
    }

    return segments;
  }, [chapterItems]);

  // Habit Radar Geometry
  const radarSvgSegments = useMemo(() => {
    const numHabits = radarData.habits.length;
    if (numHabits === 0) return [];

    const cx = 250;
    const cy = 225;
    const rOuter = 190;
    const rInner = 60;
    const ringStep = (rOuter - rInner) / numHabits;
    const startAngleDeg = -90;
    const totalAngleDeg = 270;
    const angleStepDeg = totalAngleDeg / radarData.daysInMonth;

    const segments: Array<{
      path: string;
      color: string;
      habitName: string;
      day: number;
      isFulfilled: boolean;
    }> = [];

    const radialGap = 2;
    const angularGapPx = 2;

    for (let h = 0; h < numHabits; h++) {
      const baseOuterR = rOuter - h * ringStep;
      const baseInnerR = rOuter - (h + 1) * ringStep;

      const cellOuterR = baseOuterR - radialGap / 2;
      const cellInnerR = baseInnerR + radialGap / 2;

      for (let d = 0; d < radarData.daysInMonth; d++) {
        const dayNum = d + 1;
        const a1Base = startAngleDeg + d * angleStepDeg;
        const a2Base = startAngleDeg + (d + 1) * angleStepDeg;

        const angleInsetOuter = (angularGapPx / 2 / cellOuterR) * (180 / Math.PI);
        const angleInsetInner = (angularGapPx / 2 / cellInnerR) * (180 / Math.PI);

        const aOuter1 = ((a1Base + angleInsetOuter) * Math.PI) / 180;
        const aOuter2 = ((a2Base - angleInsetOuter) * Math.PI) / 180;
        const aInner1 = ((a1Base + angleInsetInner) * Math.PI) / 180;
        const aInner2 = ((a2Base - angleInsetInner) * Math.PI) / 180;

        const path = calculatePolarArc(cx, cy, cellInnerR, cellOuterR, aOuter1, aOuter2);
        const isFulfilled = !!(radarData.monthData[String(dayNum)] && radarData.monthData[String(dayNum)][h]);

        const color = isFulfilled ? '#10b981' : '#be123c';

        segments.push({
          path,
          color,
          habitName: radarData.habits[h],
          day: dayNum,
          isFulfilled,
        });
      }
    }

    return segments;
  }, [radarData]);

  // Extract distinct programs across tracks
  const allPrograms = useMemo(() => {
    const list: Array<{ id: string; title: string }> = [];
    Object.entries(customPrograms).forEach(([_trackId, progs]) => {
      progs.forEach((p: Program) => {
        if (!list.some((item) => item.title === p.name)) {
          list.push({ id: p.name, title: p.name });
        }
      });
    });
    return list;
  }, [customPrograms]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* 1. Header with Ambient Glow */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-900 dark:to-slate-800 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-fuchsia-500/10 dark:bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-400/10 rounded-full border border-indigo-400/20">
              Analytical System
            </span>
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-fuchsia-400 bg-fuchsia-400/10 rounded-full border border-fuchsia-400/20">
              Live Sync
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Analytics</h2>
          <p className="text-slate-400 text-xs">
            Comprehensive visual intelligence, track and program completion trends
          </p>
        </div>
      </div>

      {/* 2. Interactive Analytics Summary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Card 1: Avg Completion */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col hover:shadow-md transition-all">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            Avg Completion
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
              {kpi.avgCompletion}%
            </span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpi.avgCompletion)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Logged Actions */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col hover:shadow-md transition-all">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            Logged Actions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
              {kpi.totalActions}
            </span>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wide">Entries</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-3 font-semibold">
            Total tracked action logs across all domains
          </p>
        </div>

        {/* Card 3: Current Streak */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col hover:shadow-md transition-all">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            Active Streak
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-orange-500">
              {kpi.activeStreak} days
            </span>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
          </div>
          <p className="text-[9px] text-slate-400 mt-3 font-semibold">
            Consecutive active focus and habit days
          </p>
        </div>

        {/* Card 4: Days Remaining */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col hover:shadow-md transition-all">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            Days Remaining
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-emerald-500">
              {kpi.daysRemaining}
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Days</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-3 font-semibold">
            Until next targeted goal completion
          </p>
        </div>
      </div>

      {/* 3. Global Chapters Goal Chart (Concentric Polar Arc Map) */}
      <div className="relative bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col max-w-sm space-y-4 w-full">
          {/* Dropdown Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Filter Map View
            </label>
            <select
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
            >
              <option value="global">🌍 Global View (All Curriculum)</option>
              {tracks.map((t: Track) => (
                <option key={t.id} value={`track:${t.id}`}>
                  Track: {t.name}
                </option>
              ))}
              {allPrograms.map((p) => (
                <option key={p.id} value={`program:${p.title}`}>
                  Program: {p.title}
                </option>
              ))}
              {normalizedSubjects.map((s: NormalizedSubject) => (
                <option key={s.id} value={`subject:${s.name}`}>
                  Subject: {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 rounded-full border border-indigo-100 dark:border-indigo-900/50 w-fit block">
              Interactive Polar Map
            </span>
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              Syllabus Chapters Analysis
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Polar segmented visual distribution of all chapters. Hover over segments to view subject
              names, chapter index, and completion statuses.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">
                Complete ({chapterStats.completed})
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300">
                Incomplete ({chapterStats.incomplete})
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded bg-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">
                Skipped ({chapterStats.skipped})
              </span>
            </div>
          </div>
        </div>

        {/* Declarative SVG Concentric Arc Visualization */}
        <div className="relative flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 440 440"
            className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] select-none"
          >
            {polarSvgSegments.map((seg, idx) => (
              <path
                key={idx}
                d={seg.path}
                fill={seg.color}
                className="transition-transform duration-150 hover:opacity-80 cursor-pointer"
                onMouseEnter={() => setHoveredChapter(seg.item)}
                onMouseLeave={() => setHoveredChapter(null)}
              />
            ))}
            {/* Center Hub */}
            <circle cx="220" cy="220" r="52" className="fill-white dark:fill-slate-900 shadow-md" />
            <text
              x="220"
              y="214"
              textAnchor="middle"
              className="text-sm font-black fill-slate-800 dark:fill-white uppercase"
            >
              {chapterStats.completionPercentage}%
            </text>
            <text
              x="220"
              y="230"
              textAnchor="middle"
              className="text-[9px] font-bold fill-slate-400 uppercase tracking-widest"
            >
              Done
            </text>
          </svg>

          {/* Hovered Chapter Tooltip Banner */}
          {hoveredChapter && (
            <div className="mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in">
              <span>{hoveredChapter.subject}</span>
              <span className="text-indigo-400">Ch. {hoveredChapter.chapterNum}</span>
              <span
                className={`uppercase text-[9px] px-1.5 py-0.5 rounded ${
                  hoveredChapter.status === 'complete'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : hoveredChapter.status === 'skip'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {hoveredChapter.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. The X Commitments Habit Radar Chart Card */}
      <div className="relative bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col w-full overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[8.5px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                Habit Radar
              </span>
              <span className="px-2 py-0.5 text-[8.5px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                Daily Consistency
              </span>
            </div>
            <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mt-0.5">
              The X Commitments
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Daily habit tracker & radial habit grid.
            </p>
          </div>

          {/* Month Stepper */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                const prev = new Date(radarDate);
                prev.setMonth(prev.getMonth() - 1);
                setRadarDate(prev);
              }}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-slate-800 dark:text-slate-100 min-w-[120px] text-center uppercase tracking-wider">
              {radarData.monthName} {radarData.year}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = new Date(radarDate);
                next.setMonth(next.getMonth() + 1);
                setRadarDate(next);
              }}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Habit Radar Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Vertical Stat Cards */}
          <div className="w-full lg:w-56 grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-col gap-2.5">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Monthly Completion
              </span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {radarData.pct}%
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Total Fulfilled
              </span>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                {radarData.fulfilledCount} / {radarData.totalCells}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Active Streak
              </span>
              <div className="text-lg font-black text-amber-500 mt-0.5">
                {radarData.streak} Days 🔥
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Days Logged
              </span>
              <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">
                {radarData.daysLogged} Days
              </div>
            </div>
          </div>

          {/* SVG Habit Radar */}
          <div className="relative flex-1 flex items-center justify-center min-h-[360px] w-full overflow-x-auto">
            {radarSvgSegments.length > 0 ? (
              <svg viewBox="0 0 500 450" className="w-[340px] sm:w-[420px] select-none">
                {radarSvgSegments.map((seg, idx) => (
                  <path
                    key={idx}
                    d={seg.path}
                    fill={seg.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <title>{`${seg.habitName} - Day ${seg.day}: ${seg.isFulfilled ? 'Completed' : 'Missed'}`}</title>
                  </path>
                ))}
                {/* Center Badge */}
                <circle cx="250" cy="225" r="46" className="fill-white dark:fill-slate-900 shadow-md" />
                <text
                  x="250"
                  y="220"
                  textAnchor="middle"
                  className="text-xs font-black fill-slate-800 dark:fill-white uppercase"
                >
                  {radarData.pct}%
                </text>
                <text
                  x="250"
                  y="235"
                  textAnchor="middle"
                  className="text-[8px] font-bold fill-slate-400 uppercase tracking-widest"
                >
                  Radar
                </text>
              </svg>
            ) : (
              <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-bold">No active habits configured for radar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Focus Matrix GitHub Box Heatmap */}
      <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-5 border-b border-slate-100 dark:border-slate-700 gap-4">
          <div className="space-y-0.5">
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
              Focus Matrix Heatmap
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                GitHub Style
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Daywise focus intensity distribution & achievement tiers
            </p>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
            {([30, 90, 180, 365] as FocusHeatmapRange[]).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setHeatmapRange(days)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  heatmapRange === days
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {days === 30 ? '1M' : days === 90 ? '3M' : days === 180 ? '6M' : '1Y'}
              </button>
            ))}
          </div>
        </div>

        {/* 8 Summary Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Active Days
            </span>
            <div className="text-base font-black text-slate-800 dark:text-white mt-0.5">
              {heatmapStats.activeDays}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Streak
            </span>
            <div className="text-base font-black text-orange-500 mt-0.5">
              {heatmapStats.streak}d 🔥
            </div>
          </div>
          <div className="bg-rose-50/40 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-200/40 dark:border-rose-900/30 text-center">
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">0h (✕)</span>
            <div className="text-base font-black text-rose-500 mt-0.5">{heatmapStats.zeroCount}</div>
          </div>
          <div className="bg-rose-100/50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-300/40 dark:border-rose-800/50 text-center">
            <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
              0-2h (⭕)
            </span>
            <div className="text-base font-black text-rose-700 dark:text-rose-300 mt-0.5">
              {heatmapStats.redCount}
            </div>
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-200/40 dark:border-blue-900/40 text-center">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">2-4h (Blue)</span>
            <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {heatmapStats.blueCount}
            </div>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/40 dark:border-emerald-900/40 text-center">
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              &gt; 4h (Green)
            </span>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {heatmapStats.greenCount}
            </div>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/40 dark:border-amber-900/40 text-center">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
              ≥ 6h (Gold)
            </span>
            <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {heatmapStats.goldCount}
            </div>
          </div>
          <div className="bg-purple-50/50 dark:bg-fuchsia-950/20 p-2.5 rounded-xl border border-purple-200/40 dark:border-fuchsia-900/40 text-center">
            <span className="text-[9px] font-black text-fuchsia-600 uppercase tracking-widest">
              ≥ 8h (Gem)
            </span>
            <div className="text-base font-black text-fuchsia-600 dark:text-fuchsia-400 mt-0.5">
              {heatmapStats.gemCount}
            </div>
          </div>
        </div>

        {/* GitHub Box Matrix */}
        <div className="w-full overflow-x-auto pb-3 pt-1">
          <div className="flex gap-1.5 min-w-[760px]">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dIdx) => {
                  let bgClass = 'bg-rose-500/20 border-rose-300/40 dark:bg-rose-950/30';
                  if (day.tier === 'rose') bgClass = 'bg-rose-600 border-rose-500 text-white';
                  if (day.tier === 'blue') bgClass = 'bg-blue-500 border-blue-400 text-white';
                  if (day.tier === 'green') bgClass = 'bg-emerald-500 border-emerald-400 text-white';
                  if (day.tier === 'gold') bgClass = 'bg-amber-400 border-amber-300 text-slate-900';
                  if (day.tier === 'diamond')
                    bgClass = 'bg-gradient-to-tr from-cyan-400 via-sky-300 to-indigo-500 border-cyan-300 text-white';

                  return (
                    <button
                      key={dIdx}
                      type="button"
                      disabled={day.isFuture}
                      onClick={() => setSelectedDay(day)}
                      title={`${day.dateKey}: ${day.hours}h focus`}
                      className={`w-3.5 h-3.5 rounded border transition-transform hover:scale-125 cursor-pointer ${bgClass} ${
                        day.isFuture ? 'opacity-20 cursor-not-allowed' : ''
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Day Detail Inspector Card */}
        {selectedDay && (
          <div className="mt-4 p-4 bg-indigo-50/60 dark:bg-slate-900/80 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                  {selectedDay.dateKey}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  ({selectedDay.hours}h Focus Time)
                </span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                  {selectedDay.tier} tier
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Subjects worked:{' '}
                {selectedDay.subjects && selectedDay.subjects.length > 0
                  ? selectedDay.subjects.join(', ')
                  : 'General Focus Session'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 6. Focus Analytics Bar Comparison Card */}
      <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-5 border-b border-slate-100 dark:border-slate-700 gap-4">
          <div className="space-y-0.5">
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
              Focus Analytics Comparison
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Daywise focus hours compared to daily 4h benchmark
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
            {([7, 30, 180] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setFocusTimeframe(days)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  focusTimeframe === days
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {days === 7 ? '7 Days' : days === 30 ? '30 Days' : '6 Months'}
              </button>
            ))}
          </div>
        </div>

        {/* Declarative SVG Trend Chart */}
        <div className="w-full h-56 relative bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200/40 dark:border-slate-800/40 flex items-end gap-1 overflow-x-auto">
          {focusChartData.days.map((d, idx) => {
            const heightPct = Math.min(100, (d.hours / 8.0) * 100);
            return (
              <div
                key={idx}
                className="flex-1 min-w-[12px] flex flex-col items-center justify-end h-full group relative"
              >
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    d.hours >= d.target
                      ? 'bg-emerald-500 group-hover:bg-emerald-400'
                      : d.hours > 0
                      ? 'bg-indigo-500 group-hover:bg-indigo-400'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  style={{ height: `${Math.max(4, heightPct)}%` }}
                />
                <title>{`${d.dateStr}: ${d.hours}h`}</title>
              </div>
            );
          })}
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Total Focus
            </span>
            <div className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              {focusChartData.totalFocusHours}h
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Average Focus
            </span>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {focusChartData.avgFocusHours}h / day
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Peak Day
            </span>
            <div className="text-base font-black text-rose-500 mt-0.5">
              {focusChartData.peakHours}h
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Success Rate (≥4h)
            </span>
            <div className="text-base font-black text-amber-500 mt-0.5">
              {focusChartData.successRate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
