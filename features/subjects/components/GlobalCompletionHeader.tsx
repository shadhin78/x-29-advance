'use client';

/**
 * X-29 Global Completion Header (features/subjects/components/GlobalCompletionHeader.tsx)
 * 
 * Recreates the exact legacy #completion-stats-section from pages/Subjects/Subjects.html.
 * Preserves all element IDs, classes, raw SVGs, and responsive styles.
 */

import React from 'react';
import Link from 'next/link';

interface GlobalCompletionHeaderProps {
  totalChapters: number;
  completedChapters: number;
  globalPercent: number;
  onOpenSyllabusModal: () => void;
}

export const GlobalCompletionHeader: React.FC<GlobalCompletionHeaderProps> = ({
  totalChapters,
  completedChapters,
  globalPercent,
  onOpenSyllabusModal,
}) => {
  // Circular gauge calculations for 120x120 SVG
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (globalPercent / 100) * circumference;

  return (
    <div id="completion-stats-section" className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
      {/* Left 3-Column Card */}
      <div className="lg:col-span-3 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-between shadow-sm hover:shadow-xl transition-shadow relative group">
        <Link
          href="/analytics"
          id="btn-open-global-history"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:px-3 sm:py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 z-10 border border-blue-200 dark:border-blue-800/50"
          title="Open History Database"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden sm:block">Database</span>
        </Link>

        <div>
          <div className="flex justify-between items-end mb-4 sm:mb-5 md:mb-6 pr-10 sm:pr-24">
            <div>
              <span
                id="progress-title"
                className="block text-[9px] sm:text-[10px] md:text-[11px] font-black text-slate-400 uppercase mb-1 sm:mb-2 tracking-widest"
              >
                Global Overall Completion
              </span>
              <h2
                id="progress-text"
                className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 drop-shadow-sm leading-none"
              >
                {globalPercent}%
              </h2>
            </div>
            <div
              id="progress-detail"
              className="text-[10px] sm:text-xs md:text-sm font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg md:rounded-xl whitespace-nowrap"
            >
              {completedChapters} / {totalChapters} Chapters
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-900 h-4 sm:h-5 md:h-6 rounded-full overflow-hidden shadow-inner p-0.5 md:p-1 border border-slate-200 dark:border-slate-800">
            <div
              id="progress-bar"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${globalPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Circular Gauge Card */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 relative flex items-center justify-center shadow-sm hover:shadow-xl transition-shadow">
        <button
          type="button"
          id="btn-open-global-chapters"
          onClick={onOpenSyllabusModal}
          className="relative flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer group w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40"
          title="View All Subject Completions"
        >
          <svg className="w-full h-full max-w-[120px] max-h-[120px] sm:max-w-[140px] sm:max-h-[140px] md:max-w-[160px] md:max-h-[160px] drop-shadow-lg -rotate-90">
            {/* Background Track */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="url(#globalSyllabusGradient)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="globalSyllabusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[9px] sm:text-[10px] md:text-[11px] font-black text-slate-350 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors uppercase tracking-widest">
            Syllabus
          </div>
        </button>
      </div>
    </div>
  );
};
