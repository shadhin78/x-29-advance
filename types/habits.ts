/**
 * X-29 Habit Domain Types (types/habits.ts)
 */

export interface DailyHabit {
  id: string;
  name: string;
  title?: string;
  desc?: string;
  question?: string;
  startDate?: string;
  track?: string;
  color?: string;
  icon?: string;
  priority?: number;
  order?: number;
  history: Record<string, boolean>; // 'YYYY-MM-DD' -> true
  streak?: number;
  bestStreak?: number;
}

