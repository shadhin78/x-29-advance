'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

export default function SchedulePage() {
  return (
    <FeaturePlaceholder
      title="Daily Schedule"
      description="Interactive time-slot blocks, dual routine set switcher, and schedule group managers."
      icon={CalendarDays}
      phase="Phase 4C — Feature Stage"
      badgeColor="text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
    />
  );
}
