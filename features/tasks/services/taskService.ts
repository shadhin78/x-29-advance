/**
 * X-29 Task Domain Service (features/tasks/services/taskService.ts)
 * 
 * Pure calculations for study task completions, chapter status tracking,
 * and syllabus progress aggregation.
 * 
 * ZERO DOM, ZERO React, ZERO direct window dependencies.
 */

import type { StudyTask } from '@/types/task';

export interface SubjectTaskProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
  status: 'completed' | 'in-progress' | 'not-started';
}

/**
 * Returns a Set of completed chapter numbers for a given subject.
 */
export function getCompletedChaptersForSubject(tasks: StudyTask[], subjectName: string): Set<number> {
  const set = new Set<number>();
  if (!Array.isArray(tasks)) return set;

  tasks.forEach((t) => {
    if (t && t.subject === subjectName && t.completed && !t.skipped) {
      const num = Number(t.chapter);
      if (!isNaN(num) && num > 0) {
        set.add(num);
      }
    }
  });

  return set;
}

/**
 * Computes progress stats for a subject based on its completed chapter tasks.
 */
export function calculateSubjectProgress(
  tasks: StudyTask[],
  subjectName: string,
  totalChapters: number
): SubjectTaskProgress {
  const safeTotal = Math.max(1, totalChapters);
  const completedSet = getCompletedChaptersForSubject(tasks, subjectName);
  const completedCount = completedSet.size;
  const percentage = Math.min(100, Math.round((completedCount / safeTotal) * 100));

  let status: 'completed' | 'in-progress' | 'not-started' = 'not-started';
  if (completedCount >= safeTotal) {
    status = 'completed';
  } else if (completedCount > 0) {
    status = 'in-progress';
  }

  return {
    completedCount,
    totalCount: safeTotal,
    percentage,
    status,
  };
}

/**
 * Toggles completion for a chapter of a subject in the task list.
 */
export function toggleChapterTask(
  tasks: StudyTask[],
  subjectName: string,
  chapterNumber: number,
  trackId = 'trackA'
): StudyTask[] {
  const updated = [...tasks];
  const existingIdx = updated.findIndex(
    (t) => t.subject === subjectName && Number(t.chapter) === chapterNumber
  );

  const now = new Date().toISOString();
  if (existingIdx >= 0) {
    const prev = updated[existingIdx];
    const newCompleted = !prev.completed;
    updated[existingIdx] = {
      ...prev,
      completed: newCompleted,
      actualDateCompleted: newCompleted ? now : null,
      updatedAt: Date.now(),
    };
  } else {
    // Create new completed task
    updated.push({
      id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      date: now.slice(0, 10),
      track: trackId,
      subject: subjectName,
      chapter: chapterNumber,
      completed: true,
      actualDateCompleted: now,
      updatedAt: Date.now(),
    });
  }

  return updated;
}
