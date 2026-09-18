'use client';

/**
 * X-29 Subject Target Live Component (features/focus/components/SubjectTargetLive.tsx)
 * 
 * Manages subject selection, live target progress tracking,
 * and goal management for individual study topics.
 */

import React, { useState, useMemo } from 'react';
import type { SubjectFocusTarget, TimerLogSession } from '@/types/timer';
import {
  getAvailableSubjectGroups,
  getSubjectColor,
  type ProgramSubjectGroup,
} from '@/features/focus/services/focusSubjectAdapter';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Maximize2, Minimize2, Trash2, X, Target } from 'lucide-react';

interface SubjectTargetLiveProps {
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
  subjectFocusTargets: Record<string, SubjectFocusTarget>;
  timerLogs: TimerLogSession[];
  activeRunningSubject: string | null;
  activeRunningElapsedSec: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSetSubjectTarget: (subject: string, hours: number, minutes: number) => void;
  onDeleteSubjectTarget: (subject: string) => void;
}

export const SubjectTargetLive: React.FC<SubjectTargetLiveProps> = React.memo(function SubjectTargetLive({
  selectedSubject,
  onSelectSubject,
  subjectFocusTargets,
  timerLogs,
  activeRunningSubject,
  activeRunningElapsedSec,
  isFullscreen,
  onToggleFullscreen,
  onSetSubjectTarget,
  onDeleteSubjectTarget,
}) {
  const [filter, setFilter] = useState<'uncompleted' | 'done'>('uncompleted');
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [targetSubject, setTargetSubject] = useState<string>(selectedSubject || 'General Study');
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

  // Compute target stats
  const targetItems = useMemo(() => {
    const entries = Object.entries(subjectFocusTargets);
    return entries.map(([sub, target]) => {
      const h = Number(target.hours) || 0;
      const m = Number(target.minutes) || 0;
      const targetSec = (h * 3600) + (m * 60);

      let doneSec = subjectDoneSeconds[sub] || 0;
      if (activeRunningSubject === sub) {
        doneSec += activeRunningElapsedSec;
      }

      const isCompleted = targetSec > 0 && doneSec >= targetSec;
      const remainSec = Math.max(0, targetSec - doneSec);
      const progressPercent = targetSec > 0 ? Math.min(100, Math.round((doneSec / targetSec) * 100)) : 0;
      const color = getSubjectColor(sub);

      return {
        subject: sub,
        targetSec,
        doneSec,
        remainSec,
        progressPercent,
        isCompleted,
        color,
      };
    });
  }, [subjectFocusTargets, subjectDoneSeconds, activeRunningSubject, activeRunningElapsedSec]);

  const uncompletedItems = useMemo(() => targetItems.filter((item) => !item.isCompleted), [targetItems]);
  const doneItems = useMemo(() => targetItems.filter((item) => item.isCompleted), [targetItems]);

  const displayedItems = filter === 'uncompleted' ? uncompletedItems : doneItems;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(targetHours, 10) || 0;
    const m = parseInt(targetMinutes, 10) || 0;
    if (targetSubject && (h > 0 || m > 0)) {
      onSetSubjectTarget(targetSubject, h, m);
      setAddModalOpen(false);
    }
  };

  const formatSecToHhMm = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  };

  return (
    <>
      {/* Subject Dropdown & Fullscreen Button Bar */}
      <div id="timer-subject-select-container" className="w-full min-w-0 max-w-full text-left flex flex-col gap-1">
        <label
          htmlFor="timer-subject-select"
          className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400"
        >
          Track Time Against:
        </label>
        <div className="flex items-center gap-2 w-full min-w-0 max-w-full">
          <select
            id="timer-subject-select"
            value={selectedSubject}
            onChange={(e) => onSelectSubject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-500 font-bold flex-1 min-w-0 cursor-pointer shadow-sm outline-none touch-manipulation h-[46px] truncate"
          >
            {subjectGroups.map((group) => (
              <optgroup key={group.program} label={`🎓 ${group.program}`}>
                {group.subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Fullscreen Button */}
          <button
            id="timer-btn-fullscreen"
            type="button"
            onClick={onToggleFullscreen}
            className="p-2.5 sm:p-3 bg-slate-800/90 hover:bg-slate-700/90 rounded-2xl transition-all active:scale-95 text-slate-300 border border-slate-700/60 shadow-md touch-manipulation flex items-center justify-center h-[46px] w-[46px] shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Subject Target Tracker Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                Subject Target Tracker
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Set study target and track live progress
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs: Uncompleted & Done */}
            <div
              id="subject-target-filter-bar"
              className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800"
            >
              <button
                id="st-filter-uncompleted"
                type="button"
                onClick={() => setFilter('uncompleted')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all touch-manipulation ${
                  filter === 'uncompleted'
                    ? 'bg-rose-600 text-white shadow shadow-rose-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${filter === 'uncompleted' ? 'bg-rose-200 animate-pulse' : 'bg-rose-500'}`} />
                <span>Uncompleted</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-mono leading-none">
                  {uncompletedItems.length}
                </span>
              </button>

              <button
                id="st-filter-done"
                type="button"
                onClick={() => setFilter('done')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all touch-manipulation ${
                  filter === 'done'
                    ? 'bg-emerald-600 text-white shadow shadow-emerald-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${filter === 'done' ? 'bg-emerald-200 animate-pulse' : 'bg-emerald-500'}`} />
                <span>Done</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-mono leading-none">
                  {doneItems.length}
                </span>
              </button>
            </div>

            {/* Add Target Button */}
            <button
              id="timer-btn-add-subject-target"
              type="button"
              onClick={() => {
                setTargetSubject(selectedSubject || 'General Study');
                setAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all"
              title="Add Subject Target"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target</span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        {displayedItems.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            {filter === 'uncompleted' ? 'No uncompleted targets.' : 'No completed targets yet.'}
          </div>
        ) : (
          <div
            id="subject-targets-list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[360px] overflow-y-auto pr-1"
          >
            {displayedItems.map((item) => (
              <div
                key={item.subject}
                className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-2.5 transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-black text-slate-800 dark:text-white truncate">
                      {item.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full ${
                        item.isCompleted
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.progressPercent}%
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteSubjectTarget(item.subject)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                      title="Delete Target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.progressPercent}%`,
                      backgroundColor: item.isCompleted ? '#10b981' : item.color,
                    }}
                  />
                </div>

                {/* Done vs Remaining */}
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="text-slate-500 dark:text-slate-400">
                    Done: {formatSecToHhMm(item.doneSec)}
                  </span>
                  <span className={item.isCompleted ? 'text-emerald-500' : 'text-blue-500 dark:text-blue-400'}>
                    {item.isCompleted ? 'Completed' : `Rem: ${formatSecToHhMm(item.remainSec)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Target Modal */}
      <Dialog.Root open={addModalOpen} onOpenChange={setAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <Dialog.Title className="text-base font-black uppercase tracking-wider">
                  Set Subject Target
                </Dialog.Title>
              </div>
              <Dialog.Close className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all">
                <X className="w-5 h-5" />
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
