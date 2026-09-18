'use client';

/**
 * X-29 Routine Hours Summary (features/schedule/components/RoutineHoursSummary.tsx)
 * 
 * Group-based breakdown of scheduled hours with collapsible group cards,
 * group creation/editing, and item assignment actions.
 */

import React, { useState, useMemo } from 'react';
import type { ScheduleBlock, ScheduleGroup } from '@/types/schedule';
import { calculateGroupSummaries } from '@/features/schedule/services/scheduleService';
import { ChevronDown, ChevronUp, FolderPlus, Edit2, Trash2, X } from 'lucide-react';

interface RoutineHoursSummaryProps {
  blocks: ScheduleBlock[];
  groups: ScheduleGroup[];
  onOpenCreateGroup: () => void;
  onEditGroup: (group: ScheduleGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onAssignItem: (itemName: string, groupId: string) => void;
  onRemoveItem: (itemName: string) => void;
}

export const RoutineHoursSummary: React.FC<RoutineHoursSummaryProps> = React.memo(
  function RoutineHoursSummary({
    blocks,
    groups,
    onOpenCreateGroup,
    onEditGroup,
    onDeleteGroup,
    onAssignItem,
    onRemoveItem,
  }) {
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const summaries = useMemo(() => calculateGroupSummaries(blocks, groups), [blocks, groups]);

    const toggleCollapse = (groupId: string) => {
      setCollapsedGroups((prev) => ({
        ...prev,
        [groupId]: !prev[groupId],
      }));
    };

    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">
              Routine Hours Summary
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Summed durations by group
            </p>
          </div>
          <button
            onClick={onOpenCreateGroup}
            className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-emerald-950/40 hover:text-emerald-400 hover:border-emerald-800 transition-all active:scale-95 flex items-center gap-1"
          >
            <FolderPlus className="w-3 h-3" />
            <span>+ Group</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {summaries.groupSummaries.length === 0 ? (
            <div className="py-6 text-center border border-dashed border-slate-800 rounded-2xl">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                Create a group to see summary
              </p>
            </div>
          ) : (
            summaries.groupSummaries.map(({ group, items, totalHours }) => {
              const isCollapsed = !!collapsedGroups[group.id];
              const hrStr = totalHours === 1 ? '1.0 hr' : `${totalHours.toFixed(1)} hrs`;

              return (
                <div
                  key={group.id}
                  className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40"
                >
                  <div
                    onClick={() => toggleCollapse(group.id)}
                    className="flex items-center justify-between px-3 py-2.5 bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-[11px] font-black uppercase tracking-wider text-white truncate">
                        {group.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        ({items.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-black text-white tabular-nums">
                        {hrStr}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGroup(group);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                        title="Edit group"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGroup(group.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete group"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <div className="p-2 space-y-1.5 bg-slate-900/30">
                      {items.length === 0 ? (
                        <p className="text-[9px] text-slate-500 font-bold text-center py-2">
                          No items assigned to this group.
                        </p>
                      ) : (
                        items.map((it) => (
                          <div
                            key={it.name}
                            className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl"
                          >
                            <div className="flex items-center space-x-2 overflow-hidden flex-1 min-w-0">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: it.color }}
                              />
                              <span className="text-xs font-bold text-slate-300 truncate" title={it.name}>
                                {it.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 pl-1">
                              <button
                                onClick={() => onRemoveItem(it.name)}
                                className="text-[8px] font-black text-rose-400 hover:text-rose-300 p-0.5 rounded hover:bg-rose-950/40 transition-colors"
                                title="Remove from group"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black text-white tabular-nums">
                                {it.hours.toFixed(1)}h
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Ungrouped items list if any */}
          {summaries.ungroupedItems.length > 0 && groups.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Ungrouped Work Items
              </span>
              <div className="space-y-1.5">
                {summaries.ungroupedItems.map((it) => (
                  <div
                    key={it.name}
                    className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/60 rounded-xl"
                  >
                    <span className="text-xs font-bold text-slate-400 truncate flex-1 pr-2">
                      {it.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        onChange={(e) => {
                          if (e.target.value) onAssignItem(it.name, e.target.value);
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-[9px] font-bold rounded-lg px-1.5 py-0.5 outline-none"
                      >
                        <option value="">+ Assign</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs font-bold text-slate-300">{it.hours.toFixed(1)}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
