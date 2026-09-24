'use client';

/**
 * X-29 Exam Session Modal (features/exam/components/SessionModal.tsx)
 * 
 * Accessible dialog for creating and editing timeframe session groups.
 * Parity with legacy #session-modal.
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, X, AlertCircle } from 'lucide-react';
import type { ExamSession } from '@/types/exam';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';

interface SessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToEdit: ExamSession | null;
  onSave: (sessionData: Omit<ExamSession, 'id'>, id?: string) => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  open,
  onOpenChange,
  sessionToEdit,
  onSave,
}) => {
  const { tracks, customPrograms, getNormalizedSubjects } = useTaxonomyStore();

  const [program, setProgram] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Extract available programs from taxonomy store
  const availablePrograms = useMemo(() => {
    const progSet = new Set<string>();

    // From normalized subjects
    const norm = getNormalizedSubjects();
    norm.forEach((s) => {
      if (s.program) progSet.add(s.program);
    });

    // From custom programs
    Object.values(customPrograms).forEach((pList) => {
      if (Array.isArray(pList)) {
        pList.forEach((p) => {
          if (p && p.name) progSet.add(p.name);
        });
      }
    });

    return Array.from(progSet).sort();
  }, [customPrograms, getNormalizedSubjects]);

  useEffect(() => {
    if (sessionToEdit) {
      setProgram(sessionToEdit.program || '');
      setName(sessionToEdit.name || '');
      setStartDate(sessionToEdit.startDate || '');
      setEndDate(sessionToEdit.endDate || '');
    } else {
      setProgram(availablePrograms[0] || 'Non-Program');
      setName('');
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    }
    setErrorMsg('');
  }, [sessionToEdit, open, availablePrograms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!program) {
      setErrorMsg('Please select a program.');
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setErrorMsg('Start date cannot be after end date.');
      return;
    }

    onSave(
      {
        program,
        name: name.trim(),
        startDate,
        endDate,
      },
      sessionToEdit?.id
    );

    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content
          aria-describedby="session-modal-description"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-[999999] overflow-hidden flex flex-col focus:outline-none animate-in zoom-in-95"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <Dialog.Title className="text-sm md:text-base font-black text-slate-800 dark:text-white uppercase tracking-wider truncate">
                  {sessionToEdit ? 'Edit Session' : 'Add Session'}
                </Dialog.Title>
                <p
                  id="session-modal-description"
                  className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate"
                >
                  Create a timeframe group for exams
                </p>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form Body */}
          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-5 md:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-75px)] sm:max-h-[calc(88vh-75px)]"
          >
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Select Program *
              </label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                required
                className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="">-- Select Program --</option>
                <option value="Non-Program">⚙️ Non-Program Wise (Custom)</option>
                {availablePrograms.map((pName) => (
                  <option key={pName} value={pName}>
                    🎓 {pName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Session Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Midterm Exams, Quiz Week"
                className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl bg-slate-100 sm:bg-transparent dark:bg-slate-800 sm:dark:bg-transparent min-h-[42px] flex items-center justify-center transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 min-h-[42px] flex items-center justify-center cursor-pointer"
              >
                Save Session
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
