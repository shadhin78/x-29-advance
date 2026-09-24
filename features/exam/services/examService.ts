/**
 * X-29 Exam Routine Domain Service (features/exam/services/examService.ts)
 * 
 * Pure domain service for exam routine timetables, calendar-accurate time remaining,
 * tiered countdown calculation, date formatters, and status helpers.
 * 
 * ZERO DOM, ZERO React, ZERO direct window dependencies.
 * Deterministic and 100% unit-testable.
 */

import type { ExamRoutineItem, ExamSession, ExamCountdownDetails } from '@/types/exam';

export const DEFAULT_EXAM_SESSIONS: ExamSession[] = [
  {
    id: 'session_cs_midterm',
    program: 'Computer Science',
    name: 'Midterm Examination',
    startDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'session_math_finals',
    program: 'Mathematics',
    name: 'Semester Finals',
    startDate: new Date(Date.now() + 26 * 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 35 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now() - 43200000,
  },
];

export const DEFAULT_EXAM_ROUTINE: ExamRoutineItem[] = [
  {
    id: 'exam_dsa_1',
    sessionId: 'session_cs_midterm',
    mode: 'program',
    subject: 'Data Structures & Algorithms',
    title: 'Data Structures & Algorithms',
    program: 'Computer Science',
    code: 'CSE-201',
    date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    time: '10:00',
    startTime: '10:00',
    endTime: '13:00',
    room: 'Hall 402',
    status: 'upcoming',
    completed: false,
    routineSet: 1,
    createdAt: Date.now() - 80000000,
  },
  {
    id: 'exam_os_1',
    sessionId: 'session_cs_midterm',
    mode: 'program',
    subject: 'Operating Systems',
    title: 'Operating Systems',
    program: 'Computer Science',
    code: 'CSE-202',
    date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
    time: '14:00',
    startTime: '14:00',
    endTime: '17:00',
    room: 'Hall 403',
    status: 'upcoming',
    completed: false,
    routineSet: 1,
    createdAt: Date.now() - 70000000,
  },
  {
    id: 'exam_math_1',
    sessionId: 'session_math_finals',
    mode: 'program',
    subject: 'Discrete Mathematics',
    title: 'Discrete Mathematics',
    program: 'Mathematics',
    code: 'MTH-102',
    date: new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10),
    time: '10:00',
    startTime: '10:00',
    endTime: '13:00',
    room: 'Hall 101',
    status: 'upcoming',
    completed: false,
    routineSet: 1,
    createdAt: Date.now() - 60000000,
  },
];

/**
 * Parses YYYY-MM-DD date and optional HH:MM time into epoch milliseconds.
 */
export function parseExamDateTime(
  itemOrDate: ExamRoutineItem | { date: string; time?: string; startTime?: string } | string,
  timeParam?: string
): number {
  let dateStr = '';
  let timeStr = '';

  if (typeof itemOrDate === 'string') {
    dateStr = itemOrDate;
    timeStr = timeParam || '00:00';
  } else if (itemOrDate && typeof itemOrDate === 'object') {
    dateStr = itemOrDate.date || '';
    timeStr = itemOrDate.time || itemOrDate.startTime || '00:00';
  }

  if (!dateStr) return NaN;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return NaN;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  let hours = 0;
  let minutes = 0;
  if (timeStr) {
    const timeParts = timeStr.split(':');
    hours = parseInt(timeParts[0], 10) || 0;
    minutes = parseInt(timeParts[1], 10) || 0;
  }

  const dt = new Date(year, month, day, hours, minutes, 0, 0);
  return dt.getTime();
}

/**
 * Calculates calendar-accurate remaining time between two dates.
 * Matches legacy js/features/exam/countdown.js logic with exact month/day borrowing.
 */
export function calculateExamTimeRemaining(fromDate: Date, toDate: Date): {
  isPast: boolean;
  years: number;
  months: number;
  days: number;
  hours: number;
  mins: number;
  secs: number;
  tier: 'days' | 'months' | 'years';
  totalMs: number;
  diffMs: number;
} {
  if (!fromDate || !toDate) {
    return {
      isPast: true,
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      mins: 0,
      secs: 0,
      tier: 'days',
      totalMs: 0,
      diffMs: 0,
    };
  }

  const diffMs = toDate.getTime() - fromDate.getTime();
  if (diffMs <= 0) {
    return {
      isPast: true,
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      mins: 0,
      secs: 0,
      tier: 'days',
      totalMs: 0,
      diffMs,
    };
  }

  const y1 = fromDate.getFullYear();
  const m1 = fromDate.getMonth();
  const d1 = fromDate.getDate();
  const h1 = fromDate.getHours();
  const min1 = fromDate.getMinutes();
  const s1 = fromDate.getSeconds();

  const y2 = toDate.getFullYear();
  const m2 = toDate.getMonth();
  const d2 = toDate.getDate();
  const h2 = toDate.getHours();
  const min2 = toDate.getMinutes();
  const s2 = toDate.getSeconds();

  let years = y2 - y1;
  let months = m2 - m1;
  let days = d2 - d1;
  let hours = h2 - h1;
  let mins = min2 - min1;
  let secs = s2 - s1;

  if (secs < 0) {
    secs += 60;
    mins -= 1;
  }
  if (mins < 0) {
    mins += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    // Borrow days from previous month relative to target month (m2 in year y2)
    const daysInPrevMonth = new Date(y2, m2, 0).getDate();
    days += daysInPrevMonth;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  // Determine tier based on remaining duration:
  // 1) >= 1 Year -> tier 'years' -> [ Year, Month, Day, Hr ]
  // 2) >= 1 Month and < 1 Year -> tier 'months' -> [ Month, Day, Hr, Min ]
  // 3) < 1 Month -> tier 'days' -> [ Day, Hr, Min, Sec ]
  let tier: 'days' | 'months' | 'years' = 'days';
  if (years >= 1) {
    tier = 'years';
  } else if (months >= 1) {
    tier = 'months';
  } else {
    tier = 'days';
  }

  return {
    isPast: false,
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    mins: Math.max(0, mins),
    secs: Math.max(0, secs),
    tier,
    totalMs: diffMs,
    diffMs,
  };
}

/**
 * Formats countdown breakdown object into a compact string.
 */
export function formatExamCountdownString(
  rem: ReturnType<typeof calculateExamTimeRemaining>
): string {
  if (!rem || rem.isPast) return 'Ended';
  if (rem.tier === 'years') {
    return `${String(rem.years).padStart(2, '0')}y ${String(rem.months).padStart(2, '0')}mo ${String(rem.days).padStart(2, '0')}d ${String(rem.hours).padStart(2, '0')}h`;
  } else if (rem.tier === 'months') {
    return `${String(rem.months).padStart(2, '0')}mo ${String(rem.days).padStart(2, '0')}d ${String(rem.hours).padStart(2, '0')}h ${String(rem.mins).padStart(2, '0')}m`;
  } else {
    return `${String(rem.days).padStart(2, '0')}d ${String(rem.hours).padStart(2, '0')}h ${String(rem.mins).padStart(2, '0')}m ${String(rem.secs).padStart(2, '0')}s`;
  }
}

/**
 * Formats YYYY-MM-DD date into "14 Oct 2026".
 */
export function formatSessionDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [yr, mo, dy] = parts.map(Number);
  if (isNaN(yr) || isNaN(mo) || isNaN(dy)) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[mo - 1] || '';
  const dayStr = String(dy).padStart(2, '0');
  return `${dayStr} ${monthName} ${yr}`;
}

/**
 * Determines if an exam is completed or its schedule is over (2 hours past exam start).
 */
export function isExamDoneOrOver(exam: ExamRoutineItem, nowMs: number = Date.now()): boolean {
  if (!exam) return true;
  if (exam.status === 'completed' || exam.completed) return true;
  const exTimeMs = parseExamDateTime(exam);
  if (isNaN(exTimeMs)) return false;
  return exTimeMs <= (nowMs - 7200000); // 2 hours grace period
}

/**
 * Sorts exams chronologically.
 */
export function sortExams(exams: ExamRoutineItem[]): ExamRoutineItem[] {
  return [...exams].sort((a, b) => {
    const ta = parseExamDateTime(a) || 0;
    const tb = parseExamDateTime(b) || 0;
    return ta - tb;
  });
}

/**
 * Resolves the target exam and calculates live countdown details.
 */
export function calculateExamCountdown(
  exams: ExamRoutineItem[],
  sessions: ExamSession[] = [],
  selectedExamId = 'auto',
  nowMs = Date.now()
): ExamCountdownDetails {
  const defaultReturn: ExamCountdownDetails = {
    targetExam: null,
    targetSession: null,
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    tier: 'days',
    isPast: false,
    isLiveToday: false,
    totalMsRemaining: 0,
    diffMs: 0,
  };

  if (!Array.isArray(exams) || exams.length === 0) {
    return defaultReturn;
  }

  // Parse valid user exams with timestamp
  const userExams = exams
    .filter((e) => e && e.subject && e.date)
    .map((e) => ({ ...e, timeMs: parseExamDateTime(e) }))
    .filter((e) => !isNaN(e.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs);

  if (userExams.length === 0) return defaultReturn;

  const upcomingExams = userExams.filter(
    (e) => e.status !== 'completed' && !e.completed && e.timeMs > (nowMs - 7200000)
  );

  let targetExam: ExamRoutineItem | null = null;
  if (selectedExamId && selectedExamId !== 'auto') {
    targetExam = userExams.find((e) => e.id === selectedExamId) || null;
  }
  if (!targetExam) {
    targetExam = upcomingExams[0] || null;
  }

  if (!targetExam) {
    return defaultReturn;
  }

  const targetSession =
    sessions.find((s) => s.id === targetExam?.sessionId) ||
    sessions.find((s) => s.program === targetExam?.program) ||
    null;

  const targetTimeMs = parseExamDateTime(targetExam);
  const targetDate = new Date(targetTimeMs);
  const currentDate = new Date(nowMs);
  const rem = calculateExamTimeRemaining(currentDate, targetDate);

  const isLiveToday = rem.isPast && rem.diffMs > -7200000;

  return {
    targetExam,
    targetSession,
    years: rem.years,
    months: rem.months,
    days: rem.days,
    hours: rem.hours,
    minutes: rem.mins,
    seconds: rem.secs,
    tier: rem.tier,
    isPast: rem.isPast,
    isLiveToday,
    totalMsRemaining: rem.totalMs,
    diffMs: rem.diffMs,
  };
}

/**
 * Converts a hex color into RGBA with the given opacity.
 */
export function hexToRgba(hex: string, alpha = 0.3): string {
  if (!hex || typeof hex !== 'string') return `rgba(244, 63, 94, ${alpha})`;
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return `rgba(244, 63, 94, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
