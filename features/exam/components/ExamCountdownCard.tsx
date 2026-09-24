'use client';

/**
 * Legacy compatibility wrapper for ExamHeroCountdown
 */

import React from 'react';
import type { ExamRoutineItem } from '@/types/exam';
import { ExamHeroCountdown } from './ExamHeroCountdown';

interface ExamCountdownCardProps {
  exams: ExamRoutineItem[];
  selectedExamId: string;
  onSelectExamId: (id: string) => void;
}

export const ExamCountdownCard: React.FC<ExamCountdownCardProps> = ({
  exams,
  selectedExamId,
  onSelectExamId,
}) => {
  return (
    <ExamHeroCountdown
      exams={exams}
      sessions={[]}
      selectedExamId={selectedExamId}
      onSelectExamId={onSelectExamId}
    />
  );
};
