'use client';

/**
 * X-29 Analytics Studio Component (features/analytics/components/AnalyticsStudio.tsx)
 * 
 * Master Visual Intelligence Hub providing:
 * 1. Global KPI Summary Badges (Avg Completion, Actions, Streak, Days Remaining)
 * 2. Concentric Circular Chapter Progress Polar Map (Declarative React SVG with Cascading Filters)
 * 3. The X Commitments Radial Habit Radar Grid (Declarative React SVG with Left-Side Leader Lines & Live Toggle)
 * 4. Embedded Focus Analytics Section (1D/7D/30D/6M, Day Stepper, Daily/Weekly/Monthly Grouping, Combo/Bar/Line)
 * 5. GitHub-style Focus Matrix Heatmap (8 Stat Badges, 30D/90D/180D/365D, Interactive Day Inspector)
 * 6. Visual Analysis Trends (1Y/2Y/3Y/Life Time):
 *    - Program Completion Trend Line Chart
 *    - Daily Actions Month Trend Chart
 *    - Active Goal Pacing Trend (X Bar Burn-up Chart)
 *    - Global Scope Trend (Burn-up Chart)
 * 7. Subject Trend & Yearly Actions Drill-down Modals
 * 
 * 100% Visual and Behavioral Parity with legacy pages/Analytics/* and spectra.js.
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
  calculateFocusAnalyticsMetrics,
  calculateProgramTrends,
  calculateDailyActionMonthlyTrends,
} from '@/features/analytics/services/analyticsService';
import {
  calculatePaceStats,
  resolveTargetedSubjects,
  buildPaceTrendChartData,
} from '@/features/pace/services/paceEngine';
import type {
  FocusHeatmapRange,
  FocusDayData,
  TrendTimeFilter,
} from '@/types/analytics';
import type { Track, Program, NormalizedSubject } from '@/types/taxonomy';
import {
  TrendingUp,
  Flame,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Clock,
  Calendar,
  X,
  Target,
  BarChart2,
} from 'lucide-react';

export const AnalyticsStudio: React.FC = () => {
  const { tracks, customPrograms, getNormalizedSubjects, initFromStorage: initTaxonomy } =
    useTaxonomyStore();
  const { tasks, initFromStorage: initTasks } = useTaskStore();
  const { habits, toggleHabit, initFromStorage: initHabits } = useDailyActionStore();
  const {
    timerLogs,
    dailyFocusHoursTarget,
    setDailyFocusHoursTarget,
    initFromStorage: initTimer,
  } = useTimerStore();
  const { dailyTargetsDatabase, initFromStorage: initTargets } = useTargetStore();
  const { paceGoals, activeGoalId, initFromStorage: initPace } = usePaceStore();

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
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [hoveredChapter, setHoveredChapter] = useState<{
    subject: string;
    chapterNum: number;
    status: string;
  } | null>(null);

  // 2. Habit Radar Month State
  const [radarDate, setRadarDate] = useState(() => new Date());
  const [radarTooltip, setRadarTooltip] = useState<{
    x: number;
    y: number;
    habitName: string;
    dayNum: number;
    dateStr: string;
    isCompleted: boolean;
  } | null>(null);

  // 3. Heatmap Range State
  const [heatmapRange, setHeatmapRange] = useState<FocusHeatmapRange>(365);
  const [selectedDay, setSelectedDay] = useState<FocusDayData | null>(null);

  // 4. Focus Analytics Controls State
  const [focusTimeframe, setFocusTimeframe] = useState<1 | 7 | 30 | 180>(30);
  const [focusDayOffset, setFocusDayOffset] = useState<number>(0);
  const [focusGrouping, setFocusGrouping] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [focusChartStyle, setFocusChartStyle] = useState<'combo' | 'bar' | 'line'>('combo');
  const [localTargetInput, setLocalTargetInput] = useState<number>(() => dailyFocusHoursTarget || 4.0);

  // Sync target input when store loads
  useEffect(() => {
    if (dailyFocusHoursTarget && dailyFocusHoursTarget > 0) {
      setLocalTargetInput(dailyFocusHoursTarget);
    }
  }, [dailyFocusHoursTarget]);

  // 5. Visual Analysis Trends State
  const [trendTimeframe, setTrendTimeframe] = useState<TrendTimeFilter>('ALL');
  const [isSubjectTrendModalOpen, setIsSubjectTrendModalOpen] = useState(false);
  const [isYearlyActionsModalOpen, setIsYearlyActionsModalOpen] = useState(false);

  const normalizedSubjects = useMemo(() => {
    return getNormalizedSubjects();
  }, [getNormalizedSubjects, tracks]);

  // Distinct programs
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
    let totalActions = 0;
    habits.forEach((h) => {
      totalActions += Object.keys(h.history || {}).length;
    });
    Object.values(dailyTargetsDatabase).forEach((list) => {
      totalActions += list.filter((t) => t.completed).length;
    });

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

  // Focus Analytics Chart Data
  const focusAnalytics = useMemo(() => {
    return calculateFocusAnalyticsMetrics(
      timerLogs,
      focusTimeframe,
      focusGrouping,
      localTargetInput,
      focusDayOffset
    );
  }, [timerLogs, focusTimeframe, focusGrouping, localTargetInput, focusDayOffset]);

  // Program Completion Trend Data
  const programTrends = useMemo(() => {
    return calculateProgramTrends(
      tasks,
      normalizedSubjects,
      customPrograms,
      tracks,
      trendTimeframe
    );
  }, [tasks, normalizedSubjects, customPrograms, tracks, trendTimeframe]);

  // Daily Actions Monthly Trend Data
  const dailyActionsData = useMemo(() => {
    return calculateDailyActionMonthlyTrends(habits, trendTimeframe);
  }, [habits, trendTimeframe]);

  // Active Pace Goal Trend Data (X Bar)
  const activePaceGoal = useMemo(() => {
    return paceGoals.find((g) => g.id === activeGoalId) || paceGoals[0] || null;
  }, [paceGoals, activeGoalId]);

  const activePaceStats = useMemo(() => {
    if (!activePaceGoal) return null;
    const targetedSubjects = resolveTargetedSubjects(
      activePaceGoal,
      normalizedSubjects.map((s) => ({ subject: s.name, program: s.program }))
    );
    const subStatsMap: Record<string, { totalChapters: number; completedChapters: number }> = {};
    normalizedSubjects.forEach((s) => {
      const subTasks = tasks.filter((t) => t.subject === s.name);
      subStatsMap[s.name] = {
        totalChapters: s.chaptersCount || 1,
        completedChapters: subTasks.filter((t) => t.completed).length,
      };
    });
    return calculatePaceStats(activePaceGoal, targetedSubjects, subStatsMap);
  }, [activePaceGoal, normalizedSubjects, tasks]);

  const activePaceChart = useMemo(() => {
    if (!activePaceStats || !activePaceGoal) return null;
    return buildPaceTrendChartData(activePaceStats, activePaceGoal);
  }, [activePaceStats, activePaceGoal]);

  // Global Scope Pace Trend Data
  const globalPaceStats = useMemo(() => {
    const dummyGlobalGoal = {
      id: 'global-academic-scope',
      type: 'global' as const,
      target: 'Global Academic Scope',
      startDate: '2026-01-01',
      deadline: '2026-12-31',
    };
    const targetedSubjects = new Set(normalizedSubjects.map((s) => s.name));
    const subStatsMap: Record<string, { totalChapters: number; completedChapters: number }> = {};
    normalizedSubjects.forEach((s) => {
      const subTasks = tasks.filter((t) => t.subject === s.name);
      subStatsMap[s.name] = {
        totalChapters: s.chaptersCount || 1,
        completedChapters: subTasks.filter((t) => t.completed).length,
      };
    });
    const stats = calculatePaceStats(dummyGlobalGoal, targetedSubjects, subStatsMap);
    const chart = buildPaceTrendChartData(stats, dummyGlobalGoal);
    return { stats, chart };
  }, [normalizedSubjects, tasks]);

  // Polar Concentric Map Geometry (viewBox: -250 -250 500 500)
  const polarSvgSegments = useMemo(() => {
    const total = chapterItems.length;
    if (total === 0) return [];

    let numRings = 4;
    if (total <= 45) numRings = 1;
    else if (total <= 90) numRings = 2;
    else if (total <= 180) numRings = 3;
    else if (total <= 280) numRings = 4;
    else numRings = 5;

    const radii: number[] = [];
    if (numRings === 1) {
      radii.push(145);
    } else {
      for (let i = 0; i < numRings; i++) {
        radii.push(96 + i * 30);
      }
    }

    const totalRadiusSum = radii.reduce((a, b) => a + b, 0);
    const distribution: number[] = [];
    let allocated = 0;
    for (let i = 0; i < numRings; i++) {
      let count = Math.round((radii[i] / totalRadiusSum) * total);
      if (i === numRings - 1) {
        count = total - allocated;
      }
      distribution.push(count);
      allocated += count;
    }

    const segments: Array<{
      path: string;
      color: string;
      item: (typeof chapterItems)[0];
    }> = [];

    let currentChapterIdx = 0;
    for (let r = 0; r < numRings; r++) {
      const numSegments = distribution[r];
      if (numSegments <= 0) continue;

      const innerRadius = numRings === 1 ? 130 : 96 + r * 30;
      const outerRadius = numRings === 1 ? 165 : innerRadius + 24;

      const anglePerSegment = (2 * Math.PI) / numSegments;
      const angularGap = Math.min(0.04, anglePerSegment * 0.15);

      for (let segIdx = 0; segIdx < numSegments; segIdx++) {
        if (currentChapterIdx >= chapterItems.length) break;
        const item = chapterItems[currentChapterIdx];

        const thetaStart = -Math.PI / 2 + segIdx * anglePerSegment + angularGap;
        const thetaEnd = -Math.PI / 2 + (segIdx + 1) * anglePerSegment - angularGap;

        const path = calculatePolarArc(0, 0, innerRadius, outerRadius, thetaStart, thetaEnd);

        let color = '#f43f5e'; // incomplete rose
        if (item.status === 'complete') color = '#10b981'; // complete emerald
        if (item.status === 'skip') color = '#94a3b8'; // skipped slate

        segments.push({ path, color, item });
        currentChapterIdx++;
      }
    }

    return segments;
  }, [chapterItems]);

  // Habit Radar Geometry (cx: 350, cy: 225, width: 580, height: 450)
  const radarSvgSegments = useMemo(() => {
    const numHabits = radarData.habits.length;
    if (numHabits === 0) return { cells: [], leaderLines: [] };

    const cx = 350;
    const cy = 225;
    const rOuter = 195;
    const rInner = 68;
    const ringStep = (rOuter - rInner) / numHabits;
    const startAngleDeg = -90;
    const totalAngleDeg = 270;
    const angleStepDeg = totalAngleDeg / radarData.daysInMonth;

    const cells: Array<{
      path: string;
      color: string;
      habitName: string;
      habitId: string;
      day: number;
      isFulfilled: boolean;
      isPastDay: boolean;
    }> = [];

    const radialGap = 2.2;
    const angularGapPx = 2.2;

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === radarData.year && today.getMonth() === radarDate.getMonth();

    for (let h = 0; h < numHabits; h++) {
      const habit = habits[h];
      const baseOuterR = rOuter - h * ringStep;
      const baseInnerR = rOuter - (h + 1) * ringStep;

      const cellOuterR = baseOuterR - radialGap / 2;
      const cellInnerR = baseInnerR + radialGap / 2;

      for (let d = 0; d < radarData.daysInMonth; d++) {
        const dayNum = d + 1;
        const a1Base = startAngleDeg + d * angleStepDeg;
        const a2Base = startAngleDeg + (d + 1) * angleStepDeg;

        const angleInsetOuter = ((angularGapPx / 2) / cellOuterR) * (180 / Math.PI);
        const angleInsetInner = ((angularGapPx / 2) / cellInnerR) * (180 / Math.PI);

        const aOuter1 = ((a1Base + angleInsetOuter) * Math.PI) / 180;
        const aOuter2 = ((a2Base - angleInsetOuter) * Math.PI) / 180;
        const aInner1 = ((a1Base + angleInsetInner) * Math.PI) / 180;
        const aInner2 = ((a2Base - angleInsetInner) * Math.PI) / 180;

        const path = calculatePolarArc(cx, cy, cellInnerR, cellOuterR, aOuter1, aOuter2);
        const isFulfilled = !!(radarData.monthData[String(dayNum)] && radarData.monthData[String(dayNum)][h]);

        const isPastDay =
          radarData.year < today.getFullYear() ||
          (radarData.year === today.getFullYear() && radarDate.getMonth() < today.getMonth()) ||
          (isCurrentMonth && dayNum < today.getDate());

        let color = 'transparent';
        if (isFulfilled) color = '#10b981';
        else if (isPastDay) color = 'rgb(190, 18, 60)';

        cells.push({
          path,
          color,
          habitName: radarData.habits[h],
          habitId: habit?.id || `habit-${h}`,
          day: dayNum,
          isFulfilled,
          isPastDay,
        });
      }
    }

    // Leader lines for habits
    const leaderLines: Array<{
      lineY: number;
      midY: number;
      habit: (typeof habits)[0];
      habitName: string;
      habitIndex: number;
      isTodayDone: boolean;
      targetDay: number;
    }> = [];

    const lineXStart = 15;
    const targetDay = today.getDate();

    for (let h = 0; h < numHabits; h++) {
      const lineY = cy - (rOuter - h * ringStep);
      const midY = cy - rOuter + (h + 0.5) * ringStep;
      const habit = habits[h];
      const isTodayDone = isCurrentMonth
        ? !!(radarData.monthData[String(targetDay)] && radarData.monthData[String(targetDay)][h])
        : false;

      leaderLines.push({
        lineY,
        midY,
        habit,
        habitName: radarData.habits[h],
        habitIndex: h,
        isTodayDone,
        targetDay,
      });
    }

    return { cells, leaderLines, cx, cy, rOuter, rInner, ringStep, lineXStart };
  }, [radarData, radarDate, habits]);

  // Day Stepper Display Label for Focus Analytics
  const dayStepperLabel = useMemo(() => {
    if (focusDayOffset === 0) return 'Today';
    const d = new Date();
    d.setDate(d.getDate() + focusDayOffset);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [focusDayOffset]);

  // Current filter label for map view
  const currentFilterLabel = useMemo(() => {
    if (chapterFilter === 'global') return '🌍 Global View';
    const [type, val] = chapterFilter.split(':');
    if (type === 'track') {
      const t = tracks.find((track) => track.id === val);
      return `🏁 ${t ? t.name : val}`;
    }
    if (type === 'program') return `🎓 ${val}`;
    if (type === 'subject') return `📚 ${val}`;
    return '🌍 Global View';
  }, [chapterFilter, tracks]);

  return (
    <div
      id="page-spectra-analytics"
      className="space-y-6 md:space-y-8 analytics-slide-up animate-page-enter"
    >
      {/* 1. Header with Ambient Glow */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-fuchsia-500/10 dark:bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-400/10 rounded-full border border-indigo-400/20">
              Analytical System
            </span>
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-fuchsia-400 bg-fuchsia-400/10 rounded-full border border-fuchsia-400/20">
              Live Sync
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Analytics</h2>
          <p className="text-slate-400 text-[10px] sm:text-xs">
            Comprehensive visual intelligence, track and program completion trends
          </p>
        </div>
      </div>

      {/* 2. Interactive Analytics Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-6">
        {/* Stat Card 1: Avg Completion */}
        <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col hover:shadow-md transition-all group hover:-translate-y-1 duration-300 min-w-0">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            Avg Completion
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              id="analytics-avg-completion"
              className="text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100"
            >
              {kpi.avgCompletion}%
            </span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3 shadow-inner">
            <div
              id="analytics-avg-completion-bar"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpi.avgCompletion)}%` }}
            />
          </div>
        </div>

        {/* Stat Card 2: Logged Actions */}
        <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col hover:shadow-md transition-all group hover:-translate-y-1 duration-300 min-w-0">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            Logged Actions
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              id="analytics-total-actions"
              className="text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100"
            >
              {kpi.totalActions}
            </span>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wide">Entries</span>
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-3 font-semibold">
            Total tracked action logs across all filters
          </p>
        </div>

        {/* Stat Card 3: Active Streak */}
        <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col hover:shadow-md transition-all group hover:-translate-y-1 duration-300 min-w-0">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            Active Streak
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              id="analytics-active-streak"
              className="text-lg md:text-2xl font-black text-orange-500"
            >
              {kpi.activeStreak} days
            </span>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-3 font-semibold">
            Consecutive days with logged actions
          </p>
        </div>

        {/* Stat Card 4: Days Remaining */}
        <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col hover:shadow-md transition-all group hover:-translate-y-1 duration-300 min-w-0">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            Days Remaining
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              id="analytics-days-remaining"
              className="text-lg md:text-2xl font-black text-emerald-500"
            >
              {kpi.daysRemaining}
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Days</span>
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-3 font-semibold">
            Remaining days until target completion
          </p>
        </div>
      </div>

      {/* 3. Global Chapters Goal Chart (Concentric Polar Arc Map) */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col xl:flex-row items-center justify-around gap-6 md:gap-8 w-full">
        {/* Tooltip inside spectra page */}
        <div
          id="spectra-gcm-tooltip"
          className="absolute hidden bg-slate-950/95 text-white text-[11px] font-bold px-3 py-2 rounded-xl border border-white/10 shadow-2xl pointer-events-none z-[90] backdrop-blur-md transition-all duration-75"
        />

        <div className="flex flex-col max-w-sm space-y-4 w-full md:w-auto">
          {/* Dropdown Selector */}
          <div className="flex flex-col gap-1.5 mb-2 relative">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Filter Map View
            </label>
            <div className="relative w-full text-[11px] shrink-0">
              <button
                id="spectra-filter-dropdown-btn"
                type="button"
                onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm flex items-center justify-between"
              >
                <span id="spectra-filter-dropdown-label">{currentFilterLabel}</span>
                <ChevronRight
                  className={`w-4 h-4 ml-2 transition-transform duration-200 text-slate-400 ${
                    isFilterDropdownOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isFilterDropdownOpen && (
                <div
                  id="spectra-filter-dropdown-menu"
                  className="absolute left-0 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-xl z-50 flex flex-col max-h-[300px] overflow-y-auto p-2.5 scrollbar-thin"
                >
                  <label
                    onClick={() => {
                      setChapterFilter('global');
                      setIsFilterDropdownOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0"
                  >
                    <input
                      type="radio"
                      name="spectra-filter"
                      checked={chapterFilter === 'global'}
                      onChange={() => {}}
                      className="rounded text-indigo-500"
                    />
                    <span className="font-extrabold uppercase text-[10px] tracking-widest">
                      🌍 Global View
                    </span>
                  </label>

                  <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1.5 shrink-0" />
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1 shrink-0">
                    Tracks
                  </div>
                  {tracks.map((t: Track) => (
                    <label
                      key={t.id}
                      onClick={() => {
                        setChapterFilter(`track:${t.id}`);
                        setIsFilterDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0"
                    >
                      <input
                        type="radio"
                        name="spectra-filter"
                        checked={chapterFilter === `track:${t.id}`}
                        onChange={() => {}}
                        className="rounded text-indigo-500"
                      />
                      <span className="font-bold uppercase text-[9px] tracking-wider">
                        🏁 {t.name}
                      </span>
                    </label>
                  ))}

                  <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1 shrink-0" />
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1 shrink-0">
                    Programs
                  </div>
                  {allPrograms.map((p) => (
                    <label
                      key={p.id}
                      onClick={() => {
                        setChapterFilter(`program:${p.title}`);
                        setIsFilterDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0"
                    >
                      <input
                        type="radio"
                        name="spectra-filter"
                        checked={chapterFilter === `program:${p.title}`}
                        onChange={() => {}}
                        className="rounded text-indigo-500"
                      />
                      <span className="font-bold uppercase text-[9px] tracking-wider">
                        🎓 {p.title}
                      </span>
                    </label>
                  ))}

                  <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1 shrink-0" />
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1 shrink-0">
                    Subjects
                  </div>
                  {normalizedSubjects.map((s: NormalizedSubject) => (
                    <label
                      key={s.id}
                      onClick={() => {
                        setChapterFilter(`subject:${s.name}`);
                        setIsFilterDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0"
                    >
                      <input
                        type="radio"
                        name="spectra-filter"
                        checked={chapterFilter === `subject:${s.name}`}
                        onChange={() => {}}
                        className="rounded text-indigo-500"
                      />
                      <span className="font-bold uppercase text-[9px] tracking-wider">
                        📚 {s.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 rounded-full border border-indigo-100 dark:border-indigo-900/50 w-fit block">
              Interactive Map
            </span>
            <h3
              id="spectra-analysis-title"
              className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight"
            >
              Syllabus Chapters Analysis
            </h3>
            <p
              id="spectra-analysis-desc"
              className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed"
            >
              A visual distribution of all chapters in your study goals. Hover over segments to view
              subject names, chapter index, and completion statuses.
            </p>
          </div>

          {/* Legend Inside Spectra Page */}
          <div className="flex flex-col gap-2.5 pt-2 text-[10px] font-black uppercase tracking-wider">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">
                Complete (<span id="spectra-legend-complete">{chapterStats.completed}</span>)
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300">
                Incomplete (<span id="spectra-legend-incomplete">{chapterStats.incomplete}</span>)
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" />
              <span className="text-slate-600 dark:text-slate-300">
                Skipped (<span id="spectra-legend-skipped">{chapterStats.skipped}</span>)
              </span>
            </div>
          </div>
        </div>

        {/* Chart Display Container */}
        <div id="spectra-circle-chart-wrapper" className="relative flex flex-col items-center justify-center">
          <div className="relative w-[240px] h-[240px] min-[375px]:w-[280px] min-[375px]:h-[280px] sm:w-[340px] sm:h-[340px] md:w-[360px] md:h-[360px] xl:w-[420px] xl:h-[420px] flex items-center justify-center shrink-0">
            <svg
              className="w-full h-full select-none"
              viewBox="-250 -250 500 500"
            >
              {polarSvgSegments.map((seg, idx) => (
                <path
                  key={idx}
                  d={seg.path}
                  fill={seg.color}
                  className="transition-all duration-150 hover:opacity-80 cursor-pointer"
                  onMouseEnter={() => setHoveredChapter(seg.item)}
                  onMouseLeave={() => setHoveredChapter(null)}
                />
              ))}
            </svg>

            {/* Center Circle Hub */}
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none w-24 h-24 sm:w-36 sm:h-36 bg-white dark:bg-slate-800 rounded-full shadow-inner border border-slate-100 dark:border-slate-700/80">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Progress
              </span>
              <span className="text-base sm:text-xl font-black text-slate-800 dark:text-white leading-none mt-1">
                {chapterStats.completed}/{chapterStats.effectiveTotal}
              </span>
              <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-lg border mt-1 shadow-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-indigo-900/50">
                {chapterStats.completionPercentage}%
              </span>
              <span className="text-[8px] sm:text-[9px] italic font-bold text-slate-500 dark:text-slate-400 mt-1">
                {chapterStats.incomplete} remaining
              </span>
            </div>
          </div>

          {/* Hovered Chapter Tooltip Banner */}
          {hoveredChapter && (
            <div className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in">
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
      <div className="relative bg-white dark:bg-slate-800 p-3.5 sm:p-4 md:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col w-full overflow-hidden">
        {/* Tooltip for Habit Radar */}
        {radarTooltip && (
          <div
            id="spectra-commitments-tooltip"
            style={{ left: radarTooltip.x, top: radarTooltip.y }}
            className="fixed bg-slate-950/95 text-white text-[11px] font-bold px-3 py-2 rounded-xl border border-white/15 shadow-2xl pointer-events-none z-[100] backdrop-blur-md transition-all duration-75 flex flex-col gap-1"
          >
            <div className="font-extrabold text-white text-[11px]">{radarTooltip.habitName}</div>
            <div className="text-[10px] text-slate-400">{radarTooltip.dateStr}</div>
            <div
              className={`text-[9px] font-black uppercase ${
                radarTooltip.isCompleted ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {radarTooltip.isCompleted ? 'Fulfilled ✓' : 'Missed ✕'}
            </div>
          </div>
        )}

        {/* Header & Controls Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/80 mb-3.5 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[8.5px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                Habit Radar
              </span>
              <span className="px-2 py-0.5 text-[8.5px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                Daily Consistency
              </span>
            </div>
            <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2 mt-0.5">
              The X Commitments
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight max-w-xl">
              Daily commitment tracker & radial habit grid. Click any cell or checkbox to log or toggle
              completion for that day.
            </p>
          </div>

          {/* Action & Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center bg-slate-100 dark:bg-slate-900/70 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <button
                data-commitment-prev
                type="button"
                title="Previous Month"
                onClick={() => {
                  const prev = new Date(radarDate);
                  prev.setMonth(prev.getMonth() - 1);
                  setRadarDate(prev);
                }}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span
                id="spectra-commitments-month-label"
                className="px-2.5 text-[11px] font-black text-slate-800 dark:text-slate-100 min-w-[95px] text-center uppercase tracking-wider"
              >
                {radarData.monthName} {radarData.year}
              </span>
              <button
                data-commitment-next
                type="button"
                title="Next Month"
                onClick={() => {
                  const next = new Date(radarDate);
                  next.setMonth(next.getMonth() + 1);
                  setRadarDate(next);
                }}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Layout Container: Vertical Left-Side Stats + Chart */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6 mt-3">
          {/* Summary Stats Vertical Bar (Left Side) */}
          <div className="w-full lg:w-52 xl:w-60 flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-col gap-2.5">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Monthly Completion
              </span>
              <span
                id="spectra-commitments-pct"
                className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5"
              >
                {radarData.pct}%
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Total Fulfilled
              </span>
              <span
                id="spectra-commitments-count"
                className="text-base sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5"
              >
                {radarData.fulfilledCount} / {radarData.totalCells}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Active Streak
              </span>
              <span
                id="spectra-commitments-streak"
                className="text-base sm:text-xl font-black text-amber-500 mt-0.5"
              >
                {radarData.streak} Days 🔥
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Days Logged
              </span>
              <span
                id="spectra-commitments-days-logged"
                className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5"
              >
                {radarData.daysLogged} Days
              </span>
            </div>
          </div>

          {/* SVG Chart Display Container (Right Side) */}
          <div
            id="spectra-commitments-chart-wrapper"
            className="relative w-full flex-1 flex items-center justify-center min-h-[350px] sm:min-h-[440px] overflow-x-auto py-1"
          >
            {habits.length > 0 ? (
              <svg
                viewBox="0 0 580 450"
                className="w-full max-w-[640px] h-auto select-none"
              >
                {/* Leader Lines and Labels */}
                {radarSvgSegments.leaderLines?.map((ll) => (
                  <g key={`leader-${ll.habitIndex}`}>
                    <line
                      x1={15}
                      y1={ll.lineY}
                      x2={350}
                      y2={ll.lineY}
                      className="commitment-leader-line stroke-slate-200 dark:stroke-slate-800 stroke-[1.2]"
                    />
                    {/* Interactive Checkbox for Today */}
                    <g
                      className="cursor-pointer"
                      onClick={() => {
                        const dStr = `${radarData.year}-${String(radarDate.getMonth() + 1).padStart(2, '0')}-${String(ll.targetDay).padStart(2, '0')}`;
                        toggleHabit(ll.habit.id, dStr);
                      }}
                    >
                      <rect
                        x={15}
                        y={ll.midY - 6}
                        width={12}
                        height={12}
                        rx={3}
                        className={
                          ll.isTodayDone
                            ? 'fill-emerald-500 stroke-emerald-500'
                            : 'fill-white dark:fill-slate-900 stroke-slate-400 dark:stroke-slate-600 stroke-[1.4]'
                        }
                      />
                      {ll.isTodayDone && (
                        <path
                          d={`M ${15 + 3} ${ll.midY} L ${15 + 5} ${ll.midY + 2.5} L ${15 + 9} ${ll.midY - 2.5}`}
                          stroke="#ffffff"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      <text
                        x={35}
                        y={ll.midY}
                        dominantBaseline="central"
                        className="commitment-label-text fill-slate-800 dark:fill-slate-200 text-[10px] font-extrabold uppercase hover:opacity-80 transition-opacity"
                      >
                        {ll.habitName}
                      </text>
                    </g>
                  </g>
                ))}

                {/* Polar Arc Cells */}
                {radarSvgSegments.cells?.map((cell, idx) => (
                  <path
                    key={idx}
                    d={cell.path}
                    fill={cell.color}
                    className={`cursor-pointer transition-all duration-100 ${
                      cell.isFulfilled
                        ? 'commitment-cell-active hover:brightness-110'
                        : cell.isPastDay
                        ? 'commitment-cell-inactive hover:brightness-125'
                        : 'stroke-slate-300 dark:stroke-slate-700 stroke-[1.1]'
                    }`}
                    onClick={() => {
                      const dStr = `${radarData.year}-${String(radarDate.getMonth() + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                      toggleHabit(cell.habitId, dStr);
                    }}
                    onMouseEnter={(e) => {
                      setRadarTooltip({
                        x: e.clientX + 10,
                        y: e.clientY + 10,
                        habitName: cell.habitName,
                        dayNum: cell.day,
                        dateStr: `${radarData.monthName} ${cell.day}, ${radarData.year}`,
                        isCompleted: cell.isFulfilled,
                      });
                    }}
                    onMouseLeave={() => setRadarTooltip(null)}
                  />
                ))}

                {/* Center Hub */}
                <circle
                  cx={350}
                  cy={225}
                  r={50}
                  className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700 stroke-2 shadow-lg"
                />
                <text
                  x={350}
                  y={215}
                  textAnchor="middle"
                  className="text-base font-black fill-slate-900 dark:fill-white uppercase"
                >
                  {radarData.pct}%
                </text>
                <text
                  x={350}
                  y={235}
                  textAnchor="middle"
                  className="text-[9px] font-black fill-indigo-500 uppercase tracking-widest"
                >
                  Radar
                </text>
              </svg>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckSquare className="w-8 h-8 text-indigo-500 mb-2" />
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  No Daily Actions Configured
                </h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Configure habits in Daily Actions to populate the habit radar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Embedded Focus Analytics Section */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-5 sm:mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                Focus Analytics
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Daywise focus hours compared to target
              </p>
            </div>
          </div>
        </div>

        {/* Controls Selector Row */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-between gap-2 sm:gap-3 px-1 pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0 w-full mb-4">
          {/* Timeframe Selector */}
          <div className="flex shrink-0 bg-slate-100 dark:bg-slate-900/60 p-0.5 sm:p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
            {([1, 7, 30, 180] as const).map((r) => (
              <button
                key={r}
                id={`spectra-tar-btn-${r}`}
                type="button"
                onClick={() => setFocusTimeframe(r)}
                className={`shrink-0 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all ${
                  focusTimeframe === r
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {r === 1 ? '1D' : r === 7 ? '7D' : r === 30 ? '30D' : '6M'}
              </button>
            ))}
          </div>

          {/* Day Stepper (for 1 Day filter) */}
          {focusTimeframe === 1 && (
            <div
              id="spectra-day-stepper"
              className="flex shrink-0 items-center bg-slate-100 dark:bg-slate-900/60 p-0.5 sm:p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40 transition-all"
            >
              <button
                id="spectra-day-prev-btn"
                type="button"
                title="Previous Day (-1 Day)"
                onClick={() => setFocusDayOffset((prev) => prev - 1)}
                className="shrink-0 px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                id="spectra-day-label"
                type="button"
                title="Click to jump to Today"
                onClick={() => setFocusDayOffset(0)}
                className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 min-w-[65px] text-center select-none cursor-pointer transition-colors"
              >
                {dayStepperLabel}
              </button>
              <button
                id="spectra-day-next-btn"
                type="button"
                title="Next Day (+1 Day)"
                onClick={() => setFocusDayOffset((prev) => Math.min(0, prev + 1))}
                className="shrink-0 px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Grouping Selector */}
          <div className="flex shrink-0 bg-slate-100 dark:bg-slate-900/60 p-0.5 sm:p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
            {(['daily', 'weekly', 'monthly'] as const).map((g) => (
              <button
                key={g}
                id={`spectra-tag-btn-${g}`}
                type="button"
                disabled={focusTimeframe === 1}
                onClick={() => setFocusGrouping(g)}
                className={`shrink-0 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all capitalize ${
                  focusGrouping === g
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                } ${focusTimeframe === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Chart Style Selector */}
          <div className="flex shrink-0 bg-slate-100 dark:bg-slate-900/60 p-0.5 sm:p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
            {(['combo', 'bar', 'line'] as const).map((s) => (
              <button
                key={s}
                id={`spectra-tas-btn-${s}`}
                type="button"
                onClick={() => setFocusChartStyle(s)}
                className={`shrink-0 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all capitalize ${
                  focusChartStyle === s
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {s === 'line' ? 'Line/Area' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Declarative SVG Chart Container */}
        <div
          id="spectraFocusAnalyticsChart"
          className="relative w-full h-[280px] sm:h-[330px] bg-slate-50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-inner flex flex-col justify-end overflow-x-auto"
        >
          {focusAnalytics.points.length > 0 ? (
            <div className="relative w-full h-full flex items-end gap-1 sm:gap-2 min-w-[320px]">
              {/* Benchmark Target Dashed Line */}
              <div
                className="absolute left-0 right-0 border-b-2 border-dashed border-rose-400/70 z-10 pointer-events-none"
                style={{ bottom: `${Math.min(95, (localTargetInput / 10.0) * 100)}%` }}
              >
                <span className="absolute right-2 -top-4 text-[9px] font-black text-rose-500 uppercase tracking-widest bg-white dark:bg-slate-900 px-1 rounded">
                  Target: {localTargetInput}h
                </span>
              </div>

              {focusAnalytics.points.map((p, idx) => {
                const heightPct = Math.min(100, (p.hours / 10.0) * 100);
                const isMet = p.hours >= p.target;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Bar visualization */}
                    {(focusChartStyle === 'combo' || focusChartStyle === 'bar') && (
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          isMet
                            ? 'bg-emerald-500 group-hover:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                            : p.hours > 0
                            ? 'bg-indigo-500 group-hover:bg-indigo-400'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />
                    )}

                    {/* Line node visualization */}
                    {focusChartStyle === 'line' && (
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-all shadow"
                        style={{ marginBottom: `${Math.max(2, heightPct)}%` }}
                      />
                    )}

                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 hidden group-hover:flex bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                      {p.label}: {p.hours}h
                    </div>

                    <span className="text-[8px] text-slate-400 font-bold mt-1 truncate max-w-[28px] sm:max-w-none">
                      {p.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
              No Focus Session Logs Recorded
            </div>
          )}
        </div>

        {/* Config / Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 mt-6">
          {/* Daily Focus Target Config */}
          <div className="sm:col-span-2 flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Focus Target
              </label>
            </div>
            <div className="shrink-0 w-20">
              <input
                id="spectra-timer-target-input"
                type="number"
                data-daily-focus-target
                value={localTargetInput}
                min="0.5"
                step="0.5"
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setLocalTargetInput(val);
                  setDailyFocusHoursTarget(val);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-center text-base md:text-lg font-black focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner dark:text-white"
              />
            </div>
          </div>

          {/* Average Focus Hours Display */}
          <div className="sm:col-span-2 flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Average Focus
              </label>
            </div>
            <div className="shrink-0 w-20 text-center">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-1 shadow-inner w-full flex justify-center">
                <span
                  id="spectra-timer-average-focus"
                  className="text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400"
                >
                  {focusAnalytics.avgFocusHours}h
                </span>
              </div>
            </div>
          </div>

          {/* Peak Day Display */}
          <div className="sm:col-span-2 flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex-1 flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Highest Focus
              </label>
              <span
                id="spectra-timer-peak-date"
                className="text-[8px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mt-0.5 leading-none"
              >
                {focusAnalytics.peakDate}
              </span>
            </div>
            <div className="shrink-0 w-24 text-center">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 shadow-inner w-full flex justify-center">
                <span
                  id="spectra-timer-peak-value"
                  className="text-base md:text-lg font-black text-rose-600 dark:text-rose-400"
                >
                  {focusAnalytics.peakHours}h
                </span>
              </div>
            </div>
          </div>

          {/* Total Focus Hours */}
          <div className="sm:col-span-2 flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total Focus
              </label>
            </div>
            <div className="shrink-0 w-24 text-center">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 shadow-inner w-full flex justify-center">
                <span
                  id="spectra-timer-total-focus"
                  className="text-base md:text-lg font-black text-indigo-600 dark:text-indigo-400"
                >
                  {focusAnalytics.totalFocusHours}h
                </span>
              </div>
            </div>
          </div>

          {/* Average Target */}
          <div className="sm:col-span-2 flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Average Target
              </label>
            </div>
            <div className="shrink-0 w-24 text-center">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 shadow-inner w-full flex justify-center">
                <span
                  id="spectra-timer-average-target"
                  className="text-base md:text-lg font-black text-rose-500 dark:text-rose-400"
                >
                  {focusAnalytics.avgTargetHours}h
                </span>
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="sm:col-span-2 flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Success Rate
              </label>
              <span
                id="spectra-timer-success-rate-subtitle"
                className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mt-0.5"
              >
                {focusAnalytics.successDays} of {focusAnalytics.totalDays} days
              </span>
            </div>
            <div className="shrink-0 w-24 text-center">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 shadow-inner w-full flex justify-center">
                <span
                  id="spectra-timer-success-rate"
                  className="text-base md:text-lg font-black text-amber-600 dark:text-amber-400"
                >
                  {focusAnalytics.successRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Focus Matrix GitHub Box Heatmap */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col relative">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-5 border-b border-slate-100 dark:border-slate-700 gap-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                Focus Matrix Heatmap
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  GitHub Style
                </span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Daywise focus intensity distribution & achievement tiers
              </p>
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
            {([30, 90, 180, 365] as FocusHeatmapRange[]).map((days) => (
              <button
                key={days}
                id={`spectra-hm-btn-${days}`}
                type="button"
                onClick={() => setHeatmapRange(days)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  heatmapRange === days
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {days === 30 ? '1 Month' : days === 90 ? '3 Months' : days === 180 ? '6 Months' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        {/* 8 Summary Stat Badges Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5 mb-5">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Active Days
            </span>
            <span
              id="spectra-hm-stat-active-days"
              className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-0.5"
            >
              {heatmapStats.activeDays}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Current Streak
            </span>
            <span
              id="spectra-hm-stat-streak"
              className="text-base sm:text-lg font-black text-orange-500 mt-0.5"
            >
              {heatmapStats.streak} days 🔥
            </span>
          </div>
          <div className="bg-rose-50/40 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-200/40 dark:border-rose-900/30 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
              0h (✕)
            </span>
            <span
              id="spectra-hm-stat-zero"
              className="text-base sm:text-lg font-black text-rose-500 dark:text-rose-400 mt-0.5"
            >
              {heatmapStats.zeroCount}
            </span>
          </div>
          <div className="bg-rose-100/50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-300/40 dark:border-rose-800/50 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
              0-2h (⭕)
            </span>
            <span
              id="spectra-hm-stat-red"
              className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5"
            >
              {heatmapStats.redCount}
            </span>
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-200/40 dark:border-blue-900/40 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
              2-4h (Blue)
            </span>
            <span
              id="spectra-hm-stat-blue"
              className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5"
            >
              {heatmapStats.blueCount}
            </span>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/40 dark:border-emerald-900/40 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              &gt; 4h (Green)
            </span>
            <span
              id="spectra-hm-stat-green"
              className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5"
            >
              {heatmapStats.greenCount}
            </span>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/40 dark:border-amber-900/40 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
              ≥ 6h (Golden)
            </span>
            <span
              id="spectra-hm-stat-gold"
              className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5"
            >
              {heatmapStats.goldCount}
            </span>
          </div>
          <div className="bg-purple-50/50 dark:bg-fuchsia-950/20 p-2.5 rounded-xl border border-purple-200/40 dark:border-fuchsia-900/40 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-fuchsia-600 uppercase tracking-widest">
              ≥ 8h (Diamond)
            </span>
            <span
              id="spectra-hm-stat-gem"
              className="text-base sm:text-lg font-black text-fuchsia-600 dark:text-fuchsia-400 mt-0.5"
            >
              {heatmapStats.gemCount}
            </span>
          </div>
        </div>

        {/* GitHub Box Matrix */}
        <div className="w-full overflow-x-auto spectra-heatmap-scrollbar pb-3 pt-1">
          <div id="spectra-focus-heatmap-grid" className="min-w-[760px] flex gap-1.5">
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

        {/* Legend Footer & Interactive Day Detail Side Note Row */}
        <div
          id="spectra-heatmap-footer"
          className="flex flex-col gap-4 pt-4 mt-3 border-t border-slate-100 dark:border-slate-700/80"
        >
          {/* Compact Tier Colors Legend */}
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Tier Colors Legend
            </span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                <div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-300/60 dark:bg-rose-950/40 dark:border-rose-800/50 flex items-center justify-center text-rose-500 text-[8px] font-black">
                  ✕
                </div>
                <span>0h (Faded Red - ✕)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                <div className="w-3 h-3 rounded bg-rose-600 border border-rose-500 flex items-center justify-center text-white text-[8px] font-black">
                  ⭕
                </div>
                <span>0-2h (Deep Rose - ⭕)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                <div className="w-3 h-3 rounded bg-blue-500 border border-blue-400" />
                <span>&gt; 2-4h (Blue)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" />
                <span>&gt; 4h (Green)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                <div className="w-3 h-3 rounded bg-amber-400 border border-amber-300" />
                <span>≥ 6h (Golden)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                <div className="w-3 h-3 rounded bg-gradient-to-tr from-cyan-400 via-sky-300 to-indigo-500 border border-cyan-300" />
                <span>≥ 8h (Diamond)</span>
              </div>
            </div>
          </div>

          {/* Day Detail Side Note Card */}
          <div
            id="spectra-heatmap-side-note"
            className="w-full bg-indigo-50/60 dark:bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm flex flex-col gap-2.5 transition-all duration-200"
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Date:
                </span>
                <span
                  id="spectra-sn-day-name"
                  className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider"
                >
                  {selectedDay ? selectedDay.date.toLocaleDateString('en-US', { weekday: 'long' }) : 'Select a Day'}
                </span>
                <span
                  id="spectra-sn-date"
                  className="text-[10px] font-bold text-slate-500 dark:text-slate-400"
                >
                  {selectedDay ? `(${selectedDay.dateKey})` : '(Click box)'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Focus Time:
                </span>
                <span
                  id="spectra-sn-focus-time"
                  className="text-xs font-black text-slate-800 dark:text-white"
                >
                  {selectedDay ? `${selectedDay.hours}h` : '0 min'}
                </span>
              </div>
              {selectedDay && (
                <div className="shrink-0">
                  <span
                    id="spectra-sn-tier-badge"
                    className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-300"
                  >
                    {selectedDay.tier} Tier
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 pt-2 border-t border-indigo-100/60 dark:border-slate-800/60">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 flex-1 min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                  Subjects:
                </span>
                <div id="spectra-sn-subjects-list" className="flex flex-wrap items-center gap-1.5">
                  {selectedDay && selectedDay.subjects && selectedDay.subjects.length > 0 ? (
                    selectedDay.subjects.map((sub, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        {sub}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      Click a box in the heatmap above.
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Target Met:
                </span>
                <span
                  id="spectra-sn-target-pct"
                  className="text-xs font-black text-indigo-600 dark:text-indigo-400"
                >
                  {selectedDay
                    ? `${Math.min(100, Math.round((selectedDay.hours / localTargetInput) * 100))}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Visual Analysis Trends Section */}
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
                onClick={() => setIsSubjectTrendModalOpen(true)}
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
                      .map((v, i) => `${40 + i * stepX},${220 - (Math.min(100, v) / 100) * 200}`)
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
                        {prog.values.map((v, i) => (
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
                onClick={() => setIsYearlyActionsModalOpen(true)}
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
                      .map((v, i) => `${40 + i * stepX},${220 - (Math.min(total, v) / total) * 200}`)
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
                    const pts = activePaceChart.actTrajectory.filter((v): v is number => v !== null);
                    if (pts.length <= 1) return null;
                    const stepX = (490 - 40) / Math.max(1, activePaceChart.actTrajectory.length - 1);
                    const total = activePaceStats?.total || 1;
                    const pointsStr = pts
                      .map((v, i) => `${40 + i * stepX},${220 - (Math.min(total, v) / total) * 200}`)
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
                    .map((v, i) => `${40 + i * stepX},${220 - (Math.min(total, v) / total) * 200}`)
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
                  const pts = globalPaceStats.chart.actTrajectory.filter((v): v is number => v !== null);
                  if (pts.length <= 1) return null;
                  const stepX = (490 - 40) / Math.max(1, globalPaceStats.chart.actTrajectory.length - 1);
                  const total = globalPaceStats.stats.total || 1;
                  const pointsStr = pts
                    .map((v, i) => `${40 + i * stepX},${220 - (Math.min(total, v) / total) * 200}`)
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

      {/* 8. Subject Trend Drilldown Modal */}
      {isSubjectTrendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Subject Breakdown & Progress
                </h3>
                <p className="text-xs text-slate-400">
                  Granular completion metrics across curriculum subjects
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubjectTrendModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {normalizedSubjects.map((sub) => {
                const subTasks = tasks.filter((t) => t.subject === sub.name);
                const completed = subTasks.filter((t) => t.completed).length;
                const total = sub.chaptersCount || 1;
                const pct = Math.round((completed / total) * 100);

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-500">
                          {sub.program}
                        </span>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white mt-0.5">
                          {sub.name}
                        </h4>
                      </div>
                      <span className="text-xs font-black text-emerald-500">{pct}%</span>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-1">
                        <span>Chapters</span>
                        <span>
                          {completed} / {total}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 9. Yearly Actions Drilldown Modal */}
      {isYearlyActionsModalOpen && (
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
                onClick={() => setIsYearlyActionsModalOpen(false)}
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
      )}
    </div>
  );
};
