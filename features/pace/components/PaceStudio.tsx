'use client';

/**
 * X-29 Pace Studio Component (features/pace/components/PaceStudio.tsx)
 * 
 * 100% Parity with pages/Pace Management/Pace Management.html & paceManager.js:
 * - Fluid full-width container (#page-paces-management) with hardware-accelerated slide-up transition
 * - Top Metrics Banner (#pace-stats-section) with baseline info & 3 KPI cards
 * - Main Pace Management section (#pace-management-section)
 * - Inline Add Goal Form with bundle type selector, dates, and dynamic items checklist
 * - Active Timelines grid (#pace-goals-container) with 4-button hover actions
 * - Accessible Radix modals for Trend Analysis, Target Breakdown, Edit Goal, and Confirm Delete
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePaceStore } from '@/stores/usePaceStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useOutcomeStore } from '@/stores/useOutcomeStore';
import {
  resolveTargetedSubjects,
  calculatePaceStats,
} from '@/features/pace/services/paceEngine';
import dynamic from 'next/dynamic';
import { PaceStatsBanner } from './PaceStatsBanner';
import { PaceGoalCard } from './PaceGoalCard';
import type { PaceGoal } from '@/types/pace';

const EditPaceModal = dynamic(
  () => import('./modals/EditPaceModal').then((m) => m.EditPaceModal),
  { ssr: false }
);
const GoalDetailsModal = dynamic(
  () => import('./modals/GoalDetailsModal').then((m) => m.GoalDetailsModal),
  { ssr: false }
);
const PaceTrendModal = dynamic(
  () => import('./modals/PaceTrendModal').then((m) => m.PaceTrendModal),
  { ssr: false }
);
const ConfirmDeleteModal = dynamic(
  () => import('./modals/ConfirmDeleteModal').then((m) => m.ConfirmDeleteModal),
  { ssr: false }
);

export const PaceStudio: React.FC = () => {
  const {
    paceGoals,
    activeGoalId,
    initFromStorage: initPace,
    addGoal,
    updateGoal,
    deleteGoal,
    setActiveGoalId,
  } = usePaceStore();

  const { tracks, customPrograms, syllabusStructure, initFromStorage: initTaxonomy } = useTaxonomyStore();
  const { tasks, initFromStorage: initTasks } = useTaskStore();
  const { celebrationTargets, initFromStorage: initOutcome } = useOutcomeStore();

  // Inline Add Goal Form state
  const [bundleType, setBundleType] = useState<'subjects' | 'programs' | 'global'>('subjects');
  const [goalName, setGoalName] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [deadline, setDeadline] = useState('2026-10-31');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Modals state
  const [trendModalOpen, setTrendModalOpen] = useState(false);
  const [trendGoal, setTrendGoal] = useState<PaceGoal | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsGoal, setDetailsGoal] = useState<PaceGoal | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<PaceGoal | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [goalIdToDelete, setGoalIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    initPace();
    initTaxonomy();
    initTasks();
    initOutcome();
  }, [initPace, initTaxonomy, initTasks, initOutcome]);

  // Compute subjectStats ({ totalChapters, completedChapters }) from taxonomy & tasks
  const subjectStats = useMemo(() => {
    const stats: Record<string, { totalChapters: number; completedChapters: number }> = {};

    tracks.forEach((t) => {
      const subs = syllabusStructure[t.id] || [];
      subs.forEach((s) => {
        const total = Array.isArray(s.chapters)
          ? s.chapters.length
          : typeof s.chapters === 'number'
          ? s.chapters
          : 0;
        stats[s.subject] = {
          totalChapters: total,
          completedChapters: 0,
        };
      });
    });

    tasks.forEach((t) => {
      if (t.completed && stats[t.subject]) {
        stats[t.subject].completedChapters += 1;
      }
    });

    return stats;
  }, [tracks, syllabusStructure, tasks]);

  // Flattened all subjects
  const allSubjects = useMemo(() => {
    const list: { subject: string; program: string }[] = [];
    tracks.forEach((t) => {
      const subs = syllabusStructure[t.id] || [];
      subs.forEach((s) => {
        list.push({ subject: s.subject, program: s.program });
      });
    });
    return list;
  }, [tracks, syllabusStructure]);

  // Active Goal & Stats for top banner
  const activeGoal = useMemo(() => {
    return paceGoals.find((g) => g.id === activeGoalId) || paceGoals[0];
  }, [paceGoals, activeGoalId]);

  const activeStats = useMemo(() => {
    if (!activeGoal) {
      return {
        total: 0,
        completed: 0,
        remaining: 0,
        percentage: 0,
        totalDays: 0,
        daysElapsed: 0,
        daysRemaining: 0,
        reqPace: 0,
        curPace: 0,
        projectedFinish: '—',
        daysNeeded: 0,
        isBehind: false,
        status: 'no-data' as const,
      };
    }
    const targeted = resolveTargetedSubjects(activeGoal, allSubjects);
    return calculatePaceStats(activeGoal, targeted, subjectStats);
  }, [activeGoal, allSubjects, subjectStats]);

  // Handlers for Modals
  const handleOpenTrend = useCallback((goal?: PaceGoal) => {
    setTrendGoal(goal || activeGoal || null);
    setTrendModalOpen(true);
  }, [activeGoal]);

  const handleOpenDetails = useCallback((goal: PaceGoal) => {
    setDetailsGoal(goal);
    setDetailsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((goal: PaceGoal) => {
    setEditGoal(goal);
    setEditModalOpen(true);
  }, []);

  const handleRequestDelete = useCallback((id: string) => {
    setGoalIdToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (goalIdToDelete) {
      deleteGoal(goalIdToDelete);
      setGoalIdToDelete(null);
    }
  }, [goalIdToDelete, deleteGoal]);

  const handleSaveEdit = useCallback((id: string, updates: Partial<PaceGoal>) => {
    updateGoal(id, updates);
  }, [updateGoal]);

  // Inline Add Goal Toggle
  const toggleItemSelection = (item: string) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleCreatePaceTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !startDate || !deadline) return;

    let type: PaceGoal['type'] = 'bundle';
    if (bundleType === 'global') type = 'global';
    else if (bundleType === 'programs') type = 'bundle';
    else type = 'bundle';

    addGoal({
      type,
      target: goalName.trim(),
      startDate,
      deadline,
      subjects: bundleType === 'subjects' || bundleType === 'global' ? selectedItems : undefined,
      programs: bundleType === 'programs' ? selectedItems : undefined,
    });

    // Reset inline form
    setGoalName('');
    setSelectedItems([]);
  };

  const trendGoalStats = useMemo(() => {
    if (!trendGoal) return null;
    const targeted = resolveTargetedSubjects(trendGoal, allSubjects);
    return calculatePaceStats(trendGoal, targeted, subjectStats);
  }, [trendGoal, allSubjects, subjectStats]);

  const detailsGoalStats = useMemo(() => {
    if (!detailsGoal) return null;
    const targeted = resolveTargetedSubjects(detailsGoal, allSubjects);
    return calculatePaceStats(detailsGoal, targeted, subjectStats);
  }, [detailsGoal, allSubjects, subjectStats]);

  return (
    <div id="page-paces-management" className="w-full space-y-6 md:space-y-8 animate-page-enter pb-16">
      {/* Top Pace Stats Section */}
      <PaceStatsBanner
        stats={activeStats}
        activeGoal={activeGoal}
        onOpenTrendModal={() => handleOpenTrend(activeGoal)}
      />

      {/* Pace Management Section */}
      <div
        id="pace-management-section"
        className="mt-8 md:mt-12 bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col scroll-mt-24 md:scroll-mt-32"
      >
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
                Pace Management
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Bundle subjects or programs together to create specific timeline goals
              </p>
            </div>
          </div>
        </div>

        {/* Inline Add Goal Form */}
        <form
          onSubmit={handleCreatePaceTarget}
          className="bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 mb-8 shadow-inner"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Bundle Type
              </label>
              <select
                id="add-pace-bundle-type"
                value={bundleType}
                onChange={(e) => {
                  setBundleType(e.target.value as any);
                  setSelectedItems([]);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-bold w-full outline-none"
              >
                <option value="subjects">Specific Subjects (Across Programs)</option>
                <option value="programs">Multiple Entire Programs</option>
                <option value="global">Global Overall Goal</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5" id="add-pace-name-container">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Goal Name
              </label>
              <input
                type="text"
                id="add-pace-name"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. Phase 1 Year Target"
                required
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-bold w-full outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Start Date
              </label>
              <input
                type="date"
                id="add-pace-start"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-bold w-full outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Deadline
              </label>
              <input
                type="date"
                id="add-pace-date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-bold w-full outline-none"
              />
            </div>
          </div>

          {/* Dynamic Item Checklist */}
          {bundleType !== 'global' && (
            <div className="flex flex-col gap-3" id="add-pace-checklist-section">
              <label
                id="add-pace-checklist-label"
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1.5"
              >
                Select Items to Include
              </label>
              <div
                id="add-pace-subjects-container"
                className="flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar p-1"
              >
                {bundleType === 'programs' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
                    {tracks.map((t) => {
                      const progs = customPrograms[t.id] || [];
                      return progs.map((p) => {
                        const pName = typeof p === 'string' ? p : p.name;
                        const isPassed = celebrationTargets?.programs?.includes(pName);
                        const isChecked = selectedItems.includes(pName);

                        if (isPassed) {
                          return (
                            <label
                              key={pName}
                              className="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none"
                            >
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <input type="checkbox" disabled checked={false} className="form-checkbox h-4 w-4 text-slate-400 rounded cursor-not-allowed" />
                                <del className="text-[10px] md:text-xs font-bold text-slate-400 truncate">{pName}</del>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50">Passed</span>
                            </label>
                          );
                        }

                        return (
                          <label
                            key={pName}
                            className={`flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl border transition-all shadow-sm ${
                              isChecked
                                ? 'bg-orange-500/10 border-orange-500/50 text-slate-900 dark:text-white font-bold'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleItemSelection(pName)}
                              className="form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500"
                            />
                            <span className="text-[10px] md:text-xs font-bold truncate">{pName}</span>
                          </label>
                        );
                      });
                    })}
                  </div>
                ) : (
                  <div className="space-y-3 w-full">
                    {tracks.map((track) => {
                      const subs = syllabusStructure[track.id] || [];
                      if (subs.length === 0) return null;
                      return (
                        <div key={track.id}>
                          <div className="text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">
                            {track.name}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {subs.map((s) => {
                              const isPassed = celebrationTargets?.subjects?.includes(s.subject);
                              const isChecked = selectedItems.includes(s.subject);

                              if (isPassed) {
                                return (
                                  <label
                                    key={s.subject}
                                    className="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none"
                                  >
                                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                                      <input type="checkbox" disabled checked={false} className="form-checkbox h-4 w-4 text-slate-400 rounded cursor-not-allowed" />
                                      <del className="text-[10px] md:text-xs font-bold text-slate-400 truncate">{s.subject}</del>
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50">Passed</span>
                                  </label>
                                );
                              }

                              return (
                                <label
                                  key={s.subject}
                                  className={`flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl border transition-all shadow-sm ${
                                    isChecked
                                      ? 'bg-orange-500/10 border-orange-500/50 text-slate-900 dark:text-white font-bold'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleItemSelection(s.subject)}
                                    className="form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500"
                                  />
                                  <span className="text-[10px] md:text-xs font-bold truncate">{s.subject}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-5">
            <button
              type="submit"
              id="btn-add-pace-goal"
              data-pace-add
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-[10px] md:text-xs uppercase tracking-widest py-3 md:py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_16px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 active:scale-95"
            >
              Create Pace Target
            </button>
          </div>
        </form>

        {/* Goals Grid */}
        <h4
          id="active-timelines-heading"
          className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 scroll-mt-24 md:scroll-mt-32"
        >
          Active Timelines
        </h4>

        <div
          id="pace-goals-container"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
        >
          {paceGoals.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <span className="text-3xl mb-2 grayscale opacity-50">🎯</span>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest text-center">
                No custom pace goals set. Add one above to track specific deadlines.
              </p>
            </div>
          ) : (
            paceGoals.map((goal) => {
              const targeted = resolveTargetedSubjects(goal, allSubjects);
              const stats = calculatePaceStats(goal, targeted, subjectStats);
              return (
                <PaceGoalCard
                  key={goal.id}
                  goal={goal}
                  stats={stats}
                  isActive={goal.id === activeGoalId}
                  onSetActive={setActiveGoalId}
                  onOpenTrend={handleOpenTrend}
                  onOpenDetails={handleOpenDetails}
                  onEdit={handleOpenEdit}
                  onDelete={handleRequestDelete}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {trendModalOpen && (
        <PaceTrendModal
          open={trendModalOpen}
          onOpenChange={setTrendModalOpen}
          goal={trendGoal}
          stats={trendGoalStats}
        />
      )}

      {detailsModalOpen && (
        <GoalDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          goal={detailsGoal}
          stats={detailsGoalStats}
          subjectStats={subjectStats}
        />
      )}

      {editModalOpen && (
        <EditPaceModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          goal={editGoal}
          onSave={handleSaveEdit}
        />
      )}

      {deleteConfirmOpen && (
        <ConfirmDeleteModal
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Pace Target"
          message="Are you sure you want to remove this pace timeline goal? This action cannot be undone."
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};
