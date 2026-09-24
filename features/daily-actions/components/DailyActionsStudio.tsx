'use client';

/**
 * X-29 Authoritative Daily Actions Studio Component (features/daily-actions/components/DailyActionsStudio.tsx)
 * 
 * 100% Visual and Behavioral Parity with legacy pages/Daily Actions/Daily Actions.html & .js:
 * 1. Daily Actions Tracker Progress Header with #btn-open-dadb and glowing percentage bar
 * 2. Daily Actions Grid (#daily-actions-grid) with Action cards, YES/NO toggle, and 180-day mini-heatmaps
 * 3. Monthly Targets Section (#monthly-targets-section) with pace metrics & navigation
 * 4. Weekly Targets Section (#weekly-targets-section) with pace metrics & navigation
 * 5. Daily Targets Section (#daily-targets-setup-section) with day navigation
 * 6. Create Daily Action Section (#add-daily-action-section) collapsible form
 * 7. Modals: DailyActionsDbModal (DADB), ActionAnalyticsModal (Habit Radar), TargetsDbModal, EditDailyActionModal
 */

import React, { useState, useEffect } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { useTargetStore } from '@/stores/useTargetStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';

import { DailyActionsTrackerHeader } from './DailyActionsTrackerHeader';
import { DailyActionsGrid } from './DailyActionsGrid';
import { MonthlyTargetsSection } from './MonthlyTargetsSection';
import { WeeklyTargetsSection } from './WeeklyTargetsSection';
import { DailyTargetsSection } from './DailyTargetsSection';
import { CreateDailyActionSection } from './CreateDailyActionSection';

import { DailyActionsDbModal } from './modals/DailyActionsDbModal';
import { ActionAnalyticsModal } from './modals/ActionAnalyticsModal';
import { TargetsDbModal } from './modals/TargetsDbModal';
import { EditDailyActionModal } from './modals/EditDailyActionModal';

export const DailyActionsStudio: React.FC = () => {
  const { initFromStorage: initHabits } = useDailyActionStore();
  const { initFromStorage: initTargets } = useTargetStore();
  const { initFromStorage: initTaxonomy } = useTaxonomyStore();

  // Modal visibility states
  const [isDadbOpen, setIsDadbOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [analyticsActionId, setAnalyticsActionId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editActionId, setEditActionId] = useState<string | null>(null);

  const [isTargetsDbOpen, setIsTargetsDbOpen] = useState(false);
  const [targetsDbTab, setTargetsDbTab] = useState<'monthly' | 'weekly' | 'daily'>('monthly');

  useEffect(() => {
    initHabits();
    initTargets();
    initTaxonomy();
  }, [initHabits, initTargets, initTaxonomy]);

  const handleOpenAnalytics = (actionId: string) => {
    setAnalyticsActionId(actionId);
    setIsAnalyticsOpen(true);
  };

  const handleOpenEdit = (actionId: string) => {
    setEditActionId(actionId);
    setIsEditOpen(true);
  };

  const handleOpenTargetsDb = (tab: 'monthly' | 'weekly' | 'daily') => {
    setTargetsDbTab(tab);
    setIsTargetsDbOpen(true);
  };

  return (
    <div
      id="page-daily-actions"
      className="space-y-6 md:space-y-8 animate-page-enter w-full pb-12"
    >
      {/* Daily Actions Tracker Main Shell */}
      <div
        id="daily-actions-tracker"
        className="mb-10 md:mb-14 pt-2 sm:pt-4 md:pt-6 scroll-mt-24 md:scroll-mt-32"
      >
        {/* 1. Header with Glow Progress Bar */}
        <DailyActionsTrackerHeader onOpenDadb={() => setIsDadbOpen(true)} />

        {/* 2. Daily Actions Grid with 180-Day Heatmaps */}
        <DailyActionsGrid
          onOpenAnalytics={handleOpenAnalytics}
          onOpenEdit={handleOpenEdit}
        />

        {/* 3. Monthly Targets Section */}
        <MonthlyTargetsSection onOpenMtdb={() => handleOpenTargetsDb('monthly')} />

        {/* 4. Weekly Targets Section */}
        <WeeklyTargetsSection onOpenWtdb={() => handleOpenTargetsDb('weekly')} />

        {/* 5. Daily Targets Section */}
        <DailyTargetsSection onOpenDtdb={() => handleOpenTargetsDb('daily')} />

        {/* 6. Create Daily Action Tracker Collapsible Section */}
        <CreateDailyActionSection />
      </div>

      {/* Modals */}
      <DailyActionsDbModal
        isOpen={isDadbOpen}
        onClose={() => setIsDadbOpen(false)}
      />

      <ActionAnalyticsModal
        isOpen={isAnalyticsOpen}
        actionId={analyticsActionId}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      <TargetsDbModal
        isOpen={isTargetsDbOpen}
        initialTab={targetsDbTab}
        onClose={() => setIsTargetsDbOpen(false)}
      />

      <EditDailyActionModal
        isOpen={isEditOpen}
        actionId={editActionId}
        onClose={() => setIsEditOpen(false)}
      />
    </div>
  );
};
