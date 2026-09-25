'use client';

/**
 * X-29 Subject Target Live Component (features/focus/components/SubjectTargetLive.tsx)
 * 
 * Manages subject targets, live target progress tracking,
 * and goal management for individual study topics with 100% visual parity
 * against legacy Focus.html and Focus.js.
 */

import React, { useState, useMemo } from 'react';
import type { SubjectFocusTarget, TimerLogSession } from '@/types/timer';
import {
  getAvailableSubjectGroups,
  getSubjectColor,
  type ProgramSubjectGroup,
} from '@/features/focus/services/focusSubjectAdapter';
import * as Dialog from '@radix-ui/react-dialog';

interface SubjectTargetLiveProps {
  subjectFocusTargets: Record<string, SubjectFocusTarget>;
  timerLogs: TimerLogSession[];
  activeRunningSubject: string | null;
  activeRunningElapsedSec: number;
  onSetSubjectTarget: (subject: string, hours: number, minutes: number) => void;
  onDeleteSubjectTarget: (subject: string) => void;
}

function getSubjectTargetDomId(subject: string) {
  return 'stt-' + String(subject).replace(/[^a-zA-Z0-9_-]/g, '_');
}

export const SubjectTargetLive: React.FC<SubjectTargetLiveProps> = React.memo(function SubjectTargetLive({
  subjectFocusTargets,
  timerLogs,
  activeRunningSubject,
  activeRunningElapsedSec,
  onSetSubjectTarget,
  onDeleteSubjectTarget,
}) {
  const [filter, setFilter] = useState<'uncompleted' | 'done'>('uncompleted');
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [targetSubject, setTargetSubject] = useState<string>('General Study');
  const [targetHours, setTargetHours] = useState<string>('2');
  const [targetMinutes, setTargetMinutes] = useState<string>('0');

  const subjectGroups: ProgramSubjectGroup[] = useMemo(() => {
    return getAvailableSubjectGroups();
  }, []);

  // Compute accumulated time per subject from logs
  const subjectDoneSeconds = useMemo(() => {
    const map: Record<string, number> = {};
    timerLogs.forEach((log) => {
      const sub = log.subject || 'General Study';
      map[sub] = (map[sub] || 0) + Number(log.duration || 0);
    });
    return map;
  }, [timerLogs]);

  // 1. Precompute static base stats from logs and targets (runs ONLY when targets or logs change)
  const baseTargets = useMemo(() => {
    const entries = Object.entries(subjectFocusTargets);
    const sorted = entries.sort((a, b) => {
      const timeA = a[1].createdAt ? new Date(a[1].createdAt).getTime() : 0;
      const timeB = b[1].createdAt ? new Date(b[1].createdAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return a[0].localeCompare(b[0]);
    });

    return sorted.map(([subject, target]) => {
      const h = Number(target.hours) || 0;
      const m = Number(target.minutes) || 0;
      const targetSec = (h * 3600) + (m * 60);

      let baseDoneSec = 0;
      const targetCreatedAt = target.createdAt ? new Date(target.createdAt) : null;
      if (targetCreatedAt) {
        targetCreatedAt.setHours(0, 0, 0, 0);
      }

      timerLogs.forEach((log) => {
        if ((log.subject || 'General Study') === subject) {
          const logDate = new Date(log.date);
          if (!targetCreatedAt || logDate >= targetCreatedAt) {
            baseDoneSec += Number(log.duration || 0);
          }
        }
      });

      const color = getSubjectColor(subject);
      const targetText = `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;

      let startDateText = 'All-time';
      if (target.createdAt) {
        startDateText = new Date(target.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }

      return {
        subject,
        target,
        targetSec,
        baseDoneSec,
        color,
        targetText,
        startDateText,
        domId: getSubjectTargetDomId(subject),
      };
    });
  }, [subjectFocusTargets, timerLogs]);

  // 2. Derive processed targets adding live active elapsed seconds with O(1) arithmetic
  const processedTargets = useMemo(() => {
    return baseTargets.map((base) => {
      const addActive = activeRunningSubject === base.subject ? activeRunningElapsedSec : 0;
      const doneSec = base.baseDoneSec + addActive;
      const isCompleted = base.targetSec > 0 && doneSec >= base.targetSec;
      const remainSec = Math.max(0, base.targetSec - doneSec);
      const progressPercent = base.targetSec > 0 ? Math.min(100, Math.round((doneSec / base.targetSec) * 100)) : 0;

      const doneHrs = Math.floor(doneSec / 3600);
      const doneMins = Math.floor((doneSec % 3600) / 60);
      const doneText = `${String(doneHrs).padStart(2, '0')}h ${String(doneMins).padStart(2, '0')}m`;

      const remainHrs = Math.floor(remainSec / 3600);
      const remainMins = Math.floor((remainSec % 3600) / 60);
      const remainText = `${String(remainHrs).padStart(2, '0')}h ${String(remainMins).padStart(2, '0')}m`;

      return {
        ...base,
        doneSec,
        remainSec,
        progressPercent,
        isCompleted,
        doneText,
        remainText,
      };
    });
  }, [baseTargets, activeRunningSubject, activeRunningElapsedSec]);

  const uncompletedTargets = useMemo(() => processedTargets.filter((t) => !t.isCompleted), [processedTargets]);
  const completedTargets = useMemo(() => processedTargets.filter((t) => t.isCompleted), [processedTargets]);

  const displayList = filter === 'done' ? completedTargets : uncompletedTargets;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(targetHours, 10) || 0;
    const m = parseInt(targetMinutes, 10) || 0;
    if (targetSubject && (h > 0 || m > 0)) {
      onSetSubjectTarget(targetSubject, h, m);
      setAddModalOpen(false);
    }
  };

  return (
    <>
      {/* Subject Focus Target Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
                Subject Target Tracker
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Set study target and track progress
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Section Filter Tabs: Uncompleted (Red) & Done (Green) */}
            <div
              id="subject-target-filter-bar"
              role="tablist"
              aria-label="Target status filters"
              className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800"
            >
              <button
                id="st-filter-uncompleted"
                type="button"
                role="tab"
                aria-selected={filter === 'uncompleted'}
                onClick={() => setFilter('uncompleted')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                  filter === 'uncompleted'
                    ? 'bg-rose-600 text-white shadow shadow-rose-500/20 active:scale-95'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800 active:scale-95'
                }`}
              >
                <span
                  id="st-dot-uncompleted"
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full ${filter === 'uncompleted' ? 'bg-rose-200 animate-pulse' : 'bg-rose-500'}`}
                />
                <span>Uncompleted</span>
                <span
                  id="st-count-uncompleted"
                  className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-mono leading-none"
                >
                  {uncompletedTargets.length}
                </span>
              </button>

              <button
                id="st-filter-done"
                type="button"
                role="tab"
                aria-selected={filter === 'done'}
                onClick={() => setFilter('done')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                  filter === 'done'
                    ? 'bg-emerald-600 text-white shadow shadow-emerald-500/20 active:scale-95'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800 active:scale-95'
                }`}
              >
                <span
                  id="st-dot-done"
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full ${filter === 'done' ? 'bg-emerald-200 animate-pulse' : 'bg-emerald-500'}`}
                />
                <span>Done</span>
                <span
                  id="st-count-done"
                  className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-mono leading-none"
                >
                  {completedTargets.length}
                </span>
              </button>
            </div>

            {/* Add Target Button */}
            <button
              id="timer-btn-add-subject-target"
              type="button"
              onClick={() => {
                setTargetSubject('General Study');
                setAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all"
              title="Add Subject Target"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Target</span>
            </button>
          </div>
        </div>

        {/* Dynamic subject targets list */}
        {displayList.length === 0 ? (
          filter === 'uncompleted' ? (
            <div className="col-span-full py-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-black uppercase tracking-wider">
                All subject targets completed!
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                View finished targets in the{' '}
                <button
                  type="button"
                  onClick={() => setFilter('done')}
                  className="text-emerald-500 underline font-black hover:text-emerald-400"
                >
                  Done ({completedTargets.length})
                </button>{' '}
                section.
              </p>
            </div>
          ) : (
            <div className="col-span-full py-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-200/60 dark:border-slate-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-black uppercase tracking-wider">
                No completed targets yet
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Keep focusing! Completed subject targets will appear here automatically.
              </p>
            </div>
          )
        ) : (
          <div
            id="subject-targets-list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1"
          >
            {displayList.map((item) => {
              const remainColorClass = item.isCompleted
                ? 'text-emerald-500'
                : 'text-indigo-500 dark:text-indigo-400';
              const badgeClass = item.isCompleted
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

              return (
                <div
                  key={item.subject}
                  id={`${item.domId}-card`}
                  className={`p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col gap-2.5 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md ${
                    item.isCompleted ? 'ring-1 ring-emerald-500/30' : ''
                  }`}
                  style={{ borderLeft: `4px solid ${item.color}` }}
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-slate-800 dark:text-white truncate" title={item.subject}>
                          {item.subject}
                        </span>
                        {item.isCompleted && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/20">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                            Done
                          </span>
                        )}
                      </div>
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">
                        Start: {item.startDateText}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Progress Badge */}
                      <span
                        id={`${item.domId}-badge`}
                        className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full transition-colors duration-300 ${badgeClass}`}
                      >
                        {item.progressPercent}%
                      </span>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteSubjectTarget(item.subject)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                        title="Delete Target"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Premium Progress Bar */}
                  <div className="w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      id={`${item.domId}-bar`}
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${item.progressPercent}%`,
                        backgroundColor: item.isCompleted ? '#10b981' : item.color,
                      }}
                    />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-1.5 text-center mt-0.5">
                    <div className="flex flex-col bg-white dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/80 rounded-xl py-1 px-0.5">
                      <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400">Done</span>
                      <span id={`${item.domId}-done`} className="text-[9.5px] font-black text-emerald-500 font-mono whitespace-nowrap">
                        {item.doneText}
                      </span>
                    </div>
                    <div className="flex flex-col bg-white dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/80 rounded-xl py-1 px-0.5">
                      <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400">Remain</span>
                      <span id={`${item.domId}-remain`} className={`text-[9.5px] font-black ${remainColorClass} font-mono whitespace-nowrap`}>
                        {item.remainText}
                      </span>
                    </div>
                    <div className="flex flex-col bg-white dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/80 rounded-xl py-1 px-0.5">
                      <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400">Target</span>
                      <span id={`${item.domId}-target`} className="text-[9.5px] font-black text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                        {item.targetText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Target Modal */}
      <Dialog.Root open={addModalOpen} onOpenChange={setAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <Dialog.Title className="text-base font-black uppercase tracking-wider">
                Set Subject Target
              </Dialog.Title>
              <Dialog.Close className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Dialog.Close>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Subject
                </label>
                <select
                  value={targetSubject}
                  onChange={(e) => setTargetSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {subjectGroups.map((group) => (
                    <optgroup key={group.program} label={group.program}>
                      {group.subjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={targetHours}
                    onChange={(e) => setTargetHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-base font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-base font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                  Save Target
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
});
