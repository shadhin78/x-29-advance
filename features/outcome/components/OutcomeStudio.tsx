'use client';

/**
 * X-29 Outcome Studio Component (features/outcome/components/OutcomeStudio.tsx)
 * 
 * Main page coordinator for Success & Results:
 * - Program CGPA & Exam scorecards matching Outcome.html
 * - Outcome Programs Toggle Bar & Date Sort controls
 * - Target comparison & achievement badges
 * - Pass / Freeze configuration checklist
 * - Milestone celebration criteria & live progress
 * - Authentic 2-page CongratsModal with full-screen canvas confetti
 * - Program progression trend modal
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutcomeStore } from '@/stores/useOutcomeStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import {
  groupAndProcessResults,
  calculateCelebrationProgress,
} from '@/features/outcome/services/outcomeEngine';
import { ResultCard } from './ResultCard';
import { PassFreezeSection } from './PassFreezeSection';
import { CelebrationSection } from './CelebrationSection';
import { ResultEntryModal } from './ResultEntryModal';
import { CelebrationSetupModal } from './CelebrationSetupModal';
import { CongratsModal } from './CongratsModal';
import { ProgramTrendModal } from './ProgramTrendModal';
import type { SuccessResult, CelebrationTargets, OutcomeProgramGroup } from '@/types/outcome';
import { Award, Plus, ArrowUpDown } from 'lucide-react';

export const OutcomeStudio: React.FC = () => {
  const {
    successResults,
    celebrationTargets,
    dateSortOrder,
    selectedProgramFilter,
    initFromStorage,
    addBatchResults,
    deleteProgramGroup,
    setCelebrationTargets,
    toggleDateSortOrder,
    setSelectedProgramFilter,
  } = useOutcomeStore();

  const { tracks, customPrograms, syllabusStructure, passedItems, initFromStorage: initTaxonomy } =
    useTaxonomyStore();

  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OutcomeProgramGroup | null>(null);

  const [celebrationModalOpen, setCelebrationModalOpen] = useState(false);
  const [congratsModalOpen, setCongratsModalOpen] = useState(false);

  const [trendModalOpen, setTrendModalOpen] = useState(false);
  const [trendProgram, setTrendProgram] = useState('');

  useEffect(() => {
    initFromStorage();
    initTaxonomy();
  }, [initFromStorage, initTaxonomy]);

  // Unique list of programs across all tracks
  const programsList = useMemo(() => {
    const list: string[] = [];
    tracks.forEach((t) => {
      const progs = customPrograms[t.id] || [];
      progs.forEach((p) => {
        const name = typeof p === 'string' ? p : p.name;
        if (!list.includes(name)) list.push(name);
      });
    });
    return list;
  }, [tracks, customPrograms]);

  // Flattened all subjects across syllabus structure
  const allSubjects = useMemo(() => {
    const list: { subject: string; program: string }[] = [];
    tracks.forEach((t) => {
      const trackSubs = syllabusStructure[t.id] || [];
      trackSubs.forEach((s) => {
        list.push({ subject: s.subject, program: s.program });
      });
    });
    return list;
  }, [tracks, syllabusStructure]);

  // Process and sort results
  const processedGroups = useMemo(() => {
    let groups = groupAndProcessResults(successResults, allSubjects, customPrograms);

    if (selectedProgramFilter !== 'ALL') {
      groups = groups.filter((g) => g.program === selectedProgramFilter);
    }

    groups.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return dateSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return groups;
  }, [successResults, allSubjects, customPrograms, selectedProgramFilter, dateSortOrder]);

  // Calculate live celebration score
  const celebrationProgress = useMemo(() => {
    return calculateCelebrationProgress(allSubjects, celebrationTargets, passedItems);
  }, [allSubjects, celebrationTargets, passedItems]);

  const handleSaveResults = useCallback(
    (
      resultsToSave: Omit<SuccessResult, 'id'>[],
      isEdit?: boolean,
      oldProgramName?: string,
      oldDate?: string
    ) => {
      if (isEdit && oldProgramName) {
        deleteProgramGroup(oldProgramName, oldDate);
      }
      addBatchResults(resultsToSave);
      setEditingGroup(null);
    },
    [addBatchResults, deleteProgramGroup]
  );

  const handleDeleteGroup = useCallback(
    (programName: string, date: string) => {
      if (window.confirm(`Delete results for ${programName} on ${date}?`)) {
        deleteProgramGroup(programName, date);
      }
    },
    [deleteProgramGroup]
  );

  const handleEditGroup = useCallback((group: OutcomeProgramGroup) => {
    setEditingGroup(group);
    setResultModalOpen(true);
  }, []);

  const handleViewAnalytics = useCallback((programName: string) => {
    setTrendProgram(programName);
    setTrendModalOpen(true);
  }, []);

  const handleSaveCelebrationTargets = useCallback(
    (targets: CelebrationTargets) => {
      setCelebrationTargets(targets);
    },
    [setCelebrationTargets]
  );

  const handlePreviewCelebration = useCallback(() => {
    setCongratsModalOpen(true);
  }, []);

  const activeTrendTarget = useMemo(() => {
    if (!trendProgram) return { targetCGPA: '', targetGrade: '' };
    const grp = processedGroups.find((g) => g.program === trendProgram);
    return {
      targetCGPA: grp?.targetCGPA || '',
      targetGrade: grp?.targetGrade || '',
    };
  }, [trendProgram, processedGroups]);

  return (
    <div id="page-outcome" className="w-full space-y-6 md:space-y-8 animate-page-enter pb-16">
      {/* Success & Results Section */}
      <div
        id="success-results-section"
        className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col scroll-mt-24 md:scroll-mt-32"
      >
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
                Success & Results
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Log Program CGPAs and Major Achievements
              </p>
            </div>
          </div>

          <button
            id="btn-open-result-modal"
            onClick={() => {
              setEditingGroup(null);
              setResultModalOpen(true);
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-black text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Result</span>
          </button>
        </div>

        {/* Outcome Programs Toggle Bar */}
        <div id="outcome-programs-toggle-bar" className="flex flex-wrap items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSelectedProgramFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              selectedProgramFilter === 'ALL'
                ? 'bg-yellow-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            All Programs
          </button>
          {programsList.map((prog) => (
            <button
              key={prog}
              type="button"
              onClick={() => setSelectedProgramFilter(prog)}
              className={`px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedProgramFilter === prog
                  ? 'bg-yellow-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {prog}
            </button>
          ))}
        </div>

        {/* Results Header & Date Sort Controls Bar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Logged Results
            </span>
            <span
              id="outcome-results-count-badge"
              className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              {processedGroups.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="outcome-date-sort-btn"
              onClick={toggleDateSortOrder}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-[10px] md:text-xs font-black uppercase tracking-wider transition-all shadow-2xs active:scale-95 flex items-center gap-2 cursor-pointer group"
              title="Toggle date sort order (Newest / Oldest)"
            >
              <span className="text-slate-400 dark:text-slate-500 group-hover:text-yellow-500 transition-colors">
                Sort:
              </span>
              <span id="outcome-date-sort-text" className="text-slate-800 dark:text-slate-100">
                Date: {dateSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </span>
              <ArrowUpDown
                className={`w-3.5 h-3.5 text-yellow-500 transition-transform duration-200 ${
                  dateSortOrder === 'oldest' ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div
          id="results-container"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
        >
          {processedGroups.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <span className="text-4xl mb-3 grayscale opacity-50 select-none">🌟</span>
              <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest text-center">
                No results logged yet. Add your first achievement!
              </p>
            </div>
          ) : (
            processedGroups.map((grp) => (
              <ResultCard
                key={grp.id}
                group={grp}
                onDeleteGroup={handleDeleteGroup}
                onEdit={handleEditGroup}
                onViewAnalytics={handleViewAnalytics}
              />
            ))
          )}
        </div>
      </div>

      {/* Pass / Freeze Section */}
      <PassFreezeSection />

      {/* Milestone Celebration Criteria Section */}
      <CelebrationSection
        onOpenSetupModal={() => setCelebrationModalOpen(true)}
        onPreviewCelebration={handlePreviewCelebration}
      />

      {/* Result Entry & Edit Modal */}
      <ResultEntryModal
        open={resultModalOpen}
        onOpenChange={setResultModalOpen}
        onSave={handleSaveResults}
        editingGroup={editingGroup}
      />

      {/* Celebration Setup Modal */}
      <CelebrationSetupModal
        open={celebrationModalOpen}
        onOpenChange={setCelebrationModalOpen}
        celebrationTargets={celebrationTargets}
        onSave={handleSaveCelebrationTargets}
      />

      {/* Authentic 2-Page Congratulations Modal with Confetti */}
      <CongratsModal
        open={congratsModalOpen}
        onOpenChange={setCongratsModalOpen}
        successResults={successResults}
        successScore={celebrationProgress.percent}
      />

      {/* Program Progression Trend Modal */}
      <ProgramTrendModal
        open={trendModalOpen}
        onOpenChange={setTrendModalOpen}
        programName={trendProgram}
        results={successResults}
        targetCGPA={activeTrendTarget.targetCGPA}
        targetGrade={activeTrendTarget.targetGrade}
      />
    </div>
  );
};
