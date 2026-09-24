'use client';

/**
 * X-29 Global Chapters Modal (features/subjects/components/GlobalChaptersModal.tsx)
 * 
 * Recreates the modal opened by #btn-open-global-chapters.
 * Displays all subjects, track groupings, chapter completions, and progress rings.
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Track, SyllabusStructure } from '@/types/taxonomy';
import { X, BookOpen, CheckCircle2 } from 'lucide-react';
import { getSubjectColor } from '@/features/taxonomy/services/taxonomyService';

interface GlobalChaptersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracks: Track[];
  syllabusStructure: SyllabusStructure;
  completedChaptersMap: Record<string, Set<number>>;
  onSelectSubjectFilter?: (subject: string) => void;
}

export const GlobalChaptersModal: React.FC<GlobalChaptersModalProps> = ({
  open,
  onOpenChange,
  tracks,
  syllabusStructure,
  completedChaptersMap,
  onSelectSubjectFilter,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white flex flex-col focus:outline-none animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Curriculum Syllabus Overview</span>
              </span>
              <Dialog.Title className="text-lg sm:text-xl font-black text-white mt-0.5">
                All Subject Completions
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* List of Tracks and Subjects */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 custom-scrollbar">
            {tracks.map((trackObj) => {
              const subs = syllabusStructure[trackObj.id] || [];
              if (subs.length === 0) return null;

              return (
                <div key={trackObj.id} className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>{trackObj.name || trackObj.id}</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {subs.length} Subjects
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subs.map((s) => {
                      const completedCount = completedChaptersMap[s.subject]?.size || 0;
                      const totalCount = s.chapters || 0;
                      const percentage =
                        totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;
                      const isComplete = completedCount >= totalCount && totalCount > 0;
                      const subjectColor = getSubjectColor(s.subject);

                      return (
                        <div
                          key={s.subject}
                          onClick={() => {
                            if (onSelectSubjectFilter) {
                              onSelectSubjectFilter(s.subject);
                              onOpenChange(false);
                            }
                          }}
                          className="p-3.5 bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: subjectColor }}
                            />
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors block truncate">
                                {s.subject}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {s.program} • {completedCount}/{totalCount} Ch
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <span className="text-xs font-mono font-bold text-blue-400">
                                {percentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
