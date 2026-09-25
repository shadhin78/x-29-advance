'use client';

/**
 * X-29 Subject Task List (features/subjects/components/SubjectTaskList.tsx)
 * 
 * Recreates the exact legacy #dashboard-content and #task-list with expandable
 * subject cards, 4-metric pace banners, and interactive chapter checklist task grids.
 * Preserves all element IDs, classes, raw SVGs, and responsive styles.
 */

import React, { useState } from 'react';
import type { Track, SyllabusStructure, CustomProgramsMap, PassedItemsState, SubjectTimeLink, RevisionDataState } from '@/types/taxonomy';
import type { PaceGoal } from '@/types/pace';
import { getSubjectColor } from '@/features/taxonomy/services/taxonomyService';

interface SubjectTaskListProps {
  tracks: Track[];
  syllabusStructure: SyllabusStructure;
  customPrograms: CustomProgramsMap;
  passedItems: PassedItemsState;
  subjectTimeLinks: Record<string, SubjectTimeLink>;
  revisionData: RevisionDataState;
  paceGoals: PaceGoal[];
  completedChaptersMap: Record<string, Set<number>>;
  currentFilter: string;
  onToggleChapter: (subject: string, chapter: number, trackId?: string) => void;
  onOpenTimeModal: (subject: string) => void;
  onOpenEditModal: (subject: string, program: string, trackId: string) => void;
  onOpenTrendModal: (subject: string) => void;
}

const SHADOW_MAP: Record<string, string> = {
  indigo: 'shadow-[0_0_10px_rgba(99,102,241,0.6)]',
  emerald: 'shadow-[0_0_10px_rgba(16,185,129,0.6)]',
  violet: 'shadow-[0_0_10px_rgba(139,92,246,0.6)]',
  rose: 'shadow-[0_0_10px_rgba(244,63,94,0.6)]',
  amber: 'shadow-[0_0_10px_rgba(245,158,11,0.6)]',
  cyan: 'shadow-[0_0_10px_rgba(6,182,212,0.6)]',
  blue: 'shadow-[0_0_10px_rgba(59,130,246,0.6)]',
};

const COLOR_MAP = ['indigo', 'emerald', 'violet', 'rose', 'amber', 'cyan'];

export const SubjectTaskList: React.FC<SubjectTaskListProps> = ({
  tracks,
  syllabusStructure,
  customPrograms,
  passedItems,
  subjectTimeLinks,
  revisionData,
  paceGoals,
  completedChaptersMap,
  currentFilter,
  onToggleChapter,
  onOpenTimeModal,
  onOpenEditModal,
  onOpenTrendModal,
}) => {
  // Local state for expandable details open/closed state
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  // Flatten all syllabus subjects
  const allSubjectsList: { trackId: string; program: string; subject: string; chapters: number }[] = [];
  tracks.forEach((trackObj) => {
    const items = syllabusStructure[trackObj.id] || [];
    items.forEach((item) => {
      allSubjectsList.push({
        trackId: trackObj.id,
        program: item.program,
        subject: item.subject,
        chapters: item.chapters || 0,
      });
    });
  });

  // Filter subjects based on currentFilter
  const subjectsToRender = allSubjectsList.filter((s) => {
    if (currentFilter === 'All') return true;
    if (s.program === currentFilter) return true;
    if (s.subject === currentFilter) return true;
    return false;
  });

  const formatDateStr = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div id="dashboard-content" className="w-full">
      <div id="task-list" className="flex flex-col space-y-6 md:space-y-8 w-full pb-4">
        {subjectsToRender.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-wider border border-dashed border-slate-700/60 rounded-3xl">
            No subjects found for &quot;{currentFilter}&quot;.
          </div>
        ) : (
          subjectsToRender.map((subItem) => {
            const { trackId, program, subject, chapters } = subItem;
            const safeSubId = subject.replace(/[^a-zA-Z0-9]/g, '-');
            const trackObj = tracks.find((t) => t.id === trackId);
            const trackName = trackObj ? trackObj.name : trackId.toUpperCase();

            const isFrozen =
              (passedItems.subjects && passedItems.subjects.includes(subject)) ||
              (passedItems.programs && passedItems.programs.includes(program));

            const completedSet = completedChaptersMap[subject] || new Set<number>();
            const completedCount = isFrozen ? chapters : completedSet.size;
            const progressPct = chapters > 0 ? Math.min(100, Math.round((completedCount / chapters) * 100)) : 0;

            const trackIdx = tracks.findIndex((t) => t.id === trackId);
            const colorClass = trackIdx !== -1 ? COLOR_MAP[trackIdx % COLOR_MAP.length] : 'blue';
            const shadowClass = SHADOW_MAP[colorClass] || SHADOW_MAP.blue;
            const subjectColor = getSubjectColor(subject);

            // Clean display name
            let displaySubName = subject;
            if (displaySubName.startsWith(program + ' - ')) {
              displaySubName = displaySubName.replace(program + ' - ', '');
            } else if (displaySubName.startsWith(program + ' ')) {
              displaySubName = displaySubName.replace(program + ' ', '');
            }

            // Time Link handling
            let targetDate: Date | null = null;
            let startDate: Date | null = null;
            let linkLabel: string | null = null;
            let hasTimeGoal = false;

            const timeLink = subjectTimeLinks[subject];
            if (timeLink) {
              if (timeLink.type === 'date' && timeLink.date) {
                hasTimeGoal = true;
                targetDate = new Date(timeLink.date);
                if (timeLink.startDate) startDate = new Date(timeLink.startDate);
                linkLabel = 'Custom Timeline';
              } else if (timeLink.type === 'goal' && timeLink.id) {
                const pg = paceGoals.find((g) => g.id === timeLink.id);
                if (pg) {
                  hasTimeGoal = true;
                  targetDate = new Date(pg.deadline);
                  if (pg.startDate) startDate = new Date(pg.startDate);
                  linkLabel = `Link: ${pg.target}`;
                }
              }
            }

            const startDateStr = startDate && !isNaN(startDate.getTime()) ? formatDateStr(startDate) : '--';
            const endDateStr = targetDate && !isNaN(targetDate.getTime()) ? formatDateStr(targetDate) : '--';
            const headerDatesStr =
              hasTimeGoal || startDate ? `${startDateStr} → ${endDateStr}` : 'No Timeline Set';

            // Pace calculations
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const msPerDay = 1000 * 60 * 60 * 24;
            const remainingCh = Math.max(0, chapters - completedCount);

            let actPaceRaw = 0;
            let reqPaceRaw = 0;
            let daysElapsed = 0;

            if (chapters > 0) {
              if (completedCount > 0) {
                daysElapsed = 1; // baseline
                actPaceRaw = completedCount / Math.max(1, daysElapsed);
              }

              if (hasTimeGoal && targetDate) {
                const daysRemaining = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / msPerDay));
                reqPaceRaw = remainingCh / daysRemaining;
              }
            }

            const actPace = actPaceRaw > 0 ? actPaceRaw.toFixed(2) : '0.00';
            const reqPace = hasTimeGoal ? reqPaceRaw.toFixed(2) : '--';

            let estFinishStr = '--';
            let estDaysNeededStr = 'Unknown';
            if (isFrozen || completedCount >= chapters) {
              estFinishStr = 'Finished';
              estDaysNeededStr = '0 Days';
            } else if (completedCount === 0) {
              estFinishStr = 'No Data';
              estDaysNeededStr = 'Unknown';
            } else if (actPaceRaw > 0) {
              const daysLeft = remainingCh / actPaceRaw;
              const estDate = new Date(today.getTime() + daysLeft * msPerDay);
              estFinishStr = formatDateStr(estDate);
              estDaysNeededStr = `${Math.ceil(daysLeft)} Days Needed`;
            }

            let timeGoalCountdownStr = 'No Goal';
            if (isFrozen || completedCount >= chapters) {
              timeGoalCountdownStr = 'Done';
            } else if (hasTimeGoal && targetDate) {
              const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / msPerDay);
              if (diffDays > 0) timeGoalCountdownStr = `${diffDays} Days Left`;
              else if (diffDays === 0) timeGoalCountdownStr = 'Due Today';
              else timeGoalCountdownStr = `${Math.abs(diffDays)} Days Overdue`;
            }

            // Determine if open (defaults to open if single subject, or toggled)
            const isOpen =
              openMap[safeSubId] !== undefined ? openMap[safeSubId] : subjectsToRender.length === 1;

            return (
              <details
                key={subject}
                id={`details-${safeSubId}`}
                open={isOpen}
                onToggle={(e) => {
                  const target = e.currentTarget;
                  setOpenMap((prev) => ({ ...prev, [safeSubId]: target.open }));
                }}
                className="bg-white dark:bg-slate-800 rounded-[1.25rem] md:rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-700/60 mb-5 group overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* Collapsed Header Summary */}
                <summary className="cursor-pointer p-4 md:p-6 outline-none select-none list-none flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/80 [&::-webkit-details-marker]:hidden relative z-10">
                  {/* Left Side */}
                  <div className="flex flex-col gap-2.5 w-full lg:w-[40%] shrink-0">
                    <div className="flex items-center gap-3">
                      {isFrozen ? (
                        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm shrink-0 text-base md:text-lg drop-shadow-md">
                          🏆
                        </div>
                      ) : (
                        <div
                          className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-${colorClass}-50 dark:bg-${colorClass}-500/10 border border-${colorClass}-100 dark:border-${colorClass}-500/20 shadow-sm shrink-0`}
                        >
                          <div className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-${colorClass}-500 ${shadowClass}`} />
                        </div>
                      )}
                      <div className="flex flex-col overflow-hidden w-full pr-2">
                        <div className="flex items-center w-full">
                          <h2 className="tracking-tight truncate flex-1" title={displaySubName}>
                            <span className="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white mr-2">
                              {displaySubName}
                            </span>
                            <span className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider mr-1.5">
                              - {program}
                            </span>
                            <span className="text-[10px] md:text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                              - {trackName}
                            </span>
                          </h2>
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 lg:ml-[3.25rem] uppercase tracking-widest bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md w-fit border border-slate-200 dark:border-slate-700/50">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{headerDatesStr}</span>
                    </div>
                  </div>

                    {/* Middle Progress */}
                    <div className="flex flex-col gap-2 w-full lg:w-[35%] lg:px-4">
                      <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                        <span id={`group-text-${safeSubId}`} className="text-slate-500 dark:text-slate-400">
                          {completedCount} <span className="opacity-60 text-[9px] mx-0.5">/</span> {chapters}{' '}
                          <span className="opacity-60">CH</span>
                        </span>
                        <span
                          id={`group-pct-${safeSubId}`}
                          className={`text-${colorClass}-600 dark:text-${colorClass}-400 bg-${colorClass}-50 dark:bg-${colorClass}-900/30 px-1.5 py-0.5 rounded border border-${colorClass}-100 dark:border-${colorClass}-800/50 shadow-sm`}
                        >
                          {progressPct}%
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={progressPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${subject} progress: ${progressPct}%`}
                        className="w-full bg-slate-100 dark:bg-slate-700/50 h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-600/30 relative"
                      >
                        <div
                          id={`group-bar-${safeSubId}`}
                          className={`h-full bg-gradient-to-r from-${colorClass}-400 to-${colorClass}-600 transition-all duration-700 ease-out relative`}
                          style={{ width: `${progressPct}%` }}
                        >
                          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Right EST Finish & Controls */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 lg:gap-6 w-full lg:w-[25%] lg:pl-0">
                      <div className="flex flex-col text-left lg:text-right flex-1 lg:flex-none">
                        <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-0.5">
                          EST. Finish
                        </span>
                        <span
                          id={`header-est-${safeSubId}`}
                          className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200"
                        >
                          {estFinishStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Trend Analytics Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenTrendModal(subject);
                          }}
                          aria-label={`View performance trend for ${subject}`}
                          className="p-2 md:p-2.5 shrink-0 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl shadow-sm transition-all border border-slate-200 dark:border-slate-600/50 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          title="View Subject Trend"
                        >
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </button>

                        {/* Edit Subject Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenEditModal(subject, program, trackId);
                          }}
                          aria-label={`Edit subject details for ${subject}`}
                          className="p-2 md:p-2.5 shrink-0 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl shadow-sm transition-all border border-slate-200 dark:border-slate-600/50 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Edit Subject Details"
                        >
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>

                        {/* Accordion Chevron */}
                        <div
                          aria-hidden="true"
                          className={`p-2 md:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 transition-all duration-300 shrink-0 shadow-sm border border-slate-200/50 dark:border-slate-600/30 ${
                            isOpen ? 'rotate-180 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''
                          }`}
                        >
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                </summary>

                {/* Expanded View */}
                <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/10">
                  {/* 4 Action Analytics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                    {/* Time Goal */}
                    <div
                      onClick={() => onOpenTimeModal(subject)}
                      className="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 transition-all cursor-pointer group/tg scale-100 active:scale-[0.98]"
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover/tg:opacity-100 transition-opacity">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </div>
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Time Goal
                      </span>
                      <span className="text-sm md:text-[1.05rem] font-black text-slate-800 dark:text-slate-100 leading-tight">
                        {endDateStr}
                      </span>
                      <span
                        id={`tg-tg-days-${safeSubId}`}
                        className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-0.5"
                      >
                        {timeGoalCountdownStr}
                      </span>
                      {linkLabel && (
                        <span className="block text-[8px] text-orange-500 dark:text-orange-400 mt-1 uppercase tracking-widest font-black bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded border border-orange-100 dark:border-orange-800/50 mx-auto w-fit">
                          {linkLabel}
                        </span>
                      )}
                    </div>

                    {/* Req Pace */}
                    <div className="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm flex flex-col justify-center text-center">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-500/90 dark:text-blue-400/90 mb-1">
                        Req Pace
                      </span>
                      <span className="text-sm md:text-[1.1rem] font-black text-blue-700 dark:text-blue-400">
                        <span id={`tg-req-${safeSubId}`}>{reqPace}</span>{' '}
                        <span className="text-[9px] opacity-70 font-bold uppercase tracking-widest">ch/d</span>
                      </span>
                    </div>

                    {/* Actual Pace */}
                    <div
                      className={`relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-${colorClass}-50/80 to-${colorClass}-100/50 dark:from-${colorClass}-900/20 dark:to-${colorClass}-900/30 rounded-2xl border border-${colorClass}-100 dark:border-${colorClass}-800/50 shadow-sm flex flex-col justify-center text-center`}
                    >
                      <span
                        className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest text-${colorClass}-500/90 dark:text-${colorClass}-400/90 mb-1`}
                      >
                        Actual Pace
                      </span>
                      <span className={`text-sm md:text-[1.1rem] font-black text-${colorClass}-700 dark:text-${colorClass}-400`}>
                        <span id={`tg-act-${safeSubId}`}>{actPace}</span>{' '}
                        <span className="text-[9px] opacity-70 font-bold uppercase tracking-widest">ch/d</span>
                      </span>
                      <span
                        id={`tg-act-days-${safeSubId}`}
                        className={`text-[9px] text-${colorClass}-500/80 font-bold mt-0.5`}
                      >
                        {completedCount > 0 ? `${daysElapsed} Days Passed` : '0 Days Passed'}
                      </span>
                    </div>

                    {/* Est Finish */}
                    <div className="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-orange-50/80 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/30 rounded-2xl border border-orange-100 dark:border-orange-800/50 shadow-sm flex flex-col justify-center text-center">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-orange-500/90 dark:text-orange-400/90 mb-1">
                        Est. Finish
                      </span>
                      <span
                        id={`tg-est-${safeSubId}`}
                        className="text-sm md:text-[1.05rem] font-black text-orange-600 dark:text-orange-400"
                      >
                        {estFinishStr}
                      </span>
                      <span
                        id={`tg-est-days-${safeSubId}`}
                        className="text-[9px] text-orange-500/80 font-bold mt-0.5"
                      >
                        {estDaysNeededStr}
                      </span>
                    </div>
                  </div>

                  {/* Chapter Task Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {Array.from({ length: chapters }, (_, i) => i + 1).map((chNum) => {
                      const isDone = completedSet.has(chNum);

                      return (
                        <div
                          key={chNum}
                          id={`single-task-${safeSubId}-${chNum}`}
                          className={`relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[110px] overflow-hidden group border ${
                            isDone
                              ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                              : 'border-slate-100 dark:border-slate-700'
                          }`}
                        >
                          {/* Color Accent Bar */}
                          <div
                            className="absolute top-0 left-0 w-full h-1 transition-colors duration-300"
                            style={{ backgroundColor: subjectColor }}
                          />

                          {/* Top Tag & Edit Row */}
                          <div className="flex justify-between items-start mb-3 mt-1">
                            <span className="text-[9px] px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded-md font-black tracking-widest uppercase">
                              CH {chNum}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditModal(subject, program, trackId);
                              }}
                              aria-label={`Edit or delete Chapter ${chNum} of ${subject}`}
                              className="text-slate-400 hover:text-blue-500 active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                              title="Edit/Delete Task"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Title and Checkbox Row */}
                          <div className="flex items-end justify-between mt-auto gap-3">
                            <div className="flex flex-col pr-1">
                              <span
                                className={`font-black text-slate-800 dark:text-slate-100 text-sm md:text-base tracking-tight leading-tight mb-0.5 ${
                                  isDone ? 'line-through text-emerald-700 dark:text-emerald-400 opacity-70' : ''
                                }`}
                              >
                                Ch. {chNum}
                              </span>
                              <span
                                className={`text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 ${
                                  isDone ? 'line-through opacity-60' : ''
                                }`}
                              >
                                Topic {chNum}
                              </span>
                            </div>

                            <div className="shrink-0 mb-0.5">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => onToggleChapter(subject, chNum, trackId)}
                                  aria-label={`Mark Chapter ${chNum} of ${subject} as ${isDone ? 'incomplete' : 'complete'}`}
                                  className="task-checkbox peer relative appearance-none w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 checked:bg-emerald-500 checked:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all shadow-sm hover:border-emerald-400"
                                />
                                <svg
                                  className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-md"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="4"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
};
