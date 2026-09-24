'use client';

/**
 * X-29 Master Configuration Studio Component (features/config/components/MasterConfigStudio.tsx)
 * 
 * 100% Visual and Functional Parity with Legacy Master Config:
 * - 6 Canonical Tabs: Add Chapter, Add Subject, Add Program, Manage Data, Set Priority, Manage Tracks
 * - Dynamic Priority Reordering Engine: Tracks, Programs, Subjects, Daily Actions (arrows + priority 1..N dropdowns)
 * - Universal Rename & Cascade Deletion: Subject, Program, Daily Action
 * - Dashboard Header Configuration (Top Tag, Main Title, Subtitle)
 * - Danger Zone Clean Slate Reset
 * - Track Management with Edit Modal and Cascade Deletion Safety
 * - JSON Backup & Restore Tools (Export and Import)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import type { Track, Program, SyllabusItem } from '@/types/taxonomy';
import type { DailyHabit } from '@/types/habits';
import {
  reorderListWithPriority,
  changePriorityInList,
  createBackupPayload,
  validateBackupPayload,
} from '@/features/config/services/configService';
import {
  Settings,
  Plus,
  BookOpen,
  FolderPlus,
  Edit2,
  Trash2,
  ListPlus,
  Layers,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  X,
} from 'lucide-react';

export type ConfigTab = 'chapter' | 'subject' | 'program' | 'manage' | 'priority' | 'track';

const TRACK_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#a855f7', '#f97316'];
const PROG_COLORS = ['#7c3aed', '#6366f1', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#0284c7'];

export const MasterConfigStudio: React.FC = () => {
  const {
    tracks,
    customPrograms,
    syllabusStructure,
    dashboardConfig,
    passedItems,
    initFromStorage: initTaxonomy,
    addTrack,
    updateTrack,
    deleteTrackCascade,
    addProgram,
    renameProgram,
    deleteProgramCascade,
    addSubject,
    updateSubject,
    deleteSubject,
    addChapter,
    reorderTracks,
    reorderAllPrograms,
    reorderAllSubjects,
    setDashboardHeaderConfig,
    resetWorkspaceToCleanSlate,
    importFullTaxonomyState,
  } = useTaxonomyStore();

  const {
    habits,
    initFromStorage: initHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    resetHabitsToCleanSlate,
    importFullHabitsState,
  } = useDailyActionStore();

  const [activeTab, setActiveTab] = useState<ConfigTab>('chapter');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 1. Add Chapter Form State
  const [chTrack, setChTrack] = useState('');
  const [chProgram, setChProgram] = useState('');
  const [chSubject, setChSubject] = useState('');
  const [chNum, setChNum] = useState('');
  const [chTitle, setChTitle] = useState('');

  // 2. Add Subject Form State
  const [subTrack, setSubTrack] = useState('');
  const [subProgram, setSubProgram] = useState('');
  const [subName, setSubName] = useState('');
  const [subBulk, setSubBulk] = useState(false);
  const [subBulkCount, setSubBulkCount] = useState('10');

  // 3. Add Program Form State
  const [progTrack, setProgTrack] = useState('');
  const [progName, setProgName] = useState('');

  // 4. Manage Data Form State
  const [manageType, setManageType] = useState<'subject' | 'program' | 'action'>('subject');
  const [manageTrack, setManageTrack] = useState('');
  const [manageProgramFilter, setManageProgramFilter] = useState('');
  const [manageTarget, setManageTarget] = useState('');
  const [manageNewName, setManageNewName] = useState('');

  // Header Config State
  const [headerTag, setHeaderTag] = useState('');
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerSub, setHeaderSub] = useState('');

  // 5. Manage Track Form State
  const [newTrackId, setNewTrackId] = useState('');
  const [newTrackName, setNewTrackName] = useState('');
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTrackModalName, setEditTrackModalName] = useState('');

  // Priority Local Editing State (for smooth UI manipulation before saving)
  const [priorityTracks, setPriorityTracks] = useState<Track[]>([]);
  const [priorityPrograms, setPriorityPrograms] = useState<Array<{ trackId: string; trackName: string; prog: Program }>>([]);
  const [prioritySubjects, setPrioritySubjects] = useState<SyllabusItem[]>([]);
  const [priorityActions, setPriorityActions] = useState<DailyHabit[]>([]);

  // Clean Slate Confirmation Modal
  const [showResetModal, setShowResetModal] = useState(false);

  // File Input Ref for JSON Restore
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize stores
  useEffect(() => {
    initTaxonomy();
    initHabits();
  }, [initTaxonomy, initHabits]);

  // Sync dashboardConfig values into header inputs
  useEffect(() => {
    if (dashboardConfig) {
      setHeaderTag(dashboardConfig.topTag || '');
      setHeaderTitle(dashboardConfig.mainTitle || '');
      setHeaderSub(dashboardConfig.subTitle || '');
    }
  }, [dashboardConfig]);

  // Set default tracks in selectors
  useEffect(() => {
    if (tracks.length > 0) {
      if (!chTrack || !tracks.some((t) => t.id === chTrack)) setChTrack(tracks[0].id);
      if (!subTrack || !tracks.some((t) => t.id === subTrack)) setSubTrack(tracks[0].id);
      if (!progTrack || !tracks.some((t) => t.id === progTrack)) setProgTrack(tracks[0].id);
      if (!manageTrack || !tracks.some((t) => t.id === manageTrack)) setManageTrack(tracks[0].id);
    }
  }, [tracks, chTrack, subTrack, progTrack, manageTrack]);

  // Programs under chTrack
  const chPrograms = useMemo(() => {
    if (!chTrack) return [];
    return customPrograms[chTrack] || [];
  }, [chTrack, customPrograms]);

  // Subjects under chTrack and chProgram
  const chSubjects = useMemo(() => {
    if (!chTrack) return [];
    const subs = syllabusStructure[chTrack] || [];
    if (!chProgram) return subs;
    return subs.filter((s) => s.program === chProgram);
  }, [chTrack, chProgram, syllabusStructure]);

  // Set default chProgram
  useEffect(() => {
    if (chPrograms.length > 0 && (!chProgram || !chPrograms.some((p) => p.name === chProgram))) {
      setChProgram(chPrograms[0].name);
    }
  }, [chPrograms, chProgram]);

  // Set default chSubject
  useEffect(() => {
    if (chSubjects.length > 0 && (!chSubject || !chSubjects.some((s) => s.subject === chSubject))) {
      setChSubject(chSubjects[0].subject);
    }
  }, [chSubjects, chSubject]);

  // Programs under subTrack
  const subPrograms = useMemo(() => {
    if (!subTrack) return [];
    return customPrograms[subTrack] || [];
  }, [subTrack, customPrograms]);

  useEffect(() => {
    if (subPrograms.length > 0 && (!subProgram || !subPrograms.some((p) => p.name === subProgram))) {
      setSubProgram(subPrograms[0].name);
    }
  }, [subPrograms, subProgram]);

  // Programs under manageTrack
  const managePrograms = useMemo(() => {
    if (!manageTrack) return [];
    return customPrograms[manageTrack] || [];
  }, [manageTrack, customPrograms]);

  useEffect(() => {
    if (managePrograms.length > 0 && (!manageProgramFilter || !managePrograms.some((p) => p.name === manageProgramFilter))) {
      setManageProgramFilter(managePrograms[0].name);
    }
  }, [managePrograms, manageProgramFilter]);

  // Subjects under manageTrack and manageProgramFilter
  const manageSubjects = useMemo(() => {
    if (!manageTrack) return [];
    const subs = syllabusStructure[manageTrack] || [];
    if (!manageProgramFilter) return subs;
    return subs.filter((s) => s.program === manageProgramFilter);
  }, [manageTrack, manageProgramFilter, syllabusStructure]);

  // Priority tab items sync
  useEffect(() => {
    // 1. Tracks with sequential 1..N priority
    const sortedTracks = [...tracks].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
    setPriorityTracks(
      sortedTracks.map((t, idx) => ({
        ...t,
        priority: t.priority ?? idx + 1,
        order: t.order ?? idx,
      }))
    );

    // 2. Global flat programs across all tracks
    const flatProgs: Array<{ trackId: string; trackName: string; prog: Program }> = [];
    tracks.forEach((trackObj) => {
      (customPrograms[trackObj.id] || []).forEach((p) => {
        flatProgs.push({
          trackId: trackObj.id,
          trackName: trackObj.name,
          prog: { ...p },
        });
      });
    });
    flatProgs.sort((a, b) => (a.prog.priority ?? 999) - (b.prog.priority ?? 999) || (a.prog.order ?? 999) - (b.prog.order ?? 999));
    setPriorityPrograms(
      flatProgs.map((item, idx) => ({
        ...item,
        prog: {
          ...item.prog,
          priority: item.prog.priority ?? idx + 1,
          order: item.prog.order ?? idx,
        },
      }))
    );

    // 3. Flat subjects across all tracks
    const flatSubs: SyllabusItem[] = [];
    tracks.forEach((t) => {
      (syllabusStructure[t.id] || []).forEach((s) => {
        flatSubs.push({ ...s });
      });
    });
    flatSubs.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
    setPrioritySubjects(
      flatSubs.map((s, idx) => ({
        ...s,
        priority: s.priority ?? idx + 1,
        order: s.order ?? idx,
      }))
    );

    // 4. Daily actions
    const sortedHabits = [...habits].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
    setPriorityActions(
      sortedHabits.map((a, idx) => ({
        ...a,
        priority: a.priority ?? idx + 1,
        order: a.order ?? idx,
      }))
    );
  }, [tracks, customPrograms, syllabusStructure, habits]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // 1. Submit Add Chapter
  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chTrack || !chSubject || !chTitle.trim()) {
      showToast('Please select subject and enter chapter title.', 'error');
      return;
    }

    const title = chNum ? `Ch. ${chNum}: ${chTitle.trim()}` : chTitle.trim();
    addChapter(chTrack, chSubject, title);
    setChTitle('');
    setChNum('');
    showToast(`Chapter "${title}" added to ${chSubject}.`, 'success');
  };

  // 2. Submit Add Subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTrack || !subProgram || !subName.trim()) {
      showToast('Please select track, program, and enter subject name.', 'error');
      return;
    }

    const name = subName.trim();
    const count = subBulk ? parseInt(subBulkCount, 10) || 10 : 0;

    addSubject(subTrack, {
      track: subTrack,
      subject: name,
      program: subProgram,
      chapters: count,
      priority: 3,
      order: (syllabusStructure[subTrack] || []).length,
    });

    setSubName('');
    setSubBulk(false);
    showToast(
      count > 0
        ? `Subject "${name}" created under ${subProgram} with ${count} auto-generated chapters.`
        : `Subject "${name}" created successfully!`,
      'success'
    );
  };

  // 3. Submit Add Program
  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTrack || !progName.trim()) {
      showToast('Please select track and enter program name.', 'error');
      return;
    }

    const name = progName.trim();
    const existing = (customPrograms[progTrack] || []).some(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      showToast('A program with this name already exists in this track.', 'error');
      return;
    }

    addProgram(progTrack, {
      name,
      targetCGPA: '3.80',
      priority: 3,
      order: (customPrograms[progTrack] || []).length,
    });

    setProgName('');
    showToast(`Program "${name}" created!`, 'success');
  };

  // 4. Submit Manage Data (Rename & Delete)
  const handleManageRename = () => {
    if (!manageTarget || !manageNewName.trim()) {
      showToast('Please select an item and enter the new name.', 'error');
      return;
    }

    const newName = manageNewName.trim();
    if (manageType === 'subject') {
      updateSubject(manageTrack, manageTarget, { subject: newName });
      showToast(`Subject renamed to "${newName}".`, 'success');
    } else if (manageType === 'program') {
      renameProgram(manageTrack, manageTarget, newName);
      showToast(`Program renamed to "${newName}" and all subjects updated!`, 'success');
    } else if (manageType === 'action') {
      updateHabit(manageTarget, { title: newName, name: newName });
      showToast(`Daily action title updated to "${newName}"!`, 'success');
    }

    setManageNewName('');
    setManageTarget('');
  };

  const handleManageDelete = () => {
    if (!manageTarget) {
      showToast('Please select an item to delete.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to completely delete "${manageTarget}"? This cannot be undone.`)) {
      return;
    }

    if (manageType === 'subject') {
      deleteSubject(manageTrack, manageTarget);
      showToast(`Subject "${manageTarget}" deleted.`, 'success');
    } else if (manageType === 'program') {
      deleteProgramCascade(manageTrack, manageTarget);
      showToast(`Program "${manageTarget}" and all its subjects deleted.`, 'success');
    } else if (manageType === 'action') {
      deleteHabit(manageTarget);
      showToast(`Daily action deleted.`, 'success');
    }

    setManageTarget('');
  };

  // 4. Submit Dashboard Header Config
  const handleSaveHeaders = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerTag.trim() || !headerTitle.trim()) {
      showToast('Top Tag and Main Title are required.', 'error');
      return;
    }

    setDashboardHeaderConfig({
      topTag: headerTag.trim(),
      mainTitle: headerTitle.trim(),
      subTitle: headerSub.trim(),
    });

    showToast('Dashboard headers updated successfully!', 'success');
  };

  // 4. Clean Slate Reset Execution
  const handleCleanSlateReset = async () => {
    try {
      await resetWorkspaceToCleanSlate();
      await resetHabitsToCleanSlate();
      setShowResetModal(false);
      showToast('Workspace reset successfully to a fresh, clean state!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Reset error: ${msg}`, 'error');
    }
  };

  // 5. Submit Add Track
  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTrackName.trim();
    if (!name) {
      showToast('Track Name required.', 'error');
      return;
    }

    const id = (newTrackId.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    if (!id) {
      showToast('Valid Track ID required.', 'error');
      return;
    }

    if (tracks.some((t) => t.id === id)) {
      showToast('A track with this ID already exists.', 'error');
      return;
    }

    addTrack({
      id,
      name,
      priority: tracks.length + 1,
      order: tracks.length,
    });

    setNewTrackId('');
    setNewTrackName('');
    showToast(`Track "${name}" successfully created!`, 'success');
  };

  // Edit Track Modal Handlers
  const handleOpenEditTrackModal = (track: Track) => {
    setEditingTrack(track);
    setEditTrackModalName(track.name);
  };

  const handleSaveEditTrackModal = () => {
    if (!editingTrack || !editTrackModalName.trim()) {
      showToast('Track name cannot be empty.', 'error');
      return;
    }

    updateTrack(editingTrack.id, { name: editTrackModalName.trim() });
    showToast(`Track "${editingTrack.id}" renamed to "${editTrackModalName.trim()}".`, 'success');
    setEditingTrack(null);
  };

  // Priority Reordering Handlers
  const handleMoveTrack = (index: number, direction: -1 | 1) => {
    const updated = reorderListWithPriority(priorityTracks, index, direction);
    setPriorityTracks(updated);
  };

  const handleTrackPriorityDropdown = (trackId: string, newPriority: number) => {
    const updated = changePriorityInList(priorityTracks, 'id', trackId, newPriority);
    setPriorityTracks(updated);
  };

  const handleMoveProgram = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= priorityPrograms.length) return;

    const copy = [...priorityPrograms];
    const itemA = { ...copy[index] };
    const itemB = { ...copy[targetIndex] };

    copy[index] = itemB;
    copy[targetIndex] = itemA;

    const updated = copy.map((item, idx) => ({
      ...item,
      prog: {
        ...item.prog,
        priority: idx + 1,
        order: idx,
      },
    }));
    setPriorityPrograms(updated);
  };

  const handleProgramPriorityDropdown = (progName: string, newPriority: number) => {
    const targetIndex = Math.max(1, Math.min(newPriority, priorityPrograms.length)) - 1;
    const currentIndex = priorityPrograms.findIndex((p) => p.prog.name === progName);
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    const copy = [...priorityPrograms];
    const [removed] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, removed);

    const renumbered = copy.map((item, idx) => ({
      ...item,
      prog: {
        ...item.prog,
        priority: idx + 1,
        order: idx,
      },
    }));
    setPriorityPrograms(renumbered);
  };

  const handleMoveSubject = (index: number, direction: -1 | 1) => {
    const updated = reorderListWithPriority(prioritySubjects, index, direction);
    setPrioritySubjects(updated);
  };

  const handleSubjectPriorityDropdown = (subjectName: string, newPriority: number) => {
    const updated = changePriorityInList(prioritySubjects, 'subject', subjectName, newPriority);
    setPrioritySubjects(updated);
  };

  const handleMoveAction = (index: number, direction: -1 | 1) => {
    const updated = reorderListWithPriority(priorityActions, index, direction);
    setPriorityActions(updated);
  };

  const handleActionPriorityDropdown = (actionId: string, newPriority: number) => {
    const updated = changePriorityInList(priorityActions, 'id', actionId, newPriority);
    setPriorityActions(updated);
  };

  // Commit and Persist Priorities to Stores
  const handleSaveAllPriorities = () => {
    // 1. Commit Tracks
    reorderTracks(priorityTracks);

    // 2. Commit Programs back into customPrograms map
    const newProgramsMap: Record<string, Program[]> = {};
    tracks.forEach((t) => {
      newProgramsMap[t.id] = [];
    });
    priorityPrograms.forEach((item) => {
      if (!newProgramsMap[item.trackId]) newProgramsMap[item.trackId] = [];
      newProgramsMap[item.trackId].push(item.prog);
    });
    reorderAllPrograms(newProgramsMap);

    // 3. Commit Subjects back into syllabusStructure map
    const newSyllabusMap: Record<string, SyllabusItem[]> = {};
    tracks.forEach((t) => {
      newSyllabusMap[t.id] = [];
    });
    prioritySubjects.forEach((sub) => {
      if (!newSyllabusMap[sub.track]) newSyllabusMap[sub.track] = [];
      newSyllabusMap[sub.track].push(sub);
    });
    reorderAllSubjects(newSyllabusMap);

    // 4. Commit Daily Actions
    reorderHabits(priorityActions);

    showToast('Priorities saved and synced successfully!', 'success');
  };

  // Backup & Restore Tools
  const handleExportJSON = () => {
    const jsonStr = createBackupPayload({
      tracks,
      customPrograms,
      syllabusStructure,
      habits,
      passedItems,
      dashboardConfig,
    });

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `x-29_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup JSON exported successfully!', 'success');
  };

  const handleImportJSONClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validation = validateBackupPayload(parsed);
        if (!validation.isValid || !validation.data) {
          showToast(validation.error || 'Invalid backup file.', 'error');
          return;
        }

        const data = validation.data;
        const tracksToImport = data.tracks || tracks;
        const programsToImport = data.customPrograms || customPrograms;
        const syllabusToImport = data.syllabusStructure || data.customSyllabus || syllabusStructure;
        const passedToImport = data.passedItems || passedItems;
        const configToImport = data.dashboardConfig || dashboardConfig;
        const habitsToImport = data.habits || data.customActions || habits;

        await importFullTaxonomyState({
          tracks: tracksToImport,
          customPrograms: programsToImport,
          syllabusStructure: syllabusToImport,
          passedItems: passedToImport,
          dashboardConfig: configToImport,
        });

        await importFullHabitsState(habitsToImport);

        showToast('Workspace data imported and restored successfully!', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`Failed to parse backup JSON: ${msg}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="page-master-config" className="w-full min-w-0 space-y-6 max-w-7xl mx-auto pb-16 animate-page-enter">
      {/* Hidden File Input for JSON Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
        aria-hidden="true"
      />

      {/* Toast Feedback */}
      {feedback && (
        <div
          id="toast-message"
          className={`p-4 rounded-2xl border shadow-lg transition-all animate-in fade-in text-xs font-bold ${
            feedback.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-300'
              : feedback.type === 'info'
              ? 'bg-blue-950/80 border-blue-800 text-blue-300'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Main Container */}
      <div
        id="master-configuration-section"
        className="w-full min-w-0 bg-white dark:bg-slate-800 p-4 sm:p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col scroll-mt-24 md:scroll-mt-32 master-config-slide-up"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 min-w-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg font-black dark:text-white leading-tight truncate">
                Master Configuration
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
                Manage Syllabus &amp; Daily Actions dynamically
              </p>
            </div>
          </div>

          {/* Backup & Restore Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleExportJSON}
              title="Export workspace backup as JSON file"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all active:scale-95 border border-slate-200 dark:border-slate-600/60 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleImportJSONClick}
              title="Import workspace state from JSON file"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all active:scale-95 border border-slate-200 dark:border-slate-600/60 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Headers (6 Canonical Buttons) */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:gap-3 mb-4 md:mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
          {[
            { id: 'chapter', label: 'Add Chapter', elementId: 'sys-tab-chapter' },
            { id: 'subject', label: 'Add Subject', elementId: 'sys-tab-subject' },
            { id: 'program', label: 'Add Program', elementId: 'sys-tab-program' },
            { id: 'manage', label: 'Manage Data', elementId: 'sys-tab-manage' },
            { id: 'priority', label: 'Set Priority', elementId: 'sys-tab-priority' },
            { id: 'track', label: 'Manage Tracks', elementId: 'sys-tab-track' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={tab.elementId}
                onClick={() => setActiveTab(tab.id as ConfigTab)}
                className={`px-3.5 sm:px-4 md:px-5 py-2 sm:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Add Chapter */}
        {activeTab === 'chapter' && (
          <div id="sys-content-chapter" className="transition-all">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">
              Add a new chapter to a subject. It will automatically take the next available empty &quot;Revision&quot; slot.
            </p>
            <form onSubmit={handleAddChapter}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Track
                  </label>
                  <select
                    id="add-ch-track"
                    value={chTrack}
                    onChange={(e) => {
                      setChTrack(e.target.value);
                      setChProgram('');
                      setChSubject('');
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Program
                  </label>
                  <select
                    id="add-ch-program"
                    value={chProgram}
                    onChange={(e) => {
                      setChProgram(e.target.value);
                      setChSubject('');
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  >
                    {chPrograms.map((p, idx) => (
                      <option key={`${p.name}_${idx}`} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Subject
                  </label>
                  <select
                    id="add-ch-subject"
                    value={chSubject}
                    onChange={(e) => setChSubject(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  >
                    {chSubjects.length === 0 ? (
                      <option value="">No subjects found</option>
                    ) : (
                      chSubjects.map((s) => (
                        <option key={s.subject} value={s.subject}>
                          {s.subject}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Ch. No
                  </label>
                  <input
                    type="number"
                    id="add-ch-num"
                    value={chNum}
                    onChange={(e) => setChNum(e.target.value)}
                    placeholder="e.g. 17"
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Topic Name
                  </label>
                  <input
                    type="text"
                    id="add-ch-title"
                    value={chTitle}
                    onChange={(e) => setChTitle(e.target.value)}
                    required
                    placeholder="e.g. Auditing"
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-append-new-chapter"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 shadow-md focus:ring-2 focus:ring-offset-2"
                >
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Add Subject */}
        {activeTab === 'subject' && (
          <div id="sys-content-subject" className="transition-all">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">
              Create a new subject heading and link it to an existing Program.
            </p>
            <form onSubmit={handleAddSubject}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Track
                  </label>
                  <select
                    id="add-sub-track"
                    value={subTrack}
                    onChange={(e) => {
                      setSubTrack(e.target.value);
                      setSubProgram('');
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Program Link
                  </label>
                  <select
                    id="add-sub-program"
                    value={subProgram}
                    onChange={(e) => setSubProgram(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  >
                    {subPrograms.map((p, idx) => (
                      <option key={`${p.name}_${idx}`} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    New Subject Name
                  </label>
                  <input
                    type="text"
                    id="add-sub-name"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    required
                    placeholder="e.g. Financial Reporting"
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5 h-full justify-end pb-1 lg:col-span-1">
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-transform">
                    <input
                      type="checkbox"
                      id="add-sub-bulk-cb"
                      checked={subBulk}
                      onChange={(e) => setSubBulk(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 transition-all"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Bulk Chapters
                    </span>
                  </label>
                  {subBulk && (
                    <input
                      type="number"
                      id="add-sub-bulk-num"
                      min="1"
                      max="50"
                      value={subBulkCount}
                      onChange={(e) => setSubBulkCount(e.target.value)}
                      placeholder="Qty"
                      className="mt-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-bold w-full shadow-sm"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  id="btn-append-new-subject"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 shadow-md lg:col-span-1"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Add Program */}
        {activeTab === 'program' && (
          <div id="sys-content-program" className="transition-all">
            <div className="mb-8">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">
                Add a completely new Program bracket to any track.
              </p>
              <form onSubmit={handleAddProgram}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Track
                    </label>
                    <select
                      id="add-prog-track"
                      value={progTrack}
                      onChange={(e) => setProgTrack(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                    >
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      New Program Name
                    </label>
                    <input
                      type="text"
                      id="add-prog-name"
                      value={progName}
                      onChange={(e) => setProgName(e.target.value)}
                      required
                      placeholder="e.g. Honours, Year 1"
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn-append-new-program"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    Create Program
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 4: Manage Data */}
        {activeTab === 'manage' && (
          <div id="sys-content-manage" className="transition-all space-y-6">
            <div className="mb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">
                Safely rename or delete existing items.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 items-end">
                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Edit Type
                  </label>
                  <select
                    id="manage-type"
                    value={manageType}
                    onChange={(e) => {
                      setManageType(e.target.value as 'subject' | 'program' | 'action');
                      setManageTarget('');
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  >
                    <option value="subject">Subject</option>
                    <option value="program">Program</option>
                    <option value="action">Daily Action</option>
                  </select>
                </div>

                {manageType !== 'action' && (
                  <div className="flex flex-col gap-1.5 lg:col-span-1" id="manage-track-box">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Track
                    </label>
                    <select
                      id="manage-track"
                      value={manageTrack}
                      onChange={(e) => {
                        setManageTrack(e.target.value);
                        setManageTarget('');
                      }}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                    >
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {manageType === 'subject' && (
                  <div className="flex flex-col gap-1.5 lg:col-span-1" id="manage-program-box">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Program Filter
                    </label>
                    <select
                      id="manage-program"
                      value={manageProgramFilter}
                      onChange={(e) => {
                        setManageProgramFilter(e.target.value);
                        setManageTarget('');
                      }}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                    >
                      {managePrograms.map((p, idx) => (
                        <option key={`${p.name}_${idx}`} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div
                  className={`flex flex-col gap-1.5 ${
                    manageType === 'action'
                      ? 'lg:col-span-3'
                      : manageType === 'program'
                      ? 'lg:col-span-2'
                      : 'lg:col-span-1'
                  }`}
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Select Item
                  </label>
                  <select
                    id="manage-target"
                    value={manageTarget}
                    onChange={(e) => setManageTarget(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  >
                    <option value="">Select an item...</option>
                    {manageType === 'subject' &&
                      manageSubjects.map((s) => (
                        <option key={s.subject} value={s.subject}>
                          {s.subject}
                        </option>
                      ))}
                    {manageType === 'program' &&
                      managePrograms.map((p, idx) => (
                        <option key={`${p.name}_${idx}`} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    {manageType === 'action' &&
                      habits.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title || a.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div
                  className={`flex flex-col gap-1.5 ${
                    manageType === 'action'
                      ? 'lg:col-span-2'
                      : manageType === 'program'
                      ? 'lg:col-span-2'
                      : 'lg:col-span-2'
                  }`}
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    New Name / Title
                  </label>
                  <input
                    type="text"
                    id="manage-new-name"
                    value={manageNewName}
                    onChange={(e) => setManageNewName(e.target.value)}
                    placeholder="Enter new name..."
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                  />
                </div>

                <div className="flex gap-2 lg:col-span-2 w-full">
                  <button
                    type="button"
                    id="btn-execute-manage-edit"
                    onClick={handleManageRename}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    id="btn-request-manage-delete"
                    onClick={handleManageDelete}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Header Configuration */}
            <div className="border-t border-slate-100 dark:border-slate-700/60 pt-6">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">
                Update the main dashboard titles and subheadings.
              </p>
              <form onSubmit={handleSaveHeaders}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Top Tag
                    </label>
                    <input
                      type="text"
                      id="edit-header-tag"
                      value={headerTag}
                      onChange={(e) => setHeaderTag(e.target.value)}
                      placeholder="e.g. X-29"
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Main Title
                    </label>
                    <input
                      type="text"
                      id="edit-header-title"
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      placeholder="e.g. X-29 Dashboard"
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 lg:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      id="edit-header-sub"
                      value={headerSub}
                      onChange={(e) => setHeaderSub(e.target.value)}
                      placeholder="e.g. Study Tracker Dashboard"
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn-save-header-config"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    Update Headers
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone: Clean Slate Workspace Reset */}
            <div className="border-t border-slate-100 dark:border-slate-700/60 pt-6 mt-6">
              <div className="bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-wider">
                      Clean Slate / Reset Workspace
                    </h4>
                    <p className="text-[11px] text-red-600/80 dark:text-red-400/70 font-semibold mt-0.5">
                      Completely reset all tracks, programs, subjects, daily actions, targets, and study progress. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-reset-clean-slate"
                  onClick={() => setShowResetModal(true)}
                  className="w-full md:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset to Clean Slate</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Set Priority */}
        {activeTab === 'priority' && (
          <div id="sys-content-priority" className="transition-all space-y-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-bold">
              Use ↑ ↓ arrows to reorder. Rank numbers update automatically. Track order affects Program Completion cards and Subject Progress.
            </p>

            {/* 1. Tracks Priority Order */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Tracks Priority Order</span>
                <span className="ml-auto text-[8px] font-bold text-slate-400 normal-case tracking-normal">
                  (Affects Completion Rate &amp; Subject Progress)
                </span>
              </h4>
              <div className="flex flex-col gap-2">
                {priorityTracks.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No tracks found.</p>
                ) : (
                  priorityTracks.map((t, idx) => {
                    const color = TRACK_COLORS[idx % TRACK_COLORS.length];
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:border-indigo-400 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[10px] font-black tracking-tight"
                            style={{
                              backgroundColor: `${color}22`,
                              color,
                              border: `1px solid ${color}55`,
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {t.name}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              Track &middot; Controls program card &amp; subject order
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <select
                            id={`priority-track-${t.id}`}
                            value={t.priority ?? idx + 1}
                            onChange={(e) => handleTrackPriorityDropdown(t.id, parseInt(e.target.value, 10))}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-[9px] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 max-w-[72px]"
                          >
                            {priorityTracks.map((_, pIdx) => (
                              <option key={pIdx + 1} value={pIdx + 1}>
                                {pIdx + 1}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveTrack(idx, -1)}
                              className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-indigo-100 dark:bg-slate-700 dark:hover:bg-indigo-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === priorityTracks.length - 1}
                              onClick={() => handleMoveTrack(idx, 1)}
                              className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-indigo-100 dark:bg-slate-700 dark:hover:bg-indigo-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Programs Priority Order */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-500 border-b border-slate-200/60 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Programs Priority Order</span>
                <span className="ml-auto text-[8px] font-bold text-slate-400 normal-case tracking-normal">
                  (Independent from Subjects)
                </span>
              </h4>
              <div className="flex flex-col gap-2">
                {priorityPrograms.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No programs found.</p>
                ) : (
                  priorityPrograms.map((item, flatIdx) => {
                    const color = PROG_COLORS[flatIdx % PROG_COLORS.length];
                    return (
                      <div
                        key={`${item.trackId}_${item.prog.name}`}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:border-violet-400 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[10px] font-black tracking-tight"
                            style={{
                              backgroundColor: `${color}22`,
                              color,
                              border: `1px solid ${color}55`,
                            }}
                          >
                            #{flatIdx + 1}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                              {item.prog.name}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              {item.trackName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <select
                            value={item.prog.priority ?? flatIdx + 1}
                            onChange={(e) => handleProgramPriorityDropdown(item.prog.name, parseInt(e.target.value, 10))}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-[9px] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-violet-500 max-w-[72px]"
                          >
                            {priorityPrograms.map((_, pIdx) => (
                              <option key={pIdx + 1} value={pIdx + 1}>
                                {pIdx + 1}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={flatIdx === 0}
                              onClick={() => handleMoveProgram(flatIdx, -1)}
                              className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-violet-100 dark:bg-slate-700 dark:hover:bg-violet-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={flatIdx === priorityPrograms.length - 1}
                              onClick={() => handleMoveProgram(flatIdx, 1)}
                              className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-violet-100 dark:bg-slate-700 dark:hover:bg-violet-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Syllabus Subjects & Daily Actions (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Syllabus Subjects */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Syllabus Subjects</span>
                </h4>
                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                  {prioritySubjects.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400">No syllabus subjects found.</p>
                  ) : (
                    prioritySubjects.map((s, idx) => {
                      const trackObj = tracks.find((t) => t.id === s.track);
                      const trackName = trackObj ? trackObj.name : s.track;
                      return (
                        <div
                          key={`${s.track}_${s.subject}`}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:border-emerald-400 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[10px] font-black tracking-tight bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                              #{idx + 1}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                                {s.subject}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                {s.program} &middot; {trackName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <select
                              value={s.priority ?? idx + 1}
                              onChange={(e) => handleSubjectPriorityDropdown(s.subject, parseInt(e.target.value, 10))}
                              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-[9px] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 max-w-[72px]"
                            >
                              {prioritySubjects.map((_, pIdx) => (
                                <option key={pIdx + 1} value={pIdx + 1}>
                                  {pIdx + 1}
                                </option>
                              ))}
                            </select>
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveSubject(idx, -1)}
                                className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-emerald-100 dark:bg-slate-700 dark:hover:bg-emerald-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === prioritySubjects.length - 1}
                                onClick={() => handleMoveSubject(idx, 1)}
                                className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-emerald-100 dark:bg-slate-700 dark:hover:bg-emerald-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Daily Action Trackers */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Daily Action Trackers</span>
                </h4>
                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                  {priorityActions.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400">No daily actions created yet.</p>
                  ) : (
                    priorityActions.map((a, idx) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:border-amber-400 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[10px] font-black tracking-tight bg-amber-500/10 text-amber-500 border border-amber-500/30">
                            #{idx + 1}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                              {a.title || a.name}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase break-words whitespace-normal mt-0.5">
                              {a.desc || a.question || ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <select
                            id={`priority-action-${a.id}`}
                            value={a.priority ?? idx + 1}
                            onChange={(e) => handleActionPriorityDropdown(a.id, parseInt(e.target.value, 10))}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-[9px] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500 max-w-[72px]"
                          >
                            {priorityActions.map((_, pIdx) => (
                              <option key={pIdx + 1} value={pIdx + 1}>
                                {pIdx + 1}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveAction(idx, -1)}
                              className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-amber-100 dark:bg-slate-700 dark:hover:bg-amber-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === priorityActions.length - 1}
                              onClick={() => handleMoveAction(idx, 1)}
                              className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-amber-100 dark:bg-slate-700 dark:hover:bg-amber-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Save Priorities Button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAllPriorities}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest px-8 py-3 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save &amp; Sync Priorities</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: Manage Tracks */}
        {activeTab === 'track' && (
          <div id="sys-content-track" className="transition-all space-y-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">
              Add, rename, or delete academic or professional tracks. WARNING: Deleting a track deletes all its programs, subjects, and study progress data.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Add Track Card */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
                  Add New Track
                </h4>
                <form onSubmit={handleAddTrack} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Track Name
                    </label>
                    <input
                      type="text"
                      id="add-track-name"
                      value={newTrackName}
                      onChange={(e) => setNewTrackName(e.target.value)}
                      placeholder="e.g. Postgraduate (MBA)"
                      required
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Track ID (Optional)
                    </label>
                    <input
                      type="text"
                      id="add-track-id"
                      value={newTrackId}
                      onChange={(e) => setNewTrackId(e.target.value)}
                      placeholder="e.g. postgraduate-mba"
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Track</span>
                  </button>
                </form>
              </div>

              {/* Existing Tracks List */}
              <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
                  Existing Tracks ({tracks.length})
                </h4>
                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {tracks.map((track) => {
                    const totalPrograms = customPrograms[track.id] ? customPrograms[track.id].length : 0;
                    const totalSubjects = syllabusStructure[track.id] ? syllabusStructure[track.id].length : 0;
                    return (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-all hover:border-blue-400"
                      >
                        <div className="flex flex-col min-w-0 pr-2 flex-1">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 break-words whitespace-normal leading-normal">
                            {track.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                              ID: {track.id}
                            </span>
                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              {totalPrograms} Programs
                            </span>
                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              {totalSubjects} Subjects
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTrackModal(track)}
                            className="p-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                            title="Rename Track"
                          >
                            Rename
                          </button>
                          {tracks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to completely delete the track "${track.name}"? This will delete all its programs, subjects, and study tasks.`
                                  )
                                ) {
                                  deleteTrackCascade(track.id);
                                  showToast(`Track "${track.name}" and associated data deleted.`, 'success');
                                }
                              }}
                              className="p-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all active:scale-95"
                              title="Delete Track"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Track Modal */}
      {editingTrack && (
        <div
          id="edit-track-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Edit Track Name
              </h3>
              <button
                onClick={() => setEditingTrack(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Track ID
                </label>
                <input
                  type="text"
                  id="etm-track-id"
                  value={editingTrack.id}
                  disabled
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono font-bold w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Track Name
                </label>
                <input
                  type="text"
                  id="etm-track-name"
                  value={editTrackModalName}
                  onChange={(e) => setEditTrackModalName(e.target.value)}
                  required
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                id="etm-track-save-btn"
                onClick={handleSaveEditTrackModal}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Slate Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900/60 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider">
                  Reset Workspace Data
                </h3>
                <span className="text-[11px] font-bold text-red-500">
                  Critical Destruction Warning
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
              Are you sure you want to completely clear all data? This will delete all tracks, subjects, chapters, daily actions, pace goals, routines, tasks, and history. This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCleanSlateReset}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterConfigStudio;
