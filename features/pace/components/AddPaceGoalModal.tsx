'use client';

/**
 * X-29 Add / Edit Pace Goal Modal (features/pace/components/AddPaceGoalModal.tsx)
 * 
 * Accessible dialog for defining timeline pace targets, bundle scopes,
 * and completion deadlines.
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { PaceGoal } from '@/types/pace';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Target, Calendar } from 'lucide-react';

interface AddPaceGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalToEdit: PaceGoal | null;
  onSave: (goalData: Omit<PaceGoal, 'id'>, existingId?: string) => void;
}

export const AddPaceGoalModal: React.FC<AddPaceGoalModalProps> = ({
  open,
  onOpenChange,
  goalToEdit,
  onSave,
}) => {
  const { tracks, customPrograms, syllabusStructure } = useTaxonomyStore();

  const [type, setType] = useState<'bundle' | 'program' | 'subject' | 'global'>('bundle');
  const [target, setTarget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  // Collect all programs
  const allPrograms = useMemo(() => {
    const list: string[] = [];
    tracks.forEach((t) => {
      const progs = customPrograms[t.id] || [];
      progs.forEach((p) => {
        const name = typeof p === 'string' ? p : p.name;
        if (!list.includes(name)) list.push(name);
      });
    });
    return list;
  }, [tracks, customPrograms]);

  // Collect all subjects grouped by program
  const allSubjects = useMemo(() => {
    const list: { subject: string; program: string }[] = [];
    tracks.forEach((t) => {
      const subs = syllabusStructure[t.id] || [];
      subs.forEach((s) => {
        if (!list.some((item) => item.subject === s.subject)) {
          list.push({ subject: s.subject, program: s.program });
        }
      });
    });
    return list;
  }, [tracks, syllabusStructure]);

  useEffect(() => {
    if (goalToEdit) {
      setType(goalToEdit.type);
      setTarget(goalToEdit.target || '');
      setStartDate(goalToEdit.startDate || '2026-01-01');
      setDeadline(goalToEdit.deadline || '2026-10-31');
      setSelectedSubjects(goalToEdit.subjects || []);
      setSelectedPrograms(goalToEdit.programs || []);
    } else {
      setType('bundle');
      setTarget('');
      setStartDate('2026-01-01');
      setDeadline(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
      setSelectedSubjects([]);
      setSelectedPrograms([]);
    }
  }, [goalToEdit, open]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim() || !startDate || !deadline) return;

    onSave(
      {
        type,
        target: target.trim(),
        startDate,
        deadline,
        subjects: type === 'bundle' || type === 'global' ? selectedSubjects : undefined,
        programs: type === 'bundle' ? selectedPrograms : undefined,
      },
      goalToEdit?.id
    );

    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              <Dialog.Title className="text-base font-black uppercase tracking-wider">
                {goalToEdit ? 'Edit Pace Target' : 'Create Pace Target'}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
            {/* Bundle Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Timeline Target Scope
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="bundle">Specific Subjects Bundle</option>
                <option value="program">Entire Program Goal</option>
                <option value="global">Global Overall Target</option>
              </select>
            </div>

            {/* Target / Goal Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Goal Name
              </label>
              <input
                type="text"
                placeholder="e.g. Phase 1 Academic Target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            {/* Subject / Program Checklist */}
            {type === 'bundle' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                  Select Included Subjects
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {allSubjects.map((s) => {
                    const checked = selectedSubjects.includes(s.subject);
                    return (
                      <label
                        key={s.subject}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          checked
                            ? 'bg-orange-950/30 border-orange-800/80 text-white'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="text-xs font-bold text-slate-200 block truncate">
                            {s.subject}
                          </span>
                          <span className="text-[9px] text-slate-500 font-medium">
                            {s.program}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSubject(s.subject)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                {goalToEdit ? 'Save Target' : 'Create Target'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
