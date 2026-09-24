'use client';

/**
 * X-29 Subject Filter Navigation (features/subjects/components/SubjectFilterNav.tsx)
 * 
 * Recreates the exact legacy #subject-navigation-section and #subject-navigation-container.
 * Preserves all element IDs, classes, raw SVGs, and responsive styles.
 */

import React from 'react';
import type { Track, SyllabusStructure, CustomProgramsMap } from '@/types/taxonomy';

interface SubjectFilterNavProps {
  tracks: Track[];
  syllabusStructure: SyllabusStructure;
  customPrograms: CustomProgramsMap;
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
  onOpenRevisionModal: () => void;
}

export const SubjectFilterNav: React.FC<SubjectFilterNavProps> = ({
  tracks,
  syllabusStructure,
  customPrograms,
  currentFilter,
  onSelectFilter,
  onOpenRevisionModal,
}) => {
  const getBtnClass = (val: string) => {
    const isActive = currentFilter === val;
    return `active:scale-95 whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all duration-300 cursor-pointer ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-transparent scale-105'
        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-md'
    }`;
  };

  return (
    <div
      id="subject-navigation-section"
      className="bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4 md:space-y-6 w-full"
    >
      <h2 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2 md:pb-3">
        Filter Tasks by Subject
      </h2>

      <div id="subject-navigation-container" className="space-y-4">
        {/* Top All Tasks + Revise Subject Row */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={getBtnClass('All')}
            onClick={() => onSelectFilter('All')}
          >
            All Tasks
          </button>
          <button
            type="button"
            onClick={onOpenRevisionModal}
            className="active:scale-95 whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all duration-300 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/60 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Revise Subject</span>
          </button>
        </div>

        {/* Tracks and Custom Programs */}
        {tracks.map((trackObj) => {
          const trackId = trackObj.id;
          const programsForTrack = customPrograms[trackId] || [];
          const trackSubs = syllabusStructure[trackId] || [];

          return (
            <React.Fragment key={trackId}>
              {programsForTrack.map((prog) => {
                const progName = prog.name || String(prog);
                const subs = trackSubs
                  .filter((s) => s.program === progName)
                  .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

                if (subs.length === 0) return null;

                return (
                  <div
                    key={progName}
                    className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-full"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1 w-full">
                        {progName} PROGRAM
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 md:gap-3">
                      <button
                        type="button"
                        className={getBtnClass(progName)}
                        onClick={() => onSelectFilter(progName)}
                      >
                        [ ENTIRE {progName} ]
                      </button>

                      {subs.map((s) => {
                        let displaySub = s.subject;
                        if (displaySub.startsWith(s.program + ' - ')) {
                          displaySub = displaySub.replace(s.program + ' - ', '');
                        } else if (displaySub.startsWith(s.program + ' ')) {
                          displaySub = displaySub.replace(s.program + ' ', '');
                        }

                        return (
                          <button
                            key={s.subject}
                            type="button"
                            className={getBtnClass(s.subject)}
                            onClick={() => onSelectFilter(s.subject)}
                          >
                            {displaySub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
