'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { getActiveScheduleSlot } from '@/features/schedule/services/scheduleService';
import { Clock, ExternalLink } from 'lucide-react';

export const ActiveNowCard: React.FC = () => {
  const { scheduleBlocks, scheduleBlocks2, activeRoutineSet } = useScheduleStore();

  const blocks = activeRoutineSet === 2 ? scheduleBlocks2 : scheduleBlocks;

  const activeSlot = useMemo(() => {
    return getActiveScheduleSlot(blocks);
  }, [blocks]);

  const activeBlock = activeSlot.activeBlock;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Active Routine Slot
            </h3>
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-black truncate">
              Realtime Timeline
            </span>
          </div>
        </div>
        <Link
          href="/schedule"
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
          title="Go to Daily Schedule"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center p-2">
        {activeBlock ? (
          <div className="space-y-1.5 w-full">
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20 inline-block">
              Scheduled Right Now
            </span>
            <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
              {activeBlock.task}
            </h4>
            <div className="text-xs font-bold text-slate-500">
              {activeBlock.startTime} – {activeBlock.endTime}
            </div>
            {activeBlock.track && (
              <span className="text-[9px] font-black uppercase text-indigo-500 px-2 py-0.5 rounded bg-indigo-500/10 inline-block mt-1">
                {activeBlock.track}
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-1 text-slate-400">
            <div className="text-xs font-bold">No routine block active right now.</div>
            <div className="text-[10px]">Check schedule timeline for upcoming activities.</div>
          </div>
        )}
      </div>

      <Link
        href="/focus"
        className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
      >
        Start Focus Session
      </Link>
    </div>
  );
};
