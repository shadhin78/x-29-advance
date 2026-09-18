'use client';

/**
 * X-29 Chapter Checklist Modal (features/subjects/components/ChapterChecklistModal.tsx)
 * 
 * Interactive chapter-by-chapter task checklist with instant completion toggles.
 */

import React, { useMemo } from 'react';
import type { NormalizedSubject } from '@/types/taxonomy';
import { getChapterNumbers } from '@/features/taxonomy/services/taxonomyService';
import { getCompletedChaptersForSubject } from '@/features/tasks/services/taskService';
import { useTaskStore } from '@/stores/useTaskStore';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Check, BookOpen } from 'lucide-react';

interface ChapterChecklistModalProps {
  subject: NormalizedSubject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChapterChecklistModal: React.FC<ChapterChecklistModalProps> = ({
  subject,
  open,
  onOpenChange,
}) => {
  const { tasks, toggleChapter } = useTaskStore();

  const chapters = useMemo(() => {
    if (!subject) return [];
    return getChapterNumbers(subject.chaptersCount);
  }, [subject]);

  const completedSet = useMemo(() => {
    if (!subject) return new Set<number>();
    return getCompletedChaptersForSubject(tasks, subject.name);
  }, [tasks, subject]);

  if (!subject) return null;

  const completedCount = completedSet.size;
  const totalCount = subject.chaptersCount;
  const percentage = Math.min(100, Math.round((completedCount / totalCount) * 100));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white flex flex-col focus:outline-none animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {subject.program} • {subject.trackName}
              </span>
              <Dialog.Title className="text-lg sm:text-xl font-black text-white mt-0.5">
                {subject.name}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Progress Summary Header */}
          <div className="py-4 space-y-2 border-b border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>{completedCount} of {totalCount} Chapters Completed</span>
              </span>
              <span className={completedCount === totalCount ? 'text-emerald-400' : 'text-blue-400'}>
                {percentage}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: completedCount === totalCount ? '#10b981' : subject.color,
                }}
              />
            </div>
          </div>

          {/* Chapters List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2.5 pr-1 custom-scrollbar">
            {chapters.map((chNum) => {
              const isDone = completedSet.has(chNum);
              return (
                <div
                  key={chNum}
                  onClick={() => toggleChapter(subject.name, chNum, subject.trackId)}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-700 bg-slate-900 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold">
                        Chapter {chNum}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? 'Completed' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
