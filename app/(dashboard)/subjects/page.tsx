'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

export default function SubjectsPage() {
  return (
    <FeaturePlaceholder
      title="Subjects & Syllabus Progress"
      description="Multi-track syllabus progress bars, custom program breakdowns, and subject-specific study tasks."
      icon={BookOpen}
      phase="Phase 4D — Feature Stage"
      badgeColor="text-violet-400 bg-violet-500/10 border-violet-500/20"
    />
  );
}
