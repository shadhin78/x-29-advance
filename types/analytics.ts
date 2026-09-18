/**
 * X-29 Analytics Types (types/analytics.ts)
 */

export interface AnalyticsKpiSummary {
  avgCompletion: number;
  totalActions: number;
  activeStreak: number;
  daysRemaining: number;
}

export type FocusHeatmapRange = 30 | 90 | 180 | 365;

export type HeatmapTier = 'zero' | 'rose' | 'blue' | 'green' | 'gold' | 'diamond';

export interface FocusDayData {
  dateKey: string;
  date: Date;
  hours: number;
  seconds: number;
  isFuture: boolean;
  tier: HeatmapTier;
  subjects?: string[];
}

export interface HeatmapStats {
  activeDays: number;
  streak: number;
  zeroCount: number;
  redCount: number;
  blueCount: number;
  greenCount: number;
  goldCount: number;
  gemCount: number;
}

export interface ChapterMapItem {
  subject: string;
  chapterNum: number;
  status: 'complete' | 'incomplete' | 'skip';
}

export interface ChapterMapStats {
  completed: number;
  incomplete: number;
  skipped: number;
  total: number;
  effectiveTotal: number;
  completionPercentage: number;
}

export interface HabitRadarData {
  monthName: string;
  year: number;
  daysInMonth: number;
  habits: string[];
  monthData: Record<string, boolean[]>;
  pct: number;
  fulfilledCount: number;
  totalCells: number;
  streak: number;
  daysLogged: number;
}
