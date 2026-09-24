'use client';

/**
 * X-29 Active Now Card (features/schedule/components/ActiveNowCard.tsx)
 * 
 * 100% Parity with legacy scheduleSlot.js (lines 191-260 & lines 310-344).
 * Supports both desktop (sidebar card) and mobile (top banner) variants.
 * Displays live ticking countdown (HH:MM:SS), progress bar, time range,
 * and category badge. Renders Free Time card when no slot is active.
 */

import React, { useState, useEffect } from 'react';
import type { ScheduleBlock } from '@/types/schedule';
import { getActiveScheduleSlot, formatTime12h } from '@/features/schedule/services/scheduleService';

interface ActiveNowCardProps {
  blocks: ScheduleBlock[];
  variant?: 'desktop' | 'mobile';
  onEditBlock?: (id: string) => void;
}

export const ActiveNowCard: React.FC<ActiveNowCardProps> = React.memo(function ActiveNowCard({
  blocks,
  variant = 'desktop',
  onEditBlock,
}) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slotInfo = getActiveScheduleSlot(blocks, now);
  const { activeBlock, progressPercent, countdownStr } = slotInfo;

  const category = activeBlock?.track || activeBlock?.program || 'Routine';
  const blockColor = activeBlock?.color || '#6366f1';
  const timeRangeStr = activeBlock
    ? `${formatTime12h(activeBlock.startTime)} – ${formatTime12h(activeBlock.endTime)}`
    : '';

  // Desktop variant
  if (variant === 'desktop') {
    if (activeBlock) {
      return (
        <div>
          <div className="flex items-center justify-between mb-1.5 select-none">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Active Now
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          <div
            className="rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all hover:shadow-md"
            style={{
              minHeight: '180px',
              backgroundColor: `${blockColor}cc`,
              border: `1.5px solid ${blockColor}`,
            }}
            onClick={() => onEditBlock && onEditBlock(activeBlock.id)}
          >
            <div className="flex flex-col gap-1.5 min-w-0">
              <span
                className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded inline-block self-start leading-none max-w-full truncate"
                style={{
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(255,255,255,0.12)',
                }}
              >
                {category}
              </span>
              <h4
                className="text-base font-bold text-white leading-snug tracking-tight truncate mt-0.5"
                title={activeBlock.task}
              >
                {activeBlock.task}
              </h4>
            </div>

            <div className="mt-2 space-y-2">
              <div className="text-center">
                <span
                  className="text-xl font-black font-mono tracking-wider text-white tabular-nums"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
                >
                  {countdownStr}
                </span>
              </div>
              <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/60 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 shrink-0">
                <span
                  className="text-[10px] font-bold font-mono tracking-tight"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  {timeRangeStr}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Desktop Free Time (Idle)
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5 select-none">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Active Now
          </h3>
          <span className="flex h-2 w-2 relative">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-350 dark:bg-slate-650" />
          </span>
        </div>

        <div
          className="bg-slate-50/40 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all select-none"
          style={{ minHeight: '180px' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">☀️</span>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Free Time
            </h4>
          </div>
          <p className="text-[9px] opacity-75 text-slate-440 dark:text-slate-500 mt-2">
            No active routine slot right now.
          </p>
        </div>
      </div>
    );
  }

  // Mobile variant
  if (activeBlock) {
    return (
      <div
        className="rounded-2xl overflow-hidden border shadow-lg cursor-pointer"
        style={{
          borderColor: `${blockColor}55`,
          background: `linear-gradient(135deg, ${blockColor}dd, ${blockColor}bb)`,
        }}
        onClick={() => onEditBlock && onEditBlock(activeBlock.id)}
      >
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/90">
                Active Now
              </h3>
            </div>
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
              style={{
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.8)',
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              {category}
            </span>
          </div>

          <h4
            className="text-lg font-bold text-white leading-snug tracking-tight mb-2 truncate"
            title={activeBlock.task}
          >
            {activeBlock.task}
          </h4>

          <div className="flex items-center justify-between mb-2.5">
            <span
              className="text-2xl font-black font-mono tracking-wider text-white tabular-nums"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}
            >
              {countdownStr}
            </span>
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              remaining
            </span>
          </div>

          <div className="w-full bg-white/15 rounded-full h-2 mb-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/60 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs font-bold font-mono tracking-tight"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              {timeRangeStr}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Free Time (Idle)
  return (
    <div className="bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between transition-all select-none">
      <div className="flex items-center gap-2.5">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-350 dark:bg-slate-650" />
        </span>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Active Now
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-base">☀️</span>
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Free Time</span>
      </div>
    </div>
  );
});
