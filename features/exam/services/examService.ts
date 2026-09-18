/**
 * X-29 Exam Routine Domain Service (features/exam/services/examService.ts)
 * 
 * Pure calculations for exam schedules, sorting, date parsing,
 * and upcoming exam countdown logic.
 * 
 * ZERO DOM, ZERO React, ZERO direct window dependencies.
 */

import type { ExamRoutineItem, ExamCountdownDetails } from '@/types/exam';

export const DEFAULT_EXAM_ROUTINE: ExamRoutineItem[] = [
  {
    id: 'exam_dsa_1',
    subject: 'Data Structures & Algorithms',
    program: 'Computer Science',
    code: 'CSE-201',
    date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    time: '10:00',
    startTime: '10:00',
    endTime: '13:00',
    room: 'Hall 402',
    completed: false,
    routineSet: 1,
  },
  {
    id: 'exam_os_1',
    subject: 'Operating Systems',
    program: 'Computer Science',
    code: 'CSE-202',
    date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
    time: '14:00',
    startTime: '14:00',
    endTime: '17:00',
    room: 'Hall 403',
    completed: false,
    routineSet: 1,
  },
  {
    id: 'exam_math_1',
    subject: 'Discrete Mathematics',
    program: 'Mathematics',
    code: 'MTH-102',
    date: new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10),
    time: '10:00',
    startTime: '10:00',
    endTime: '13:00',
    room: 'Hall 101',
    completed: false,
    routineSet: 1,
  },
];

/**
 * Safely parses exam date and time into millisecond epoch.
 */
export function parseExamDateTime(exam: ExamRoutineItem): number {
  if (!exam.date) return 0;
  const timePart = exam.time || exam.startTime || '09:00';
  const isoStr = `${exam.date.slice(0, 10)}T${timePart.slice(0, 5)}:00`;
  const parsed = new Date(isoStr).getTime();
  return isNaN(parsed) ? new Date(exam.date).getTime() : parsed;
}

/**
 * Sorts exams chronologically by exam date and time.
 */
export function sortExams(exams: ExamRoutineItem[]): ExamRoutineItem[] {
  return [...exams].sort((a, b) => parseExamDateTime(a) - parseExamDateTime(b));
}

/**
 * Pure countdown calculation for selected exam or nearest upcoming exam.
 */
export function calculateExamCountdown(
  exams: ExamRoutineItem[],
  selectedExamId = 'auto',
  nowMs = Date.now()
): ExamCountdownDetails {
  const defaultReturn: ExamCountdownDetails = {
    targetExam: null,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
    totalMsRemaining: 0,
  };

  if (!Array.isArray(exams) || exams.length === 0) {
    return defaultReturn;
  }

  let target: ExamRoutineItem | null = null;

  if (selectedExamId && selectedExamId !== 'auto') {
    target = exams.find((e) => e.id === selectedExamId) || null;
  }

  // If auto or selected not found, choose the nearest upcoming non-completed exam
  if (!target) {
    const upcoming = exams
      .filter((e) => !e.completed && parseExamDateTime(e) >= nowMs)
      .sort((a, b) => parseExamDateTime(a) - parseExamDateTime(b));

    if (upcoming.length > 0) {
      target = upcoming[0];
    } else {
      // If none upcoming, pick the nearest one in the future or last exam
      const sorted = sortExams(exams);
      target = sorted[sorted.length - 1] || null;
    }
  }

  if (!target) return defaultReturn;

  const targetMs = parseExamDateTime(target);
  const diff = targetMs - nowMs;
  const isPast = diff <= 0;
  const safeDiff = Math.max(0, diff);

  const totalSecs = Math.floor(safeDiff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  return {
    targetExam: target,
    days,
    hours,
    minutes,
    seconds,
    isPast,
    totalMsRemaining: safeDiff,
  };
}
