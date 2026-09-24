'use client';

/**
 * X-29 Subject Time Goal Modal (features/subjects/components/SubjectTimeModal.tsx)
 * 
 * Recreates legacy #subject-time-modal from js/features/tasks/subjectGoals.js.
 * Preserves all inputs, link options, and styles.
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { PaceGoal } from '@/types/pace';
import type { SubjectTimeLink } from '@/types/taxonomy';
import { X, Calendar, Link2, Trash2 } from 'lucide-react';

interface SubjectTimeModalProps {
  subject: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLink?: SubjectTimeLink;
  paceGoals: PaceGoal[];
  onSave: (subject: string, link: SubjectTimeLink | null) => void;
}

export const SubjectTimeModal: React.FC<SubjectTimeModalProps> = ({
  subject,
  open,
  onOpenChange,
  currentLink,
  paceGoals,
  onSave,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');

  useEffect(() => {
    if (open && currentLink) {
      if (currentLink.type === 'goal') {
        setSelectedGoalId(currentLink.id || '');
        setStartDate('');
        setTargetDate('');
      } else if (currentLink.type === 'date') {
        setSelectedGoalId('');
        setStartDate(currentLink.startDate || '');
        setTargetDate(currentLink.date || '');
      }
    } else if (open) {
      setSelectedGoalId('');
      setStartDate('');
      setTargetDate('');
    }
  }, [open, currentLink]);

  if (!subject) return null;

  const handleSave = () => {
    if (targetDate) {
      onSave(subject, { type: 'date', startDate, date: targetDate });
    } else if (selectedGoalId) {
      onSave(subject, { type: 'goal', id: selectedGoalId });
    } else {
      onSave(subject, null);
    }
    onOpenChange(false);
  };

  const handleClear = () => {
    onSave(subject, null);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white flex flex-col focus:outline-none animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Subject Timeline Setup
              </span>
              <Dialog.Title className="text-lg sm:text-xl font-black text-white mt-0.5">
                {subject}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Form Content */}
          <div className="py-5 space-y-4">
            {/* Option 1: Link to Existing Pace Goal */}
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                <Link2 className="w-4 h-4 text-indigo-400" />
                <span>Link to Active Pace Goal</span>
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => {
                  setSelectedGoalId(e.target.value);
                  if (e.target.value) {
                    setTargetDate('');
                    setStartDate('');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="">-- None Selected --</option>
                {paceGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.target} ({g.deadline})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-wider my-2">
              <div className="h-px bg-slate-800 flex-1" />
              <span>OR Custom Dates</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Option 2: Custom Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value) setSelectedGoalId('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    setTargetDate(e.target.value);
                    if (e.target.value) setSelectedGoalId('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Goal</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
