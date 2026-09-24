'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { NormalizedSubject } from '@/types/taxonomy';
import type { StudyTask } from '@/types/task';

interface SubjectTrendModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: NormalizedSubject[];
  tasks: StudyTask[];
}

export const SubjectTrendModal: React.FC<SubjectTrendModalProps> = ({
  isOpen,
  onClose,
  subjects,
  tasks,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Subject Breakdown & Progress
            </h3>
            <p className="text-xs text-slate-400">
              Granular completion metrics across curriculum subjects
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map((sub) => {
            const subTasks = tasks.filter((t) => t.subject === sub.name);
            const completed = subTasks.filter((t) => t.completed).length;
            const total = sub.chaptersCount || 1;
            const pct = Math.round((completed / total) * 100);

            return (
              <div
                key={sub.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-indigo-500">
                      {sub.program}
                    </span>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white mt-0.5">
                      {sub.name}
                    </h4>
                  </div>
                  <span className="text-xs font-black text-emerald-500">{pct}%</span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-1">
                    <span>Chapters</span>
                    <span>
                      {completed} / {total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
