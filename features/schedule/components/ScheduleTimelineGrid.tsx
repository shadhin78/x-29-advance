'use client';

/**
 * X-29 Schedule Timeline Grid (features/schedule/components/ScheduleTimelineGrid.tsx)
 * 
 * Renders 1-hour segmented boxes for the daily timeline routine with
 * day-start indicator and interactive edit/delete controls.
 */

import React, { useMemo } from 'react';
import type { ScheduleBlock } from '@/types/schedule';
import { segmentBlocksInto1HourSlots } from '@/features/schedule/services/scheduleService';
import { Edit2, Trash2, Calendar } from 'lucide-react';

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
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-slate-400 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
          <Calendar className="w-10 h-10 text-slate-600 mb-3" />
          <h4 className="text-xs font-black uppercase tracking-wider">No Slots Planned</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Your daily schedule is empty. Add routine blocks to plan your typical day.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {segments.map((seg, idx) => {
          const color = seg.color || '#6366f1';
          return (
            <div
              key={`${seg.id}_${seg.startMin}_${idx}`}
              onClick={() => onEditBlock(seg.id)}
              className="rounded-2xl flex flex-col hover:shadow-xl transition-all relative overflow-hidden group cursor-pointer border border-slate-800/80 bg-slate-900/60"
              style={{ minHeight: '140px' }}
            >
              {/* Time header (1/4) */}
              <div className="flex items-center justify-center py-2.5 bg-slate-950/80 border-b border-slate-800/60">
                <div
                  className="flex items-center justify-center px-2.5 py-1 rounded-lg"
                  style={{ border: `1.5px solid ${color}55` }}
                >
                  <span className="text-[10px] font-black tracking-tight" style={{ color }}>
                    {seg.startTime} – {seg.endTime}
                  </span>
                </div>
              </div>

              {/* Work task and meta (3/4) */}
              <div
                className="flex flex-col items-center justify-between p-3 flex-1 text-center rounded-b-2xl relative"
                style={{ backgroundColor: `${color}dd` }}
              >
                {seg.isDayStart && (
                  <span className="inline-flex items-center text-[8px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-md shadow-sm mb-1">
                    ☀️ Start
                  </span>
                )}

                <div className="space-y-0.5 my-auto">
                  <h4
                    className="text-xs sm:text-sm font-black text-white tracking-tight leading-snug line-clamp-2"
                    title={seg.task}
                  >
                    {seg.task}
                  </h4>

                  {(seg.track || seg.program) && (
                    <div className="pt-1">
                      {seg.track && (
                        <span className="block text-[8px] font-black text-white/80 uppercase tracking-widest truncate">
                          {seg.track}
                        </span>
                      )}
                      {seg.program && (
                        <span className="block text-[8px] font-bold text-white/90 truncate">
                          {seg.program}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Floating hover actions */}
                <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBlock(seg.id);
                    }}
                    className="p-1 bg-black/30 hover:bg-black/50 border border-white/20 rounded-lg text-white transition-colors"
                    title="Edit Slot"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBlock(seg.id);
                    }}
                    className="p-1 bg-black/30 hover:bg-rose-900/60 border border-white/20 rounded-lg text-white transition-colors"
                    title="Delete Slot"
                  >
                    <Trash2 className="w-3 h-3" />
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
