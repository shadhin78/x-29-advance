'use client';

/**
 * X-29 Result Card Component (features/outcome/components/ResultCard.tsx)
 * 
 * Displays individual program/semester outcome scorecard with:
 * - Program color dot & Program Card badge
 * - Date display & [Goal Met] / [Not Met] badges
 * - Action buttons on hover (Progression Trend, Edit, Delete)
 * - Overall Program Score Banner (Grade-Based/CGPA-Based, Manual/Estimated, PASS/FAIL)
 * - Target comparison & match status indicator (✓ / ✕)
 * - Scrollable Subject Grades breakdown with individual targets & PASS/FAIL badges
 * 
 * Direct visual & functional parity with legacy outcomeResults.js.
 */

import React from 'react';
import type { OutcomeProgramGroup } from '@/types/outcome';
import { getOutcomeProgramColor } from '@/features/outcome/utils/outcomeColors';
import { TrendingUp, Pencil, Trash2 } from 'lucide-react';

interface ResultCardProps {
  group: OutcomeProgramGroup;
  onDeleteGroup: (programName: string, date: string) => void;
  onEdit?: (group: OutcomeProgramGroup) => void;
  onViewAnalytics?: (programName: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = React.memo(function ResultCard({
  group,
  onDeleteGroup,
  onEdit,
  onViewAnalytics,
}) {
  const programColor = getOutcomeProgramColor(group.program);

  // Formatted date string (en-GB: e.g. "20 Nov 2025")
  const dateFormatted = React.useMemo(() => {
    if (!group.date) return '';
    try {
      const d = new Date(group.date);
      if (isNaN(d.getTime())) return group.date;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return group.date;
    }
  }, [group.date]);

  const evalType = group.evaluationType || 'cgpa';
  const isGrade = evalType === 'grade';

  // Overall pass/fail check
  const isOverallFailed = isGrade
    ? !!(group.computedGrade && ['C', 'D', 'E', 'F'].includes(group.computedGrade.trim().toUpperCase()))
    : !!(group.computedCgpa && parseFloat(group.computedCgpa) < 2.0);

  const statusText = isOverallFailed ? 'FAIL' : 'PASS';
  const scoreColorClass = isOverallFailed
    ? 'text-red-500 dark:text-red-400'
    : 'text-emerald-500 dark:text-emerald-400';
  const statusBadgeColor = isOverallFailed
    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
    : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';

  const indicatorText = group.isEstimated ? 'Estimated' : 'Manual';
  const indicatorBadgeColor = group.isEstimated
    ? 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
    : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800';

  const systemText = isGrade ? 'Grade-Based' : 'CGPA-Based';
  const systemBadgeColor =
    'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';

  // Target values
  const hasTarget = group.targetCGPA && group.targetCGPA !== 'none' && group.targetCGPA !== '';
  const tgtCgpaDisp = hasTarget ? group.targetCGPA : 'None';
  const tgtGradeDisp = hasTarget ? group.targetGrade || '—' : 'None';

  // Match indicator
  let matchStatusNode: React.ReactNode = null;
  if (group.overall && !group.isEstimated && group.subjects.length > 0) {
    const manualVal = group.overall.value || '';
    const isMatch = manualVal === group.computedCgpa;
    if (isMatch) {
      matchStatusNode = (
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black shrink-0 shadow-sm shadow-emerald-500/20"
          title={`Matches subject-wise estimate (CGPA: ${group.computedCgpa}, Grade: ${group.computedGrade})`}
        >
          ✓
        </span>
      );
    } else {
      matchStatusNode = (
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black shrink-0 shadow-sm shadow-rose-500/20"
          title={`Differs from subject-wise estimate (CGPA: ${group.computedCgpa}, Grade: ${group.computedGrade})`}
        >
          ✕
        </span>
      );
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
      {/* Top Right Action Buttons (visible on hover) */}
      <div className="absolute top-3.5 right-3.5 flex space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onViewAnalytics && (
          <button
            type="button"
            onClick={() => onViewAnalytics(group.program)}
            className="text-slate-400 hover:text-cyan-500 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
            title="View Progression Trend"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(group)}
            className="text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
            title="Edit Program Result"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDeleteGroup(group.program, group.date)}
          className="text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
          title="Delete Program Result"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        {/* Header bar: Program Card badge & Date */}
        <div className="flex items-center space-x-2 mb-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: programColor }}
          />
          <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">
            Program Card
          </span>
          <span className="text-[8px] font-bold text-slate-400 ml-auto mr-8 sm:mr-16">
            {dateFormatted}
          </span>
        </div>

        {/* Title & Goal Status */}
        <h4 className="font-black text-base text-slate-800 dark:text-slate-100 leading-tight mb-3 pr-12 flex items-center flex-wrap">
          <span>{group.program}</span>
          {hasTarget && (
            <span
              className={`text-xs font-black ml-1.5 whitespace-nowrap uppercase tracking-wider ${
                group.isGoalMet ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {group.isGoalMet ? '[Goal Met]' : '[Not Met]'}
            </span>
          )}
        </h4>

        {/* Overall Program Score Banner */}
        <div className="mb-4 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${systemBadgeColor}`}>
              {systemText}
            </span>
            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${indicatorBadgeColor}`}>
              {indicatorText}
            </span>
            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${statusBadgeColor} ml-auto`}>
              {statusText}
            </span>
          </div>

          {/* Target & Score Row */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Target
              </span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {tgtGradeDisp} ({tgtCgpaDisp})
              </span>
            </div>

            <div className="text-right flex items-center gap-2">
              <div className="flex flex-col items-end">
                {isGrade ? (
                  <>
                    <span className={`text-sm font-black ${scoreColorClass}`}>
                      Grade: {group.computedGrade || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                      CGPA: {group.computedCgpa || 'N/A'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={`text-sm font-black ${scoreColorClass}`}>
                      CGPA: {group.computedCgpa || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                      Grade: {group.computedGrade || 'N/A'}
                    </span>
                  </>
                )}
              </div>
              {matchStatusNode}
            </div>
          </div>
        </div>

        {/* Subject Listing */}
        {group.subjects.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-700/60 pt-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Subject Grades ({group.subjects.length})
            </span>
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
              {group.subjects.map((s) => {
                const subEval = s.evaluationType || evalType;
                const isSubFailed = subEval === 'grade'
                  ? !!(s.grade && ['C', 'D', 'E', 'F'].includes(s.grade.trim().toUpperCase()))
                  : !!(s.value && parseFloat(s.value) < 2.0);

                const subScoreColor = isSubFailed
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400';

                const subTargetDisp = s.targetCGPA && s.targetCGPA !== 'none'
                  ? `${s.targetGrade || '—'} (${s.targetCGPA})`
                  : 'None';

                return (
                  <div
                    key={s.id}
                    className="flex justify-between items-center text-xs py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0"
                  >
                    <div className="flex flex-col truncate mr-2">
                      <span className="font-bold text-slate-600 dark:text-slate-300 truncate">
                        {s.subject}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        Target: {subTargetDisp}
                      </span>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <span className={`font-black ${subScoreColor}`}>
                          {subEval === 'grade' ? s.grade || 'N/A' : s.value || 'N/A'}
                        </span>
                        {subEval === 'grade' ? (
                          <span className="text-[10px] font-bold text-slate-400 block -mt-0.5">
                            (CGPA: {s.value || '—'})
                          </span>
                        ) : s.grade ? (
                          <span className="text-[10px] font-bold text-slate-400 block -mt-0.5">
                            ({s.grade})
                          </span>
                        ) : null}
                      </div>

                      <span
                        className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded border scale-90 origin-right ${
                          isSubFailed
                            ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                        }`}
                      >
                        {isSubFailed ? 'FAIL' : 'PASS'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
