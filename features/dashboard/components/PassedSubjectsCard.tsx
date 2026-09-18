'use client';

import React from 'react';
import Link from 'next/link';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export const PassedSubjectsCard: React.FC = () => {
  const { passedItems, getNormalizedSubjects } = useTaxonomyStore();
  const allSubjects = getNormalizedSubjects();

  const passedList = allSubjects.filter(
    (s) => s.isPassed || passedItems.subjects.includes(s.name)
  );

  const rate =
    allSubjects.length > 0 ? Math.round((passedList.length / allSubjects.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col select-none h-[250px]">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
              Passed Subjects
            </h3>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-extrabold truncate">
              [ Subject • Program • Freeze ]
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50">
            {rate}% Passed
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

      <div className="grid grid-cols-2 gap-2 content-start overflow-y-auto pr-1 flex-1 custom-scrollbar text-[10px] mt-1">
        {passedList.length > 0 ? (
          passedList.map((s) => (
            <div
              key={s.id}
              className="p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {s.name}
              </span>
              <span className="text-[8px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 mt-1">
                Passed & Frozen
              </span>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-6 text-slate-400 text-xs font-bold">
            No subjects marked as passed yet.
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
        <span>Passed Count</span>
        <span className="text-slate-900 dark:text-white text-xs font-black">
          {passedList.length} / {allSubjects.length}
        </span>
      </div>
    </div>
  );
};
