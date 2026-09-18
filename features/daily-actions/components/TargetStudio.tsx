'use client';

/**
 * X-29 Target Studio Component (features/daily-actions/components/TargetStudio.tsx)
 * 
 * Authoritative studio for Monthly Target Setup:
 * - Month navigation
 * - Program & Subject taxonomy picker
 * - Interactive chapter size checklist
 * - Unified target allocation engine execution
 * - Filterable Monthly Targets Database (MTDB)
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTargetStore } from '@/stores/useTargetStore';
import {
  getMonthRangeKey,
  autoSpreadChapters,
  calculateTargetProgress,
} from '@/features/targets/services/targetAllocationEngine';
import type { MonthlyTarget } from '@/types/targets';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export const TargetStudio: React.FC = () => {
  const { tracks, customPrograms, syllabusStructure, initFromStorage: initTaxonomy } =
    useTaxonomyStore();

  const {
    monthlyTargetsDatabase,
    dailyTargetsDatabase,
    selectedMonthRange,
    initFromStorage: initTargets,
    addBatchAllocation,
    deleteMonthlyTarget,
    toggleMonthlyTargetCompleted,
    setSelectedMonthRange,
  } = useTargetStore();

  // Current month date offset (0 = current month, 1 = next month, -1 = last month)
  const [monthOffset, setMonthOffset] = useState(0);

  // Taxonomy Selection
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Chapter Selection & Sizes
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [chapterSizes, setChapterSizes] = useState<Record<string, number>>({});

  // Allocator Mode
  const [allocMode, setAllocMode] = useState<'sequential' | 'even-spread' | 'single-day'>('sequential');
  const [allocStartDate, setAllocStartDate] = useState('');

  useEffect(() => {
    initTaxonomy();
    initTargets();
    setAllocStartDate(new Date().toISOString().slice(0, 10));
  }, [initTaxonomy, initTargets]);

  // Compute active month range string based on offset
  const activeMonthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const activeMonthRangeKey = useMemo(() => {
    return getMonthRangeKey(activeMonthDate);
  }, [activeMonthDate]);

  useEffect(() => {
    setSelectedMonthRange(activeMonthRangeKey);
  }, [activeMonthRangeKey, setSelectedMonthRange]);

  // Auto-set default track
  useEffect(() => {
    if (tracks.length > 0 && !selectedTrack) {
      setSelectedTrack(tracks[0].id);
    }
  }, [tracks, selectedTrack]);

  // Available programs
  const availablePrograms = useMemo(() => {
    if (!selectedTrack) return [];
    return customPrograms[selectedTrack] || [];
  }, [selectedTrack, customPrograms]);

  useEffect(() => {
    if (availablePrograms.length > 0 && !selectedProgram) {
      const first = typeof availablePrograms[0] === 'string' ? availablePrograms[0] : availablePrograms[0].name;
      setSelectedProgram(first);
    }
  }, [availablePrograms, selectedProgram]);

  // Available subjects
  const availableSubjects = useMemo(() => {
    if (!selectedTrack) return [];
    const subs = syllabusStructure[selectedTrack] || [];
    if (!selectedProgram) return subs;
    return subs.filter((s) => s.program === selectedProgram);
  }, [selectedTrack, selectedProgram, syllabusStructure]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(availableSubjects[0].subject);
    }
  }, [availableSubjects, selectedSubject]);

  // Chapters for chosen subject
  const currentSubjectItem = useMemo(() => {
    return availableSubjects.find((s) => s.subject === selectedSubject);
  }, [availableSubjects, selectedSubject]);

  const chapterList = useMemo(() => {
    if (!currentSubjectItem) return [];
    const count = currentSubjectItem.chapters || 10;
    return Array.from({ length: count }, (_, i) => `Ch. ${i + 1}`);
  }, [currentSubjectItem]);

  const toggleChapter = (ch: string) => {
    setSelectedChapters((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
    if (!chapterSizes[ch]) {
      setChapterSizes((prev) => ({ ...prev, [ch]: 10 }));
    }
  };

  const selectAllChapters = () => {
    if (selectedChapters.length === chapterList.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters([...chapterList]);
      const initialSizes: Record<string, number> = {};
      chapterList.forEach((ch) => {
        initialSizes[ch] = chapterSizes[ch] || 10;
      });
      setChapterSizes(initialSizes);
    }
  };

  const setPresetSizeAll = (size: number) => {
    const updated: Record<string, number> = {};
    chapterList.forEach((ch) => {
      updated[ch] = size;
    });
    setChapterSizes(updated);
  };

  // Run Allocation
  const handleExecuteAllocation = () => {
    if (selectedChapters.length === 0) {
      alert('Please select at least one chapter to allocate.');
      return;
    }

    const chaptersToAllocate = selectedChapters.map((ch) => ({
      track: selectedTrack,
      program: selectedProgram,
      subject: selectedSubject,
      chapter: ch,
      size: chapterSizes[ch] || 10,
    }));

    const result = autoSpreadChapters({
      chapters: chaptersToAllocate,
      startDate: allocStartDate,
      daysCount: 30,
      mode: allocMode,
    });

    addBatchAllocation(result);
    setSelectedChapters([]);
    alert(`Successfully allocated ${result.monthlyTargets.length} chapters across ${activeMonthRangeKey}!`);
  };

  // Targets in MTDB for active month
  const activeTargets = useMemo(() => {
    return monthlyTargetsDatabase[activeMonthRangeKey] || [];
  }, [monthlyTargetsDatabase, activeMonthRangeKey]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/daily-actions"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Daily Actions</span>
          </Link>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Monthly Target Setup Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative chapter allocation, bulk spreading, and Monthly Targets Database (MTDB).
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black uppercase text-white px-3 font-mono">
            {activeMonthRangeKey}
          </span>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Studio Setup Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Chapter Checklist & Allocator (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Taxonomy Selector */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">
              1. Select Curriculum Scope
            </h3>

            {/* Track Selector */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Track
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {tracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTrack(t.id);
                      setSelectedProgram('');
                      setSelectedSubject('');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      selectedTrack === t.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Program & Subject Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Program
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => {
                    setSelectedProgram(e.target.value);
                    setSelectedSubject('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {availablePrograms.map((p, idx) => {
                    const name = typeof p === 'string' ? p : p.name;
                    return (
                      <option key={`${name}_${idx}`} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {availableSubjects.map((s) => (
                    <option key={s.subject} value={s.subject}>
                      {s.subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Chapter Checklist with Size Inputs */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                2. Select Chapters & Set Sizes
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllChapters}
                  className="text-[10px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-300"
                >
                  {selectedChapters.length === chapterList.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] text-slate-500 font-bold">Presets:</span>
                {[10, 20, 30].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPresetSizeAll(sz)}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-bold text-slate-300 hover:text-white"
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {chapterList.map((ch) => {
                const checked = selectedChapters.includes(ch);
                const size = chapterSizes[ch] || 10;
                return (
                  <div
                    key={ch}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      checked
                        ? 'bg-blue-950/20 border-blue-800/60 text-white'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <label className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChapter(ch)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold truncate">{ch}</span>
                    </label>

                    {checked && (
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Size:</span>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={size}
                          onChange={(e) =>
                            setChapterSizes((prev) => ({
                              ...prev,
                              [ch]: parseInt(e.target.value, 10) || 1,
                            }))
                          }
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs font-mono font-bold text-white text-center outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Execution & Batch Allocator */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">
              3. Batch Allocation Strategy
            </h3>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Distribution Mode
              </label>
              <select
                value={allocMode}
                onChange={(e) => setAllocMode(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="sequential">Sequential Day Cascade</option>
                <option value="even-spread">Even Spread Across Month</option>
                <option value="single-day">Single Day Bulk Target</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Start Date
              </label>
              <input
                type="date"
                value={allocStartDate}
                onChange={(e) => setAllocStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleExecuteAllocation}
                disabled={selectedChapters.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Spread {selectedChapters.length} Chapters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Targets Database (MTDB) Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              Monthly Targets Database (MTDB)
            </h2>
          </div>
          <span className="text-[10px] font-black bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-slate-400">
            {activeTargets.length} Targets Scheduled
          </span>
        </div>

        {activeTargets.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            <p className="text-xs font-bold text-slate-500">
              No targets allocated for {activeMonthRangeKey}. Select chapters above to populate MTDB.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {activeTargets.map((target) => {
              const allDaily = Object.values(dailyTargetsDatabase).flat();
              const progress = calculateTargetProgress(target, allDaily);

              return (
                <div
                  key={target.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    progress.isCompleted
                      ? 'bg-slate-950/40 border-slate-900 opacity-60'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        toggleMonthlyTargetCompleted(activeMonthRangeKey, target.id)
                      }
                      className="text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                      {progress.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </button>

                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          progress.isCompleted ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {target.chapter}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {target.subject} • Size: {target.totalChapterSize}
                        {target.targetWeek ? ` • ${target.targetWeek}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {progress.percent}%
                    </span>
                    <button
                      onClick={() => deleteMonthlyTarget(activeMonthRangeKey, target.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
