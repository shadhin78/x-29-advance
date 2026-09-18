'use client';

/**
 * X-29 Pass / Freeze Configuration Component (features/outcome/components/PassFreezeSection.tsx)
 * 
 * Allows marking entire programs or individual subjects as "Passed" / "Frozen".
 * Synchronizes with useTaxonomyStore.passedItems.
 */

import React, { useState } from 'react';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { ShieldCheck, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';

export const PassFreezeSection: React.FC = () => {
  const { tracks, customPrograms, syllabusStructure, passedItems, toggleProgramPassed, toggleSubjectPassed } =
    useTaxonomyStore();

  const [isOpen, setIsOpen] = useState(false);
  const [openPrograms, setOpenPrograms] = useState<Record<string, boolean>>({});

  const toggleProgramAccordion = (progName: string) => {
    setOpenPrograms((prev) => ({
      ...prev,
      [progName]: !prev[progName],
    }));
  };

  const isProgramPassed = (progName: string) => passedItems.programs.includes(progName);
  const isSubjectPassed = (progName: string, subName: string) =>
    isProgramPassed(progName) || passedItems.subjects.includes(subName);

  return (
    <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 sm:p-7 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left"
      >
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 rounded-2xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              Pass / Freeze Configuration
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Freeze completed programs or subjects to satisfy pacing
            </p>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 sm:p-7 pt-2 border-t border-slate-800 space-y-6">
          <p className="text-xs text-slate-400 font-medium">
            Mark entire programs or specific subjects as &quot;Passed&quot;. This freezes them in the
            study dashboard, compacts their UI in the Task Checklist, and fulfills their pacing targets.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Column 1: Programs (Freeze All Subs) */}
            <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-3">
                Programs (Freeze All Subs)
              </h4>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {tracks.map((track) => {
                  const progs = customPrograms[track.id] || [];
                  if (progs.length === 0) return null;
                  return (
                    <div key={track.id} className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">
                        {track.name}
                      </span>
                      {progs.map((p, idx) => {
                        const pName = typeof p === 'string' ? p : p.name;
                        const checked = isProgramPassed(pName);
                        return (
                          <label
                            key={`${pName}_${idx}`}
                            className={`flex items-center space-x-3 p-2 rounded-xl border transition-all cursor-pointer ${
                              checked
                                ? 'bg-emerald-950/30 border-emerald-800/80 text-white'
                                : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProgramPassed(pName)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold truncate">{pName}</span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Individual Subjects */}
            <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-3">
                Individual Subjects
              </h4>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {tracks.map((track) => {
                  const progs = customPrograms[track.id] || [];
                  const trackSubs = syllabusStructure[track.id] || [];

                  return progs.map((prog, idx) => {
                    const pName = typeof prog === 'string' ? prog : prog.name;
                    const subs = trackSubs.filter((s) => s.program === pName);
                    if (subs.length === 0) return null;

                    const progOpen = !!openPrograms[pName];
                    const progPassed = isProgramPassed(pName);

                    return (
                      <div
                        key={`${pName}_sub_${idx}`}
                        className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50"
                      >
                        <div
                          onClick={() => toggleProgramAccordion(pName)}
                          className="flex items-center justify-between p-2.5 bg-slate-900 cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-white">{pName}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                              {subs.length} Subs
                            </span>
                          </div>
                          {progOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>

                        {progOpen && (
                          <div className="p-2 space-y-1 bg-slate-950/40 border-t border-slate-800">
                            {subs.map((s) => {
                              const checked = isSubjectPassed(pName, s.subject);
                              return (
                                <label
                                  key={s.subject}
                                  className={`flex items-center space-x-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                                    checked
                                      ? 'bg-emerald-950/20 border-emerald-800/60 text-white'
                                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={progPassed}
                                    onChange={() => toggleSubjectPassed(s.subject)}
                                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                                  />
                                  <span className="text-xs font-bold truncate">{s.subject}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
