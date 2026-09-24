'use client';

/**
 * X-29 Celebration Section Component (features/outcome/components/CelebrationSection.tsx)
 * 
 * Milestone celebration criteria setup and live progress indicator.
 * Direct visual & functional parity with Outcome.html lines 134-172.
 */

import React, { useState, useMemo } from 'react';
import { useOutcomeStore } from '@/stores/useOutcomeStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { calculateCelebrationProgress } from '@/features/outcome/services/outcomeEngine';
import { Award, Sparkles, Settings, RotateCcw, ChevronDown } from 'lucide-react';

interface CelebrationSectionProps {
  onOpenSetupModal: () => void;
  onPreviewCelebration: () => void;
}

export const CelebrationSection: React.FC<CelebrationSectionProps> = ({
  onOpenSetupModal,
  onPreviewCelebration,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { celebrationTargets, setCelebrationTargets } = useOutcomeStore();
  const { tracks, customPrograms, syllabusStructure, passedItems } = useTaxonomyStore();

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

  const progress = useMemo(() => {
    return calculateCelebrationProgress(allSubjects, celebrationTargets, passedItems);
  }, [allSubjects, celebrationTargets, passedItems]);

  const handleResetDefault = () => {
    if (window.confirm('Reset celebration criteria to default (all courses)?')) {
      setCelebrationTargets({ programs: [], subjects: [] });
    }
  };

  return (
    <div
      id="outcome-celebration-section"
      className="mt-6 md:mt-8 bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col scroll-mt-24 md:scroll-mt-32 overflow-hidden transition-all"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full cursor-pointer p-5 md:p-8 outline-none select-none flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/80 transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
                Milestone Celebration Criteria
              </h3>
              <span className="text-[9px] px-2 py-0.5 font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 rounded-md">
                Core Targets
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Click to configure core courses required for milestone celebration
            </p>
          </div>
        </div>

        <div
          className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 transition-all duration-300 shrink-0 border border-slate-200/50 dark:border-slate-600/30 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {isOpen && (
        <div className="p-5 md:p-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Define which essential programs and subjects must be passed to unlock your completion
              celebration. Elective or non-core courses won&apos;t block your celebration.
            </p>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={onOpenSetupModal}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Setup Criteria</span>
              </button>

              <button
                type="button"
                onClick={onPreviewCelebration}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preview Celebration</span>
              </button>

              {progress.isCustom && (
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-slate-600 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 inline mr-1" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Live Progress Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 p-5 rounded-2xl border border-amber-500/20 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {progress.isCustom ? '🎯 Custom Criteria' : '⚙️ Default: 100% All'}
                </span>
                <span className="text-sm font-black text-slate-800 dark:text-white">
                  {progress.passedCore} of {progress.totalCore} Core Courses Passed (
                  {progress.percent}%)
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-300 dark:border-slate-800">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {progress.isCelebrated
                ? '🎉 Congratulations! All core celebration requirements have been fulfilled!'
                : progress.isCustom
                ? 'Custom celebration criteria active. Continue passing the assigned core courses.'
                : 'Currently set to default. Click "Setup Criteria" to select specific core courses.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
