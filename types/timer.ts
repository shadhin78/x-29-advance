/**
 * X-29 Focus Timer & Chronograph Types
 */

export type TimerMode = 'stopwatch' | 'timer' | 'alarm';

export type TimerStatus = 'ready' | 'running' | 'paused' | 'completed';

export interface ModeTimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedBeforeStart: number;
  targetDuration: number;
  updatedAt: number;
  alarmStart?: string;
  alarmEnd?: string;
  alarmUseCurrent?: boolean;
}

export interface ActiveTimerState {
  isRunning: boolean;
  mode: TimerMode;
  startTime: number | null;
  elapsedBeforeStart: number;
  targetDuration: number;
  selectedSubject: string;
  alarmStart?: string;
  alarmEnd?: string;
  alarmUseCurrent?: boolean;
  updatedAt?: number;
  timerStates?: Partial<Record<TimerMode, ModeTimerState>>;
}

export interface TimerLogSession {
  id: string;
  subject: string;
  duration: number; // in seconds
  durationSeconds?: number; // legacy compatibility alias
  date: string; // ISO date string
  mode: TimerMode;
  createdAt?: string;
  updatedAt?: number;
}

export type SessionHistoryFilter = 'all' | 'day' | 'week' | 'month' | 'year';

export interface SubjectFocusTarget {
  hours: number | string;
  minutes: number | string;
  createdAt?: string;
}

export interface SubjectTargetProgress {
  subject: string;
  targetSeconds: number;
  doneSeconds: number;
  remainingSeconds: number;
  progressPercent: number;
  isCompleted: boolean;
  color: string;
}

export interface SubjectBreakdownItem {
  subject: string;
  totalSeconds: number;
  percentage: number;
  formattedDuration: string;
  color: string;
}

export interface TimerDigits {
  hours: string;
  minutes: string;
  seconds: string;
  hundredths: string;
  hhmm: string;
  ss: string;
  fullClock: string;
}

export interface DialAngles {
  mainHandDeg: number;
  subdialDeg: number;
}
