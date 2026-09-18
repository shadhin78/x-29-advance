'use client';

/**
 * X-29 Active Now Card (features/schedule/components/ActiveNowCard.tsx)
 * 
 * Displays the current running routine slot, time elapsed / remaining,
 * and live progress bar. Updates every second locally without persisting.
 */

import React, { useState, useEffect } from 'react';
import type { ScheduleBlock } from '@/types/schedule';
import { getActiveScheduleSlot, formatTime12h } from '@/features/schedule/services/scheduleService';
import { Clock, Play, ArrowRight } from 'lucide-react';

interface ActiveNowCardProps {
  blocks: ScheduleBlock[];
}

export const ActiveNowCard: React.FC<ActiveNowCardProps> = React.memo(function ActiveNowCard({ blocks }) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slotInfo = getActiveScheduleSlot(blocks, now);
  const { activeBlock, remainingMinutes, progressPercent, nextBlock } = slotInfo;

  return (
    <div className="glass-card rounded-3xl p-5 border border-slate-800/80 relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-blue-950/40 shadow-lg">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
            Active Now
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-400">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {activeBlock ? (
        <div className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                {activeBlock.task}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {formatTime12h(activeBlock.startTime)} – {formatTime12h(activeBlock.endTime)}
                </span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-black font-mono text-blue-400 tabular-nums">
                {remainingMinutes}m
              </span>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">
                Left
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
              <span>{Math.round(progressPercent)}% elapsed</span>
              {nextBlock && (
                <span className="flex items-center gap-1 truncate max-w-[160px]">
                  Next: {nextBlock.task}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-4 pb-2 text-center">
          <p className="text-xs font-bold text-slate-400">No Routine Slot Active Right Now</p>
          {nextBlock && (
            <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1">
              <span>Next up:</span>
              <span className="text-blue-400 font-bold">{nextBlock.task}</span>
              <span>at {formatTime12h(nextBlock.startTime)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
});
