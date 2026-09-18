'use client';

/**
 * X-29 Subjects Studio (features/subjects/components/SubjectsStudio.tsx)
 * 
 * Master subjects studio view with curriculum taxonomy browsing,
 * chapter completion tracking, and search filtering.
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { NormalizedSubject } from '@/types/taxonomy';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { calculateSubjectProgress } from '@/features/tasks/services/taskService';
import { SubjectCard } from './SubjectCard';
import { ChapterChecklistModal } from './ChapterChecklistModal';
import { BookOpen, Search, CheckCircle2, Award } from 'lucide-react';

export const SubjectsStudio: React.FC = () => {
  const { tracks, isInitialized: taxInit, initFromStorage: initTax, getNormalizedSubjects } = useTaxonomyStore();
  const { tasks, isInitialized: taskInit, initFromStorage: initTasks } = useTaskStore();

  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubjectForModal, setActiveSubjectForModal] = useState<NormalizedSubject | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!taxInit) initTax();
    if (!taskInit) initTasks();
  }, [taxInit, taskInit, initTax, initTasks]);

  const allSubjects = useMemo(() => {
    return getNormalizedSubjects();
  }, [getNormalizedSubjects]);

  // Filter subjects by track and search
  const filteredSubjects = useMemo(() => {
    return allSubjects.filter((s) => {
      const matchTrack = selectedTrack === 'all' || s.trackId === selectedTrack;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.program.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTrack && matchSearch;
    });
  }, [allSubjects, selectedTrack, searchQuery]);

  // Compute aggregate stats
  const overallStats = useMemo(() => {
    let totalChapters = 0;
    let completedChapters = 0;
    let completedSubjectsCount = 0;

    allSubjects.forEach((s) => {
      totalChapters += s.chaptersCount;
      const p = calculateSubjectProgress(tasks, s.name, s.chaptersCount);
      completedChapters += p.completedCount;
      if (p.status === 'completed') completedSubjectsCount++;
    });

    const percentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    return {
      totalSubjects: allSubjects.length,
      completedSubjectsCount,
      totalChapters,
      completedChapters,
      percentage,
    };
  }, [allSubjects, tasks]);

  const handleOpenChecklist = (subject: NormalizedSubject) => {
    setActiveSubjectForModal(subject);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-page-enter">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Total Subjects
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono">
              {overallStats.totalSubjects}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Total Chapters
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono">
              {overallStats.totalChapters}
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Completed Chapters
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {overallStats.completedChapters}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Syllabus Coverage
            </span>
            <p className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
              {overallStats.percentage}%
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Track Segmented Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTrack('all')}
            className={`px-3 sm:px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
              selectedTrack === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            All Tracks
          </button>
          {tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTrack(t.id)}
              className={`px-3 sm:px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                selectedTrack === t.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none h-[42px]"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-wider border border-dashed border-slate-800 rounded-3xl">
          No subjects found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredSubjects.map((subject) => {
            const progress = calculateSubjectProgress(tasks, subject.name, subject.chaptersCount);
            return (
              <SubjectCard
                key={subject.id}
                subject={subject}
                progress={progress}
                onOpenChecklist={handleOpenChecklist}
              />
            );
          })}
        </div>
      )}

      {/* Chapter Checklist Modal */}
      <ChapterChecklistModal
        subject={activeSubjectForModal}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};
