'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

export default function AnalyticsPage() {
  return (
    <FeaturePlaceholder
      title="Spectra Analytics"
      description="Advanced syllabus breakdown, concentric SVG chapter maps, habit radar visualizations, and pacing scope burn-up analytics."
      icon={BarChart3}
      phase="Phase 4D — Feature Stage"
      badgeColor="text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20"
    />
  );
}
