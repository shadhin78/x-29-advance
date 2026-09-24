'use client';

/**
 * X-29 Authoritative Monthly Target Setup Studio (features/daily-actions/components/TargetStudio.tsx)
 * 
 * 100% Visual and Behavioral Parity with legacy pages/Daily Actions/monthly target setup/monthly target setup.html & .js:
 * 1. Page Navigation & Action Header (Back button, Month selector pill group, Direct Month Picker, Live Metrics Row)
 * 2. Left Column (5 cols): Target Hierarchy (Program Tracks with cards, Syllabus Subjects with cards)
 * 3. Right Column (7 cols): Chapters & Scope Studio (Search, Bulk Size Presets, Bulk Week Assignment, Chapter Rows)
 * 4. Full-Width Row: Daily Target Allocator Studio (Divide 2/3/4/5/7 days, Spread across month, Spread from date, Fraction pills, Custom daily splits)
 * 5. Bottom Action Footer Block (Summary text, Cancel, Add Target with full cascading sync to Monthly, Weekly, and Daily databases)
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTargetStore } from '@/stores/useTargetStore';
import {
  getMonthRangeKey,
  getWeekRangeKey,
  getMonthDatesList,
} from '@/features/targets/services/targetAllocationEngine';
import type { MonthlyTarget, WeeklyTarget, DailyTarget, AllocationResult } from '@/types/targets';

interface DailySplitRow {
  day: string; // 'YYYY-MM-DD'
  size: number;
  fraction?: string; // e.g. '1/2', '1/3'
}

interface ChapterConfig {
  chapter: string;
  size: number;
  week: string;
  dailySplits: DailySplitRow[];
}

export const TargetStudio: React.FC = () => {
  const router = useRouter();

  const { tracks, customPrograms, syllabusStructure, initFromStorage: initTaxonomy } =
    useTaxonomyStore();

  const {
    monthlyTargetsDatabase,
    initFromStorage: initTargets,
    addBatchAllocation,
  } = useTargetStore();

  // Active month date offset (0 = current month)
  const [monthOffset, setMonthOffset] = useState(0);

  // Active target month
  const activeMonthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const activeMonthRangeKey = useMemo(() => {
    return getMonthRangeKey(activeMonthDate);
  }, [activeMonthDate]);

  const monthInputValue = useMemo(() => {
    const y = activeMonthDate.getFullYear();
    const m = String(activeMonthDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [activeMonthDate]);

  // Calendar dates for the active month
  const monthDates = useMemo(() => {
    return getMonthDatesList(activeMonthDate);
  }, [activeMonthDate]);

  // Available weeks in month
  const availableWeeks = useMemo(() => {
    const weeksSet = new Set<string>();
    monthDates.forEach((dStr) => {
      weeksSet.add(getWeekRangeKey(new Date(dStr)));
    });
    return Array.from(weeksSet);
  }, [monthDates]);

  // Selected Program Tracks & Syllabus Subjects
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Selected Chapters state: chapterKey -> ChapterConfig
  // chapterKey: `${subject}:::${chapter}`
  const [selectedChapters, setSelectedChapters] = useState<Record<string, ChapterConfig>>({});

  // Chapter search filter
  const [chapterSearch, setChapterSearch] = useState('');

  // Bulk size & week inputs
  const [bulkSize, setBulkSize] = useState<number>(10);
  const [bulkWeek, setBulkWeek] = useState<string>('');

  // Daily allocation bulk start date
  const [bulkStartDate, setBulkStartDate] = useState<string>('');

  useEffect(() => {
    initTaxonomy();
    initTargets();
    if (monthDates.length > 0) {
      setBulkStartDate(monthDates[0]);
    }
  }, [initTaxonomy, initTargets, monthDates]);

  // All available programs across all tracks
  const allPrograms = useMemo(() => {
    const progs: { trackId: string; trackName: string; name: string }[] = [];
    tracks.forEach((track) => {
      const pList = customPrograms[track.id] || [];
      pList.forEach((p) => {
        const pName = typeof p === 'string' ? p : p.name;
        progs.push({ trackId: track.id, trackName: track.name, name: pName });
      });
    });
    return progs;
  }, [tracks, customPrograms]);

  // Default select first program if none selected
  useEffect(() => {
    if (allPrograms.length > 0 && selectedPrograms.length === 0) {
      setSelectedPrograms([allPrograms[0].name]);
    }
  }, [allPrograms, selectedPrograms]);

  // Available subjects filtered by selected programs
  const availableSubjects = useMemo(() => {
    const subs: { trackId: string; program: string; subject: string; chaptersCount: number }[] = [];
    tracks.forEach((track) => {
      const sList = syllabusStructure[track.id] || [];
      sList.forEach((s) => {
        if (selectedPrograms.length === 0 || selectedPrograms.includes(s.program)) {
          subs.push({
            trackId: track.id,
            program: s.program,
            subject: s.subject,
            chaptersCount: s.chapters || 10,
          });
        }
      });
    });
    return subs;
  }, [tracks, syllabusStructure, selectedPrograms]);

  // Default select first subject if none selected
  useEffect(() => {
    if (availableSubjects.length > 0 && selectedSubjects.length === 0) {
      setSelectedSubjects([availableSubjects[0].subject]);
    }
  }, [availableSubjects, selectedSubjects]);

  // Available chapters from selected subjects
  const availableChapters = useMemo(() => {
    const chapters: {
      key: string;
      subject: string;
      program: string;
      trackId: string;
      chapter: string;
    }[] = [];

    availableSubjects.forEach((sub) => {
      if (selectedSubjects.includes(sub.subject)) {
        for (let i = 1; i <= sub.chaptersCount; i++) {
          const chName = `Ch. ${i}`;
          chapters.push({
            key: `${sub.subject}:::${chName}`,
            subject: sub.subject,
            program: sub.program,
            trackId: sub.trackId,
            chapter: chName,
          });
        }
      }
    });

    return chapters;
  }, [availableSubjects, selectedSubjects]);

  // Filtered chapters for Scope Studio
  const filteredChapters = useMemo(() => {
    if (!chapterSearch.trim()) return availableChapters;
    const q = chapterSearch.toLowerCase();
    return availableChapters.filter(
      (c) => c.chapter.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
    );
  }, [availableChapters, chapterSearch]);

  // Toggle Program Card
  const toggleProgram = (pName: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(pName) ? prev.filter((p) => p !== pName) : [...prev, pName]
    );
  };

  // Toggle Subject Card
  const toggleSubject = (sName: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sName) ? prev.filter((s) => s !== sName) : [...prev, sName]
    );
  };

  // Toggle Chapter Row
  const toggleChapter = (key: string, chapter: string) => {
    setSelectedChapters((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      } else {
        const defaultWeek = availableWeeks[0] || '';
        const defaultDay = monthDates[0] || '';
        return {
          ...prev,
          [key]: {
            chapter,
            size: bulkSize || 10,
            week: defaultWeek,
            dailySplits: [{ day: defaultDay, size: bulkSize || 10, fraction: '1/1' }],
          },
        };
      }
    });
  };

  // Select all / clear chapters
  const toggleAllChapters = (select: boolean) => {
    if (!select) {
      setSelectedChapters({});
    } else {
      const next: Record<string, ChapterConfig> = {};
      const defaultWeek = availableWeeks[0] || '';
      const defaultDay = monthDates[0] || '';
      filteredChapters.forEach((c) => {
        next[c.key] = {
          chapter: c.chapter,
          size: bulkSize || 10,
          week: defaultWeek,
          dailySplits: [{ day: defaultDay, size: bulkSize || 10, fraction: '1/1' }],
        };
      });
      setSelectedChapters(next);
    }
  };

  // Bulk Apply Size
  const applyBulkSize = () => {
    const sz = bulkSize || 10;
    setSelectedChapters((prev) => {
      const next: Record<string, ChapterConfig> = {};
      for (const k in prev) {
        const splitsCount = Math.max(1, prev[k].dailySplits.length);
        const splitPortion = Math.round((sz / splitsCount) * 10) / 10;
        next[k] = {
          ...prev[k],
          size: sz,
          dailySplits: prev[k].dailySplits.map((s) => ({ ...s, size: splitPortion })),
        };
      }
      return next;
    });
  };

  // Bulk Apply Week
  const applyBulkWeek = () => {
    if (!bulkWeek) return;
    setSelectedChapters((prev) => {
      const next: Record<string, ChapterConfig> = {};
      for (const k in prev) {
        next[k] = { ...prev[k], week: bulkWeek };
      }
      return next;
    });
  };

  // Distribute across W1 - W4
  const distributeChaptersWeeks = () => {
    if (availableWeeks.length === 0) return;
    const keys = Object.keys(selectedChapters);
    setSelectedChapters((prev) => {
      const next: Record<string, ChapterConfig> = {};
      keys.forEach((k, idx) => {
        const targetWeek = availableWeeks[idx % availableWeeks.length];
        next[k] = { ...prev[k], week: targetWeek };
      });
      return next;
    });
  };

  // Split chapter across N days
  const splitChapterDays = (key: string, numDays: number) => {
    setSelectedChapters((prev) => {
      const curr = prev[key];
      if (!curr) return prev;

      const totalSize = curr.size || 10;
      const portion = Math.round((totalSize / numDays) * 10) / 10;
      const splits: DailySplitRow[] = [];

      for (let i = 0; i < numDays; i++) {
        const targetDay = monthDates[i % monthDates.length] || '';
        splits.push({
          day: targetDay,
          size: portion,
          fraction: `1/${numDays}`,
        });
      }

      return {
        ...prev,
        [key]: {
          ...curr,
          dailySplits: splits,
        },
      };
    });
  };

  // Split all chapters across N days
  const splitAllChapters = (numDays: number) => {
    const keys = Object.keys(selectedChapters);
    keys.forEach((k) => splitChapterDays(k, numDays));
  };

  // Auto-spread sequentially across month
  const autoSpreadAcrossMonth = () => {
    const keys = Object.keys(selectedChapters);
    if (keys.length === 0 || monthDates.length === 0) return;

    setSelectedChapters((prev) => {
      const next: Record<string, ChapterConfig> = {};
      keys.forEach((k, idx) => {
        const assignedDay = monthDates[idx % monthDates.length];
        const assignedWeek = getWeekRangeKey(new Date(assignedDay));
        next[k] = {
          ...prev[k],
          week: assignedWeek,
          dailySplits: [
            {
              day: assignedDay,
              size: prev[k].size || 10,
              fraction: '1/1',
            },
          ],
        };
      });
      return next;
    });
  };

  // Spread from chosen start date
  const spreadFromStartDate = () => {
    if (!bulkStartDate) return;
    const startIndex = monthDates.indexOf(bulkStartDate);
    if (startIndex === -1) return;

    const availableFromStart = monthDates.slice(startIndex);
    const keys = Object.keys(selectedChapters);

    setSelectedChapters((prev) => {
      const next: Record<string, ChapterConfig> = {};
      keys.forEach((k, idx) => {
        const assignedDay = availableFromStart[idx % availableFromStart.length];
        const assignedWeek = getWeekRangeKey(new Date(assignedDay));
        next[k] = {
          ...prev[k],
          week: assignedWeek,
          dailySplits: [
            {
              day: assignedDay,
              size: prev[k].size || 10,
              fraction: '1/1',
            },
          ],
        };
      });
      return next;
    });
  };

  // Add a split row for chapter
  const addSplitRow = (key: string) => {
    setSelectedChapters((prev) => {
      const curr = prev[key];
      if (!curr) return prev;
      const lastDay = curr.dailySplits[curr.dailySplits.length - 1]?.day || monthDates[0];
      const nextDayIdx = (monthDates.indexOf(lastDay) + 1) % monthDates.length;
      const nextDay = monthDates[nextDayIdx] || monthDates[0];

      return {
        ...prev,
        [key]: {
          ...curr,
          dailySplits: [...curr.dailySplits, { day: nextDay, size: 5, fraction: 'custom' }],
        },
      };
    });
  };

  // Remove a split row for chapter
  const removeSplitRow = (key: string, idx: number) => {
    setSelectedChapters((prev) => {
      const curr = prev[key];
      if (!curr || curr.dailySplits.length <= 1) return prev;
      const filtered = curr.dailySplits.filter((_, i) => i !== idx);
      return {
        ...prev,
        [key]: {
          ...curr,
          dailySplits: filtered,
        },
      };
    });
  };

  // Update specific split row
  const updateSplitRow = (key: string, idx: number, updates: Partial<DailySplitRow>) => {
    setSelectedChapters((prev) => {
      const curr = prev[key];
      if (!curr) return prev;
      const nextSplits = curr.dailySplits.map((s, i) => (i === idx ? { ...s, ...updates } : s));
      return {
        ...prev,
        [key]: {
          ...curr,
          dailySplits: nextSplits,
        },
      };
    });
  };

  // Summary Metrics
  const summarySelectedTargets = Object.keys(selectedChapters).length;
  const summaryTotalPages = Object.values(selectedChapters).reduce((acc, c) => acc + (c.size || 0), 0);
  const summaryScheduledDays = Object.values(selectedChapters).reduce(
    (acc, c) => acc + c.dailySplits.length,
    0
  );

  // Execute Cascading Target Creation
  const handleSaveMonthlyTarget = () => {
    const keys = Object.keys(selectedChapters);
    if (keys.length === 0) {
      alert('Please select at least one chapter to allocate.');
      return;
    }

    const monthlyTargets: MonthlyTarget[] = [];
    const weeklyTargets: WeeklyTarget[] = [];
    const dailyTargets: DailyTarget[] = [];

    keys.forEach((key, kIdx) => {
      const config = selectedChapters[key];
      const [subject, chapter] = key.split(':::');
      const subItem = availableChapters.find((c) => c.key === key);
      const program = subItem?.program || selectedPrograms[0] || 'Academic';
      const trackId = subItem?.trackId || tracks[0]?.id || 'core';

      const monthlyId = `mt_${Date.now()}_${kIdx}`;
      const weeklyId = `wt_${Date.now()}_${kIdx}`;

      // 1. Monthly Target Record
      monthlyTargets.push({
        id: monthlyId,
        track: trackId,
        program,
        subject,
        chapter,
        totalChapterSize: config.size || 10,
        targetWeek: config.week || availableWeeks[0],
        targetMonth: activeMonthRangeKey,
        targetType: 'chapter',
        scope: 'Whole Chapter',
        completed: false,
      });

      // 2. Weekly Target Record
      weeklyTargets.push({
        id: weeklyId,
        monthlyTargetId: monthlyId,
        source: 'monthly',
        track: trackId,
        program,
        subject,
        chapter,
        targetWeek: config.week || availableWeeks[0],
        completed: false,
        size: config.size || 10,
      });

      // 3. Daily Target Records
      config.dailySplits.forEach((split, sIdx) => {
        dailyTargets.push({
          id: `dt_${Date.now()}_${kIdx}_${sIdx}`,
          monthlyTargetId: monthlyId,
          weeklyTargetId: weeklyId,
          track: trackId,
          program,
          subject,
          chapter,
          date: split.day,
          portionSize: split.size,
          completed: false,
        });
      });
    });

    const result: AllocationResult = {
      monthlyTargets,
      weeklyTargets,
      dailyTargets,
    };

    addBatchAllocation(result);
    alert(`Successfully created ${monthlyTargets.length} monthly targets with full weekly and daily cascade!`);
    router.push('/daily-actions');
  };

  return (
    <div
      id="page-monthly-target-setup"
      className="space-y-3.5 sm:space-y-6 md:space-y-8 animate-page-enter w-full pb-12"
    >
      {/* 1. Page Navigation & Action Header */}
      <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-3.5 sm:space-y-5">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 sm:gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-3.5 sm:pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 w-full xl:w-auto">
            {/* Back Button */}
            <Link
              href="/daily-actions"
              data-close-monthly-target-page
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-black text-xs transition-all active:scale-95 border border-slate-200/70 dark:border-slate-600/50 shadow-xs shrink-0 self-stretch sm:self-auto min-h-[38px] sm:min-h-[40px]"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Daily Actions</span>
            </Link>

            <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
              <div className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-indigo-50 to-indigo-100/70 dark:from-indigo-950/60 dark:to-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl sm:rounded-2xl border border-indigo-200/60 dark:border-indigo-800/50 shadow-sm shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2
                    id="mt-page-title"
                    className="text-base sm:text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight truncate"
                  >
                    Monthly Target Setup
                  </h2>
                  <span
                    id="mt-page-mode-badge"
                    className="inline-block text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0"
                  >
                    Target Setup
                  </span>
                </div>
                <p
                  id="mt-page-subtitle"
                  className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5 line-clamp-2 sm:line-clamp-1 leading-snug"
                >
                  Configure program, subject, chapter breakdown, sizes, and weekly/daily target synchronization
                </p>
              </div>
            </div>
          </div>

          {/* Top Month Badge & Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-2 w-full xl:w-auto pt-1 sm:pt-0">
            {/* Pill Group */}
            <div className="flex items-center justify-center space-x-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shadow-xs w-full sm:w-auto shrink-0">
              <button
                type="button"
                id="mt-setup-btn-prev"
                onClick={() => setMonthOffset((o) => o - 1)}
                className="flex-1 sm:flex-none justify-center px-2.5 py-1.5 text-[10px] font-black rounded-xl transition-all text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 flex items-center gap-1 min-h-[34px] cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Prev</span>
              </button>
              <button
                type="button"
                id="mt-setup-btn-current"
                onClick={() => setMonthOffset(0)}
                className={`flex-1 sm:flex-none justify-center px-3 py-1.5 text-[10px] font-black rounded-xl transition-all flex items-center gap-1 min-h-[34px] cursor-pointer ${
                  monthOffset === 0
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <span>Current</span>
              </button>
              <button
                type="button"
                id="mt-setup-btn-next"
                onClick={() => setMonthOffset((o) => o + 1)}
                className="flex-1 sm:flex-none justify-center px-2.5 py-1.5 text-[10px] font-black rounded-xl transition-all text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 flex items-center gap-1 min-h-[34px] cursor-pointer"
              >
                <span>Next</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Direct Month Picker */}
            <label
              htmlFor="mt-setup-month-input"
              className="relative flex items-center justify-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100/70 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-inner cursor-pointer transition-all active:scale-95 w-full sm:w-auto shrink-0 min-h-[34px]"
            >
              <svg className="w-3.5 h-3.5 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span id="mt-page-month-badge" className="truncate pointer-events-none">
                {activeMonthRangeKey}
              </span>
              <input
                type="month"
                id="mt-setup-month-input"
                value={monthInputValue}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m] = e.target.value.split('-').map(Number);
                    const now = new Date();
                    const diff = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
                    setMonthOffset(diff);
                  }
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-auto"
                title="Select Month"
              />
            </label>
          </div>
        </div>

        {/* Live Summary Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="block text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-400 truncate leading-tight">
              Target Month Range
            </span>
            <span id="mt-summary-month-display" className="text-[11px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 truncate block mt-0.5 font-mono">
              {activeMonthRangeKey}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="block text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-400 truncate leading-tight">
              Selected Subjects
            </span>
            <span id="mt-summary-subject-display" className="text-[11px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 truncate block mt-0.5">
              {selectedSubjects.length} Selected
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="block text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-400 truncate leading-tight">
              Selected Targets
            </span>
            <span id="mt-summary-target-count" className="text-[11px] sm:text-xs md:text-sm font-black text-indigo-600 dark:text-indigo-400 block mt-0.5 truncate">
              {summarySelectedTargets} Targets Selected
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="block text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-400 truncate leading-tight">
              Total Page Allocation
            </span>
            <span id="mt-summary-total-size" className="text-[11px] sm:text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 truncate font-mono">
              {summaryTotalPages} Pages / Units
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Studio Row: Target Hierarchy (Left) & Scope Studio (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 items-start">
        {/* Left Column (5 Cols): Target Hierarchy */}
        <div className="lg:col-span-5 flex flex-col min-h-0">
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col lg:h-[780px] space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate">
                    Target Hierarchy
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold truncate">
                    Select program track & syllabus subjects
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1 min-h-0 flex flex-col">
              {/* Program Tracks Section */}
              <div className="flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 shrink-0">
                      <span>Program Tracks</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <span
                      id="mt-progs-count-badge"
                      className="text-[8.5px] sm:text-[9px] font-black text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200/50 dark:border-purple-800/50 shrink-0"
                    >
                      {selectedPrograms.length} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedPrograms(allPrograms.map((p) => p.name))}
                      className="text-[9px] font-black text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-200/50 dark:border-purple-800/50 transition-all active:scale-95 min-h-[26px] cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPrograms([])}
                      className="text-[9px] font-black text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-all active:scale-95 min-h-[26px] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Program Cards */}
                <div
                  id="mt-progs-container"
                  className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 pr-1.5"
                >
                  {allPrograms.map((p) => {
                    const isChecked = selectedPrograms.includes(p.name);
                    return (
                      <div
                        key={`${p.trackId}_${p.name}`}
                        onClick={() => toggleProgram(p.name)}
                        className={`mt-prog-card p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-black shadow-xs'
                            : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="form-checkbox h-4 w-4 text-purple-600 rounded cursor-pointer pointer-events-none"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-black truncate block">{p.name}</span>
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">
                              {p.trackName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Syllabus Subjects Section */}
              <div className="flex flex-col gap-2 flex-1 min-h-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 shrink-0">
                      <span>Syllabus Subjects</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <span
                      id="mt-subjects-count-badge"
                      className="text-[8.5px] sm:text-[9px] font-black text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 shrink-0"
                    >
                      {selectedSubjects.length} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedSubjects(availableSubjects.map((s) => s.subject))}
                      className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50 transition-all active:scale-95 min-h-[26px] cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSubjects([])}
                      className="text-[9px] font-black text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-all active:scale-95 min-h-[26px] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Subject Cards */}
                <div
                  id="mt-subjects-container"
                  className="space-y-2 flex-1 min-h-0 max-h-[350px] overflow-y-auto custom-scrollbar p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 pr-1.5"
                >
                  {availableSubjects.map((s) => {
                    const isChecked = selectedSubjects.includes(s.subject);
                    return (
                      <div
                        key={`${s.program}_${s.subject}`}
                        onClick={() => toggleSubject(s.subject)}
                        className={`mt-subject-card p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-black shadow-xs'
                            : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="form-checkbox h-4 w-4 text-indigo-600 rounded cursor-pointer pointer-events-none"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-black truncate block">{s.subject}</span>
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">
                              {s.program} • {s.chaptersCount} Chapters
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Chapters & Scope Studio */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col lg:h-[780px] space-y-3.5 sm:space-y-4">
            {/* Header */}
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3 sm:pb-4 shrink-0">
              <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate">
                    Chapters & Scope Studio
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold truncate">
                    Select individual chapters with custom page sizes & week binding
                  </p>
                </div>
              </div>

              {/* Selection Action Pills */}
              <div className="flex items-center gap-1.5 shrink-0 self-end xs:self-center">
                <button
                  type="button"
                  onClick={() => toggleAllChapters(true)}
                  className="text-[9.5px] sm:text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 transition-all active:scale-95 min-h-[30px] flex items-center cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => toggleAllChapters(false)}
                  className="text-[9.5px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-750 border border-slate-200/60 dark:border-slate-700 transition-all active:scale-95 min-h-[30px] flex items-center cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search & Bulk Tools */}
            <div className="space-y-2.5 sm:space-y-3 shrink-0">
              {/* Search */}
              <div className="relative">
                <svg
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  id="mt-chapter-search-input"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="Search chapters by keyword..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner min-h-[38px]"
                />
              </div>

              {/* Bulk Tools Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-2.5">
                {/* 1. Bulk Size Helper Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                      Bulk Size:
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={bulkSize}
                      onChange={(e) => setBulkSize(parseInt(e.target.value, 10) || 1)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-bold outline-none w-14 sm:w-16 shadow-sm focus:ring-2 focus:ring-indigo-500 text-center h-8"
                    />
                    <div className="flex items-center gap-1">
                      {[10, 20, 30, 50].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setBulkSize(sz)}
                          className="px-1.5 py-1 h-8 min-w-[28px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded text-[9.5px] font-bold border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center justify-center cursor-pointer"
                        >
                          +{sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={applyBulkSize}
                    className="w-full sm:w-auto h-8 px-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all active:scale-95 border border-indigo-200/50 dark:border-indigo-700/50 shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    Apply Size
                  </button>
                </div>

                {/* 2. Bulk Weekly Assignment Tool */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 bg-indigo-50/50 dark:bg-indigo-950/25 rounded-xl sm:rounded-2xl border border-indigo-200/60 dark:border-indigo-800/50">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 w-full">
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 shrink-0">
                      📅 Week:
                    </span>
                    <select
                      value={bulkWeek}
                      onChange={(e) => setBulkWeek(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/60 rounded-lg px-2 py-1 text-[11px] text-slate-900 dark:text-white font-bold outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 flex-1 min-w-0 truncate h-8"
                    >
                      <option value="">-- Choose Week --</option>
                      {availableWeeks.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={applyBulkWeek}
                      className="flex-1 sm:flex-none h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm flex items-center justify-center cursor-pointer"
                    >
                      Apply Week
                    </button>
                    <button
                      type="button"
                      onClick={distributeChaptersWeeks}
                      className="flex-1 sm:flex-none h-8 px-2.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg text-[9px] font-bold border border-indigo-200 dark:border-indigo-700 transition-all active:scale-95 shadow-xs flex items-center justify-center whitespace-nowrap cursor-pointer"
                    >
                      ⚡ Distribute W1-W4
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters Container */}
            <div
              id="mt-chapters-container"
              className="flex-1 min-h-0 max-h-[460px] overflow-y-auto space-y-2 p-2 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 custom-scrollbar"
            >
              {filteredChapters.map((ch) => {
                const isSelected = !!selectedChapters[ch.key];
                const config = selectedChapters[ch.key];

                return (
                  <div
                    key={ch.key}
                    className={`mt-chapter-row p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                      isSelected
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <label className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleChapter(ch.key, ch.chapter)}
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block">
                          {ch.chapter}: {ch.subject}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">
                          {ch.program}
                        </span>
                      </div>
                    </label>

                    {isSelected && config && (
                      <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400">Size:</span>
                          <input
                            type="number"
                            min="1"
                            value={config.size}
                            onChange={(e) => {
                              const newSize = parseInt(e.target.value, 10) || 1;
                              setSelectedChapters((prev) => ({
                                ...prev,
                                [ch.key]: {
                                  ...prev[ch.key],
                                  size: newSize,
                                  dailySplits: prev[ch.key].dailySplits.map((s) => ({
                                    ...s,
                                    size: Math.round((newSize / prev[ch.key].dailySplits.length) * 10) / 10,
                                  })),
                                },
                              }));
                            }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center w-14 outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400">Week:</span>
                          <select
                            value={config.week}
                            onChange={(e) => {
                              const newWeek = e.target.value;
                              setSelectedChapters((prev) => ({
                                ...prev,
                                [ch.key]: { ...prev[ch.key], week: newWeek },
                              }));
                            }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold outline-none max-w-[130px] truncate"
                          >
                            {availableWeeks.map((w) => (
                              <option key={w} value={w}>
                                {w}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Full-Width Row: Daily Target Allocator Studio */}
      <div
        id="mt-daily-allocation-card"
        className="bg-white dark:bg-slate-800 p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-3.5 sm:space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate">
                Daily Target Allocator
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold truncate">
                Fraction & multi-day scheduling from chapter size
              </p>
            </div>
          </div>
          <span
            id="mt-daily-allocation-count-badge"
            className="px-2 py-0.5 rounded text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0 ml-2"
          >
            {summaryScheduledDays} Scheduled
          </span>
        </div>

        {/* Toolbar */}
        <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                ⚡ Quick Daily Actions:
              </span>
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <span className="text-[8.5px] font-black uppercase px-1.5 text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Divide All:
                </span>
                {[2, 3, 4, 5, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => splitAllChapters(num)}
                    className="px-2 py-1 rounded-md text-[9px] font-black bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200/60 dark:border-slate-600/60 transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    ⚡ {num} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={autoSpreadAcrossMonth}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-[9px] sm:text-[9.5px] font-bold border border-emerald-200/60 dark:border-emerald-800/60 transition-all active:scale-95 shadow-xs h-8 flex items-center cursor-pointer"
              >
                ⚡ Spread Across Month
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedChapters((prev) => {
                    const next: Record<string, ChapterConfig> = {};
                    for (const k in prev) {
                      next[k] = { ...prev[k], dailySplits: [] };
                    }
                    return next;
                  });
                }}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-[9px] sm:text-[9.5px] font-bold border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-xs h-8 flex items-center cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Sequential Spread toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full">
            <div className="relative flex-1 min-w-0">
              <select
                value={bulkStartDate}
                onChange={(e) => setBulkStartDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-white font-bold outline-none shadow-sm focus:ring-2 focus:ring-emerald-500 w-full truncate h-9"
              >
                <option value="">-- Choose Start Date --</option>
                {monthDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={spreadFromStartDate}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm shrink-0 h-9 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Spread from Date</span>
            </button>
          </div>
        </div>

        {/* Chapters Daily Allocations Dynamic Container */}
        <div
          id="mt-daily-allocations-container"
          className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-3.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1"
        >
          {Object.keys(selectedChapters).length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              No chapters selected. Select chapters from the Scope Studio above to configure daily allocations.
            </div>
          ) : (
            Object.keys(selectedChapters).map((key) => {
              const config = selectedChapters[key];
              const [subject, chapter] = key.split(':::');

              return (
                <div
                  key={key}
                  className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                        {chapter}: {subject}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        Total Size: {config.size} Units
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => splitChapterDays(key, 2)}
                        className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[8.5px] font-black cursor-pointer"
                      >
                        1/2
                      </button>
                      <button
                        type="button"
                        onClick={() => splitChapterDays(key, 3)}
                        className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[8.5px] font-black cursor-pointer"
                      >
                        1/3
                      </button>
                      <button
                        type="button"
                        onClick={() => addSplitRow(key)}
                        className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[8.5px] font-black hover:bg-slate-300 cursor-pointer"
                      >
                        + Add Day
                      </button>
                    </div>
                  </div>

                  {/* Daily Splits Rows */}
                  <div className="space-y-2">
                    {config.dailySplits.map((split, sIdx) => (
                      <div
                        key={`${split.day}_${sIdx}`}
                        className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <select
                            value={split.day}
                            onChange={(e) => updateSplitRow(key, sIdx, { day: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none flex-1 truncate"
                          >
                            {monthDates.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[8.5px] uppercase font-bold text-slate-400">Size:</span>
                            <input
                              type="number"
                              min="1"
                              value={split.size}
                              onChange={(e) =>
                                updateSplitRow(key, sIdx, {
                                  size: parseFloat(e.target.value) || 1,
                                })
                              }
                              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center w-14 outline-none"
                            />
                          </div>
                        </div>

                        {config.dailySplits.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSplitRow(key, sIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title="Remove Day"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Bottom Action Footer Block */}
      <div
        id="mt-bottom-action-block"
        className="bg-white dark:bg-slate-800 p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 transition-all"
      >
        <div
          id="mt-bottom-summary-text"
          className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center sm:text-left w-full sm:w-auto truncate"
        >
          {summarySelectedTargets === 0
            ? 'Ready to configure monthly target.'
            : `${summarySelectedTargets} chapters selected (${summaryTotalPages} pages, ${summaryScheduledDays} day splits). Ready to cascade!`}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
          <Link
            href="/daily-actions"
            data-close-monthly-target-page
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 active:scale-95 transition-all shadow-xs text-center min-h-[42px] flex items-center justify-center cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="button"
            id="mt-btn-save-bottom"
            onClick={handleSaveMonthlyTarget}
            disabled={summarySelectedTargets === 0}
            className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 text-center min-h-[42px] cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>Add Target</span>
          </button>
        </div>
      </div>
    </div>
  );
};
