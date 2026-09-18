'use client';

/**
 * X-29 Pace Studio Component (features/pace/components/PaceStudio.tsx)
 * 
 * Main page coordinator for Pace Management:
 * - Velocity & finish forecast analytics banner
 * - Active timeline selection
 * - Custom bundles and timeline goal cards
 * - Add/Edit Pace Target dialog
 */

import React, { useState, useEffect, useMemo } from 'react';
import { usePaceStore } from '@/stores/usePaceStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import {
  resolveTargetedSubjects,
  calculatePaceStats,
} from '@/features/pace/services/paceEngine';
import { PaceStatsBanner } from './PaceStatsBanner';
import { PaceGoalCard } from './PaceGoalCard';
import { AddPaceGoalModal } from './AddPaceGoalModal';
import type { PaceGoal } from '@/types/pace';
import { Gauge, Plus, Target, Flame } from 'lucide-react';

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

  const { tracks, syllabusStructure, initFromStorage: initTaxonomy } = useTaxonomyStore();
  const { tasks, initFromStorage: initTasks } = useTaskStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PaceGoal | null>(null);

  useEffect(() => {
    initPace();
    initTaxonomy();
    initTasks();
  }, [initPace, initTaxonomy, initTasks]);

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

  // Active Goal & Stats
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

  const handleOpenAddGoal = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleOpenEditGoal = (goal: PaceGoal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Delete this pace timeline goal?')) {
      deleteGoal(id);
    }
  };

  const handleSaveGoal = (goalData: Omit<PaceGoal, 'id'>, existingId?: string) => {
    if (existingId) {
      updateGoal(existingId, goalData);
    } else {
      addGoal(goalData);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Velocity Banner */}
      <PaceStatsBanner stats={activeStats} activeGoal={activeGoal} />

      {/* Main Section: Pace Management */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-orange-950/60 text-orange-400 border border-orange-800/60 rounded-2xl">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Pace Management
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Bundle subjects or programs together to create specific timeline goals
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddGoal}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Timeline Target</span>
          </button>
        </div>

        {/* Timelines Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Active Timelines ({paceGoals.length})
          </h3>

          {paceGoals.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
              <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-black text-slate-400">No Custom Timelines Set</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create a timeline target to track required vs actual pace across your subjects.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {paceGoals.map((goal) => {
                const targeted = resolveTargetedSubjects(goal, allSubjects);
                const stats = calculatePaceStats(goal, targeted, subjectStats);
                return (
                  <PaceGoalCard
                    key={goal.id}
                    goal={goal}
                    stats={stats}
                    isActive={goal.id === activeGoalId}
                    onSetActive={setActiveGoalId}
                    onEdit={handleOpenEditGoal}
                    onDelete={handleDeleteGoal}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Goal Modal */}
      <AddPaceGoalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        goalToEdit={editingGoal}
        onSave={handleSaveGoal}
      />
    </div>
  );
};
