'use client';

/**
 * X-29 Subject Exam Modal (features/exam/components/SubjectExamModal.tsx)
 * 
 * Accessible dialog for creating and editing routine items inside a session block.
 * Parity with legacy #exam-modal.
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { BookOpen, X, AlertCircle } from 'lucide-react';
import type { ExamRoutineItem, ExamSession } from '@/types/exam';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { formatSessionDate } from '@/features/exam/services/examService';

interface SubjectExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examToEdit: ExamRoutineItem | null;
  targetSessionId: string | null;
  sessions: ExamSession[];
  onSave: (examData: Omit<ExamRoutineItem, 'id'>, id?: string) => void;
}

export const SubjectExamModal: React.FC<SubjectExamModalProps> = ({
  open,
  onOpenChange,
  examToEdit,
  targetSessionId,
  sessions,
  onSave,
}) => {
  const { getNormalizedSubjects } = useTaxonomyStore();

  const [mode, setMode] = useState<'program' | 'non-program'>('program');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [customSetting, setCustomSetting] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('10:00');
  const [room, setRoom] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Find active parent session
  const activeSession = useMemo(() => {
    const sId = examToEdit?.sessionId || targetSessionId;
    return sessions.find((s) => s.id === sId) || null;
  }, [examToEdit, targetSessionId, sessions]);

  // All subjects grouped by program
  const subjectsForProgram = useMemo(() => {
    if (!selectedProgram || selectedProgram === 'Non-Program') return [];
    const norm = getNormalizedSubjects();
    const filtered = norm.filter((s) => s.program === selectedProgram);
    return Array.from(new Set(filtered.map((s) => s.name))).sort();
  }, [selectedProgram, getNormalizedSubjects]);

  useEffect(() => {
    if (!open) return;

    const isNonProgram = activeSession?.program === 'Non-Program';
    const initMode = isNonProgram ? 'non-program' : (examToEdit?.mode || 'program');
    setMode(initMode);

    const prog = activeSession?.program || examToEdit?.program || '';
    setSelectedProgram(prog);

    if (examToEdit) {
      if (initMode === 'program') {
        setSelectedSubject(examToEdit.subject || '');
        setCustomSetting('');
      } else {
        setSelectedSubject('');
        setCustomSetting(examToEdit.subject || examToEdit.title || '');
      }
      setDate(examToEdit.date || '');
      setTime(examToEdit.time || examToEdit.startTime || '10:00');
      setRoom(examToEdit.room || examToEdit.venue || '');
    } else {
      setSelectedSubject('');
      setCustomSetting('');
      setDate(activeSession?.startDate || new Date().toISOString().slice(0, 10));
      setTime('10:00');
      setRoom('');
    }

    setErrorMsg('');
  }, [open, examToEdit, activeSession]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!activeSession) {
      setErrorMsg('Parent session not found.');
      return;
    }

    // Validate date bounds relative to session
    if (activeSession.startDate && date < activeSession.startDate) {
      setErrorMsg(`Exam date cannot be earlier than session start date (${activeSession.startDate}).`);
      return;
    }
    if (activeSession.endDate && date > activeSession.endDate) {
      setErrorMsg(`Exam date cannot be later than session end date (${activeSession.endDate}).`);
      return;
    }

    let finalProgram = '';
    let finalSubject = '';

    if (mode === 'program') {
      finalProgram = activeSession.program !== 'Non-Program' ? activeSession.program : selectedProgram;
      finalSubject = selectedSubject.trim();
      if (!finalSubject) {
        setErrorMsg('Please select a Subject.');
        return;
      }
    } else {
      finalProgram = 'Non-Program';
      finalSubject = customSetting.trim();
      if (!finalSubject) {
        setErrorMsg('Please enter a Custom Setting Name.');
        return;
      }
    }

    onSave(
      {
        sessionId: activeSession.id,
        mode,
        program: finalProgram,
        subject: finalSubject,
        title: finalSubject,
        date,
        time,
        startTime: time,
        room: room.trim() || 'TBA',
        venue: room.trim() || 'TBA',
        status: examToEdit?.status || 'upcoming',
        completed: examToEdit?.completed || false,
      },
      examToEdit?.id
    );

    onOpenChange(false);
  };

  const isLockedToProgram = Boolean(activeSession && activeSession.program !== 'Non-Program');

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content
          aria-describedby="exam-modal-description"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-[999999] overflow-hidden flex flex-col focus:outline-none animate-in zoom-in-95"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <Dialog.Title className="text-sm md:text-base font-black text-slate-800 dark:text-white uppercase tracking-wider truncate">
                  {examToEdit ? 'Edit Subject Exam' : 'Add Subject Exam'}
                </Dialog.Title>
                <p
                  id="exam-modal-description"
                  className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate"
                >
                  Configure exam routine item
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
            {/* Active Session Display */}
            {activeSession && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white">
                <span className="text-rose-500 font-black">Active Session:</span>{' '}
                {activeSession.name ? `${activeSession.program} - ${activeSession.name}` : activeSession.program}
                {activeSession.startDate && activeSession.endDate && (
                  <span className="text-slate-400 font-mono text-[11px] block mt-0.5">
                    ({formatSessionDate(activeSession.startDate)} - {formatSessionDate(activeSession.endDate)})
                  </span>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mode Switcher */}
            {!isLockedToProgram && (
              <div className="flex flex-col gap-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Exam Type / Mode *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setMode('program')}
                    className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer ${
                      mode === 'program'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    🎓 Program Wise
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('non-program')}
                    className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer ${
                      mode === 'non-program'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    ⚙️ Non-Program Wise
                  </button>
                </div>
              </div>
            )}

            {/* Program-Wise Fields */}
            {mode === 'program' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Program
                  </label>
                  <input
                    type="text"
                    disabled
                    value={activeSession?.program || selectedProgram}
                    className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Select Subject *
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    required
                    className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    <option value="">-- Select Subject --</option>
                    {subjectsForProgram.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                    {subjectsForProgram.length === 0 && (
                      <option value="" disabled>
                        No subjects configured under this program
                      </option>
                    )}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Custom Setting Name *
                </label>
                <input
                  type="text"
                  value={customSetting}
                  onChange={(e) => setCustomSetting(e.target.value)}
                  placeholder="e.g. Custom Subject Name, Personal Certification, Mock Test"
                  required
                  className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Venue / Hall / Room (Optional)
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Hall 402, Building 3"
                className="w-full min-h-[42px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
              />
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
                Save Exam Routine
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
