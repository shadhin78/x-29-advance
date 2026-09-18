'use client';

/**
 * X-29 Result Card Component (features/outcome/components/ResultCard.tsx)
 * 
 * Displays individual program/semester outcome scorecard with CGPA,
 * letter grade, target comparison, and collapsible subject details.
 */

import React, { useState } from 'react';
import type { OutcomeProgramGroup } from '@/types/outcome';
import { Award, ChevronDown, ChevronUp, Trash2, Calendar, Target, CheckCircle2, Clock } from 'lucide-react';

interface ResultCardProps {
  group: OutcomeProgramGroup;
  onDeleteGroup: (programName: string, date: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = React.memo(function ResultCard({
  group,
  onDeleteGroup,
}) {
  const [expanded, setExpanded] = useState(false);

  const hasTarget = group.targetCGPA && group.targetCGPA !== 'none';

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800/80 bg-slate-900/60 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group">
      <div>
        {/* Card Header: Program name & Date */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-black text-white leading-tight">
                {group.program}
              </h3>
              {group.isEstimated && (
                <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Estimated
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{group.date}</span>
            </p>
          </div>

          <button
            onClick={() => onDeleteGroup(group.program, group.date)}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Delete this result"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Score Banner */}
        <div className="py-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
              Result Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
                {group.computedCgpa || '—'}
              </span>
              {group.computedGrade && (
                <span className="text-lg font-black text-amber-400 font-mono">
                  ({group.computedGrade})
                </span>
              )}
            </div>
          </div>

          {/* Goal Status Badge */}
          {hasTarget && (
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                Target: {group.targetCGPA}
              </span>
              <div className="mt-1">
                {group.isGoalMet ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Goal Met</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-3 h-3" />
                    <span>Pending</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expandable Subject Breakdown */}
        {group.subjects.length > 0 && (
          <div className="border-t border-slate-800/80 pt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <span>Subject Breakdown ({group.subjects.length})</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expanded && (
              <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {group.subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <span className="font-bold text-slate-300 truncate max-w-[180px]">
                      {sub.subject}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono font-bold">
                      <span className="text-white">{sub.value || '—'}</span>
                      {sub.grade && (
                        <span className="text-amber-400">({sub.grade})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
