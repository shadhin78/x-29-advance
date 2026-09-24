'use client';

/**
 * X-29 Subjects Studio (features/subjects/components/SubjectsStudio.tsx)
 * 
 * Master curriculum execution and syllabus tracking view with 100% parity
 * to legacy pages/Subjects/Subjects.html and Subjects.js.
 * 
 * Features:
 * 1. Global Overall Completion (#completion-stats-section) with Database button and circular Syllabus gauge
 * 2. Expandable Subject Progress (#sidebar-progress-section) with track & program mini bars
 * 3. Filter Tasks by Subject (#subject-navigation-section) with All Tasks, Revise Subject, and pill filters
 * 4. Expandable Subject Cards (#dashboard-content -> #task-list) with 4 pace cards & chapter task checkboxes
 * 5. Modals: SubjectTimeModal, SubjectEditModal, RevisionModal, SingleSubjectTrendModal, GlobalChaptersModal
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { usePaceStore } from '@/stores/usePaceStore';
import { getCompletedChaptersForSubject } from '@/features/tasks/services/taskService';
import { GlobalCompletionHeader } from './GlobalCompletionHeader';
import { SubjectProgressAccordion } from './SubjectProgressAccordion';
import { SubjectFilterNav } from './SubjectFilterNav';
import { SubjectTaskList } from './SubjectTaskList';
import { SubjectTimeModal } from './SubjectTimeModal';
import { SubjectEditModal } from './SubjectEditModal';
import { RevisionModal } from './RevisionModal';
import { SingleSubjectTrendModal } from './SingleSubjectTrendModal';
import { GlobalChaptersModal } from './GlobalChaptersModal';

export const SubjectsStudio: React.FC = () => {
  const {
    tracks,
    syllabusStructure,
    customPrograms,
    passedItems,
    subjectTimeLinks,
    revisionData,
    isInitialized: taxInit,
    initFromStorage: initTax,
    setSubjectTimeLink,
    toggleRevisionSubject,
    toggleRevisionChapter,
    updateSubject,
    deleteSubject,
  } = useTaxonomyStore();

  const {
    tasks,
    isInitialized: taskInit,
    initFromStorage: initTasks,
    toggleChapter,
  } = useTaskStore();

  const {
    paceGoals,
    isInitialized: paceInit,
    initFromStorage: initPace,
  } = usePaceStore();

  // Active filter state: 'All', or program name, or subject name
  const [currentFilter, setCurrentFilter] = useState<string>('All');

  // Modal states
  const [syllabusModalOpen, setSyllabusModalOpen] = useState<boolean>(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState<boolean>(false);
  const [timeModalSubject, setTimeModalSubject] = useState<string | null>(null);
  const [editModalSubject, setEditModalSubject] = useState<{
    subject: string;
    program: string;
    trackId: string;
  } | null>(null);
  const [trendModalSubject, setTrendModalSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!taxInit) initTax();
    if (!taskInit) initTasks();
    if (!paceInit) initPace();
  }, [taxInit, taskInit, paceInit, initTax, initTasks, initPace]);

  // Precompute completed chapters map per subject
  const completedChaptersMap = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    tracks.forEach((trackObj) => {
      const items = syllabusStructure[trackObj.id] || [];
      items.forEach((item) => {
        map[item.subject] = getCompletedChaptersForSubject(tasks, item.subject);
      });
    });
    return map;
  }, [tracks, syllabusStructure, tasks]);

  // Aggregate subject stats for progress bars
  const subjectStats = useMemo(() => {
    const stats: Record<string, { totalChapters: number; completedCount: number }> = {};
    tracks.forEach((trackObj) => {
      const items = syllabusStructure[trackObj.id] || [];
      items.forEach((item) => {
        const isPassed =
          (passedItems.subjects && passedItems.subjects.includes(item.subject)) ||
          (passedItems.programs && passedItems.programs.includes(item.program));
        const completedCount = isPassed
          ? item.chapters
          : completedChaptersMap[item.subject]?.size || 0;

        stats[item.subject] = {
          totalChapters: item.chapters || 0,
          completedCount,
        };
      });
    });
    return stats;
  }, [tracks, syllabusStructure, passedItems, completedChaptersMap]);

  // Global completion statistics
  const { totalChapters, completedChapters, globalPercent } = useMemo(() => {
    let total = 0;
    let completed = 0;

    Object.values(subjectStats).forEach((s) => {
      total += s.totalChapters;
      completed += s.completedCount;
    });

    const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    return {
      totalChapters: total,
      completedChapters: completed,
      globalPercent: percent,
    };
  }, [subjectStats]);

  const activeTrendStats = useMemo(() => {
    if (!trendModalSubject) return { total: 0, completed: 0 };
    const stat = subjectStats[trendModalSubject] || { totalChapters: 0, completedCount: 0 };
    return { total: stat.totalChapters, completed: stat.completedCount };
  }, [trendModalSubject, subjectStats]);

  return (
    <div id="page-subjects" className="space-y-6 md:space-y-8 animate-page-enter w-full pb-12">
      {/* 1. Global Overall Completion (#completion-stats-section) */}
      <GlobalCompletionHeader
        totalChapters={totalChapters}
        completedChapters={completedChapters}
        globalPercent={globalPercent}
        onOpenSyllabusModal={() => setSyllabusModalOpen(true)}
      />

      {/* 2. Expandable Subject Progress (#sidebar-progress-section) */}
      <SubjectProgressAccordion
        tracks={tracks}
        syllabusStructure={syllabusStructure}
        customPrograms={customPrograms}
        subjectStats={subjectStats}
      />

      {/* 3. Filter Tasks by Subject (#subject-navigation-section) */}
      <SubjectFilterNav
        tracks={tracks}
        syllabusStructure={syllabusStructure}
        customPrograms={customPrograms}
        currentFilter={currentFilter}
        onSelectFilter={setCurrentFilter}
        onOpenRevisionModal={() => setRevisionModalOpen(true)}
      />

      {/* 4. Subject Task List (#dashboard-content -> #task-list) */}
      <SubjectTaskList
        tracks={tracks}
        syllabusStructure={syllabusStructure}
        customPrograms={customPrograms}
        passedItems={passedItems}
        subjectTimeLinks={subjectTimeLinks}
        revisionData={revisionData}
        paceGoals={paceGoals}
        completedChaptersMap={completedChaptersMap}
        currentFilter={currentFilter}
        onToggleChapter={toggleChapter}
        onOpenTimeModal={(sub) => setTimeModalSubject(sub)}
        onOpenEditModal={(sub, prog, track) =>
          setEditModalSubject({ subject: sub, program: prog, trackId: track })
        }
        onOpenTrendModal={(sub) => setTrendModalSubject(sub)}
      />

      {/* Modals */}
      {/* Time Goal Setup Modal */}
      <SubjectTimeModal
        subject={timeModalSubject}
        open={!!timeModalSubject}
        onOpenChange={(open) => {
          if (!open) setTimeModalSubject(null);
        }}
        currentLink={timeModalSubject ? subjectTimeLinks[timeModalSubject] : undefined}
        paceGoals={paceGoals}
        onSave={setSubjectTimeLink}
      />

      {/* Subject Edit Modal */}
      <SubjectEditModal
        subject={editModalSubject?.subject ?? null}
        currentProgram={editModalSubject?.program ?? ''}
        currentTrackId={editModalSubject?.trackId ?? ''}
        open={!!editModalSubject}
        onOpenChange={(open) => {
          if (!open) setEditModalSubject(null);
        }}
        tracks={tracks}
        customPrograms={customPrograms}
        onSave={(oldName, newName, trackId, prog) => {
          updateSubject(trackId, oldName, { subject: newName, program: prog });
        }}
        onDelete={(trackId, sub) => {
          deleteSubject(trackId, sub);
        }}
      />

      {/* Revision Modal */}
      <RevisionModal
        open={revisionModalOpen}
        onOpenChange={setRevisionModalOpen}
        tracks={tracks}
        syllabusStructure={syllabusStructure}
        revisionData={revisionData}
        onToggleRevisionSubject={toggleRevisionSubject}
        onToggleRevisionChapter={toggleRevisionChapter}
      />

      {/* Single Subject Trend Modal */}
      <SingleSubjectTrendModal
        subject={trendModalSubject}
        open={!!trendModalSubject}
        onOpenChange={(open) => {
          if (!open) setTrendModalSubject(null);
        }}
        totalChapters={activeTrendStats.total}
        completedChapters={activeTrendStats.completed}
      />

      {/* Global Chapters Breakdown Modal */}
      <GlobalChaptersModal
        open={syllabusModalOpen}
        onOpenChange={setSyllabusModalOpen}
        tracks={tracks}
        syllabusStructure={syllabusStructure}
        completedChaptersMap={completedChaptersMap}
        onSelectSubjectFilter={(sub) => {
          setCurrentFilter(sub);
          setSyllabusModalOpen(false);
        }}
      />
    </div>
  );
};
