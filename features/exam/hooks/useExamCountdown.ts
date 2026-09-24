'use client';

/**
 * X-29 Exam Countdown Hook (features/exam/hooks/useExamCountdown.ts)
 * 
 * Drives live countdown visual display with 1-second ticks
 * and visibility change re-synchronization.
 */

import { useState, useEffect, useMemo } from 'react';
import type { ExamRoutineItem, ExamSession, ExamCountdownDetails } from '@/types/exam';
import { calculateExamCountdown } from '@/features/exam/services/examService';

export function useExamCountdown(
  exams: ExamRoutineItem[],
  sessions: ExamSession[] = [],
  selectedExamId = 'auto'
): ExamCountdownDetails {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    const handleVisibility = () => {
      if (!document.hidden) {
        setNowMs(Date.now());
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return useMemo(() => {
    return calculateExamCountdown(exams, sessions, selectedExamId, nowMs);
  }, [exams, sessions, selectedExamId, nowMs]);
}
