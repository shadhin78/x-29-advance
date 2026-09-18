/**
 * X-29 Exam Routine & Session Types
 */

export interface ExamRoutineItem {
  id: string;
  subject: string;
  program?: string;
  code?: string;
  date: string; // YYYY-MM-DD or ISO
  time?: string; // HH:MM
  startTime?: string;
  endTime?: string;
  room?: string;
  completed?: boolean;
  routineSet?: number; // 1 or 2
}

export interface ExamSession {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  routine: ExamRoutineItem[];
}

export interface ExamCountdownDetails {
  targetExam: ExamRoutineItem | null;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalMsRemaining: number;
}
