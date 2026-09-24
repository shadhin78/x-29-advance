/**
 * X-29 Schedule Types (types/schedule.ts)
 */

export interface ScheduleBlock {
  id: string;
  day: string; // 'Daily'
  startTime: string; // '09:00'
  endTime: string; // '10:00'
  task: string;
  track?: string;
  program?: string;
  color?: string;
  isDayStart?: boolean;
}

export interface ScheduleGroup {
  id: string;
  name: string;
  color: string;
  items: string[];
}

export interface ScheduleSegment {
  id: string;
  task: string;
  track?: string;
  program?: string;
  color: string;
  startTime: string; // e.g. '9:00 AM'
  endTime: string; // e.g. '10:00 AM'
  startMin: number;
  endMin: number;
  duration: number;
  isDayStart: boolean;
}

export interface ActiveSlotInfo {
  activeBlock: ScheduleBlock | null;
  remainingMinutes: number;
  elapsedMinutes: number;
  progressPercent: number;
  nextBlock: ScheduleBlock | null;
  countdownStr: string;
}
