/**
 * X-29 Targets & Allocation Types
 */

export interface DailyAllocation {
  day: number;
  dateStr: string;
  size: number;
  fraction?: string;
  portionLabel?: string;
}

export interface MonthlyTarget {
  id?: string;
  key?: string;
  monthKey: string;
  track: string;
  program: string;
  subject: string;
  chapter: string | number;
  size: number;
  completed?: boolean;
  completedSize?: number;
  targetType?: string;
  weekBinding?: string;
  dailyAllocations?: DailyAllocation[];
  updatedAt?: number;
}

export interface WeeklyTarget {
  id?: string;
  key?: string;
  weekKey: string;
  monthKey?: string;
  track: string;
  program: string;
  subject: string;
  chapter: string | number;
  size: number;
  completed?: boolean;
  completedSize?: number;
  targetType?: string;
  parentMonthlyId?: string;
  updatedAt?: number;
}

export interface DailyTarget {
  id?: string;
  key?: string;
  dateKey: string;
  track: string;
  program?: string;
  subject: string;
  chapter?: string | number;
  title?: string;
  size?: number;
  completed?: boolean;
  isTodo?: boolean;
  parentWeeklyId?: string;
  parentMonthlyId?: string;
  updatedAt?: number;
}

export interface TargetDatabaseMap<T> {
  [groupKey: string]: T[];
}
