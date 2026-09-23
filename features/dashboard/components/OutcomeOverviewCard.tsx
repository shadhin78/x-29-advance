'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useOutcomeStore } from '@/stores/useOutcomeStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { groupAndProcessResults } from '@/features/outcome/services/outcomeEngine';

export const OutcomeOverviewCard: React.FC = () => {
  const { successResults } = useOutcomeStore();
  const { customPrograms, getNormalizedSubjects } = useTaxonomyStore();

  const groups = useMemo(() => {
    const subjects = getNormalizedSubjects().map((s) => ({
      program: s.program,
      subject: s.name,
    }));
    return groupAndProcessResults(successResults, subjects, customPrograms);
  }, [successResults, getNormalizedSubjects, customPrograms]);

  const { overallGrade } = useMemo(() => {
    if (groups.length === 0) return { overallGrade: '--' };
    const numValues = groups
      .map((g) => parseFloat(g.computedCgpa))
      .filter((v) => !isNaN(v) && v > 0);

    if (numValues.length === 0) return { overallGrade: '--' };
    return {
      overallGrade: groups[0]?.computedGrade || 'A',
    };
  }, [groups]);

  return (
    <div
      id="dashboard-outcome-section"
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col animate-page-enter select-none h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]"
    >
      {/* Card Header */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0 gap-1.5">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-1.5 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 rounded-xl shrink-0 border border-yellow-100 dark:border-yellow-800/40 shadow-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Outcome & CGPA
            </h3>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-extrabold truncate">
              [ Name • Target • Actual ]
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span
            id="db-outcome-overall-badge"
            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50"
          >
            {overallGrade}
          </span>
          <Link
            href="/outcome"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Go to Outcome Page"
            aria-label="Go to Outcome Page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mini Program Breakdown List (Scrollable) */}
      <div
        id="db-outcome-program-list"
        className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar text-[10px] mt-1"
      >
        {groups.length > 0 ? (
          groups.map((g) => (
            <div
              key={g.program}
              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                  {g.program}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                  {g.computedCgpa}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                  {g.computedGrade}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-[10px] font-semibold italic">
            No active program grades recorded
          </div>
        )}
      </div>
    </div>
  );
};

export default OutcomeOverviewCard;
