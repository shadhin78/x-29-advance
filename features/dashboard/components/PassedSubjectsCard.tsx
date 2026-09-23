'use client';

import React from 'react';
import Link from 'next/link';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';

export const PassedSubjectsCard: React.FC = () => {
  const { passedItems, getNormalizedSubjects } = useTaxonomyStore();
  const allSubjects = getNormalizedSubjects();

  const passedList = allSubjects.filter(
    (s) => s.isPassed || passedItems.subjects.includes(s.name)
  );

  const totalCount = allSubjects.length;
  const rate = totalCount > 0 ? Math.round((passedList.length / totalCount) * 100) : 0;

  return (
    <div
      id="dashboard-passed-subjects-section"
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col animate-page-enter select-none h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]"
    >
      {/* Card Header */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0 gap-1.5">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 border border-emerald-100 dark:border-emerald-800/40 shadow-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
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
          <span
            id="db-passed-subjects-rate-badge"
            className={
              passedList.length > 0
                ? 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-xs'
                : 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }
            title={`Success Rate: ${rate}%`}
          >
            {rate}%
          </span>
          <span
            id="db-passed-subjects-count-badge"
            className={
              passedList.length > 0
                ? 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-xs'
                : 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }
          >
            {passedList.length} Passed
          </span>
          <Link
            href="/outcome"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Manage in Outcome Page"
            aria-label="Manage in Outcome Page"
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

      {/* Mini Passed Subjects List (Scrollable 2-Column Grid) */}
      <div
        id="db-passed-subjects-list"
        className="grid grid-cols-2 gap-2 content-start overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar text-[10px] mt-1"
      >
        {passedList.length > 0 ? (
          passedList.map((s) => (
            <div
              key={s.id}
              className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 select-none shadow-2xs"
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }}
                />
                <div className="min-w-0">
                  <span
                    className="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-100 truncate block leading-tight"
                    title={s.name}
                  >
                    {s.name}
                  </span>
                  <div className="flex items-center gap-1 text-[7.5px] sm:text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
                    <span className="text-emerald-600 dark:text-emerald-400 font-black truncate max-w-[65px] sm:max-w-[85px]">
                      {s.program || 'Custom'}
                    </span>
                    <span>•</span>
                    <span className="truncate">{s.chaptersCount || 0} Ch</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                <span
                  className="text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 inline-flex items-center gap-0.5"
                  title="Passed & Frozen"
                >
                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Pass</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 h-full flex flex-col items-center justify-center py-4 text-center select-none">
            <span className="text-2xl mb-1.5 opacity-60">🛡️</span>
            <p className="text-xs font-black text-slate-600 dark:text-slate-300">No passed subjects yet</p>
            <p className="text-[9px] text-slate-400 mt-0.5 mb-2.5">Configure pass & freeze criteria in Outcome</p>
            <Link
              href="/outcome"
              className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Manage Pass / Freeze</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassedSubjectsCard;
