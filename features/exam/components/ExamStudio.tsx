'use client';

/**
 * X-29 Exam Studio Component (features/exam/components/ExamStudio.tsx)
 * 
 * Top-level view for /exam route:
 * - Live Hero Countdown Banner (with custom subject Pin selector)
 * - Session-based Exam Routine Timetable with Search and All/Upcoming/Completed filters
 * - Accessible Radix Dialogs for Session and Exam Item CRUD
 * - Full parity with legacy pages/Exam Routine/Exam Routine.html and examRoutine.js
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useExamStore } from '@/stores/useExamStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { ExamHeroCountdown } from './ExamHeroCountdown';
import { ExamRoutineSection } from './ExamRoutineSection';
import { SessionModal } from './SessionModal';
import { SubjectExamModal } from './SubjectExamModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { ExamRoutineItem, ExamSession } from '@/types/exam';

export const ExamStudio: React.FC = () => {
  const {
    examSessions,
    examRoutine,
    selectedCountdownExamId,
    initFromStorage: initExamStorage,
    addSession,
    updateSession,
    deleteSession,
    addExam,
    updateExam,
    deleteExam,
    toggleExamStatus,
    setSelectedCountdownExamId,
  } = useExamStore();

  const { initFromStorage: initTaxonomyStorage } = useTaxonomyStore();

  // Modals state
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<ExamSession | null>(null);

  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<ExamRoutineItem | null>(null);
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    initExamStorage();
    initTaxonomyStorage();
  }, [initExamStorage, initTaxonomyStorage]);

  // Session handlers
  const handleOpenAddSession = useCallback(() => {
    setSessionToEdit(null);
    setSessionModalOpen(true);
  }, []);

  const handleOpenEditSession = useCallback((session: ExamSession) => {
    setSessionToEdit(session);
    setSessionModalOpen(true);
  }, []);

  const handleDeleteSession = useCallback(
    (session: ExamSession) => {
      const name = session.name
        ? `${session.program} - ${session.name}`
        : session.program;
      setDeleteModalConfig({
        title: 'Delete Exam Session',
        message: `Are you sure you want to delete "${name}"? All associated subject exams will also be deleted.`,
        onConfirm: () => deleteSession(session.id),
      });
      setDeleteModalOpen(true);
    },
    [deleteSession]
  );

  const handleSaveSession = useCallback(
    (sessionData: Omit<ExamSession, 'id'>, id?: string) => {
      if (id) {
        updateSession(id, sessionData);
      } else {
        addSession(sessionData);
      }
    },
    [updateSession, addSession]
  );

  // Exam handlers
  const handleOpenAddExam = useCallback((sessionId: string) => {
    setExamToEdit(null);
    setTargetSessionId(sessionId);
    setExamModalOpen(true);
  }, []);

  const handleOpenEditExam = useCallback((exam: ExamRoutineItem) => {
    setExamToEdit(exam);
    setTargetSessionId(exam.sessionId || null);
    setExamModalOpen(true);
  }, []);

  const handleDeleteExam = useCallback(
    (exam: ExamRoutineItem) => {
      setDeleteModalConfig({
        title: 'Delete Subject Exam',
        message: `Are you sure you want to delete "${exam.subject}"? This action cannot be undone.`,
        onConfirm: () => deleteExam(exam.id),
      });
      setDeleteModalOpen(true);
    },
    [deleteExam]
  );

  const handleSaveExam = useCallback(
    (examData: Omit<ExamRoutineItem, 'id'>, id?: string) => {
      if (id) {
        updateExam(id, examData);
      } else {
        addExam(examData);
      }
    },
    [updateExam, addExam]
  );

  return (
    <div
      id="page-exam"
      className="space-y-6 max-w-7xl mx-auto pb-12 animate-page-enter w-full min-w-0"
    >
      {/* Top Hero Banner: Next Upcoming Exam Countdown */}
      <ExamHeroCountdown
        exams={examRoutine}
        sessions={examSessions}
        selectedExamId={selectedCountdownExamId}
        onSelectExamId={setSelectedCountdownExamId}
      />

      {/* Main Routine Timetable Section */}
      <ExamRoutineSection
        sessions={examSessions}
        exams={examRoutine}
        onOpenAddSession={handleOpenAddSession}
        onOpenEditSession={handleOpenEditSession}
        onDeleteSession={handleDeleteSession}
        onOpenAddExam={handleOpenAddExam}
        onOpenEditExam={handleOpenEditExam}
        onDeleteExam={handleDeleteExam}
        onToggleExamStatus={toggleExamStatus}
      />

      {/* Add / Edit Session Modal */}
      <SessionModal
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        sessionToEdit={sessionToEdit}
        onSave={handleSaveSession}
      />

      {/* Add / Edit Exam Modal */}
      <SubjectExamModal
        open={examModalOpen}
        onOpenChange={setExamModalOpen}
        examToEdit={examToEdit}
        targetSessionId={targetSessionId}
        sessions={examSessions}
        onSave={handleSaveExam}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={deleteModalConfig.title}
        message={deleteModalConfig.message}
        onConfirm={deleteModalConfig.onConfirm}
      />
    </div>
  );
};
