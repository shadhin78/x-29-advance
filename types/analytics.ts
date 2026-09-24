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

export type TrendTimeFilter = '1Y' | '2Y' | '3Y' | 'ALL';

export interface ProgramTrendSeries {
  name: string;
  color: string;
  values: number[];
}

export interface ProgramTrendData {
  months: string[];
  programs: ProgramTrendSeries[];
}

export interface DailyActionMonthlyData {
  days: number[];
  dailyCounts: number[];
  monthName: string;
  year: number;
  totalFulfilled: number;
  successRate: number;
  habitsBreakdown: Array<{ name: string; color: string; count: number }>;
}

export interface FocusAnalyticsPoint {
  dateStr: string;
  label: string;
  hours: number;
  target: number;
}

export interface FocusAnalyticsMetrics {
  points: FocusAnalyticsPoint[];
  totalFocusHours: number;
  avgFocusHours: number;
  peakHours: number;
  peakDate: string;
  avgTargetHours: number;
  successRate: number;
  successDays: number;
  totalDays: number;
}
