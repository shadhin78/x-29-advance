/**
 * X-29 Focus Timer & Chronograph Types
 */

export type TimerMode = 'stopwatch' | 'timer' | 'alarm';

export interface ActiveTimerState {
  isRunning: boolean;
  mode: TimerMode;
  startTime: number | null;
  elapsedBeforeStart: number;
  targetDuration: number;
  selectedSubject: string;
}

export interface TimerLogSession {
  id?: string;
  sessionId?: string;
  subject: string;
  durationSeconds: number;
  mode: TimerMode;
  timestamp: number;
  date?: string;
}
