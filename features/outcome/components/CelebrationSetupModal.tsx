'use client';

/**
 * X-29 Celebration Setup Modal (features/outcome/components/CelebrationSetupModal.tsx)
 * 
 * Accessible dialog to configure which core programs and subjects are required
 * for unlocking the milestone completion celebration.
 */

import React, { useState, useEffect } from 'react';
import type { CelebrationTargets } from '@/types/outcome';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Award } from 'lucide-react';

interface CelebrationSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celebrationTargets: CelebrationTargets;
  onSave: (targets: CelebrationTargets) => void;
}

export const CelebrationSetupModal: React.FC<CelebrationSetupModalProps> = ({
  open,
  onOpenChange,
  celebrationTargets,
  onSave,
}) => {
  const { tracks, customPrograms, syllabusStructure } = useTaxonomyStore();

  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedPrograms(celebrationTargets.programs || []);
      setSelectedSubjects(celebrationTargets.subjects || []);
    }
  }, [open, celebrationTargets]);

  const toggleProgram = (pName: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(pName) ? prev.filter((p) => p !== pName) : [...prev, pName]
    );
  };

  const toggleSubject = (sName: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sName) ? prev.filter((s) => s !== sName) : [...prev, sName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      programs: selectedPrograms,
      subjects: selectedSubjects,
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-slate-900 dark:text-white focus:outline-none animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <Dialog.Title className="text-base font-black uppercase tracking-wider">
                Setup Celebration Criteria
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select which core programs or subjects must be passed to trigger your completion celebration.
            </p>

            {/* Core Programs */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                Core Programs
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {tracks.map((track) => {
                  const progs = customPrograms[track.id] || [];
                  return progs.map((p, idx) => {
                    const pName = typeof p === 'string' ? p : p.name;
                    const checked = selectedPrograms.includes(pName);
                    return (
                      <label
                        key={`${pName}_${idx}`}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          checked
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-white'
                            : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold truncate pr-2">{pName}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProgram(pName)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </label>
                    );
                  });
                })}
              </div>
            </div>

            {/* Core Subjects */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                Individual Core Subjects
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {tracks.map((track) => {
                  const trackSubs = syllabusStructure[track.id] || [];
                  return trackSubs.map((s) => {
                    const checked = selectedSubjects.includes(s.subject);
                    return (
                      <label
                        key={s.subject}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          checked
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-white'
                            : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className="text-xs font-bold truncate">{s.subject}</span>
                          <span className="text-[9px] text-slate-400">{s.program}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSubject(s.subject)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                      </label>
                    );
                  });
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Save Criteria
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
