/**
 * X-29 Target Domain Types (types/targets.ts)
 */

export interface MonthlyTarget {
  id: string;
  track: string;
  program: string;
  subject: string;
  chapter: string;
  totalChapterSize: number;
  targetWeek?: string;
  targetMonth: string; // e.g. '01 Sep 2026 - 30 Sep 2026'
  completed?: boolean;
  notes?: string;
  dailyAllocations?: Record<string, number>; // date 'YYYY-MM-DD' -> portion size
}

export interface WeeklyTarget {
  id: string;
  monthlyTargetId?: string;
  source?: 'monthly' | 'manual';
  track: string;
  program: string;
  subject: string;
  chapter: string;
  targetWeek: string;
  completed?: boolean;
  size?: number;
}

export interface DailyTarget {
  id: string;
  monthlyTargetId?: string;
  weeklyTargetId?: string;
  track: string;
  program: string;
  subject: string;
  chapter: string;
  date: string; // 'YYYY-MM-DD'
  portionSize: number;
  completed?: boolean;
}

export type MonthlyTargetsDatabase = Record<string, MonthlyTarget[]>;
export type WeeklyTargetsDatabase = Record<string, WeeklyTarget[]>;
export type DailyTargetsDatabase = Record<string, DailyTarget[]>;

export interface TargetAllocationInput {
  chapters: {
    track: string;
    program: string;
    subject: string;
    chapter: string;
    size: number;
  }[];
  startDate: string; // 'YYYY-MM-DD'
  daysCount: number; // e.g. 30
  mode: 'sequential' | 'even-spread' | 'single-day';
  targetDate?: string;
}

export interface AllocationResult {
  monthlyTargets: MonthlyTarget[];
  weeklyTargets: WeeklyTarget[];
  dailyTargets: DailyTarget[];
}
