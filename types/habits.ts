/**
 * X-29 Habit Domain Types (types/habits.ts)
 */

export interface DailyHabit {
  id: string;
  name: string;
  color?: string;
  history: Record<string, boolean>; // 'YYYY-MM-DD' -> true
  streak?: number;
  bestStreak?: number;
}
