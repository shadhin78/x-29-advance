'use client';

/**
 * X-29 Schedule Studio Component (features/schedule/components/ScheduleStudio.tsx)
 * 
 * Main responsive page container for Daily Schedule:
 * - Realtime active slot indicator
 * - Set 1 / Set 2 routine switcher
 * - 24-hour routine allocation
 * - Group-based duration summaries
 * - 1-hour segmented timeline grid
 * - Accessible modals for slots and groups
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { ActiveNowCard } from './ActiveNowCard';
import { ScheduleTimelineGrid } from './ScheduleTimelineGrid';
import { RoutineHoursSummary } from './RoutineHoursSummary';
import { RoutineAllocationList } from './RoutineAllocationList';
import { ScheduleBlockModal } from './ScheduleBlockModal';
import { ScheduleGroupModal } from './ScheduleGroupModal';
import type { ScheduleBlock, ScheduleGroup } from '@/types/schedule';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

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

  const handleOpenAddBlock = () => {
    setEditingBlock(null);
    setBlockModalOpen(true);
  };

  const handleEditBlock = (blockId: string) => {
    const found = currentBlocks.find((b) => b.id === blockId);
    if (found) {
      setEditingBlock(found);
      setBlockModalOpen(true);
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    if (window.confirm('Delete this routine slot?')) {
      deleteBlock(blockId, activeRoutineSet);
    }
  };

  const handleSaveBlock = (blockData: Omit<ScheduleBlock, 'id'>, existingId?: string) => {
    if (existingId) {
      updateBlock(existingId, blockData, activeRoutineSet);
    } else {
      addBlock(blockData, activeRoutineSet);
    }
  };

  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupModalOpen(true);
  };

  const handleEditGroup = (group: ScheduleGroup) => {
    setEditingGroup(group);
    setGroupModalOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Remove this group? Items will become ungrouped.')) {
      deleteGroup(groupId);
    }
  };

  const handleSaveGroup = (name: string, items: string[], existingId?: string) => {
    if (existingId) {
      updateGroup(existingId, name, items);
    } else {
      addGroup(name, items);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Mobile Active Now Card */}
      <div className="block lg:hidden">
        <ActiveNowCard blocks={currentBlocks} />
      </div>

      {/* Main Grid: 1 Col Mobile (order: Grid first, Left Col second), 4 Col Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-start">
        {/* Left Column (Desktop 1 col, Mobile 2nd) */}
        <div className="lg:col-span-1 space-y-4 md:space-y-5 order-2 lg:order-1">
          {/* Desktop Active Now */}
          <div className="hidden lg:block">
            <ActiveNowCard blocks={currentBlocks} />
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

          {/* 24-Hour Routine Allocation List */}
          <RoutineAllocationList blocks={currentBlocks} onEditBlock={handleEditBlock} />
        </div>

        {/* Right Column: Timeline Grid (Desktop 3 cols, Mobile 1st) */}
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 md:p-7 shadow-sm space-y-6 order-1 lg:order-2">
          {/* Timeline Grid Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  Daily Timeline Grid
                  {/* Routine Set Switcher */}
                  <span className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 ml-1 select-none">
                    <button
                      onClick={() => setActiveRoutineSet(activeRoutineSet === 1 ? 2 : 1)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Previous Routine"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-black uppercase px-2 text-blue-400 min-w-[64px] text-center">
                      Routine {activeRoutineSet}
                    </span>
                    <button
                      onClick={() => setActiveRoutineSet(activeRoutineSet === 1 ? 2 : 1)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Next Routine"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </h2>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                1-hour segmented blocks of your daily routine
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[10px] bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full font-bold text-slate-400">
                {currentBlocks.length} Blocks
              </span>
              <button
                onClick={handleOpenAddBlock}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slot</span>
              </button>
            </div>
          </div>

          {/* Timeline Grid Boxes */}
          <ScheduleTimelineGrid
            blocks={currentBlocks}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteBlock}
          />
        </div>
      </div>

      {/* Schedule Block Modal */}
      <ScheduleBlockModal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        blockToEdit={editingBlock}
        routineSet={activeRoutineSet}
        onSave={handleSaveBlock}
      />

      {/* Schedule Group Modal */}
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
