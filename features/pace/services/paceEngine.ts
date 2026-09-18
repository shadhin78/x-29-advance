/**
 * X-29 Pace Calculation Engine (features/pace/services/paceEngine.ts)
 * 
 * Pure mathematical functions for:
 * - Statistical estimation of velocity (reqPace, curPace)
 * - Projected finish date calculation
 * - Target subjects resolution for global, program, subject, and bundled goals
 * - Pure, UI-independent calculation
 */

import type { PaceGoal, PaceStats } from '@/types/pace';

export const DEFAULT_PACE_GOALS: PaceGoal[] = [
  {
    id: 'pace-global-default',
    type: 'global',
    target: 'Global Academic Goal',
    startDate: '2026-01-01',
    deadline: '2026-10-31',
  },
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Resolves the Set of subject names targeted by a pace goal.
 */
export function resolveTargetedSubjects(
  goal: PaceGoal,
  allSubjects: { subject: string; program: string }[]
): Set<string> {
  const targeted = new Set<string>();

  if (goal.type === 'global') {
    if (goal.subjects && goal.subjects.length > 0) {
      goal.subjects.forEach((s) => targeted.add(s));
    } else {
      // Defaults to all subjects
      allSubjects.forEach((s) => targeted.add(s.subject));
    }
  } else if (goal.type === 'bundle') {
    if (goal.subjects && Array.isArray(goal.subjects)) {
      goal.subjects.forEach((s) => targeted.add(s));
    }
    if (goal.programs && Array.isArray(goal.programs)) {
      allSubjects.forEach((s) => {
        if (goal.programs?.includes(s.program)) {
          targeted.add(s.subject);
        }
      });
    }
  } else if (goal.type === 'program') {
    allSubjects.forEach((s) => {
      if (s.program === goal.target) {
        targeted.add(s.subject);
      }
    });
  } else if (goal.type === 'subject') {
    targeted.add(goal.target);
  }

  return targeted;
}

/**
 * Calculates complete, accurate velocity and finish date statistics for a pace goal.
 */
export function calculatePaceStats(
  goal: PaceGoal,
  targetedSubjects: Set<string>,
  subjectStats: Record<string, { totalChapters: number; completedChapters: number }>,
  now: Date = new Date()
): PaceStats {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  let total = 0;
  let completed = 0;

  targetedSubjects.forEach((subName) => {
    const s = subjectStats[subName];
    if (s) {
      total += s.totalChapters || 0;
      completed += s.completedChapters || 0;
    }
  });

  total = Math.max(0, total);
  completed = Math.max(0, completed);
  const remaining = Math.max(0, total - completed);

  const startDate = goal.startDate ? new Date(goal.startDate) : new Date('2026-01-01');
  const targetDate = goal.deadline ? new Date(goal.deadline) : new Date();
  startDate.setHours(0, 0, 0, 0);
  targetDate.setHours(23, 59, 59, 999);

  const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - startDate.getTime()) / MS_PER_DAY));
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / MS_PER_DAY));

  let reqPaceVal = 0;
  let curPaceVal = 0;

  if (total > 0) {
    if (today < startDate) {
      reqPaceVal = total / totalDays;
      curPaceVal = 0;
    } else if (today > targetDate) {
      reqPaceVal = remaining > 0 ? remaining : 0;
      curPaceVal = completed / Math.max(1, daysElapsed);
    } else {
      reqPaceVal = remaining > 0 ? remaining / Math.max(1, daysRemaining) : 0;
      curPaceVal = completed / Math.max(1, daysElapsed);
    }
  }

  const reqPace = Math.round(reqPaceVal * 100) / 100;
  const curPace = Math.round(curPaceVal * 100) / 100;
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  let projectedFinish = '—';
  let daysNeeded = 0;
  let status: PaceStats['status'] = 'no-data';

  if (total === 0) {
    status = 'no-data';
  } else if (remaining <= 0) {
    status = 'finished';
    projectedFinish = 'Finished';
  } else {
    if (curPace <= 0) {
      if (today < startDate) {
        status = 'future';
        projectedFinish = 'Future';
      } else if (today > targetDate) {
        status = 'overdue';
        projectedFinish = 'Overdue';
      } else {
        status = 'no-data';
      }
    } else {
      daysNeeded = Math.ceil(remaining / curPace);
      const projDate = new Date(today);
      projDate.setDate(projDate.getDate() + daysNeeded);
      projectedFinish = projDate.toISOString().slice(0, 10);

      if (today > targetDate) {
        status = 'overdue';
      } else if (curPace >= reqPace) {
        status = 'on-track';
      } else {
        status = 'behind';
      }
    }
  }

  const isBehind = status === 'behind' || status === 'overdue';

  return {
    total,
    completed,
    remaining,
    percentage,
    totalDays,
    daysElapsed,
    daysRemaining,
    reqPace,
    curPace,
    projectedFinish,
    daysNeeded,
    isBehind,
    status,
  };
}
