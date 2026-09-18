'use client';

/**
 * X-29 Routine Allocation List (features/schedule/components/RoutineAllocationList.tsx)
 * 
 * 24-hour routine allocation list with time ranges and duration badges.
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
      return [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [blocks]);

    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white">
              24-Hour Routine Allocation
            </h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Work hour counting across the day
            </p>
          </div>
          <span className="text-xs font-black text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-xl border border-blue-800/60 shrink-0 tabular-nums">
            {totalHours === 1 ? '1.0 hr' : `${totalHours.toFixed(1)} hrs`}
          </span>
        </div>

        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
          {sortedBlocks.length === 0 ? (
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center py-4">
              No work hours allocated
            </p>
          ) : (
            sortedBlocks.map((block) => {
              const hours = calculateBlockHours(block.startTime, block.endTime);
              const color = block.color || '#6366f1';
              const hrStr = hours === 1 ? '1.0 hr' : `${hours.toFixed(1)} hrs`;

              return (
                <div
                  key={block.id}
                  onClick={() => onEditBlock(block.id)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/40 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <span
                    className="w-2 h-7 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {block.task}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                      {formatTime12h(block.startTime)} – {formatTime12h(block.endTime)}
                    </p>
                  </div>
                  <span className="text-xs font-black text-slate-300 shrink-0 tabular-nums">
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
