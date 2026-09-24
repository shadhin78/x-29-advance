'use client';

/**
 * X-29 Result Entry Modal (features/outcome/components/ResultEntryModal.tsx)
 * 
 * Accessible dialog for logging or editing exam/semester results:
 * - Program & Date selectors
 * - Evaluation system switcher (CGPA Scale vs Letter Grade Scale)
 * - Overall Program score & Target CGPA
 * - Live estimate calculation from subject scores
 * - Subject-by-subject score inputs
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { SuccessResult, OutcomeProgramGroup } from '@/types/outcome';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import {
  mapCgpaToGrade,
  mapGradeToNumeric,
  validateAndFormatCgpa,
} from '@/features/outcome/services/outcomeEngine';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Award, Calculator } from 'lucide-react';

interface ResultEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (results: Omit<SuccessResult, 'id'>[], isEdit?: boolean, oldProgramName?: string, oldDate?: string) => void;
  editingGroup?: OutcomeProgramGroup | null;
}

const SIMPLE_GRADE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const ResultEntryModal: React.FC<ResultEntryModalProps> = ({
  open,
  onOpenChange,
  onSave,
  editingGroup,
}) => {
  const { tracks, customPrograms, syllabusStructure } = useTaxonomyStore();

  const [selectedProgram, setSelectedProgram] = useState('');
  const [date, setDate] = useState('');
  const [evalType, setEvalType] = useState<'cgpa' | 'grade'>('cgpa');
  const [overallValue, setOverallValue] = useState('');
  const [overallGrade, setOverallGrade] = useState('');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [subjectScores, setSubjectScores] = useState<Record<string, { value: string; grade: string }>>({});
  const [errorMsg, setErrorMsg] = useState('');

  // Collect all unique programs across taxonomy tracks
  const allPrograms = useMemo(() => {
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

  // Subjects belonging to selected program
  const programSubjects = useMemo(() => {
    if (!selectedProgram) return [];
    const list: string[] = [];
    tracks.forEach((t) => {
      const trackSubs = syllabusStructure[t.id] || [];
      trackSubs
        .filter((s) => s.program === selectedProgram)
        .forEach((s) => {
          if (!list.includes(s.subject)) list.push(s.subject);
        });
    });
    return list;
  }, [selectedProgram, tracks, syllabusStructure]);

  useEffect(() => {
    if (open) {
      setErrorMsg('');
      if (editingGroup) {
        setSelectedProgram(editingGroup.program);
        setDate(editingGroup.date || new Date().toISOString().slice(0, 10));
        setEvalType(editingGroup.evaluationType || 'cgpa');
        setOverallValue(editingGroup.computedCgpa || '');
        setOverallGrade(editingGroup.computedGrade || '');
        setTargetCGPA(editingGroup.targetCGPA || '3.80');

        const map: Record<string, { value: string; grade: string }> = {};
        editingGroup.subjects.forEach((s) => {
          if (s.subject) {
            map[s.subject] = {
              value: s.value || '',
              grade: s.grade || '',
            };
          }
        });
        setSubjectScores(map);
      } else {
        if (allPrograms.length > 0 && !selectedProgram) {
          setSelectedProgram(allPrograms[0]);
        }
        setDate(new Date().toISOString().slice(0, 10));
        setOverallValue('');
        setOverallGrade('');
        setTargetCGPA('3.80');
        setSubjectScores({});
      }
    }
  }, [open, editingGroup, allPrograms, selectedProgram]);

  const handleOverallValueChange = (val: string) => {
    setOverallValue(val);
    if (evalType === 'cgpa') {
      const formatted = validateAndFormatCgpa(val);
      if (formatted) {
        setOverallGrade(mapCgpaToGrade(formatted, 'cgpa'));
      }
    } else {
      setOverallGrade(val.toUpperCase());
    }
  };

  const handleSubjectScoreChange = (subject: string, score: string) => {
    setSubjectScores((prev) => {
      const g = evalType === 'cgpa' ? mapCgpaToGrade(score, 'cgpa') : score;
      return {
        ...prev,
        [subject]: { value: score, grade: g },
      };
    });
  };

  const handleEstimateFromSubjects = () => {
    const subs = programSubjects;
    if (subs.length === 0) return;

    let sum = 0;
    let count = 0;

    subs.forEach((s) => {
      const entry = subjectScores[s];
      if (entry) {
        if (evalType === 'grade') {
          if (entry.grade && entry.grade !== 'F') {
            sum += mapGradeToNumeric(entry.grade, 'grade');
            count++;
          }
        } else {
          const num = parseFloat(entry.value);
          if (!isNaN(num) && num > 0) {
            sum += num;
            count++;
          }
        }
      }
    });

    if (count > 0) {
      const avg = sum / count;
      const formatted = avg.toFixed(2);
      setOverallValue(formatted);
      setOverallGrade(mapCgpaToGrade(avg, evalType));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedProgram || !date) {
      setErrorMsg('Please select a program and date.');
      return;
    }

    const hasAnySubjectScore = Object.values(subjectScores).some(
      (s) => (s.value && s.value.trim() !== '') || (s.grade && s.grade.trim() !== '')
    );

    if (!overallValue && !hasAnySubjectScore) {
      setErrorMsg('Please enter an overall score or at least one subject score.');
      return;
    }

    const resultsToSave: Omit<SuccessResult, 'id'>[] = [];

    // 1. Overall Program Result
    const formattedOverall = evalType === 'cgpa' ? validateAndFormatCgpa(overallValue) : overallValue;
    const finalOverallGrade = overallGrade || (formattedOverall ? mapCgpaToGrade(formattedOverall, evalType) : undefined);

    resultsToSave.push({
      type: 'cgpa',
      evaluationType: evalType,
      title: selectedProgram,
      subject: '',
      value: formattedOverall || undefined,
      grade: finalOverallGrade,
      targetCGPA: targetCGPA || undefined,
      targetGrade: targetCGPA ? mapCgpaToGrade(targetCGPA, evalType) : undefined,
      date,
      isEstimated: !overallValue,
    });

    // 2. Individual Subject Results
    programSubjects.forEach((subName) => {
      const entry = subjectScores[subName];
      if (entry && (entry.value || entry.grade)) {
        const val = evalType === 'cgpa' ? validateAndFormatCgpa(entry.value) : entry.value;
        resultsToSave.push({
          type: 'cgpa',
          evaluationType: evalType,
          title: selectedProgram,
          subject: subName,
          value: val || undefined,
          grade: entry.grade || undefined,
          targetCGPA: targetCGPA || undefined,
          targetGrade: targetCGPA ? mapCgpaToGrade(targetCGPA, evalType) : undefined,
          date,
        });
      }
    });

    onSave(
      resultsToSave,
      !!editingGroup,
      editingGroup?.program,
      editingGroup?.date
    );
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl z-50 text-slate-900 dark:text-white focus:outline-none animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <Dialog.Title className="text-base font-black uppercase tracking-wider">
                {editingGroup ? 'Edit Exam / Semester Result' : 'Log Exam / Semester Result'}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {errorMsg && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
            {/* Program & Date Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Program
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {allPrograms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Result Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Evaluation Type Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Evaluation System
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEvalType('cgpa')}
                  className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    evalType === 'cgpa'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  CGPA Scale (0.00 – 4.00)
                </button>
                <button
                  type="button"
                  onClick={() => setEvalType('grade')}
                  className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    evalType === 'grade'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Letter Grade Scale (A, B, C...)
                </button>
              </div>
            </div>

            {/* Overall Score & Target */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Overall Score {overallGrade && `(${overallGrade})`}
                </label>
                <input
                  type="text"
                  placeholder={evalType === 'cgpa' ? 'e.g. 3.85' : 'e.g. A'}
                  value={overallValue}
                  onChange={(e) => handleOverallValueChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Target CGPA
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3.80"
                  value={targetCGPA}
                  onChange={(e) => setTargetCGPA(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Individual Subject Scores */}
            {programSubjects.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Subject Scores (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={handleEstimateFromSubjects}
                    className="text-[10px] font-black uppercase tracking-wider text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Estimate Overall</span>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {programSubjects.map((sub) => {
                    const currentScore = subjectScores[sub]?.value || '';
                    return (
                      <div
                        key={sub}
                        className="flex items-center justify-between gap-3 p-2 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          {sub}
                        </span>
                        {evalType === 'cgpa' ? (
                          <input
                            type="text"
                            placeholder="0.00"
                            value={currentScore}
                            onChange={(e) => handleSubjectScoreChange(sub, e.target.value)}
                            className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white text-center outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          <select
                            value={currentScore}
                            onChange={(e) => handleSubjectScoreChange(sub, e.target.value)}
                            className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-900 dark:text-white text-center outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="">—</option>
                            {SIMPLE_GRADE_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Save Result
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
