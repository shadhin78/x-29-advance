'use client';

/**
 * X-29 Revision Setup Modal (features/subjects/components/RevisionModal.tsx)
 * 
 * Recreates legacy #revision-modal from js/features/tasks/taskEngine.js.
 * Allows toggling subjects into Revision Mode and checking off revision practice chapters.
 */

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Track, SyllabusStructure, RevisionDataState } from '@/types/taxonomy';
import { X, RotateCcw, Check, Sparkles } from 'lucide-react';

interface RevisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracks: Track[];
  syllabusStructure: SyllabusStructure;
  revisionData: RevisionDataState;
  onToggleRevisionSubject: (subject: string) => void;
  onToggleRevisionChapter: (subject: string, chapter: number, completed: boolean) => void;
}

export const RevisionModal: React.FC<RevisionModalProps> = ({
  open,
  onOpenChange,
  tracks,
  syllabusStructure,
  revisionData,
  onToggleRevisionSubject,
  onToggleRevisionChapter,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Collect all unique subjects
  const allSubs: { subject: string; program: string; track: string; chapters: number }[] = [];
  tracks.forEach((t) => {
    const subs = syllabusStructure[t.id] || [];
    subs.forEach((s) => {
      allSubs.push({ subject: s.subject, program: s.program, track: t.name || t.id, chapters: s.chapters || 0 });
    });
  });

  const activeSubjects = revisionData.active || [];
  const currentSubObj = allSubs.find((s) => s.subject === selectedSubject) || allSubs[0];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white flex flex-col focus:outline-none animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Revision Mode Setup</span>
              </span>
              <Dialog.Title className="text-lg sm:text-xl font-black text-white mt-0.5">
                Active Revision Tracking
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Subtitle / Tip */}
          <div className="py-3 px-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl my-3 text-xs text-blue-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Enable Revision for passed or completed subjects to log additional study and practice cycles.</span>
          </div>

          {/* Subjects Selection List */}
          <div className="flex flex-wrap gap-2 py-2 max-h-36 overflow-y-auto custom-scrollbar border-b border-slate-800 pb-3">
            {allSubs.map((s) => {
              const isActive = activeSubjects.includes(s.subject);
              const isSelected = (selectedSubject || currentSubObj?.subject) === s.subject;

              return (
                <button
                  key={s.subject}
                  type="button"
                  onClick={() => setSelectedSubject(s.subject)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : isActive
                      ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span>{s.subject}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-blue-300" />}
                </button>
              );
            })}
          </div>

          {/* Selected Subject Details & Chapters */}
          {currentSubObj && (
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white">{currentSubObj.subject}</h3>
                  <span className="text-xs text-slate-400">
                    {currentSubObj.program} • {currentSubObj.track} ({currentSubObj.chapters} Chapters)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleRevisionSubject(currentSubObj.subject)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeSubjects.includes(currentSubObj.subject)
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  }`}
                >
                  {activeSubjects.includes(currentSubObj.subject) ? 'Disable Revision' : 'Enable Revision'}
                </button>
              </div>

              {/* Revision Chapters Grid */}
              {activeSubjects.includes(currentSubObj.subject) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {Array.from({ length: currentSubObj.chapters }, (_, i) => i + 1).map((chNum) => {
                    const isDone = !!revisionData.progress?.[currentSubObj.subject]?.[chNum];

                    return (
                      <div
                        key={chNum}
                        onClick={() => onToggleRevisionChapter(currentSubObj.subject, chNum, !isDone)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                          isDone
                            ? 'bg-blue-500/10 border-blue-500/30 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold">Ch. {chNum}</span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isDone ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 bg-slate-900 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
