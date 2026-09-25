'use client';

/**
 * X-29 Subject Progress Accordion (features/subjects/components/SubjectProgressAccordion.tsx)
 * 
 * Recreates the exact legacy #sidebar-progress-section and #subject-progress-container.
 * Preserves all element IDs, classes, raw SVGs, and responsive styles.
 */

import React from 'react';
import type { Track, SyllabusStructure, CustomProgramsMap } from '@/types/taxonomy';

interface SubjectProgressAccordionProps {
  tracks: Track[];
  syllabusStructure: SyllabusStructure;
  customPrograms: CustomProgramsMap;
  subjectStats: Record<string, { totalChapters: number; completedCount: number }>;
}

const COLOR_PAIRS = [
  { bg: 'bg-gradient-to-r from-indigo-400 to-indigo-600', text: 'text-indigo-500' },
  { bg: 'bg-gradient-to-r from-emerald-400 to-emerald-600', text: 'text-emerald-500' },
  { bg: 'bg-gradient-to-r from-violet-400 to-violet-600', text: 'text-violet-500' },
  { bg: 'bg-gradient-to-r from-rose-400 to-rose-600', text: 'text-rose-500' },
  { bg: 'bg-gradient-to-r from-amber-400 to-amber-600', text: 'text-amber-500' },
  { bg: 'bg-gradient-to-r from-cyan-400 to-cyan-600', text: 'text-cyan-500' },
];

export const SubjectProgressAccordion: React.FC<SubjectProgressAccordionProps> = ({
  tracks,
  syllabusStructure,
  customPrograms,
  subjectStats,
}) => {
  let pIdx = 0;

  return (
    <details
      id="sidebar-progress-section"
      className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm scroll-mt-24 md:scroll-mt-32 w-full group overflow-hidden"
    >
      <summary className="cursor-pointer p-5 sm:p-6 md:p-7 outline-none select-none list-none flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/80 transition-colors [&::-webkit-details-marker]:hidden">
        <h2 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
          Subject Progress
        </h2>
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-400 group-open:rotate-180 transition-all duration-300 shrink-0 border border-slate-200/50 dark:border-slate-600/30">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>

      <div className="p-5 sm:p-6 md:p-7 pt-0 sm:pt-0 md:pt-0">
        <div id="subject-progress-container">
          {tracks.map((trackObj) => {
            const trackId = trackObj.id;
            const trackName = trackObj.name || trackId;
            const trackSubs = syllabusStructure[trackId] || [];
            if (trackSubs.length === 0) return null;

            let trackTotalChapters = 0;
            let trackEffectiveChapters = 0;

            trackSubs.forEach((s) => {
              const stats = subjectStats[s.subject] || { totalChapters: s.chapters || 0, completedCount: 0 };
              trackTotalChapters += stats.totalChapters || 0;
              trackEffectiveChapters += stats.completedCount || 0;
            });

            const trackPerc =
              trackTotalChapters > 0 ? Math.min(100, (trackEffectiveChapters / trackTotalChapters) * 100) : 0;

            const programsForTrack = customPrograms[trackId] || [];

            return (
              <div
                key={trackId}
                className="mb-8 p-4 sm:p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/10 rounded-3xl border border-slate-200/50 dark:border-slate-800/50"
              >
                {/* Track Overall Bar */}
                <div className="mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        {trackName}
                      </span>
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        (Track Progress)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs md:text-sm font-black text-indigo-600 dark:text-indigo-400">
                      <span>
                        {Math.round(trackEffectiveChapters)}/{trackTotalChapters} Ch
                      </span>
                      <span className="ml-1">({Math.round(trackPerc)}%)</span>
                    </div>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(trackPerc)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${trackName} track overall progress: ${Math.round(trackPerc)}%`}
                    className="w-full bg-slate-100 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200/40 dark:border-slate-600/30"
                  >
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{ width: `${trackPerc}%` }}
                    />
                  </div>
                </div>

                {/* Programs under Track */}
                <div className="space-y-5">
                  {programsForTrack.map((prog) => {
                    const progName = prog.name || String(prog);
                    const subs = trackSubs.filter((s) => s.program === progName);
                    if (subs.length === 0) return null;

                    const cp = COLOR_PAIRS[pIdx % COLOR_PAIRS.length];
                    pIdx++;

                    return (
                      <div
                        key={progName}
                        className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm"
                      >
                        <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3.5 tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                          {progName} Program
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                          {subs.map((sub) => {
                            const stats = subjectStats[sub.subject] || {
                              totalChapters: sub.chapters || 0,
                              completedCount: 0,
                            };
                            const perc =
                              stats.totalChapters > 0
                                ? Math.min(100, (stats.completedCount / stats.totalChapters) * 100)
                                : 0;

                            let cleanSubName = sub.subject;
                            if (cleanSubName.startsWith(progName + ' - ')) {
                              cleanSubName = cleanSubName.replace(progName + ' - ', '');
                            } else if (cleanSubName.startsWith(progName + ' ')) {
                              cleanSubName = cleanSubName.replace(progName + ' ', '');
                            }

                            return (
                              <div key={sub.subject} className="group flex flex-col justify-center">
                                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-black mb-1.5 transition-all group-hover:translate-x-1">
                                  <div className="flex items-center truncate pr-2">
                                    <span
                                      className="truncate text-slate-700 dark:text-slate-200"
                                      title={sub.subject}
                                    >
                                      {cleanSubName}
                                    </span>
                                  </div>
                                  <div className="flex items-center shrink-0">
                                    <span className="ml-1 text-slate-700 dark:text-slate-200">
                                      {Math.round(stats.completedCount)}/{stats.totalChapters}{' '}
                                      <span className={`${cp.text} ml-0.5`}>({Math.round(perc)}%)</span>
                                    </span>
                                  </div>
                                </div>
                                <div
                                  role="progressbar"
                                  aria-valuenow={Math.round(perc)}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`${cleanSubName} progress: ${Math.round(perc)}%`}
                                  className="w-full bg-slate-100 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200/40 dark:border-slate-600/30"
                                >
                                  <div
                                    className={`${cp.bg} h-full rounded-full transition-all duration-700 ease-out shadow-sm`}
                                    style={{ width: `${perc}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
};
