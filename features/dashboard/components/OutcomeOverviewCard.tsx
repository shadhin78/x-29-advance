'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useOutcomeStore } from '@/stores/useOutcomeStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { groupAndProcessResults } from '@/features/outcome/services/outcomeEngine';
import type { OutcomeProgramGroup } from '@/types/outcome';
import { Award, ExternalLink } from 'lucide-react';

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

  const { overallAverage, overallGrade } = useMemo(() => {
    if (groups.length === 0) return { overallAverage: 0, overallGrade: 'N/A' };
    const numValues = groups
      .map((g) => parseFloat(g.computedCgpa))
      .filter((v) => !isNaN(v) && v > 0);

    if (numValues.length === 0) return { overallAverage: 0, overallGrade: 'N/A' };
    const avg = numValues.reduce((sum, v) => sum + v, 0) / numValues.length;
    return {
      overallAverage: avg,
      overallGrade: groups[0]?.computedGrade || 'A',
    };
  }, [groups]);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-1.5 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 rounded-xl border border-yellow-100 dark:border-yellow-800/40">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Outcome & CGPA
            </h3>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-extrabold truncate">
              [ Grade • CGPA • Results ]
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50">
            {overallGrade}
          </span>
          <Link
            href="/outcome"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
            title="Go to Outcome Page"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 custom-scrollbar text-[10px]">
        {groups.length > 0 ? (
          groups.map((grp: OutcomeProgramGroup) => (
            <div
              key={grp.id}
              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block truncate">
                  {grp.program}
                </span>
                <span className="text-[9px] text-slate-400">
                  {grp.subjects.length} subject(s) recorded
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  {grp.computedCgpa}
                </span>
                <span className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">
                  {grp.computedGrade}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs font-bold">
            No program results entered yet.
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
        <span>Overall Cumulative</span>
        <span className="text-slate-900 dark:text-white text-xs font-black">
          {overallAverage.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
