'use client';

/**
 * X-29 Outcome Studio Component (features/outcome/components/OutcomeStudio.tsx)
 * 
 * Main page coordinator for Success & Results:
 * - Program CGPA & Exam scorecards
 * - Target comparison & achievement badges
 * - Pass / Freeze configuration checklist
 * - Milestone celebration criteria & live progress
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useOutcomeStore } from '@/stores/useOutcomeStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { groupAndProcessResults } from '@/features/outcome/services/outcomeEngine';
import { ResultCard } from './ResultCard';
import { PassFreezeSection } from './PassFreezeSection';
import { CelebrationSection } from './CelebrationSection';
import { ResultEntryModal } from './ResultEntryModal';
import { CelebrationSetupModal } from './CelebrationSetupModal';
import type { SuccessResult, CelebrationTargets } from '@/types/outcome';
import {
  Award,
  Plus,
  ArrowUpDown,
  Calendar,
  Sparkles,
  Trophy,
} from 'lucide-react';

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

  const { tracks, customPrograms, syllabusStructure, initFromStorage: initTaxonomy } =
    useTaxonomyStore();

  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [celebrationModalOpen, setCelebrationModalOpen] = useState(false);
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);

  useEffect(() => {
    initFromStorage();
    initTaxonomy();
  }, [initFromStorage, initTaxonomy]);

  // Unique list of programs
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

  // Flattened all subjects
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

  const handleSaveResults = (results: Omit<SuccessResult, 'id'>[]) => {
    addBatchResults(results);
  };

  const handleDeleteGroup = (programName: string, date: string) => {
    if (window.confirm(`Delete results for ${programName} on ${date}?`)) {
      deleteProgramGroup(programName, date);
    }
  };

  const handleSaveCelebrationTargets = (targets: CelebrationTargets) => {
    setCelebrationTargets(targets);
  };

  const handlePreviewCelebration = () => {
    setShowCelebrationBanner(true);
    setTimeout(() => {
      setShowCelebrationBanner(false);
    }, 6000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Celebration Preview Toast / Banner */}
      {showCelebrationBanner && (
        <div className="fixed top-20 right-6 z-50 p-5 rounded-3xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 shadow-2xl border border-white/20 animate-in slide-in-from-top-4 flex items-center gap-3 max-w-md">
          <Trophy className="w-8 h-8 text-amber-950 shrink-0" />
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">🎉 Milestone Reached!</h4>
            <p className="text-xs font-bold mt-0.5">
              Congratulations! All core courses required for celebration have been completed.
            </p>
          </div>
        </div>
      )}

      {/* Main Success & Results Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-amber-950/60 text-amber-400 border border-amber-800/60 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Success & Results
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Log Program CGPAs and Major Academic Milestones
              </p>
            </div>
          </div>

          <button
            onClick={() => setResultModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Result</span>
          </button>
        </div>

        {/* Program Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedProgramFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedProgramFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Programs
          </button>
          {programsList.map((prog) => (
            <button
              key={prog}
              onClick={() => setSelectedProgramFilter(prog)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedProgramFilter === prog
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {prog}
            </button>
          ))}
        </div>

        {/* Sort & Count Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Logged Results
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
              {processedGroups.length}
            </span>
          </div>

          <button
            onClick={toggleDateSortOrder}
            className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <span className="text-slate-500">Sort:</span>
            <span>Date: {dateSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>

        {/* Results Scorecards Grid */}
        {processedGroups.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
            <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-black text-slate-400">No Outcome Results Recorded</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click &quot;Add Result&quot; to log your semester GPA, overall program CGPA, or exam
              grades.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {processedGroups.map((grp) => (
              <ResultCard key={grp.id} group={grp} onDeleteGroup={handleDeleteGroup} />
            ))}
          </div>
        )}
      </div>

      {/* Pass / Freeze Section */}
      <PassFreezeSection />

      {/* Milestone Celebration Section */}
      <CelebrationSection
        onOpenSetupModal={() => setCelebrationModalOpen(true)}
        onPreviewCelebration={handlePreviewCelebration}
      />

      {/* Modals */}
      <ResultEntryModal
        open={resultModalOpen}
        onOpenChange={setResultModalOpen}
        onSave={handleSaveResults}
      />

      <CelebrationSetupModal
        open={celebrationModalOpen}
        onOpenChange={setCelebrationModalOpen}
        celebrationTargets={celebrationTargets}
        onSave={handleSaveCelebrationTargets}
      />
    </div>
  );
};
