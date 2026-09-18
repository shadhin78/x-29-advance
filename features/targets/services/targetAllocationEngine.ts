/**
 * X-29 Unified Target Allocation Engine (features/targets/services/targetAllocationEngine.ts)
 * 
 * ONE authoritative pure business engine replacing both:
 * - js/features/targets/monthlyTargets.js
 * - pages/Daily Actions/monthly target setup/monthly target setup.js
 * 
 * Contains:
 * - NO React
 * - NO DOM
 * - NO Zustand
 * - NO Firebase / IndexedDB
 * - NO window / document
 * 
 * Pure mathematical input -> typed allocation result output.
 */

import type {
  MonthlyTarget,
  WeeklyTarget,
  DailyTarget,
  TargetAllocationInput,
  AllocationResult,
} from '@/types/targets';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns canonical month range key from a date (e.g. "01 Sep 2026 - 30 Sep 2026").
 */
export function getMonthRangeKey(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const format = (dt: Date) => {
    const dayStr = String(dt.getDate()).padStart(2, '0');
    const monthStr = MONTH_NAMES[dt.getMonth()];
    return `${dayStr} ${monthStr} ${dt.getFullYear()}`;
  };

  return `${format(firstDay)} - ${format(lastDay)}`;
}

/**
 * Returns canonical 7-day week range key for a given date.
 */
export function getWeekRangeKey(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : new Date(d);
  date.setHours(0, 0, 0, 0);

  // Week start: Monday
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date.setDate(diff));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const format = (dt: Date) => {
    const dayStr = String(dt.getDate()).padStart(2, '0');
    const monthStr = MONTH_NAMES[dt.getMonth()];
    return `${dayStr} ${monthStr} ${dt.getFullYear()}`;
  };

  return `${format(start)} - ${format(end)}`;
}

/**
 * Generates an array of dates ('YYYY-MM-DD') for a month range.
 */
export function getMonthDatesList(monthDate: Date | string = new Date()): string[] {
  const date = typeof monthDate === 'string' ? new Date(monthDate) : monthDate;
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const dates: string[] = [];
  for (let i = 1; i <= lastDay; i++) {
    const m = String(month + 1).padStart(2, '0');
    const day = String(i).padStart(2, '0');
    dates.push(`${year}-${m}-${day}`);
  }
  return dates;
}

/**
 * Splits a chapter's total size across given dates according to equal parts or custom fractions.
 */
export function splitChapterAcrossDays(
  chapterItem: {
    track: string;
    program: string;
    subject: string;
    chapter: string;
    size: number;
    monthlyTargetId?: string;
  },
  days: string[],
  fractions?: number[]
): DailyTarget[] {
  if (days.length === 0 || chapterItem.size <= 0) return [];

  const targets: DailyTarget[] = [];
  const count = days.length;

  if (fractions && fractions.length === count) {
    const fractionSum = fractions.reduce((a, b) => a + b, 0) || 1;
    days.forEach((d, idx) => {
      const portion = Math.round((chapterItem.size * (fractions[idx] / fractionSum)) * 10) / 10;
      targets.push({
        id: `dt_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        monthlyTargetId: chapterItem.monthlyTargetId,
        track: chapterItem.track,
        program: chapterItem.program,
        subject: chapterItem.subject,
        chapter: chapterItem.chapter,
        date: d,
        portionSize: portion,
        completed: false,
      });
    });
  } else {
    const basePortion = Math.floor((chapterItem.size / count) * 10) / 10;
    days.forEach((d, idx) => {
      targets.push({
        id: `dt_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        monthlyTargetId: chapterItem.monthlyTargetId,
        track: chapterItem.track,
        program: chapterItem.program,
        subject: chapterItem.subject,
        chapter: chapterItem.chapter,
        date: d,
        portionSize: basePortion,
        completed: false,
      });
    });
  }

  return targets;
}

/**
 * Automatically allocates and distributes a batch of chapters sequentially or spread across days.
 */
export function autoSpreadChapters(input: TargetAllocationInput): AllocationResult {
  const { chapters, startDate, daysCount, mode, targetDate } = input;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const monthKey = getMonthRangeKey(start);

  const monthlyTargets: MonthlyTarget[] = [];
  const weeklyTargets: WeeklyTarget[] = [];
  const dailyTargets: DailyTarget[] = [];

  // 1. Build Monthly Targets
  chapters.forEach((ch, idx) => {
    const mtId = `mt_${start.getFullYear()}_${start.getMonth()}_${idx}_${Date.now()}`;

    const mt: MonthlyTarget = {
      id: mtId,
      track: ch.track,
      program: ch.program,
      subject: ch.subject,
      chapter: ch.chapter,
      totalChapterSize: ch.size,
      targetMonth: monthKey,
      completed: false,
    };
    monthlyTargets.push(mt);

    // Distribute daily and weekly
    if (mode === 'single-day') {
      const targetDay = targetDate || startDate;
      const weekKey = getWeekRangeKey(targetDay);
      mt.targetWeek = weekKey;

      dailyTargets.push({
        id: `dt_${Date.now()}_${idx}`,
        monthlyTargetId: mtId,
        track: ch.track,
        program: ch.program,
        subject: ch.subject,
        chapter: ch.chapter,
        date: targetDay,
        portionSize: ch.size,
        completed: false,
      });

      weeklyTargets.push({
        id: `wt_${Date.now()}_${idx}`,
        monthlyTargetId: mtId,
        source: 'monthly',
        track: ch.track,
        program: ch.program,
        subject: ch.subject,
        chapter: ch.chapter,
        targetWeek: weekKey,
        completed: false,
        size: ch.size,
      });
    } else if (mode === 'sequential') {
      // One chapter every N days
      const daysPerChapter = Math.max(1, Math.floor(daysCount / Math.max(1, chapters.length)));
      const chStartDate = new Date(start);
      chStartDate.setDate(start.getDate() + idx * daysPerChapter);

      const dateStr = chStartDate.toISOString().slice(0, 10);
      const weekKey = getWeekRangeKey(dateStr);
      mt.targetWeek = weekKey;

      dailyTargets.push({
        id: `dt_${Date.now()}_${idx}`,
        monthlyTargetId: mtId,
        track: ch.track,
        program: ch.program,
        subject: ch.subject,
        chapter: ch.chapter,
        date: dateStr,
        portionSize: ch.size,
        completed: false,
      });

      weeklyTargets.push({
        id: `wt_${Date.now()}_${idx}`,
        monthlyTargetId: mtId,
        source: 'monthly',
        track: ch.track,
        program: ch.program,
        subject: ch.subject,
        chapter: ch.chapter,
        targetWeek: weekKey,
        completed: false,
        size: ch.size,
      });
    } else {
      // Even-spread mode
      const step = Math.max(1, Math.floor(daysCount / Math.max(1, chapters.length)));
      const curDate = new Date(start);
      curDate.setDate(start.getDate() + (idx % daysCount) * step);

      const dateStr = curDate.toISOString().slice(0, 10);
      const weekKey = getWeekRangeKey(dateStr);
      mt.targetWeek = weekKey;

      dailyTargets.push({
        id: `dt_${Date.now()}_${idx}`,
        monthlyTargetId: mtId,
        track: ch.track,
        program: ch.program,
        subject: ch.subject,
        chapter: ch.chapter,
        date: dateStr,
        portionSize: ch.size,
        completed: false,
      });

      weeklyTargets.push({
        id: `wt_${Date.now()}_${idx}`,
        monthlyTargetId: mtId,
        source: 'monthly',
        track: ch.track,
        program: ch.program,
        subject: ch.subject,
        chapter: ch.chapter,
        targetWeek: weekKey,
        completed: false,
        size: ch.size,
      });
    }
  });

  return {
    monthlyTargets,
    weeklyTargets,
    dailyTargets,
  };
}

/**
 * Computes completed portion and progress percentage for a target.
 */
export function calculateTargetProgress(
  target: MonthlyTarget,
  dailyTargets: DailyTarget[]
): { completedSize: number; percent: number; isCompleted: boolean } {
  const matchingDaily = dailyTargets.filter(
    (d) =>
      d.monthlyTargetId === target.id ||
      (d.subject === target.subject && d.chapter === target.chapter)
  );

  let completedSize = 0;
  matchingDaily.forEach((d) => {
    if (d.completed) {
      completedSize += d.portionSize || 0;
    }
  });

  const total = target.totalChapterSize || 1;
  const percent = Math.min(100, Math.round((completedSize / total) * 100));
  const isCompleted = !!target.completed || completedSize >= total;

  return {
    completedSize,
    percent,
    isCompleted,
  };
}
