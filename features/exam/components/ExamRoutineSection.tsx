'use client';

/**
 * X-29 Exam Routine Section Component (features/exam/components/ExamRoutineSection.tsx)
 * 
 * Pixel-perfect parity with legacy Exam Routine timetable:
 * - Session blocks grouped by timeframe
 * - Search by title, subject, program
 * - Filter tabs: All, Upcoming, Completed
 * - Live ticking countdown badges per subject card
 * - Mark Complete / Pending status toggles
 * - Add/Edit/Delete actions for sessions and subjects
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { ExamRoutineItem, ExamSession } from '@/types/exam';
import {
  Calendar,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  CheckCircle,
  GraduationCap,
  Settings,
  AlertCircle,
} from 'lucide-react';
import {
  formatSessionDate,
  parseExamDateTime,
  isExamDoneOrOver,
  calculateExamTimeRemaining,
  formatExamCountdownString,
} from '@/features/exam/services/examService';
import { getSubjectColor } from '@/features/taxonomy/services/taxonomyService';

interface ExamRoutineSectionProps {
  sessions: ExamSession[];
  exams: ExamRoutineItem[];
  onOpenAddSession: () => void;
  onOpenEditSession: (session: ExamSession) => void;
  onDeleteSession: (session: ExamSession) => void;
  onOpenAddExam: (sessionId: string) => void;
  onOpenEditExam: (exam: ExamRoutineItem) => void;
  onDeleteExam: (exam: ExamRoutineItem) => void;
  onToggleExamStatus: (examId: string) => void;
}

export const ExamRoutineSection: React.FC<ExamRoutineSectionProps> = ({
  sessions,
  exams,
  onOpenAddSession,
  onOpenEditSession,
  onDeleteSession,
  onOpenAddExam,
  onOpenEditExam,
  onDeleteExam,
  onToggleExamStatus,
}) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // 1-second interval to drive live countdown badges on cards
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sort sessions chronologically
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (!a.startDate && !b.startDate) return (b.createdAt || 0) - (a.createdAt || 0);
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [sessions]);

  // Compute session blocks to display
  const sessionBlocks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const blocks: Array<{
      session: ExamSession;
      exams: ExamRoutineItem[];
      totalCount: number;
      completedCount: number;
      upcomingCount: number;
      isFullSessionCompleted: boolean;
    }> = [];

    sortedSessions.forEach((session) => {
      // Find all exams belonging to this session
      let sessionExams = exams.filter((e) => e.sessionId === session.id);
      if (sessionExams.length === 0 && session.program !== 'Non-Program') {
        sessionExams = exams.filter((e) => !e.sessionId && e.program === session.program);
      }

      // Sort session exams chronologically
      sessionExams = [...sessionExams].sort((a, b) => {
        const ta = parseExamDateTime(a) || 0;
        const tb = parseExamDateTime(b) || 0;
        return ta - tb;
      });

      const totalCount = sessionExams.length;
      const completedCount = sessionExams.filter((e) => isExamDoneOrOver(e, nowMs)).length;
      const upcomingCount = totalCount - completedCount;

      const isFullSessionCompleted = (() => {
        if (totalCount > 0) {
          return sessionExams.every((e) => isExamDoneOrOver(e, nowMs));
        } else if (session.endDate) {
          const endMs = new Date(session.endDate + 'T23:59:59').getTime();
          return !isNaN(endMs) && endMs < nowMs;
        }
        return false;
      })();

      // Tab filter
      let filteredExams = sessionExams;
      if (filter === 'upcoming') {
        if (totalCount > 0 && upcomingCount === 0) return;
        if (totalCount === 0 && isFullSessionCompleted) return;
        filteredExams = sessionExams.filter((e) => !isExamDoneOrOver(e, nowMs));
      } else if (filter === 'completed') {
        if (completedCount === 0 && !isFullSessionCompleted) return;
        filteredExams = sessionExams.filter((e) => isExamDoneOrOver(e, nowMs));
      }

      // Search filter
      let displayExams = filteredExams;
      if (query) {
        const matchesSessionName =
          (session.name || '').toLowerCase().includes(query) ||
          (session.program || '').toLowerCase().includes(query);

        const matchingExams = filteredExams.filter(
          (e) =>
            (e.title || '').toLowerCase().includes(query) ||
            (e.subject || '').toLowerCase().includes(query) ||
            (e.program || '').toLowerCase().includes(query) ||
            (e.room || '').toLowerCase().includes(query)
        );

        if (!matchesSessionName && matchingExams.length === 0) {
          return;
        }
        if (!matchesSessionName) {
          displayExams = matchingExams;
        }
      }

      blocks.push({
        session,
        exams: displayExams,
        totalCount,
        completedCount,
        upcomingCount,
        isFullSessionCompleted,
      });
    });

    return blocks;
  }, [sortedSessions, exams, filter, searchQuery, nowMs]);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 md:mb-6 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-800/50 shadow-sm shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
              Exam Routine & Timetable
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Manage schedules, venues, and study targets for upcoming tests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddSession}
            data-open-session-modal
            className="w-full sm:w-auto justify-center bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 min-h-[42px] cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Session</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Search Box */}
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="exam-search-input"
            type="text"
            data-exam-search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exam title, subject, program..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500 outline-none transition-all min-h-[42px]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="grid grid-cols-3 w-full sm:w-auto sm:flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl gap-1 shrink-0">
          <button
            id="btn-exam-filter-all"
            data-exam-filter="all"
            onClick={() => setFilter('all')}
            className={`justify-center py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all min-h-[34px] flex items-center cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            id="btn-exam-filter-upcoming"
            data-exam-filter="upcoming"
            onClick={() => setFilter('upcoming')}
            className={`justify-center py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all min-h-[34px] flex items-center cursor-pointer ${
              filter === 'upcoming'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Upcoming
          </button>
          <button
            id="btn-exam-filter-completed"
            data-exam-filter="completed"
            onClick={() => setFilter('completed')}
            className={`justify-center py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all min-h-[34px] flex items-center cursor-pointer ${
              filter === 'completed'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Exam Routine Session Blocks Container */}
      <div id="exam-routine-container" className="flex flex-col gap-4 sm:gap-6 md:gap-8">
        {sessionBlocks.length === 0 ? (
          <div className="py-10 sm:py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 w-full col-span-full">
            <div className="w-12 h-12 mx-auto mb-3 text-slate-400 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              {searchQuery
                ? 'No Results Found'
                : filter === 'upcoming'
                ? 'No Upcoming Exam Sessions'
                : filter === 'completed'
                ? 'No Completed Sessions'
                : 'No Sessions Found'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No sessions or exams match "${searchQuery}".`
                : filter === 'upcoming'
                ? 'All scheduled exam sessions are completed, or click "Add Session" to schedule a new one.'
                : filter === 'completed'
                ? 'Completed subjects and sessions will automatically appear here once their exam is over or marked complete.'
                : 'No sessions have been created yet. Click "Add Session" to create your first session block.'}
            </p>
          </div>
        ) : (
          sessionBlocks.map(
            ({ session, exams: displayExams, totalCount, completedCount, upcomingCount, isFullSessionCompleted }) => {
              const isNonProgramSession = session.program === 'Non-Program';
              const sessionDisplayName = session.name
                ? `${session.program} - ${session.name}`
                : session.program;

              return (
                <div
                  key={session.id}
                  className="exam-session-card bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm space-y-3.5 sm:space-y-4 w-full"
                >
                  {/* Session Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-lg border border-rose-500/20 shadow-sm shrink-0">
                        {isNonProgramSession ? (
                          <Settings className="w-5 h-5 text-rose-500" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-rose-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight flex flex-wrap items-center gap-1.5 sm:gap-2 break-words">
                          <span>{sessionDisplayName}</span>
                          {(session.startDate || session.endDate) && (
                            <span className="text-[11px] sm:text-xs font-mono text-slate-400 font-bold break-all">
                              ({session.startDate ? formatSessionDate(session.startDate) : 'Start'} -{' '}
                              {session.endDate ? formatSessionDate(session.endDate) : 'End'})
                            </span>
                          )}
                          {isFullSessionCompleted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                              ✓ Session Completed
                            </span>
                          )}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 shrink-0">
                            {upcomingCount} Upcoming
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                            {completedCount} Completed
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            ({totalCount} Total Exam{totalCount === 1 ? '' : 's'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Session Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end sm:justify-start pt-2 sm:pt-0 border-t border-slate-200/40 dark:border-slate-700/40 sm:border-t-0">
                      <button
                        onClick={() => onOpenEditSession(session)}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl bg-white/60 dark:bg-slate-800/60 sm:bg-transparent border border-slate-200/40 dark:border-slate-700/40 sm:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                        title="Edit Session"
                        aria-label="Edit Session"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteSession(session)}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl bg-white/60 dark:bg-slate-800/60 sm:bg-transparent border border-slate-200/40 dark:border-slate-700/40 sm:border-0 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all cursor-pointer"
                        title="Delete Session"
                        aria-label="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenAddExam(session.id)}
                        className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 min-h-[36px] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>Add Subject</span>
                      </button>
                    </div>
                  </div>

                  {/* Grid of Subject Exam Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full">
                    {displayExams.length === 0 ? (
                      <div className="col-span-full py-8 text-center bg-white/40 dark:bg-slate-800/10 border border-dashed border-slate-200/50 dark:border-slate-700/50 rounded-2xl">
                        <p className="text-xs text-slate-400 font-medium">
                          No exams scheduled in this session yet.
                        </p>
                      </div>
                    ) : (
                      displayExams.map((ex) => {
                        const isCompleted = ex.status === 'completed' || ex.completed;
                        const exTimeMs = parseExamDateTime(ex);
                        const targetExamDt = !isNaN(exTimeMs) ? new Date(exTimeMs) : null;
                        const rem = targetExamDt
                          ? calculateExamTimeRemaining(new Date(nowMs), targetExamDt)
                          : null;

                        const subjColor = getSubjectColor(ex.subject || 'General');
                        const dtObj = !isNaN(exTimeMs) ? new Date(exTimeMs) : new Date();
                        const dtFormatted = dtObj.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        return (
                          <div
                            key={ex.id}
                            className={`exam-item-row bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group ${
                              isCompleted ? 'opacity-70' : ''
                            }`}
                          >
                            <div>
                              {/* Top Row: Countdown badge & color dot */}
                              <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                                {isCompleted ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                    ✓ Completed
                                  </span>
                                ) : !rem || isNaN(exTimeMs) ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700/60 text-slate-500 shrink-0">
                                    No Date
                                  </span>
                                ) : rem.isPast && rem.diffMs > -7200000 ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse shrink-0">
                                    ● Live Exam Today
                                  </span>
                                ) : !rem.isPast ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5 min-w-0 max-w-[85%] truncate">
                                    <Clock className="w-3 h-3 text-rose-500 animate-spin shrink-0 [animation-duration:4s]" />
                                    <span className="truncate">{formatExamCountdownString(rem)}</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700/60 text-slate-500 shrink-0">
                                    Ended
                                  </span>
                                )}

                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                  style={{ backgroundColor: subjColor }}
                                  title="Subject Accent"
                                />
                              </div>

                              <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors break-words">
                                {ex.subject || 'General Subject'}
                              </h4>

                              <div className="mt-2.5 sm:mt-3 space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                                  <span>
                                    {dtFormatted} at {ex.time || ex.startTime || '10:00'}
                                  </span>
                                </div>
                                {(ex.room || ex.venue) && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>{ex.room || ex.venue}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Card Footer: Toggle status + Edit + Delete */}
                            <div className="mt-3.5 sm:mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                              <button
                                onClick={() => onToggleExamStatus(ex.id)}
                                className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-2 sm:py-1.5 rounded-xl transition-all min-h-[36px] flex items-center justify-center cursor-pointer ${
                                  isCompleted
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                                    : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                                }`}
                              >
                                {isCompleted ? 'Mark Pending' : '✓ Mark Complete'}
                              </button>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => onOpenEditExam(ex)}
                                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                                  title="Edit Subject"
                                  aria-label="Edit Subject"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteExam(ex)}
                                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all cursor-pointer"
                                  title="Delete Subject"
                                  aria-label="Delete Subject"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
};
