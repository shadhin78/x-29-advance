'use client';

/**
 * X-29 Routine Allocation List (features/schedule/components/RoutineAllocationList.tsx)
 * 
 * 100% Parity with legacy Daily Schedule.html & scheduleRoutine.js (lines 564-605).
 * Renders 24-hour routine work allocation vertical list with time ranges,
 * category color indicators, and total hours badge.
 */

import React, { useMemo } from 'react';
import type { ScheduleBlock } from '@/types/schedule';
import {
  calculateBlockHours,
  calculateTotalAllocatedHours,
  formatTime12h,
} from '@/features/schedule/services/scheduleService';

interface RoutineAllocationListProps {
  blocks: ScheduleBlock[];
  onEditBlock: (id: string) => void;
}

export const RoutineAllocationList: React.FC<RoutineAllocationListProps> = React.memo(
  function RoutineAllocationList({ blocks, onEditBlock }) {
    const totalHours = useMemo(() => calculateTotalAllocatedHours(blocks), [blocks]);

    const sortedBlocks = useMemo(() => {
      return [...blocks]
        .filter((b) => b.day === 'Daily' || !b.day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [blocks]);

    const totalStr =
      totalHours === 0
        ? '0 hrs'
        : totalHours === 1
        ? '1.0 hr'
        : `${totalHours.toFixed(1)} hrs`;

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
              24-Hour Routine Allocation
            </h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Work hour counting across the day
            </p>
          </div>
          <span
            id="schedule-allocation-total"
            className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-xl border border-blue-100 dark:border-blue-800 shrink-0 tabular-nums"
          >
            {totalStr}
          </span>
        </div>

        <div
          id="schedule-visual-timeline-bar"
          className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar"
        >
          {sortedBlocks.length === 0 ? (
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">
              No work hours allocated
            </p>
          ) : (
            sortedBlocks.map((block) => {
              const hours = calculateBlockHours(block.startTime, block.endTime);
              if (hours <= 0) return null;

              const color = block.color || '#6366f1';
              const hrStr = hours === 1 ? '1.0 hr' : `${hours.toFixed(1)} hrs`;
              const timeRange = `${formatTime12h(block.startTime)} – ${formatTime12h(block.endTime)}`;

              return (
                <div
                  key={block.id}
                  onClick={() => onEditBlock(block.id)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/20 hover:shadow-sm transition-all cursor-pointer"
                >
                  <span
                    className="w-2 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                      {block.task}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                      {timeRange}
                    </p>
                  </div>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 shrink-0 tabular-nums">
                    {hrStr}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);
