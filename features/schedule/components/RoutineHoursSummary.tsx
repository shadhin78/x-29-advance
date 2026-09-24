'use client';

/**
 * X-29 Routine Hours Summary (features/schedule/components/RoutineHoursSummary.tsx)
 * 
 * 100% Parity with legacy Daily Schedule.html & scheduleRoutine.js (lines 728-828).
 * Renders custom work groups, collapsible work item lists, duration totals,
 * edit/delete controls, and item-to-group assignment.
 */

import React, { useState, useMemo } from 'react';
import type { ScheduleBlock, ScheduleGroup } from '@/types/schedule';
import { calculateGroupSummaries } from '@/features/schedule/services/scheduleService';

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
      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
              Routine Hours Summary
            </h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Summed durations by group
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-create-schedule-group"
              data-create-schedule-group
              onClick={onOpenCreateGroup}
              className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-all active:scale-95 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
              title="Create custom group"
            >
              <span>+ Group</span>
            </button>
          </div>
        </div>

        <div
          id="schedule-hours-summary-list"
          className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar"
        >
          {groups.length === 0 ? (
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">
              Create a group to see summary
            </p>
          ) : (
            summaries.groupSummaries.map(({ group, items, totalHours }) => {
              const isCollapsed = !!collapsedGroups[group.id];
              const grpHrStr =
                totalHours === 0
                  ? '0 hr'
                  : totalHours === 1
                  ? '1.0 hr'
                  : `${totalHours.toFixed(1)} hrs`;

              return (
                <div
                  key={group.id}
                  className="border border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden mb-3"
                >
                  <div
                    onClick={() => toggleCollapse(group.id)}
                    className="flex items-center justify-between px-3 py-2 bg-slate-100/80 dark:bg-slate-800/80 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="grp-chevron w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0"
                        style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      <span
                        className="w-2.5 h-2.5 rounded-md shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                        {group.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        ({items.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-900 dark:text-white">
                        {grpHrStr}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGroup(group);
                        }}
                        className="text-slate-400 hover:text-blue-500 transition-colors"
                        title="Edit group"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGroup(group.id);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete group"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Group Items */}
                  {!isCollapsed && (
                    <div className="grp-items p-2 space-y-1.5 bg-white dark:bg-slate-900/20">
                      {items.length === 0 ? (
                        <p className="text-[8px] text-slate-400 font-bold text-center py-2">
                          No items assigned
                        </p>
                      ) : (
                        items.map((it) => (
                          <div
                            key={it.name}
                            className="flex items-center justify-between p-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-lg hover:shadow-inner transition-all"
                          >
                            <div className="flex items-center space-x-1.5 overflow-hidden flex-1 min-w-0">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: it.color }}
                              />
                              <span
                                className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate"
                                title={it.name}
                              >
                                {it.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 pl-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveItem(it.name);
                                }}
                                className="text-[7px] font-black text-red-400 hover:text-red-600 uppercase tracking-wider px-1 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
                                title="Remove from group"
                              >
                                ✕
                              </button>
                              <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                                {it.hours === 1 ? '1.0 hr' : `${it.hours.toFixed(1)} hrs`}
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
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Ungrouped Work Items
              </span>
              <div className="space-y-1.5">
                {summaries.ungroupedItems.map((it) => (
                  <div
                    key={it.name}
                    className="flex items-center justify-between p-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-lg hover:shadow-inner transition-all"
                  >
                    <div className="flex items-center space-x-1.5 overflow-hidden flex-1 min-w-0">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: it.color }}
                      />
                      <span
                        className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate"
                        title={it.name}
                      >
                        {it.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onAssignItem(it.name, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="text-[8px] font-bold bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-500 cursor-pointer outline-none max-w-[60px]"
                      >
                        <option value="">+ Grp</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                        {it.hours === 1 ? '1.0 hr' : `${it.hours.toFixed(1)} hrs`}
                      </span>
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
