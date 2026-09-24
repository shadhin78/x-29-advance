'use client';

/**
 * X-29 Schedule Studio Component (features/schedule/components/ScheduleStudio.tsx)
 * 
 * 100% Parity with legacy pages/Daily Schedule/Daily Schedule.html & scheduleRoutine.js.
 * Main responsive page container for Daily Schedule:
 * - Mobile Active Now banner (visible on phone only, above grid)
 * - Desktop Active Now card (hidden on mobile, in left sidebar)
 * - Set 1 / Set 2 routine switcher with arrow buttons
 * - 24-hour routine allocation vertical list
 * - Group-based duration summaries
 * - 1-hour segmented timeline grid
 * - Accessible Radix dialogs for slot and group management
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { ActiveNowCard } from './ActiveNowCard';
import { ScheduleTimelineGrid } from './ScheduleTimelineGrid';
import { RoutineHoursSummary } from './RoutineHoursSummary';
import { RoutineAllocationList } from './RoutineAllocationList';
import { ScheduleBlockModal } from './ScheduleBlockModal';
import { ScheduleGroupModal } from './ScheduleGroupModal';
import type { ScheduleBlock, ScheduleGroup } from '@/types/schedule';
import { segmentBlocksInto1HourSlots } from '@/features/schedule/services/scheduleService';

export const ScheduleStudio: React.FC = () => {
  const {
    scheduleBlocks,
    scheduleBlocks2,
    scheduleGroups,
    activeRoutineSet,
    initFromStorage,
    addBlock,
    updateBlock,
    deleteBlock,
    addGroup,
    updateGroup,
    deleteGroup,
    assignItemToGroup,
    removeItemFromGroup,
    setActiveRoutineSet,
  } = useScheduleStore();

  const { initFromStorage: initTaxonomy } = useTaxonomyStore();

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ScheduleGroup | null>(null);

  useEffect(() => {
    initFromStorage();
    initTaxonomy();
  }, [initFromStorage, initTaxonomy]);

  const currentBlocks = useMemo(() => {
    return activeRoutineSet === 2 ? scheduleBlocks2 : scheduleBlocks;
  }, [activeRoutineSet, scheduleBlocks, scheduleBlocks2]);

  const segmentsCount = useMemo(() => {
    return segmentBlocksInto1HourSlots(currentBlocks).length;
  }, [currentBlocks]);

  const handleOpenAddBlock = useCallback(() => {
    setEditingBlock(null);
    setBlockModalOpen(true);
  }, []);

  const handleEditBlock = useCallback((blockId: string) => {
    const found = currentBlocks.find((b) => b.id === blockId);
    if (found) {
      setEditingBlock(found);
      setBlockModalOpen(true);
    }
  }, [currentBlocks]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    const isSet2 = activeRoutineSet === 2;
    const title = isSet2 ? 'Delete Routine 2 Slot' : 'Delete Routine Slot';
    const msg = isSet2
      ? 'Are you sure you want to delete this routine slot from Routine 2?'
      : 'Are you sure you want to delete this routine slot?';

    if (window.confirm(`${title}\n\n${msg}`)) {
      deleteBlock(blockId, activeRoutineSet);
    }
  }, [activeRoutineSet, deleteBlock]);

  const handleSaveBlock = useCallback((blockData: Omit<ScheduleBlock, 'id'>, existingId?: string) => {
    if (existingId) {
      updateBlock(existingId, blockData, activeRoutineSet);
    } else {
      addBlock(blockData, activeRoutineSet);
    }
  }, [activeRoutineSet, addBlock, updateBlock]);

  const handleOpenCreateGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupModalOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: ScheduleGroup) => {
    setEditingGroup(group);
    setGroupModalOpen(true);
  }, []);

  const handleDeleteGroup = useCallback((groupId: string) => {
    if (window.confirm('Delete Group\n\nRemove this group? Items will become ungrouped.')) {
      deleteGroup(groupId);
    }
  }, [deleteGroup]);

  const handleSaveGroup = useCallback((name: string, items: string[], existingId?: string) => {
    if (existingId) {
      updateGroup(existingId, name, items);
    } else {
      addGroup(name, items);
    }
  }, [addGroup, updateGroup]);

  const toggleRoutineSet = useCallback((direction: number) => {
    setActiveRoutineSet(activeRoutineSet === 1 ? 2 : 1);
  }, [activeRoutineSet, setActiveRoutineSet]);

  return (
    <div id="page-schedule" className="animate-page-enter w-full space-y-6">
      {/* MOBILE Active Now (visible on phone only, above grid) */}
      <div id="schedule-active-now-mobile" className="block lg:hidden w-full">
        <ActiveNowCard
          blocks={currentBlocks}
          variant="mobile"
          onEditBlock={handleEditBlock}
        />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-start">
        {/* LEFT COLUMN (appears 2nd on mobile, 1st on desktop) */}
        <div className="lg:col-span-1 space-y-4 md:space-y-5 order-2 lg:order-1">
          {/* Active Now (Desktop only - hidden on mobile) */}
          <div id="schedule-active-now-container" className="w-full hidden lg:block">
            <ActiveNowCard
              blocks={currentBlocks}
              variant="desktop"
              onEditBlock={handleEditBlock}
            />
          </div>

          {/* Routine Hours Summary */}
          <RoutineHoursSummary
            blocks={currentBlocks}
            groups={scheduleGroups}
            onOpenCreateGroup={handleOpenCreateGroup}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
            onAssignItem={assignItemToGroup}
            onRemoveItem={removeItemFromGroup}
          />

          {/* 24-Hour Routine Allocation (Work Hr Counting) */}
          <RoutineAllocationList
            blocks={currentBlocks}
            onEditBlock={handleEditBlock}
          />
        </div>

        {/* RIGHT COLUMN: Daily Timeline Grid (appears 1st on mobile, 2nd on desktop) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-5 md:p-7 shadow-sm space-y-6 order-1 lg:order-2">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white leading-tight flex items-center gap-2">
                  Daily Timeline Grid
                  {/* Arrow Switcher */}
                  <span className="inline-flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 ml-1 select-none">
                    <button
                      data-switch-routine="-1"
                      onClick={() => toggleRoutineSet(-1)}
                      className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors active:scale-75"
                      title="Switch Routine"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span
                      id="active-routine-badge"
                      className="text-[9px] font-black uppercase px-1.5 text-slate-700 dark:text-slate-300 min-w-[50px] text-center"
                    >
                      Routine {activeRoutineSet}
                    </span>
                    <button
                      data-switch-routine="1"
                      onClick={() => toggleRoutineSet(1)}
                      className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors active:scale-75"
                      title="Switch Routine"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  1-hour segmented blocks of your routine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                id="schedule-slots-count-badge"
                className="text-[9px] bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-full font-bold text-slate-500 dark:text-slate-400"
              >
                {segmentsCount} Box{segmentsCount === 1 ? '' : 'es'}
              </span>
              <button
                id="btn-open-add-schedule"
                data-open-add-schedule
                onClick={handleOpenAddBlock}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Timeline Grid */}
          <ScheduleTimelineGrid
            blocks={currentBlocks}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteBlock}
          />
        </div>
      </div>

      {/* Add / Edit Schedule Block Modal */}
      <ScheduleBlockModal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        blockToEdit={editingBlock}
        routineSet={activeRoutineSet}
        onSave={handleSaveBlock}
      />

      {/* Create / Edit Schedule Group Modal */}
      <ScheduleGroupModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        groupToEdit={editingGroup}
        blocks={currentBlocks}
        groups={scheduleGroups}
        onSave={handleSaveGroup}
      />
    </div>
  );
};
