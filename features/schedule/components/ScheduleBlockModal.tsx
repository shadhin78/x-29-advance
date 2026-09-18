'use client';

/**
 * X-29 Schedule Block Modal (features/schedule/components/ScheduleBlockModal.tsx)
 * 
 * Accessible dialog for adding or editing a daily schedule block.
 */

import React, { useState, useEffect } from 'react';
import type { ScheduleBlock } from '@/types/schedule';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, Clock, Palette } from 'lucide-react';

interface ScheduleBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockToEdit: ScheduleBlock | null;
  routineSet: number;
  onSave: (blockData: Omit<ScheduleBlock, 'id'>, existingId?: string) => void;
}

const COLOR_OPTIONS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#64748b', // Slate
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

  useEffect(() => {
    if (blockToEdit) {
      setStartTime(blockToEdit.startTime || '09:00');
      setEndTime(blockToEdit.endTime || '10:00');
      setTask(blockToEdit.task || '');
      setSelectedTrack(blockToEdit.track || '');
      setSelectedProgram(blockToEdit.program || '');
      setColor(blockToEdit.color || (routineSet === 2 ? '#8b5cf6' : '#6366f1'));
      setIsDayStart(!!blockToEdit.isDayStart);
    } else {
      setStartTime('09:00');
      setEndTime('10:00');
      setTask('');
      setSelectedTrack('');
      setSelectedProgram('');
      setColor(routineSet === 2 ? '#8b5cf6' : '#6366f1');
      setIsDayStart(false);
    }
  }, [blockToEdit, routineSet, open]);

  // Available programs based on chosen track
  const availablePrograms = React.useMemo(() => {
    if (!selectedTrack) return [];
    return customPrograms[selectedTrack] || [];
  }, [selectedTrack, customPrograms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || !startTime || !endTime) return;
    if (startTime >= endTime) {
      alert('Start time must be before end time.');
      return;
    }

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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <Dialog.Title className="text-base font-black uppercase tracking-wider">
                {blockToEdit ? `Edit Routine ${routineSet} Slot` : `Add Routine ${routineSet} Slot`}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Work Task Name */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Work Name / Activity
              </label>
              <input
                type="text"
                placeholder="e.g. Deep Study Block 1"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
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
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Track and Program */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Track (Optional)
                </label>
                <select
                  value={selectedTrack}
                  onChange={(e) => {
                    setSelectedTrack(e.target.value);
                    setSelectedProgram('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">None</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Program (Optional)
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  disabled={!selectedTrack}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-40"
                >
                  <option value="">None</option>
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

            {/* Color Picker */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Slot Color</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-xl transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Day Start Checkbox */}
            <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:bg-slate-950 select-none transition-all">
              <input
                type="checkbox"
                checked={isDayStart}
                onChange={(e) => setIsDayStart(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-black text-amber-400">☀️ Day Starts Here</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  The daily timeline grid will rotate to display this slot as the start of the day.
                </p>
              </div>
            </label>

            {/* Submit */}
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
                {blockToEdit ? 'Save Changes' : 'Add Slot'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
