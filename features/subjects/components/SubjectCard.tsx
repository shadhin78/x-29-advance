'use client';

/**
 * X-29 Subject Card Component (features/subjects/components/SubjectCard.tsx)
 * 
 * Displays subject title, program tag, track badge, progress bar,
 * and completion status with clickable chapter checklist trigger.
 */

import React from 'react';
import type { NormalizedSubject } from '@/types/taxonomy';
import type { SubjectTaskProgress } from '@/features/tasks/services/taskService';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';

interface SubjectCardProps {
  subject: NormalizedSubject;
  progress: SubjectTaskProgress;
  onOpenChecklist: (subject: NormalizedSubject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = React.memo(function SubjectCard({
  subject,
  progress,
  onOpenChecklist,
}) {
  const isCompleted = progress.status === 'completed';
  const isInProgress = progress.status === 'in-progress';

  return (
    <div
      onClick={() => onOpenChecklist(subject)}
      className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-lg active:scale-[0.99] group select-none"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-slate-300 bg-slate-800/80 border border-slate-700/50"
          >
            {subject.program}
          </span>
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isInProgress
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700/40'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>Done</span>
              </>
            ) : isInProgress ? (
              <>
                <Clock className="w-3 h-3" />
                <span>Active</span>
              </>
            ) : (
              <span>Not Started</span>
            )}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-400 transition-colors leading-snug">
          {subject.name}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Track: <span className="font-bold text-slate-300">{subject.trackName}</span>
        </p>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-xs font-mono font-bold">
          <span className="text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>{progress.completedCount} / {progress.totalCount} Chapters</span>
          </span>
          <span className={isCompleted ? 'text-emerald-400' : 'text-blue-400'}>
            {progress.percentage}%
          </span>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress.percentage}%`,
              backgroundColor: isCompleted ? '#10b981' : subject.color,
            }}
          />
        </div>
      </div>
    </div>
  );
});
