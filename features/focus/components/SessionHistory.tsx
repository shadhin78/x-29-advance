'use client';

/**
 * X-29 Session History Component (features/focus/components/SessionHistory.tsx)
 * 
 * Filterable recorded study sessions list (All, Day, Week, Month, Year)
 * with duration aggregation, delete action, and manual session recording dialog.
 */

import React, { useState, useMemo } from 'react';
import type { TimerLogSession, SessionHistoryFilter, TimerMode } from '@/types/timer';
import { formatHoursToHrMin, formatSecondsToClock } from '@/features/focus/services/timerEngine';
import { getSubjectColor, getAvailableSubjectGroups } from '@/features/focus/services/focusSubjectAdapter';
import * as Dialog from '@radix-ui/react-dialog';
import { History, Plus, Trash2, X, Clock, Calendar } from 'lucide-react';

interface SessionHistoryProps {
  timerLogs: TimerLogSession[];
  activeFilter: SessionHistoryFilter;
  onSelectFilter: (filter: SessionHistoryFilter) => void;
  onDeleteSession: (id: string) => void;
  onAddManualSession: (data: {
    subject: string;
    durationSeconds: number;
    mode: TimerMode;
    dateStr?: string;
  }) => void;
}

const FILTER_OPTIONS: Array<{ id: SessionHistoryFilter; label: string; elementId: string }> = [
  { id: 'all', label: 'All', elementId: 'sh-filter-all' },
  { id: 'day', label: 'Day', elementId: 'sh-filter-day' },
  { id: 'week', label: 'Week', elementId: 'sh-filter-week' },
  { id: 'month', label: 'Month', elementId: 'sh-filter-month' },
  { id: 'year', label: 'Year', elementId: 'sh-filter-year' },
];

export const SessionHistory: React.FC<SessionHistoryProps> = React.memo(function SessionHistory({
  timerLogs,
  activeFilter,
  onSelectFilter,
  onDeleteSession,
  onAddManualSession,
}) {
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [modalSubject, setModalSubject] = useState<string>('General Study');
  const [modalHours, setModalHours] = useState<string>('1');
  const [modalMinutes, setModalMinutes] = useState<string>('0');
  const [modalMode, setModalMode] = useState<TimerMode>('timer');
  const [modalDate, setModalDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const subjectGroups = useMemo(() => getAvailableSubjectGroups(), []);

  // Filter sessions by date range
  const filteredSessions = useMemo(() => {
    if (activeFilter === 'all') return timerLogs;

    const now = new Date();
    let threshold = 0;

    if (activeFilter === 'day') {
      threshold = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (activeFilter === 'week') {
      const dayOfWeek = now.getDay();
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      threshold = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday).getTime();
    } else if (activeFilter === 'month') {
      threshold = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else if (activeFilter === 'year') {
      threshold = new Date(now.getFullYear(), 0, 1).getTime();
    }

    return timerLogs.filter((log) => {
      const logTime = new Date(log.date).getTime();
      return logTime >= threshold;
    });
  }, [timerLogs, activeFilter]);

  // Aggregate total duration
  const totalDurationSeconds = useMemo(() => {
    return filteredSessions.reduce((acc, log) => acc + Number(log.duration || 0), 0);
  }, [filteredSessions]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(modalHours, 10) || 0;
    const m = parseInt(modalMinutes, 10) || 0;
    const totalSec = (h * 3600) + (m * 60);

    if (totalSec > 0 && modalSubject) {
      onAddManualSession({
        subject: modalSubject,
        durationSeconds: totalSec,
        mode: modalMode,
        dateStr: modalDate ? new Date(modalDate).toISOString() : new Date().toISOString(),
      });
      setAddModalOpen(false);
    }
  };

  const formatLogDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <History className="w-4 h-4 text-blue-500" />
              <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
                Session History
              </h3>
              <span
                id="timer-history-count-badge"
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {filteredSessions.length} {filteredSessions.length === 1 ? 'Session' : 'Sessions'}
              </span>
              <span
                id="timer-history-total-time-badge"
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1.5 shadow-xs"
              >
                <Clock className="w-3 h-3 inline-block shrink-0" />
                <span id="timer-history-total-time-text">
                  Total: {formatHoursToHrMin(totalDurationSeconds / 3600)}
                </span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              List of recorded study sessions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <div
              id="session-history-filter-bar"
              className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800"
            >
              {FILTER_OPTIONS.map((opt) => {
                const isActive = activeFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={opt.elementId}
                    type="button"
                    onClick={() => onSelectFilter(opt.id)}
                    className={`px-2.5 sm:px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all touch-manipulation ${
                      isActive
                        ? 'bg-blue-600 text-white shadow shadow-blue-500/20'
                        : 'text-slate-500 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Add Manual Session Button */}
            <button
              id="timer-btn-open-add-session"
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Session</span>
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No study sessions found for this period.
          </div>
        ) : (
          <div id="timer-history-container" className="overflow-x-auto w-full transition-all duration-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-slate-900 z-10">
                  <th className="py-3 px-2 font-black uppercase tracking-widest text-[10px]">
                    Date & Time
                  </th>
                  <th className="py-3 px-2 font-black uppercase tracking-widest text-[10px]">
                    Subject
                  </th>
                  <th className="py-3 px-2 font-black uppercase tracking-widest text-[10px]">
                    Duration
                  </th>
                  <th className="py-3 px-2 font-black uppercase tracking-widest text-[10px] text-center">
                    Mode
                  </th>
                  <th className="py-3 px-2 font-black uppercase tracking-widest text-[10px] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody id="timer-history-table-body" className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredSessions.map((session) => {
                  const subColor = getSubjectColor(session.subject);
                  return (
                    <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-2 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatLogDate(session.date)}
                      </td>
                      <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: subColor }}
                          />
                          <span className="truncate max-w-[150px] sm:max-w-xs">{session.subject}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatSecondsToClock(session.duration)}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {session.mode}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Manual Session Dialog */}
      <Dialog.Root open={addModalOpen} onOpenChange={setAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <Dialog.Title className="text-base font-black uppercase tracking-wider">
                  Record Manual Session
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
                  value={modalSubject}
                  onChange={(e) => setModalSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
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
                    max="24"
                    value={modalHours}
                    onChange={(e) => setModalHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-base font-mono font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
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
                    value={modalMinutes}
                    onChange={(e) => setModalMinutes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-base font-mono font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Date
                  </label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Mode
                  </label>
                  <select
                    value={modalMode}
                    onChange={(e) => setModalMode(e.target.value as TimerMode)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="timer">Timer</option>
                    <option value="stopwatch">Stopwatch</option>
                    <option value="alarm">Alarm Range</option>
                  </select>
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
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                  Add Session
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
});
