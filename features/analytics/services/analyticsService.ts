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
} from '@/types/analytics';
import type { NormalizedSubject } from '@/types/taxonomy';
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
