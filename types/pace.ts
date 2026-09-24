/**
 * X-29 Pace Types (types/pace.ts)
 */

export interface PaceGoal {
  id: string;
  type: 'global' | 'program' | 'subject' | 'bundle';
  target: string; // Goal Name or Program / Subject Name
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  subjects?: string[];
  programs?: string[];
  secondaryPaces?: string[];
  notes?: string;
}

export interface PaceStats {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  reqPace: number; // Chapters / day
  curPace: number; // Chapters / day
  projectedFinish: string;
  daysNeeded: number;
  isBehind: boolean;
  status: 'finished' | 'on-track' | 'behind' | 'future' | 'overdue' | 'no-data';
  timeGoalCountdownStr?: string;
  finishDisplay?: string;
  estDaysNeededStr?: string;
  projectedDate?: string;
}
