'use client';

/**
 * X-29 Schedule Timeline Grid (features/schedule/components/ScheduleTimelineGrid.tsx)
 * 
 * 100% Parity with legacy Daily Schedule.html & scheduleRoutine.js (lines 658-726).
 * Renders 1-hour segmented boxes for the daily timeline routine with
 * day-start indicator, stroke time header, colored body, and hover edit/delete actions.
 */

import React, { useMemo } from 'react';
import type { ScheduleBlock } from '@/types/schedule';
import { segmentBlocksInto1HourSlots } from '@/features/schedule/services/scheduleService';

interface ScheduleTimelineGridProps {
  blocks: ScheduleBlock[];
  onEditBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
}

export const ScheduleTimelineGrid: React.FC<ScheduleTimelineGridProps> = React.memo(
  function ScheduleTimelineGrid({ blocks, onEditBlock, onDeleteBlock }) {
    const segments = useMemo(() => segmentBlocksInto1HourSlots(blocks), [blocks]);

    if (segments.length === 0) {
      return (
        <div
          id="schedule-timeline-grid"
          className="grid grid-cols-1 gap-3"
        >
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
            <span className="text-3xl">📅</span>
            <h4 className="text-xs font-black uppercase tracking-wider mt-3">
              No Slots Planned
            </h4>
            <p className="text-[10px] opacity-75 mt-1 max-w-xs">
              Your daily schedule is empty. Add routine blocks to plan your typical day.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        id="schedule-timeline-grid"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
      >
        {segments.map((seg, idx) => {
          const color = seg.color || '#6366f1';

          return (
            <div
              key={`${seg.id}_${seg.startMin}_${idx}`}
              onClick={() => onEditBlock(seg.id)}
              className="rounded-2xl flex flex-col hover:shadow-lg transition-all relative overflow-hidden group cursor-pointer border border-slate-200/60 dark:border-slate-700/50"
              style={{ minHeight: '140px' }}
            >
              {/* Time header (1/4) — stroke only, no BG */}
              <div
                className="flex items-center justify-center py-2.5 bg-white dark:bg-slate-800"
                style={{ flex: '0 0 25%' }}
              >
                <div
                  className="flex items-center justify-center px-3 py-1.5 rounded-lg"
                  style={{ border: `1.5px solid ${color}55` }}
                >
                  <span
                    className="text-[10px] font-black tracking-tight"
                    style={{ color }}
                  >
                    {seg.startTime} - {seg.endTime}
                  </span>
                </div>
              </div>

              {/* Work name + meta (3/4) — colored BG, white text, centered */}
              <div
                className="flex flex-col items-center justify-center p-3 overflow-hidden text-center rounded-b-2xl"
                style={{ flex: '1 1 75%', backgroundColor: `${color}cc` }}
              >
                {seg.isDayStart && (
                  <span
                    className="inline-flex items-center text-[8px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 mb-1"
                    title="Day starts here"
                  >
                    ☀️ Start
                  </span>
                )}

                <div className="space-y-1 overflow-hidden">
                  <h4
                    className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug line-clamp-2"
                    title={seg.task}
                  >
                    {seg.task}
                  </h4>

                  {(seg.track || seg.program) && (
                    <div className="mt-1 pt-1 border-t border-dashed border-white/15">
                      {seg.track && (
                        <span className="truncate block text-[8px] font-black text-white/75 uppercase tracking-widest leading-none">
                          {seg.track}
                        </span>
                      )}
                      {seg.program && (
                        <span className="truncate block text-[8px] font-black text-white/85 uppercase tracking-wider">
                          {seg.program}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions float hover */}
                <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBlock(seg.id);
                    }}
                    className="p-1 bg-white/20 hover:bg-white/30 border border-white/20 rounded-md text-white transition-colors"
                    title="Edit"
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
                      onDeleteBlock(seg.id);
                    }}
                    className="p-1 bg-white/20 hover:bg-white/30 border border-white/20 rounded-md text-white transition-colors"
                    title="Delete"
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
            </div>
          );
        })}
      </div>
    );
  }
);
