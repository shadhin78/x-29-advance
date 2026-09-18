'use client';

/**
 * X-29 Exam Session Modal (features/exam/components/ExamSessionModal.tsx)
 * 
 * Accessible dialog for creating and editing exam routine items.
 */

import React, { useState, useEffect } from 'react';
import type { ExamRoutineItem } from '@/types/exam';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, BookOpen } from 'lucide-react';

interface ExamSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examToEdit: ExamRoutineItem | null;
  onSave: (exam: Omit<ExamRoutineItem, 'id'>, existingId?: string) => void;
  routineSet: number;
}

export const ExamSessionModal: React.FC<ExamSessionModalProps> = ({
  open,
  onOpenChange,
  examToEdit,
  onSave,
  routineSet,
}) => {
  const [subject, setSubject] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('13:00');
  const [room, setRoom] = useState<string>('');

  useEffect(() => {
    if (examToEdit) {
      setSubject(examToEdit.subject || '');
      setCode(examToEdit.code || '');
      setDate(examToEdit.date || '');
      setStartTime(examToEdit.startTime || examToEdit.time || '10:00');
      setEndTime(examToEdit.endTime || '13:00');
      setRoom(examToEdit.room || '');
    } else {
      setSubject('');
      setCode('');
      setDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
      setStartTime('10:00');
      setEndTime('13:00');
      setRoom('');
    }
  }, [examToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !date) return;

    onSave(
      {
        subject: subject.trim(),
        code: code.trim(),
        date,
        time: startTime,
        startTime,
        endTime,
        room: room.trim() || 'TBA',
        routineSet,
        completed: examToEdit?.completed || false,
      },
      examToEdit?.id
    );

    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <Dialog.Title className="text-base font-black uppercase tracking-wider">
                {examToEdit ? 'Edit Exam' : 'Schedule New Exam'}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Subject Title
              </label>
              <input
                type="text"
                placeholder="e.g. Operating Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Course Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSE-202"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Exam Hall / Room
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hall 402"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Exam Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                {examToEdit ? 'Save Changes' : 'Schedule Exam'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
