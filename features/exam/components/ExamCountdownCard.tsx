'use client';

/**
 * X-29 Exam Countdown Card Component (features/exam/components/ExamCountdownCard.tsx)
 * 
 * Big numeric countdown clock (Days, Hours, Minutes, Seconds) for nearest or chosen exam.
 */

import React from 'react';
import type { ExamRoutineItem } from '@/types/exam';
import { useExamCountdown } from '@/features/exam/hooks/useExamCountdown';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface ExamCountdownCardProps {
  exams: ExamRoutineItem[];
  selectedExamId: string;
  onSelectExamId: (id: string) => void;
}

export const ExamCountdownCard: React.FC<ExamCountdownCardProps> = React.memo(function ExamCountdownCard({
  exams,
  selectedExamId,
  onSelectExamId,
}) {
  const countdown = useExamCountdown(exams, selectedExamId);
  const target = countdown.targetExam;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-blue-950/40 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Exam Countdown
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {target ? target.subject : 'No Exams Scheduled'}
          </h2>
          {target && (
            <p className="text-xs text-slate-400 mt-0.5">
              Code: <span className="font-mono font-bold text-slate-300">{target.code || 'N/A'}</span> • Room:{' '}
              <span className="font-bold text-slate-300">{target.room || 'TBA'}</span> • Date:{' '}
              <span className="font-bold text-slate-300">{target.date}</span>
            </p>
          )}
        </div>

        {/* Target exam selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedExamId}
            onChange={(e) => onSelectExamId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="auto">Auto (Nearest Upcoming)</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.subject} ({ex.date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Countdown Digits Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-6 text-center">
        <div className="bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800/80 shadow-inner">
          <p className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-mono leading-none">
            {String(countdown.days).padStart(2, '0')}
          </p>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 block">
            Days
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800/80 shadow-inner">
          <p className="text-2xl sm:text-4xl md:text-5xl font-black text-blue-400 font-mono leading-none">
            {String(countdown.hours).padStart(2, '0')}
          </p>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 block">
            Hours
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800/80 shadow-inner">
          <p className="text-2xl sm:text-4xl md:text-5xl font-black text-indigo-400 font-mono leading-none">
            {String(countdown.minutes).padStart(2, '0')}
          </p>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 block">
            Mins
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800/80 shadow-inner">
          <p className="text-2xl sm:text-4xl md:text-5xl font-black text-emerald-400 font-mono leading-none">
            {String(countdown.seconds).padStart(2, '0')}
          </p>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 block">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
});
