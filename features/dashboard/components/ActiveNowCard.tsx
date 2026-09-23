'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useScheduleStore } from '@/stores/useScheduleStore';

export const ActiveNowCard: React.FC = () => {
  const { scheduleBlocks, scheduleBlocks2, activeRoutineSet } = useScheduleStore();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const blocks = activeRoutineSet === 2 ? scheduleBlocks2 : scheduleBlocks;

  const activeData = useMemo(() => {
    const currentMin = currentDate.getHours() * 60 + currentDate.getMinutes();
    const currentSec = currentDate.getSeconds();

    const timeToMin = (t?: string) => {
      if (!t || typeof t !== 'string') return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const format12h = (t?: string) => {
      if (!t) return '';
      const [hStr, mStr] = t.split(':');
      let h = parseInt(hStr, 10);
      const m = mStr || '00';
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return `${h}:${m} ${ampm}`;
    };

    const activeBlock = blocks.find((b) => {
      const s = timeToMin(b.startTime);
      const e = timeToMin(b.endTime);
      return s <= currentMin && currentMin < e;
    });

    if (!activeBlock) return null;

    const startMin = timeToMin(activeBlock.startTime);
    const endMin = timeToMin(activeBlock.endTime);
    const durationMins = endMin - startMin;
    const elapsedMins = currentMin - startMin;
    const progressPercent = durationMins > 0 ? Math.round((elapsedMins / durationMins) * 100) : 0;

    const totalRemainingSeconds = (endMin - currentMin) * 60 - currentSec;
    const remHrs = Math.floor(totalRemainingSeconds / 3600);
    const remMins = Math.floor((totalRemainingSeconds % 3600) / 60);
    const remSecs = totalRemainingSeconds % 60;
    const countdownStr = `${String(remHrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(
      remSecs < 0 ? 0 : remSecs
    ).padStart(2, '0')}`;

    const timeRangeStr = `${format12h(activeBlock.startTime)} - ${format12h(activeBlock.endTime)}`;
    const category = activeBlock.track || activeBlock.program || 'Routine';
    const blockColor = activeBlock.color || '#6366f1';

    return {
      activeBlock,
      countdownStr,
      progressPercent,
      timeRangeStr,
      category,
      blockColor,
    };
  }, [blocks, currentDate]);

  return (
    <div
      id="dashboard-active-now-container"
      className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-sm flex flex-col overflow-hidden h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px] select-none"
    >
      <div className="p-4 pb-2 border-b border-slate-100 dark:border-slate-700 select-none flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Active Now
          </h3>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Link
            href="/schedule"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Go to Daily Schedule"
            aria-label="Go to Daily Schedule"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      {activeData ? (
        <Link
          href="/schedule"
          className="flex-1 p-4 relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all active:scale-98 rounded-b-[22px] rounded-t-none"
          style={{ backgroundColor: `${activeData.blockColor}cc` }}
        >
          <div className="flex flex-col gap-1.5 min-w-0">
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded inline-block self-start leading-none max-w-full truncate"
              style={{
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.9)',
                background: 'rgba(255,255,255,0.12)',
              }}
            >
              {activeData.category}
            </span>
            <h4
              className="text-sm font-black text-white leading-snug tracking-tight truncate mt-1"
              title={activeData.activeBlock.task}
            >
              {activeData.activeBlock.task}
            </h4>
          </div>

          <div className="mt-2 space-y-2">
            <div className="text-center">
              <span
                className="text-2xl font-black font-mono tracking-widest text-white tabular-nums"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
              >
                {activeData.countdownStr}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/70 transition-all duration-500"
                style={{ width: `${activeData.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 shrink-0">
              <span className="text-[10px] font-bold font-mono tracking-tight text-white/75">
                {activeData.timeRangeStr}
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            No active routine scheduled right now
          </p>
          <Link
            href="/schedule"
            className="mt-2 text-[10px] font-black uppercase tracking-wider text-blue-500 hover:underline"
          >
            Configure Schedule →
          </Link>
        </div>
      )}
    </div>
  );
};

export default ActiveNowCard;
