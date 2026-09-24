'use client';

/**
 * X-29 Subject Edit Modal (features/subjects/components/SubjectEditModal.tsx)
 * 
 * Recreates legacy #subject-edit-modal from js/features/tasks/subjectGoals.js.
 * Allows editing subject name, track assignment, program, and deleting subject.
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Track, CustomProgramsMap } from '@/types/taxonomy';
import { X, Edit3, Trash2 } from 'lucide-react';

interface SubjectEditModalProps {
  subject: string | null;
  currentProgram: string;
  currentTrackId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracks: Track[];
  customPrograms: CustomProgramsMap;
  onSave: (oldName: string, newName: string, trackId: string, program: string) => void;
  onDelete: (trackId: string, subjectName: string) => void;
}

export const SubjectEditModal: React.FC<SubjectEditModalProps> = ({
  subject,
  currentProgram,
  currentTrackId,
  open,
  onOpenChange,
  tracks,
  customPrograms,
  onSave,
  onDelete,
}) => {
  const [subjectName, setSubjectName] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  useEffect(() => {
    if (open && subject) {
      setSubjectName(subject);
      setSelectedTrack(currentTrackId || (tracks[0]?.id ?? 'trackA'));
      setSelectedProgram(currentProgram);
      setConfirmDelete(false);
    }
  }, [open, subject, currentProgram, currentTrackId, tracks]);

  if (!subject) return null;

  const availablePrograms = customPrograms[selectedTrack] || [];

  const handleSave = () => {
    if (!subjectName.trim()) return;
    onSave(subject, subjectName.trim(), selectedTrack, selectedProgram || (availablePrograms[0]?.name ?? 'General'));
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(currentTrackId, subject);
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
                Edit Subject Details
              </span>
              <Dialog.Title className="text-lg sm:text-xl font-black text-white mt-0.5">
                {subject}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Form */}
          <div className="py-5 space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Subject Name
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Track
                </label>
                <select
                  value={selectedTrack}
                  onChange={(e) => {
                    setSelectedTrack(e.target.value);
                    const newProgs = customPrograms[e.target.value] || [];
                    if (newProgs.length > 0) {
                      setSelectedProgram(newProgs[0].name || String(newProgs[0]));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Program
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                >
                  {availablePrograms.map((p) => {
                    const pName = p.name || String(p);
                    return (
                      <option key={pName} value={pName}>
                        {pName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {confirmDelete && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                Are you sure? This will remove the subject from your curriculum and archive associated tasks.
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                confirmDelete
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmDelete ? 'Confirm Delete' : 'Delete Subject'}</span>
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
