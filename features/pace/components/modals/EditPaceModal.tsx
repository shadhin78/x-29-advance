'use client';

/**
 * X-29 Edit Pace Goal Modal (features/pace/components/modals/EditPaceModal.tsx)
 * 
 * 100% Parity with index.html lines 588-662 (#edit-pace-modal):
 * - Target Name input (#edit-pace-name)
 * - Start Date (#edit-pace-start) and Deadline (#edit-pace-date)
 * - Dynamic included items checklist (#edit-pace-subjects-container)
 * - Save Changes button (#btn-save-pace-edit)
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { PaceGoal } from '@/types/pace';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';

interface EditPaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: PaceGoal | null;
  onSave: (id: string, updates: Partial<PaceGoal>) => void;
}

export const EditPaceModal: React.FC<EditPaceModalProps> = ({
  open,
  onOpenChange,
  goal,
  onSave,
}) => {
  const { tracks, customPrograms, syllabusStructure } = useTaxonomyStore();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  useEffect(() => {
    if (goal) {
      setName(goal.target || '');
      setStartDate(goal.startDate || '2026-01-01');
      setDeadline(goal.deadline || '2026-10-31');
      setSelectedSubjects(goal.subjects || []);
      setSelectedPrograms(goal.programs || []);
    }
  }, [goal, open]);

  const toggleSubject = (sName: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sName) ? prev.filter((s) => s !== sName) : [...prev, sName]
    );
  };

  const toggleProgram = (pName: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(pName) ? prev.filter((p) => p !== pName) : [...prev, pName]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !name.trim() || !startDate || !deadline) return;

    onSave(goal.id, {
      target: name.trim(),
      startDate,
      deadline,
      subjects: goal.type === 'bundle' || goal.type === 'global' ? selectedSubjects : undefined,
      programs: goal.type === 'bundle' ? selectedPrograms : undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay id="epm-backdrop" className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          id="epm-content"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[90vh] mx-4 focus:outline-none animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <Dialog.Title className="text-xl font-black text-slate-900 dark:text-white">
                  Edit Timeline
                </Dialog.Title>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Modify target data
                </p>
              </div>
            </div>
            <Dialog.Close className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:rotate-90 transition-transform active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex flex-col gap-4 mb-6 overflow-y-auto custom-scrollbar pr-2 flex-1">
              <div id="epm-name-container" className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Target Name
                </label>
                <input
                  type="text"
                  id="edit-pace-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-bold w-full outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="edit-pace-start"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-bold w-full outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Deadline
                  </label>
                  <input
                    type="date"
                    id="edit-pace-date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-bold w-full outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Items Checklist */}
              {(goal?.type === 'bundle' || goal?.type === 'global') && (
                <div className="flex flex-col gap-3 mt-2" id="epm-checklist-section">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                    Included Items
                  </label>
                  <div id="edit-pace-subjects-container" className="flex flex-col gap-3 p-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {tracks.map((track) => {
                      const progs = customPrograms[track.id] || [];
                      const subs = syllabusStructure[track.id] || [];
                      return (
                        <div key={track.id} className="space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-orange-500 block">
                            {track.name}
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {subs.map((s) => {
                              const checked = selectedSubjects.includes(s.subject);
                              return (
                                <label
                                  key={s.subject}
                                  className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                    checked
                                      ? 'bg-orange-500/10 border-orange-500/40 text-slate-900 dark:text-white font-bold'
                                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-500'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleSubject(s.subject)}
                                    className="form-checkbox h-3.5 w-3.5 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500"
                                  />
                                  <span className="truncate text-[11px]">{s.subject}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-slate-500 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-black text-[10px] uppercase tracking-widest py-2.5 px-4 rounded-lg transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-pace-edit"
                data-pace-save
                className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest py-2.5 px-6 rounded-lg transition-colors shadow-md active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
