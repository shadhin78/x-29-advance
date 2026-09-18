'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

export default function ExamRoutinePage() {
  return (
    <FeaturePlaceholder
      title="Exam Routine"
      description="Scheduled exam routine calendar, exam sessions management, and live countdown timer widgets."
      icon={GraduationCap}
      phase="Phase 4C — Feature Stage"
      badgeColor="text-red-400 bg-rose-500/10 border-rose-500/20"
    />
  );
}
