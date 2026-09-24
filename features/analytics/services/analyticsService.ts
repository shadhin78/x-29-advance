/**
 * X-29 Pure Analytics Engine (features/analytics/services/analyticsService.ts)
 * 
 * Strict Pure Calculations:
 * NO React, NO DOM, NO window, NO document, NO Firebase.
 * Testable, deterministic calculations for Analytics KPI, Heatmaps, Chapter Polar Maps, and Radar grids.
 */

import type {
  AnalyticsKpiSummary,
  FocusHeatmapRange,
  FocusDayData,
  HeatmapStats,
  HeatmapTier,
  ChapterMapItem,
  ChapterMapStats,
  HabitRadarData,
  TrendTimeFilter,
  ProgramTrendData,
  DailyActionMonthlyData,
  FocusAnalyticsMetrics,
  FocusAnalyticsPoint,
} from '@/types/analytics';
import type { NormalizedSubject, Program, Track } from '@/types/taxonomy';
import type { StudyTask } from '@/types/task';
import type { DailyHabit } from '@/types/habits';

/**
 * Calculates overall syllabus completion percentage
 */
export function calculateCompletionRate(
  completed: number,
  total: number,
  skipped: number = 0
): number {
  const effective = Math.max(0, total - skipped);
  if (effective <= 0) return 0;
  return parseFloat(((completed / effective) * 100).toFixed(1));
}

/**
 * Calculates required pace (chapters or units per day)
 */
export function calculateRequiredPace(remainingUnits: number, remainingDays: number): number {
  if (remainingDays <= 0) return remainingUnits > 0 ? remainingUnits : 0;
  return parseFloat((remainingUnits / remainingDays).toFixed(2));
}

/**
 * Calculates remaining days from today until target date
 */
export function calculateDaysRemaining(targetDate: string | Date | null | undefined): number {
  if (!targetDate) return 0;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Derives tier for a given focus hours value
 */
export function getHeatmapTier(hours: number): HeatmapTier {
  if (hours <= 0) return 'zero';
  if (hours <= 2.0) return 'rose';
  if (hours <= 4.0) return 'blue';
  if (hours < 6.0) return 'green';
  if (hours < 8.0) return 'gold';
  return 'diamond';
}

/**
 * Calculates Focus Heatmap weeks grid and tier stats
 */
export function calculateFocusHeatmap(
  timerLogs: Array<{ date: string; duration: number; subject?: string }>,
  rangeDays: FocusHeatmapRange = 365,
  referenceDate: Date = new Date()
): { weeks: FocusDayData[][]; stats: HeatmapStats } {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  // Aggregate seconds and subjects by YYYY-MM-DD
  const dailySecondsMap: Record<string, number> = {};
  const dailySubjectsMap: Record<string, Set<string>> = {};

  timerLogs.forEach((log) => {
    if (!log.date) return;
    const d = new Date(log.date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dur = typeof log.duration === 'number' ? log.duration : parseInt(String(log.duration || 0), 10);
    dailySecondsMap[key] = (dailySecondsMap[key] || 0) + (isNaN(dur) ? 0 : dur);

    if (log.subject) {
      if (!dailySubjectsMap[key]) dailySubjectsMap[key] = new Set();
      dailySubjectsMap[key].add(log.subject);
    }
  });

  const endDate = new Date(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (rangeDays - 1));

  // Align start date to Sunday (day 0)
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 0) {
    startDate.setDate(startDate.getDate() - dayOfWeek);
  }

  const weeks: FocusDayData[][] = [];
  let currentWeek: FocusDayData[] = [];
  const curr = new Date(startDate);

  let activeDaysCount = 0;
  let zeroCount = 0;
  let redCount = 0;
  let blueCount = 0;
  let greenCount = 0;
  let goldCount = 0;
  let gemCount = 0;

  while (curr <= endDate || currentWeek.length > 0) {
    const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
    const isFuture = curr > endDate;
    const sec = !isFuture ? dailySecondsMap[key] || 0 : 0;
    const hours = parseFloat((sec / 3600).toFixed(2));
    const tier = getHeatmapTier(hours);
    const subjects = dailySubjectsMap[key] ? Array.from(dailySubjectsMap[key]) : [];

    if (!isFuture) {
      if (hours > 0) activeDaysCount++;
      if (hours === 0) zeroCount++;
      else if (hours > 0 && hours <= 2.0) redCount++;
      else if (hours > 2.0 && hours <= 4.0) blueCount++;
      else if (hours > 4.0 && hours < 6.0) greenCount++;
      else if (hours >= 6.0 && hours < 8.0) goldCount++;
      else if (hours >= 8.0) gemCount++;
    }

    currentWeek.push({
      date: new Date(curr),
      dateKey: key,
      hours,
      seconds: sec,
      isFuture,
      tier,
      subjects,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    curr.setDate(curr.getDate() + 1);
    if (isFuture && currentWeek.length === 0) break;
  }

  // Calculate current streak
  let streak = 0;
  const checkDate = new Date(today);
  while (true) {
    const k = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    const s = dailySecondsMap[k] || 0;
    if (s > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (checkDate.getTime() === today.getTime()) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  const stats: HeatmapStats = {
    activeDays: activeDaysCount,
    streak,
    zeroCount,
    redCount,
    blueCount,
    greenCount,
    goldCount,
    gemCount,
  };

  return { weeks, stats };
}

/**
 * Calculates SVG path for polar arc segment
 */
export function calculatePolarArc(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  theta1: number,
  theta2: number
): string {
  const x1_inner = cx + rInner * Math.cos(theta1);
  const y1_inner = cy + rInner * Math.sin(theta1);
  const x2_inner = cx + rInner * Math.cos(theta2);
  const y2_inner = cy + rInner * Math.sin(theta2);

  const x1_outer = cx + rOuter * Math.cos(theta1);
  const y1_outer = cy + rOuter * Math.sin(theta1);
  const x2_outer = cx + rOuter * Math.cos(theta2);
  const y2_outer = cy + rOuter * Math.sin(theta2);

  const largeArc = theta2 - theta1 > Math.PI ? 1 : 0;

  return `M ${x1_outer.toFixed(2)} ${y1_outer.toFixed(2)} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2_outer.toFixed(2)} ${y2_outer.toFixed(2)} L ${x2_inner.toFixed(2)} ${y2_inner.toFixed(2)} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1_inner.toFixed(2)} ${y1_inner.toFixed(2)} Z`;
}

/**
 * Extracts syllabus chapter breakdown and stats for a given filter
 */
export function calculateChapterMap(
  subjects: NormalizedSubject[],
  tasks: StudyTask[],
  filter: string = 'global'
): { chapters: ChapterMapItem[]; stats: ChapterMapStats } {
  const chapters: ChapterMapItem[] = [];
  let completed = 0;
  let skipped = 0;
  let incomplete = 0;

  subjects.forEach((sub) => {
    // Check filter
    if (filter !== 'global') {
      const [fType, fVal] = filter.split(':');
      if (fType === 'track' && sub.trackId !== fVal) return;
      if (fType === 'program' && sub.program !== fVal) return;
      if (fType === 'subject' && sub.name !== fVal) return;
    }

    const tasksForSubject = tasks.filter((t) => t.subject === sub.name);
    const totalChapters = sub.chaptersCount || 1;

    for (let c = 1; c <= totalChapters; c++) {
      const task = tasksForSubject.find(
        (t) => String(t.chapter) === String(c) || t.chapter === c
      );
      let status: 'complete' | 'incomplete' | 'skip' = 'incomplete';
      if (task?.completed) {
        status = 'complete';
        completed++;
      } else if (task?.skipped) {
        status = 'skip';
        skipped++;
      } else {
        incomplete++;
      }

      chapters.push({
        subject: sub.name,
        chapterNum: c,
        status,
      });
    }
  });

  const total = chapters.length;
  const effectiveTotal = Math.max(0, total - skipped);
  const completionPercentage =
    effectiveTotal > 0 ? parseFloat(((completed / effectiveTotal) * 100).toFixed(1)) : 0;

  return {
    chapters,
    stats: {
      completed,
      incomplete,
      skipped,
      total,
      effectiveTotal,
      completionPercentage,
    },
  };
}

/**
 * Calculates Habit Radar metrics for a specific month
 */
export function calculateHabitRadar(
  habits: DailyHabit[],
  activeDate: Date = new Date()
): HabitRadarData {
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  const monthName = activeDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const habitNames = habits.map((h) => h.name);
  const numHabits = habitNames.length;

  if (numHabits === 0) {
    return {
      monthName,
      year,
      daysInMonth,
      habits: [],
      monthData: {},
      pct: 0,
      fulfilledCount: 0,
      totalCells: 0,
      streak: 0,
      daysLogged: 0,
    };
  }

  // Build matrix for each day 1..daysInMonth
  const monthData: Record<string, boolean[]> = {};
  let fulfilledCount = 0;
  const daysLoggedSet = new Set<number>();

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayBools: boolean[] = [];
    let dayHasFulfilled = false;

    habits.forEach((h) => {
      const isFulfilled = !!h.history[dStr];
      dayBools.push(isFulfilled);
      if (isFulfilled) {
        fulfilledCount++;
        dayHasFulfilled = true;
      }
    });

    monthData[String(d)] = dayBools;
    if (dayHasFulfilled) daysLoggedSet.add(d);
  }

  const totalCells = daysInMonth * numHabits;
  const pct = totalCells > 0 ? Math.round((fulfilledCount / totalCells) * 100) : 0;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const checkStartDay = isCurrentMonth ? today.getDate() : daysInMonth;

  let streak = 0;
  for (let d = checkStartDay; d >= 1; d--) {
    const dayBools = monthData[String(d)] || [];
    const hasAny = dayBools.some(Boolean);
    if (hasAny) {
      streak++;
    } else if (d < checkStartDay) {
      break;
    }
  }

  return {
    monthName,
    year,
    daysInMonth,
    habits: habitNames,
    monthData,
    pct,
    fulfilledCount,
    totalCells,
    streak,
    daysLogged: daysLoggedSet.size,
  };
}

/**
 * Calculates focus analytics metrics and graph points for 1D, 7D, 30D, and 6M timeframes
 */
export function calculateFocusAnalyticsMetrics(
  timerLogs: Array<{ date: string; duration: number; subject?: string }>,
  timeframe: 1 | 7 | 30 | 180 = 30,
  grouping: 'daily' | 'weekly' | 'monthly' = 'daily',
  targetHours: number = 4.0,
  dayOffset: number = 0,
  referenceDate: Date = new Date()
): FocusAnalyticsMetrics {
  const points: FocusAnalyticsPoint[] = [];
  const logMap: Record<string, number> = {};

  timerLogs.forEach((log) => {
    if (!log.date) return;
    const d = new Date(log.date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dur = typeof log.duration === 'number' ? log.duration : parseInt(String(log.duration || 0), 10);
    logMap[key] = (logMap[key] || 0) + (isNaN(dur) ? 0 : dur);
  });

  const anchor = new Date(referenceDate);
  anchor.setHours(0, 0, 0, 0);

  if (timeframe === 1) {
    // 1-Day View with dayOffset
    anchor.setDate(anchor.getDate() + dayOffset);
    const key = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-${String(anchor.getDate()).padStart(2, '0')}`;
    const totalSec = logMap[key] || 0;
    const hours = parseFloat((totalSec / 3600).toFixed(2));

    // Divide day into 8 3-hour blocks: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
    for (let h = 0; h < 24; h += 3) {
      const blockLabel = `${String(h).padStart(2, '0')}:00`;
      // Distribute hours proportionally across active afternoon/evening blocks if positive
      const blockHours = hours > 0 ? parseFloat((hours / 8).toFixed(2)) : 0;
      points.push({
        dateStr: `${key} ${blockLabel}`,
        label: blockLabel,
        hours: blockHours,
        target: parseFloat((targetHours / 8).toFixed(2)),
      });
    }

    const peakHours = hours;
    const successRate = targetHours > 0 ? Math.min(100, Math.round((hours / targetHours) * 100)) : 0;

    return {
      points,
      totalFocusHours: hours,
      avgFocusHours: hours,
      peakHours,
      peakDate: key,
      avgTargetHours: targetHours,
      successRate,
      successDays: hours >= targetHours ? 1 : 0,
      totalDays: 1,
    };
  }

  // Multi-day mode (7D, 30D, 180D)
  if (grouping === 'daily') {
    for (let i = timeframe - 1; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hours = parseFloat(((logMap[key] || 0) / 3600).toFixed(2));
      points.push({
        dateStr: key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        hours,
        target: targetHours,
      });
    }
  } else if (grouping === 'weekly') {
    const numWeeks = Math.ceil(timeframe / 7);
    for (let w = numWeeks - 1; w >= 0; w--) {
      let weekSec = 0;
      const startD = new Date(anchor);
      startD.setDate(anchor.getDate() - (w * 7 + 6));
      for (let day = 0; day < 7; day++) {
        const curD = new Date(startD);
        curD.setDate(startD.getDate() + day);
        const k = `${curD.getFullYear()}-${String(curD.getMonth() + 1).padStart(2, '0')}-${String(curD.getDate()).padStart(2, '0')}`;
        weekSec += logMap[k] || 0;
      }
      const hours = parseFloat((weekSec / 3600).toFixed(2));
      points.push({
        dateStr: `W-${w}`,
        label: `Wk ${numWeeks - w}`,
        hours,
        target: targetHours * 7,
      });
    }
  } else if (grouping === 'monthly') {
    const numMonths = Math.max(1, Math.ceil(timeframe / 30));
    for (let m = numMonths - 1; m >= 0; m--) {
      const targetMonthDate = new Date(anchor.getFullYear(), anchor.getMonth() - m, 1);
      const year = targetMonthDate.getFullYear();
      const month = targetMonthDate.getMonth();
      const daysInM = new Date(year, month + 1, 0).getDate();
      let monthSec = 0;
      for (let day = 1; day <= daysInM; day++) {
        const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        monthSec += logMap[k] || 0;
      }
      const hours = parseFloat((monthSec / 3600).toFixed(2));
      points.push({
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: targetMonthDate.toLocaleString('default', { month: 'short' }),
        hours,
        target: targetHours * daysInM,
      });
    }
  }

  const totalFocusHours = points.reduce((acc, curr) => acc + curr.hours, 0);
  const avgFocusHours = points.length > 0 ? parseFloat((totalFocusHours / points.length).toFixed(2)) : 0;
  const peak = points.reduce((max, curr) => (curr.hours > max.hours ? curr : max), {
    dateStr: 'No Data',
    label: '',
    hours: 0,
    target: targetHours,
  });
  const successDays = points.filter((p) => p.hours >= p.target).length;
  const successRate = points.length > 0 ? Math.round((successDays / points.length) * 100) : 0;
  const avgTargetHours = points.length > 0 ? parseFloat((points.reduce((a, b) => a + b.target, 0) / points.length).toFixed(1)) : targetHours;

  return {
    points,
    totalFocusHours: parseFloat(totalFocusHours.toFixed(1)),
    avgFocusHours,
    peakHours: peak.hours,
    peakDate: peak.dateStr,
    avgTargetHours,
    successRate,
    successDays,
    totalDays: points.length,
  };
}

/**
 * Calculates program completion trends over a selected timeframe ('1Y' | '2Y' | '3Y' | 'ALL')
 */
export function calculateProgramTrends(
  tasks: StudyTask[],
  normalizedSubjects: NormalizedSubject[],
  customPrograms: Record<string, Program[]>,
  tracks: Track[],
  timeframe: TrendTimeFilter = 'ALL',
  referenceDate: Date = new Date()
): ProgramTrendData {
  const PALETTE = [
    '#6366f1', // indigo
    '#ec4899', // pink
    '#10b981', // emerald
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#14b8a6', // teal
    '#f43f5e', // rose
  ];

  // Distinct programs
  const programsList: Array<{ name: string; trackId: string }> = [];
  tracks.forEach((t) => {
    const progs = customPrograms[t.id] || [];
    progs.forEach((p) => {
      if (!programsList.some((item) => item.name === p.name)) {
        programsList.push({ name: p.name, trackId: t.id });
      }
    });
  });

  const now = new Date(referenceDate);
  let totalMonths = 12;
  if (timeframe === '1Y') totalMonths = 12;
  else if (timeframe === '2Y') totalMonths = 24;
  else if (timeframe === '3Y') totalMonths = 36;
  else if (timeframe === 'ALL') totalMonths = Math.max(6, now.getMonth() + 1);

  const months: string[] = [];
  const startMonthDate = new Date(now.getFullYear(), now.getMonth() - (totalMonths - 1), 1);

  for (let i = 0; i < totalMonths; i++) {
    const d = new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() + i, 1);
    months.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
  }

  // For each program, calculate completion rate across time
  const series = programsList.map((prog, pIdx) => {
    const progSubs = normalizedSubjects.filter((s) => s.program === prog.name);
    const totalChapters = progSubs.reduce((acc, s) => acc + (s.chaptersCount || 1), 0);
    const subNames = new Set(progSubs.map((s) => s.name));

    const progTasks = tasks.filter((t) => subNames.has(t.subject));
    const values: number[] = [];

    for (let m = 0; m < totalMonths; m++) {
      const monthEnd = new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() + m + 1, 0, 23, 59, 59);

      let completedSoFar = 0;
      progTasks.forEach((t) => {
        if (!t.completed) return;
        const compDate = t.actualDateCompleted ? new Date(t.actualDateCompleted) : (t.date ? new Date(t.date) : null);
        if (!compDate || compDate <= monthEnd) {
          completedSoFar++;
        }
      });

      const pct = parseFloat(((completedSoFar / Math.max(1, totalChapters)) * 100).toFixed(1));
      values.push(pct);
    }

    return {
      name: prog.name,
      color: PALETTE[pIdx % PALETTE.length],
      values,
    };
  });

  return {
    months,
    programs: series,
  };
}

/**
 * Calculates daily action monthly trends and breakdown for the active month
 */
export function calculateDailyActionMonthlyTrends(
  habits: DailyHabit[],
  timeframe: TrendTimeFilter = 'ALL',
  referenceDate: Date = new Date()
): DailyActionMonthlyData {
  const HABIT_COLORS = ['#10b981', '#6366f1', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

  const now = new Date(referenceDate);
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: number[] = [];
  const dailyCounts: number[] = [];
  let totalFulfilled = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let dayCount = 0;
    habits.forEach((h) => {
      if (h.history && h.history[dStr]) {
        dayCount++;
        totalFulfilled++;
      }
    });
    dailyCounts.push(dayCount);
  }

  const totalPossible = daysInMonth * (habits.length || 1);
  const successRate = totalPossible > 0 ? Math.round((totalFulfilled / totalPossible) * 100) : 0;

  const habitsBreakdown = habits.map((h, idx) => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (h.history && h.history[dStr]) count++;
    }
    return {
      name: h.name || h.title || `Habit ${idx + 1}`,
      color: HABIT_COLORS[idx % HABIT_COLORS.length],
      count,
    };
  });

  return {
    days,
    dailyCounts,
    monthName,
    year,
    totalFulfilled,
    successRate,
    habitsBreakdown,
  };
}
