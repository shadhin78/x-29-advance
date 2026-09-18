'use client';

/**
 * X-29 Exam Studio Component (features/exam/components/ExamStudio.tsx)
 * 
 * Provides interactive routine management, Set 1 vs Set 2 switching,
 * real-time countdown banner, and modal creation/editing for exam sessions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useExamStore } from '@/stores/useExamStore';
import { ExamCountdownCard } from './ExamCountdownCard';
import { ExamSessionModal } from './ExamSessionModal';
import type { ExamRoutineItem } from '@/types/exam';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';

export const ExamStudio: React.FC = () => {
  const {
    examRoutine,
    activeRoutineSet,
    selectedCountdownExamId,
    initFromStorage,
    addExam,
    updateExam,
    deleteExam,
    toggleExamCompleted,
    setActiveRoutineSet,
    setSelectedCountdownExamId,
  } = useExamStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamRoutineItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // Filter exams by active routine set and search query
  const filteredExams = useMemo(() => {
    return examRoutine
      .filter((ex) => (ex.routineSet || 1) === activeRoutineSet)
      .filter((ex) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          ex.subject.toLowerCase().includes(q) ||
          (ex.code && ex.code.toLowerCase().includes(q)) ||
          (ex.room && ex.room.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());
  }, [examRoutine, activeRoutineSet, searchQuery]);

  // Set-specific statistics
  const stats = useMemo(() => {
    const setExams = examRoutine.filter((ex) => (ex.routineSet || 1) === activeRoutineSet);
    const total = setExams.length;
    const completed = setExams.filter((ex) => ex.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [examRoutine, activeRoutineSet]);

  const handleOpenAddModal = () => {
    setEditingExam(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (exam: ExamRoutineItem) => {
    setEditingExam(exam);
    setModalOpen(true);
  };

  const handleSaveExam = (examData: Omit<ExamRoutineItem, 'id'>, existingId?: string) => {
    if (existingId) {
      updateExam(existingId, examData);
    } else {
      addExam(examData);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Exam Routine Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Exam schedules, seat plans, and timestamp-based countdown engines.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Routine Set Switcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setActiveRoutineSet(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeRoutineSet === 1
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Set 1 (Main)
            </button>
            <button
              onClick={() => setActiveRoutineSet(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeRoutineSet === 2
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Set 2 (Mid/Retake)
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exam</span>
          </button>
        </div>
      </div>

      {/* Countdown Card Widget */}
      <ExamCountdownCard
        exams={examRoutine.filter((ex) => (ex.routineSet || 1) === activeRoutineSet && !ex.completed)}
        selectedExamId={selectedCountdownExamId}
        onSelectExamId={setSelectedCountdownExamId}
      />

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-white">{stats.total}</p>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Scheduled
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Completed
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-rose-400">{stats.pending}</p>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Upcoming
          </span>
        </div>
      </div>

      {/* Filter / Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exam by title, code or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Exam List Table / Card View */}
      {filteredExams.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
          <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-400">No exams found in this routine set</p>
          <p className="text-xs text-slate-500 mt-1">
            Click &quot;Add Exam&quot; to schedule your exams or change search filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                exam.completed
                  ? 'bg-slate-950/40 border-slate-900 opacity-60'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <button
                  onClick={() => toggleExamCompleted(exam.id)}
                  title={exam.completed ? 'Mark as Pending' : 'Mark as Completed'}
                  className="mt-0.5 sm:mt-0 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {exam.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-base font-bold transition-all ${
                        exam.completed ? 'line-through text-slate-500' : 'text-white'
                      }`}
                    >
                      {exam.subject}
                    </h3>
                    {exam.code && (
                      <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {exam.code}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {exam.date}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {exam.startTime || exam.time || '10:00'} - {exam.endTime || '13:00'}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {exam.room || 'TBA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleOpenEditModal(exam)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Edit Exam"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteExam(exam.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Delete Exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit Exam */}
      <ExamSessionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        examToEdit={editingExam}
        onSave={handleSaveExam}
        routineSet={activeRoutineSet}
      />
    </div>
  );
};
