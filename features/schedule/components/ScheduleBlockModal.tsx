'use client';

/**
 * X-29 Schedule Block Modal (features/schedule/components/ScheduleBlockModal.tsx)
 * 
 * 100% Parity with legacy index.html (#add-schedule-modal) & scheduleRoutine.js (lines 78-311).
 * Accessible Radix Dialog for creating and editing daily schedule slots with
 * live color picker, track/program cascading, day-start flag, and strict validation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { ScheduleBlock } from '@/types/schedule';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import * as Dialog from '@radix-ui/react-dialog';

interface ScheduleBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockToEdit: ScheduleBlock | null;
  routineSet: number;
  onSave: (blockData: Omit<ScheduleBlock, 'id'>, existingId?: string) => void;
}

const COLOR_OPTIONS = [
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#f43f5e', label: 'Rose' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#64748b', label: 'Slate' },
];

export const ScheduleBlockModal: React.FC<ScheduleBlockModalProps> = ({
  open,
  onOpenChange,
  blockToEdit,
  routineSet,
  onSave,
}) => {
  const { tracks, customPrograms } = useTaxonomyStore();

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [task, setTask] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isDayStart, setIsDayStart] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (blockToEdit) {
      setStartTime(blockToEdit.startTime || '09:00');
      setEndTime(blockToEdit.endTime || '10:00');
      setTask(blockToEdit.task || '');
      setSelectedTrack(blockToEdit.track || '');
      setSelectedProgram(blockToEdit.program || '');
      setColor(blockToEdit.color || (routineSet === 2 ? '#8b5cf6' : '#6366f1'));
      setIsDayStart(!!blockToEdit.isDayStart);
      setValidationError('');
    } else {
      setStartTime('09:00');
      setEndTime('10:00');
      setTask('');
      setSelectedTrack('');
      setSelectedProgram('');
      setColor(routineSet === 2 ? '#8b5cf6' : '#6366f1');
      setIsDayStart(false);
      setValidationError('');
    }
  }, [blockToEdit, routineSet, open]);

  // Available programs based on chosen track
  const availablePrograms = useMemo(() => {
    if (!selectedTrack) return [];
    return customPrograms[selectedTrack] || [];
  }, [selectedTrack, customPrograms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      setValidationError('Please fill in start and end times.');
      return;
    }
    if (!task.trim()) {
      setValidationError('Please enter a work name.');
      return;
    }
    if (startTime >= endTime) {
      setValidationError('Start time must be before end time.');
      return;
    }

    setValidationError('');
    onSave(
      {
        day: 'Daily',
        startTime,
        endTime,
        task: task.trim(),
        track: selectedTrack || undefined,
        program: selectedProgram || undefined,
        color,
        isDayStart,
      },
      blockToEdit?.id
    );

    onOpenChange(false);
  };

  const titleText =
    routineSet === 2
      ? blockToEdit
        ? 'Edit Routine 2 Slot'
        : 'Add Routine 2 Slot'
      : blockToEdit
      ? 'Edit Daily Slot'
      : 'Add Daily Slot';

  const subtitleText =
    routineSet === 2
      ? blockToEdit
        ? 'Update your second routine set slot'
        : 'Add a slot to your second routine set'
      : blockToEdit
      ? 'Update your daily schedule slot'
      : 'Plan your daily schedule slot';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          id="asm-schedule-backdrop"
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[80] transition-opacity duration-300"
        />
        <Dialog.Content
          id="add-schedule-modal"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 z-[80] focus:outline-none flex flex-col mx-4"
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <Dialog.Title className="text-xl font-black text-slate-800 dark:text-slate-100">
                  {titleText}
                </Dialog.Title>
                <Dialog.Description className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  {subtitleText}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              data-modal-close="add-schedule-modal"
              className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:rotate-90 transition-transform active:scale-95"
            >
              <svg className="w-5 h-5 text-slate-500 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            {validationError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400">
                {validationError}
              </div>
            )}

            {/* Start and End Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Start Time:
                </label>
                <input
                  type="time"
                  id="schedule-input-start"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-inner"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  End Time:
                </label>
                <input
                  type="time"
                  id="schedule-input-end"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-inner"
                />
              </div>
            </div>

            {/* Work Task Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Work Name:
              </label>
              <input
                type="text"
                id="schedule-input-task"
                placeholder="e.g. Mathematics Practice"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-inner"
              />
            </div>

            {/* Day Start Settings */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Day Start Settings:
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400 dark:has-[:checked]:bg-blue-900/30 dark:has-[:checked]:border-blue-600 group w-full select-none">
                  <input
                    type="checkbox"
                    id="schedule-input-daystart"
                    checked={isDayStart}
                    onChange={(e) => setIsDayStart(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 cursor-pointer transition-all"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-has-[:checked]:text-blue-600 dark:group-has-[:checked]:text-blue-400">
                    ☀️ Start timeline from this slot
                  </span>
                </label>
              </div>
            </div>

            {/* Track and Program Dropdowns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Track (Optional):
                </label>
                <select
                  id="schedule-input-track"
                  data-schedule-track-select
                  value={selectedTrack}
                  onChange={(e) => {
                    setSelectedTrack(e.target.value);
                    setSelectedProgram('');
                  }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-inner cursor-pointer"
                >
                  <option value="">None (Optional)</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Program (Optional):
                </label>
                <select
                  id="schedule-input-program"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  disabled={!selectedTrack}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-inner cursor-pointer disabled:opacity-50"
                >
                  <option value="">None (Optional)</option>
                  {availablePrograms.map((p, idx) => {
                    const pName = typeof p === 'string' ? p : p.name;
                    return (
                      <option key={`${pName}_${idx}`} value={pName}>
                        {pName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Routine Color Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Routine Color:
              </label>
              <div className="flex flex-wrap gap-2.5 mt-1" id="schedule-color-picker">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    data-schedule-color={c.hex}
                    data-color={c.hex}
                    title={c.label}
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-full transition-all active:scale-90 ${
                      color === c.hex ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <button
                type="button"
                data-modal-close="add-schedule-modal"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-add-schedule"
                data-submit-add-schedule
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-black uppercase tracking-wider text-white active:scale-95 transition-all shadow-md"
              >
                {blockToEdit ? 'Save Changes' : 'Add Slot'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
