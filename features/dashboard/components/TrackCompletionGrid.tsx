'use client';

/**
 * X-29 Track Completion Grid Component (features/dashboard/components/TrackCompletionGrid.tsx)
 * 
 * Replicates the legacy Track Completion section:
 * - Displays all enrolled study tracks
 * - Shows completed chapters vs total chapters per track
 * - Renders circular SVG progress ring with canonical color accents
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { calculateCompletionRate } from '@/features/analytics/services/analyticsService';

const TRACK_COLORS = [
  'text-blue-500 stroke-blue-500',
  'text-purple-500 stroke-purple-500',
  'text-teal-500 stroke-teal-500',
  'text-rose-500 stroke-rose-500',
  'text-orange-500 stroke-orange-500',
  'text-emerald-500 stroke-emerald-500',
];

export const TrackCompletionGrid: React.FC = () => {
  const { tracks, getNormalizedSubjects } = useTaxonomyStore();
  const { tasks } = useTaskStore();

  const trackProgressList = useMemo(() => {
    const subjects = getNormalizedSubjects();

    return tracks.map((track, idx) => {
      const trackSubs = subjects.filter(
        (s) => s.trackId === track.id || s.trackName === track.name
      );

      let totalChapters = 0;
      trackSubs.forEach((s) => {
        totalChapters += s.chaptersCount || 0;
      });

      const trackSubNames = new Set(trackSubs.map((s) => s.name));
      const completed = tasks.filter((t) => trackSubNames.has(t.subject) && t.completed).length;
      const skipped = tasks.filter((t) => trackSubNames.has(t.subject) && t.skipped).length;

      const pct = calculateCompletionRate(completed, totalChapters, skipped);
      const colorClass = TRACK_COLORS[idx % TRACK_COLORS.length];

      return {
        id: track.id,
        name: track.name || track.id,
        totalChapters,
        completedChapters: completed,
        pct,
        colorClass,
      };
    });
  }, [tracks, getNormalizedSubjects, tasks]);

  if (tracks.length === 0) return null;

  return (
    <div className="mt-8 space-y-4 select-none">
      <div className="space-y-0.5">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
          Track Completion
        </h2>
        <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">
          Overall progress for all enrolled study tracks
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8 md:mb-10">
        {trackProgressList.map((tp) => (
          <Link
            key={tp.id}
            href="/subjects"
            className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between group cursor-pointer"
          >
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                {tp.name}
              </h3>
              <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">
                {tp.completedChapters} / {tp.totalChapters} Chapters
              </p>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-slate-800 shrink-0 hover:scale-105 active:scale-95 transition-all">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-700/50"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={tp.colorClass}
                  strokeWidth="3.5"
                  strokeDasharray={`${tp.pct}, 100`}
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className={`absolute text-[9px] md:text-[10px] font-black ${tp.colorClass}`}>
                {tp.pct}%
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrackCompletionGrid;
