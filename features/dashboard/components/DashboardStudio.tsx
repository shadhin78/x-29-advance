'use client';

/**
 * X-29 Dashboard Studio Component (features/dashboard/components/DashboardStudio.tsx)
 * 
 * Modular dashboard coordinating exact legacy responsive card grid:
 * - PaceTimelineCard
 * - CompactHeatmapCard
 * - MonthlyTargetsCard
 * - GlobalCompletionCard
 * - OutcomeOverviewCard
 * - ActiveNowCard
 * - DailyTargetsCard
 * - WeeklyTargetsCard
 * - DailyActionsCard
 * - UpcomingExamsCard
 * - PassedSubjectsCard
 * - ProgramCompletionGrid
 * - TrendsBar (X Bar)
 * - TrackCompletionGrid
 */

import React, { useEffect } from 'react';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { useTimerStore } from '@/stores/useTimerStore';
import { useTargetStore } from '@/stores/useTargetStore';
import { useExamStore } from '@/stores/useExamStore';
import { useOutcomeStore } from '@/stores/useOutcomeStore';
import { usePaceStore } from '@/stores/usePaceStore';
import { useScheduleStore } from '@/stores/useScheduleStore';

import { PaceTimelineCard } from './PaceTimelineCard';
import { CompactHeatmapCard } from './CompactHeatmapCard';
import { MonthlyTargetsCard } from './MonthlyTargetsCard';
import { GlobalCompletionCard } from './GlobalCompletionCard';
import { OutcomeOverviewCard } from './OutcomeOverviewCard';
import { ActiveNowCard } from './ActiveNowCard';
import { DailyTargetsCard } from './DailyTargetsCard';
import { WeeklyTargetsCard } from './WeeklyTargetsCard';
import { DailyActionsCard } from './DailyActionsCard';
import { UpcomingExamsCard } from './UpcomingExamsCard';
import { PassedSubjectsCard } from './PassedSubjectsCard';
import { ProgramCompletionGrid } from './ProgramCompletionGrid';
import { TrendsBar } from './TrendsBar';
import { TrackCompletionGrid } from './TrackCompletionGrid';

export const DashboardStudio: React.FC = () => {
  const initTaxonomy = useTaxonomyStore((s) => s.initFromStorage);
  const initTasks = useTaskStore((s) => s.initFromStorage);
  const initHabits = useDailyActionStore((s) => s.initFromStorage);
  const initTimer = useTimerStore((s) => s.initFromStorage);
  const initTargets = useTargetStore((s) => s.initFromStorage);
  const initExams = useExamStore((s) => s.initFromStorage);
  const initOutcome = useOutcomeStore((s) => s.initFromStorage);
  const initPace = usePaceStore((s) => s.initFromStorage);
  const initSchedule = useScheduleStore((s) => s.initFromStorage);

  useEffect(() => {
    initTaxonomy();
    initTasks();
    initHabits();
    initTimer();
    initTargets();
    initExams();
    initOutcome();
    initPace();
    initSchedule();
  }, [
    initTaxonomy,
    initTasks,
    initHabits,
    initTimer,
    initTargets,
    initExams,
    initOutcome,
    initPace,
    initSchedule,
  ]);

  return (
    <div id="page-dashboard" className="space-y-6 md:space-y-8 animate-page-enter">
      {/* Responsive Grid for Dashboard Cards: 2 columns on tablet md, 3 columns on desktop xl */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full mb-6">
        {/* Row 1 */}
        <PaceTimelineCard />
        <CompactHeatmapCard />
        <MonthlyTargetsCard />

        {/* Row 2 */}
        <GlobalCompletionCard />
        <OutcomeOverviewCard />
        <ActiveNowCard />

        {/* Row 3 */}
        <DailyTargetsCard />
        <WeeklyTargetsCard />
        <DailyActionsCard />

        {/* Row 4 */}
        <UpcomingExamsCard />
        <PassedSubjectsCard />
      </div>

      {/* Program Completion Section */}
      <ProgramCompletionGrid />

      {/* X Bar at the bottom of the dashboard */}
      <TrendsBar />

      {/* Track Completion Section */}
      <TrackCompletionGrid />
    </div>
  );
};

export default DashboardStudio;
