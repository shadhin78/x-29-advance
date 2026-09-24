/**
 * X-29 Exam Routine & Session Types (types/exam.ts)
 * 
 * Supports both canonical session-based exam timetables and backwards-compatible fields.
 */

export interface ExamRoutineItem {
  id: string;
  sessionId?: string;
  mode?: 'program' | 'non-program';
  subject: string;
  title?: string;
  program?: string;
  code?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  startTime?: string;
  endTime?: string;
  room?: string;
  venue?: string;
  status?: 'upcoming' | 'completed';
  completed?: boolean;
  createdAt?: number;
  updatedAt?: number;
  routineSet?: number; // Backwards compatibility for early drafts
}

export interface ExamSession {
  id: string;
  program: string; // Program name or 'Non-Program'
  name?: string; // e.g. "Midterm Exams", "Finals"
  title?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  createdAt?: number;
  updatedAt?: number;
  routine?: ExamRoutineItem[]; // Optional embedded routine for legacy backups
}

export interface ExamCountdownDetails {
  targetExam: ExamRoutineItem | null;
  targetSession: ExamSession | null;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  tier: 'days' | 'months' | 'years';
  isPast: boolean;
  isLiveToday: boolean;
  totalMsRemaining: number;
  diffMs: number;
}
