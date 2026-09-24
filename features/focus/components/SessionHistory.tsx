'use client';

/**
 * X-29 Session History Component (features/focus/components/SessionHistory.tsx)
 * 
 * Filterable recorded study sessions list (All, Day, Week, Month, Year)
 * with duration aggregation, delete action, analytics navigation,
 * and manual session recording dialog.
 * 100% visual parity with legacy Focus.html and Focus.js.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { TimerLogSession, SessionHistoryFilter, TimerMode } from '@/types/timer';
import { getAvailableSubjectGroups } from '@/features/focus/services/focusSubjectAdapter';
import * as Dialog from '@radix-ui/react-dialog';

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

  // Filter sessions matching legacy Focus.js logic
  const filteredSessions = useMemo(() => {
    const now = new Date();
    return (timerLogs || []).filter((log) => {
      if (!log || !log.date) return false;
      const logDate = new Date(log.date);
      if (isNaN(logDate.getTime())) return false;

      if (activeFilter === 'day') {
        return logDate.toDateString() === now.toDateString();
      } else if (activeFilter === 'week') {
        const diffTime = now.getTime() - logDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      } else if (activeFilter === 'month') {
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      } else if (activeFilter === 'year') {
        return logDate.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
    });
  }, [timerLogs, activeFilter]);

  // Aggregate total duration
  const totalFilterSeconds = useMemo(() => {
    return filteredSessions.reduce((acc, log) => acc + (parseInt(String(log.duration), 10) || 0), 0);
  }, [filteredSessions]);

  const formattedTotalTime = useMemo(() => {
    const totalFilterMinutes = Math.floor(totalFilterSeconds / 60);
    const filterHrs = Math.floor(totalFilterMinutes / 60);
    const filterMins = totalFilterMinutes % 60;
    const filterSecs = totalFilterSeconds % 60;

    if (filterHrs > 0) {
      return `${filterHrs} hr ${filterMins > 0 ? filterMins + ' min' : ''}`.trim();
    } else if (filterMins > 0) {
      return `${filterMins} min`;
    } else if (filterSecs > 0) {
      return `${filterSecs}s`;
    }
    return '0 min';
  }, [totalFilterSeconds]);

  const durSumStr = useMemo(() => {
    const totalFilterMinutes = Math.floor(totalFilterSeconds / 60);
    const filterHrs = Math.floor(totalFilterMinutes / 60);
    const filterMins = totalFilterMinutes % 60;
    return `${String(filterHrs).padStart(2, '0')} hr : ${String(filterMins).padStart(2, '0')} min`;
  }, [totalFilterSeconds]);

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
      const dateObj = new Date(dateStr);
      const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      const dayStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${dayStr}, ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  const formatLogDuration = (durationSec: number) => {
    const rowTotalMins = Math.floor(durationSec / 60);
    const hrs = Math.floor(rowTotalMins / 60);
    const mins = rowTotalMins % 60;
    return `${String(hrs).padStart(2, '0')} hr : ${String(mins).padStart(2, '0')} min`;
  };

  const renderModeBadge = (mode: string) => {
    if (mode === 'timer') {
      return (
        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black text-[9px] uppercase tracking-wider rounded border border-blue-100 dark:border-blue-900/30">
          Timer
        </span>
      );
    } else if (mode === 'alarm') {
      return (
        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-black text-[9px] uppercase tracking-wider rounded border border-purple-100 dark:border-purple-900/30">
          Alarm
        </span>
      );
    } else if (mode === 'addx') {
      return (
        <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-black text-[9px] uppercase tracking-wider rounded border border-orange-100 dark:border-orange-900/30">
          Added
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-wider rounded border border-emerald-100 dark:border-emerald-900/30">
        Stopwatch
      </span>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
                Session History
              </h3>
              <span
                id="timer-history-count-badge"
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                {filteredSessions.length > 20
                  ? `${filteredSessions.length} Sessions (Scrollable)`
                  : `${filteredSessions.length} Sessions`}
              </span>
              <span
                id="timer-history-total-time-badge"
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1.5 shadow-xs"
                title={`Total focus time for ${activeFilter.toUpperCase()} filter: ${formattedTotalTime}`}
              >
                <svg className="w-3 h-3 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span id="timer-history-total-time-text">
                  Total: {formattedTotalTime}
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
              className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800"
            >
              {FILTER_OPTIONS.map((opt) => {
                const isActive = activeFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={opt.elementId}
                    type="button"
                    onClick={() => onSelectFilter(opt.id)}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
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

            {/* Analytics Button */}
            <Link
              href="/analytics"
              id="timer-btn-open-analytics"
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">Analytics</span>
            </Link>

            {/* Add Manual Session Button */}
            <button
              id="timer-btn-open-add-session"
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Session</span>
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        <div
          id="timer-history-container"
          className={`overflow-x-auto w-full transition-all duration-300 custom-scrollbar ${
            filteredSessions.length > 20 ? 'max-h-[670px] overflow-y-auto pr-1' : ''
          }`}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-slate-800 z-10">
                <th className="py-3 font-black uppercase tracking-widest">Date & Time</th>
                <th className="py-3 font-black uppercase tracking-widest">Subject</th>
                <th className="py-3 font-black uppercase tracking-widest">Duration</th>
                <th className="py-3 font-black uppercase tracking-widest text-center">Mode</th>
                <th className="py-3 font-black uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody id="timer-history-table-body" className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]"
                  >
                    No focus sessions recorded for {activeFilter}
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatLogDate(session.date)}
                    </td>
                    <td className="py-3 font-black text-slate-800 dark:text-white">
                      {session.subject}
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatLogDuration(session.duration)}
                    </td>
                    <td className="py-3 text-center">
                      {renderModeBadge(session.mode)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onDeleteSession(session.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95 transition-all"
                          title="Delete session"
                        >
                          <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredSessions.length > 0 && (
              <tfoot id="timer-history-table-foot" className="sticky bottom-0 bg-white dark:bg-slate-800 z-10">
                <tr className="border-t-2 border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 font-bold">
                  <td className="py-3 font-black uppercase tracking-wider text-[10px]" colSpan={2}>
                    Filtered Total Focus Time
                  </td>
                  <td className="py-3 font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                    {durSumStr}
                  </td>
                  <td
                    colSpan={2}
                    className="py-3 text-right text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider"
                  >
                    {filteredSessions.length} session{filteredSessions.length === 1 ? '' : 's'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Manual Session Modal */}
      <Dialog.Root open={addModalOpen} onOpenChange={setAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <Dialog.Title className="text-base font-black uppercase tracking-wider">
                Add Study Session
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
                  value={modalSubject}
                  onChange={(e) => setModalSubject(e.target.value)}
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
                    max="24"
                    value={modalHours}
                    onChange={(e) => setModalHours(e.target.value)}
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
                    value={modalMinutes}
                    onChange={(e) => setModalMinutes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-base font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Mode
                  </label>
                  <select
                    value={modalMode}
                    onChange={(e) => setModalMode(e.target.value as TimerMode)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="timer">Timer</option>
                    <option value="stopwatch">Stopwatch</option>
                    <option value="alarm">Alarm</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Date
                  </label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                  Save Session
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
});
