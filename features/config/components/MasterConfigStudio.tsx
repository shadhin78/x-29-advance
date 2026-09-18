'use client';

/**
 * X-29 Master Configuration Studio Component (features/config/components/MasterConfigStudio.tsx)
 * 
 * Authoritative editor of tracks, programs, subjects, and chapters:
 * - Tabbed navigation (Add Chapter, Add Subject, Add Program, Manage Data, Manage Tracks)
 * - Safe CRUD with typed validation
 * - Direct connection to useTaxonomyStore (single source of truth)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import type { Track, Program, SyllabusItem } from '@/types/taxonomy';
import {
  Settings,
  Plus,
  BookOpen,
  FolderPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  ListPlus,
  Layers,
} from 'lucide-react';

type ConfigTab = 'chapter' | 'subject' | 'program' | 'manage' | 'track';

export const MasterConfigStudio: React.FC = () => {
  const {
    tracks,
    customPrograms,
    syllabusStructure,
    initFromStorage,
    addTrack,
    updateTrack,
    deleteTrack,
    addProgram,
    deleteProgram,
    addSubject,
    updateSubject,
    deleteSubject,
    addChapter,
  } = useTaxonomyStore();

  const [activeTab, setActiveTab] = useState<ConfigTab>('chapter');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );

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
  const [manageType, setManageType] = useState<'subject' | 'program'>('subject');
  const [manageTrack, setManageTrack] = useState('');
  const [manageTarget, setManageTarget] = useState('');
  const [manageNewName, setManageNewName] = useState('');

  // 5. Manage Track Form State
  const [newTrackId, setNewTrackId] = useState('');
  const [newTrackName, setNewTrackName] = useState('');

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // Set default tracks in selectors
  useEffect(() => {
    if (tracks.length > 0) {
      if (!chTrack) setChTrack(tracks[0].id);
      if (!subTrack) setSubTrack(tracks[0].id);
      if (!progTrack) setProgTrack(tracks[0].id);
      if (!manageTrack) setManageTrack(tracks[0].id);
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
    if (chPrograms.length > 0 && !chProgram) {
      const first = typeof chPrograms[0] === 'string' ? chPrograms[0] : chPrograms[0].name;
      setChProgram(first);
    }
  }, [chPrograms, chProgram]);

  // Set default chSubject
  useEffect(() => {
    if (chSubjects.length > 0 && !chSubject) {
      setChSubject(chSubjects[0].subject);
    }
  }, [chSubjects, chSubject]);

  // Programs under subTrack
  const subPrograms = useMemo(() => {
    if (!subTrack) return [];
    return customPrograms[subTrack] || [];
  }, [subTrack, customPrograms]);

  useEffect(() => {
    if (subPrograms.length > 0 && !subProgram) {
      const first = typeof subPrograms[0] === 'string' ? subPrograms[0] : subPrograms[0].name;
      setSubProgram(first);
    }
  }, [subPrograms, subProgram]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
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
    showToast(`Chapter "${title}" added to ${chSubject}.`);
  };

  // 2. Submit Add Subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTrack || !subProgram || !subName.trim()) {
      showToast('Please select track, program, and enter subject name.', 'error');
      return;
    }

    const name = subName.trim();
    const count = subBulk ? parseInt(subBulkCount, 10) || 10 : 10;
    const chapters = Array.from({ length: count }, (_, i) => `Ch. ${i + 1}`);

    addSubject(subTrack, {
      track: subTrack,
      subject: name,
      program: subProgram,
      chapters: count,
    });

    setSubName('');
    showToast(`Subject "${name}" created under ${subProgram} with ${count} chapters.`);
  };

  // 3. Submit Add Program
  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTrack || !progName.trim()) {
      showToast('Please select track and enter program name.', 'error');
      return;
    }

    const name = progName.trim();
    addProgram(progTrack, {
      name,
      targetCGPA: '3.80',
    });

    setProgName('');
    showToast(`Program "${name}" created.`);
  };

  // 4. Submit Rename or Delete in Manage Data
  const handleManageRename = () => {
    if (!manageTarget || !manageNewName.trim()) {
      showToast('Please select an item and enter the new name.', 'error');
      return;
    }

    const newName = manageNewName.trim();
    if (manageType === 'subject') {
      updateSubject(manageTrack, manageTarget, { subject: newName });
      showToast(`Subject renamed to "${newName}".`);
    } else {
      // Program rename: add with new name, update subjects, delete old
      addProgram(manageTrack, { name: newName });
      deleteProgram(manageTrack, manageTarget);
      showToast(`Program renamed to "${newName}".`);
    }

    setManageNewName('');
    setManageTarget('');
  };

  const handleManageDelete = () => {
    if (!manageTarget) {
      showToast('Please select an item to delete.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${manageTarget}"?`)) return;

    if (manageType === 'subject') {
      deleteSubject(manageTrack, manageTarget);
      showToast(`Subject "${manageTarget}" deleted.`);
    } else {
      deleteProgram(manageTrack, manageTarget);
      showToast(`Program "${manageTarget}" deleted.`);
    }

    setManageTarget('');
  };

  // 5. Submit Add Track
  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackId.trim() || !newTrackName.trim()) {
      showToast('Please enter Track ID and Name.', 'error');
      return;
    }

    const id = newTrackId.trim().toLowerCase().replace(/\s+/g, '-');
    addTrack({
      id,
      name: newTrackName.trim(),
    });

    setNewTrackId('');
    setNewTrackName('');
    showToast(`Track "${newTrackName}" created.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border shadow-lg transition-all animate-in fade-in text-xs font-bold ${
            feedback.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-300'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Main Container */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3.5 border-b border-slate-800/80 pb-5">
          <div className="p-3 bg-blue-950/60 text-blue-400 border border-blue-800/60 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Master Configuration
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Authoritative editor of syllabus taxonomy, tracks, programs, and chapters
            </p>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
          {[
            { id: 'chapter', label: 'Add Chapter', icon: BookOpen },
            { id: 'subject', label: 'Add Subject', icon: ListPlus },
            { id: 'program', label: 'Add Program', icon: FolderPlus },
            { id: 'manage', label: 'Manage Data', icon: Edit2 },
            { id: 'track', label: 'Manage Tracks', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ConfigTab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Add Chapter */}
        {activeTab === 'chapter' && (
          <form onSubmit={handleAddChapter} className="space-y-4 text-left">
            <p className="text-xs text-slate-400 font-bold">
              Add a new chapter or study unit to an existing subject.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Track
                </label>
                <select
                  value={chTrack}
                  onChange={(e) => {
                    setChTrack(e.target.value);
                    setChProgram('');
                    setChSubject('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Program
                </label>
                <select
                  value={chProgram}
                  onChange={(e) => {
                    setChProgram(e.target.value);
                    setChSubject('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {chPrograms.map((p, idx) => {
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
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Subject
                </label>
                <select
                  value={chSubject}
                  onChange={(e) => setChSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {chSubjects.map((s) => (
                    <option key={s.subject} value={s.subject}>
                      {s.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Ch. Number
                </label>
                <input
                  type="number"
                  placeholder="e.g. 17"
                  value={chNum}
                  onChange={(e) => setChNum(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Chapter Topic Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auditing Standards"
                  value={chTitle}
                  onChange={(e) => setChTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Chapter</span>
            </button>
          </form>
        )}

        {/* Tab 2: Add Subject */}
        {activeTab === 'subject' && (
          <form onSubmit={handleAddSubject} className="space-y-4 text-left">
            <p className="text-xs text-slate-400 font-bold">
              Create a new subject heading and link it to an existing Program.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Track
                </label>
                <select
                  value={subTrack}
                  onChange={(e) => {
                    setSubTrack(e.target.value);
                    setSubProgram('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Program Link
                </label>
                <select
                  value={subProgram}
                  onChange={(e) => setSubProgram(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {subPrograms.map((p, idx) => {
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
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Financial Reporting"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subBulk}
                    onChange={(e) => setSubBulk(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                  />
                  <span>Auto-generate Chapters</span>
                </label>
                {subBulk && (
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Chapter count"
                    value={subBulkCount}
                    onChange={(e) => setSubBulkCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Subject</span>
            </button>
          </form>
        )}

        {/* Tab 3: Add Program */}
        {activeTab === 'program' && (
          <form onSubmit={handleAddProgram} className="space-y-4 text-left">
            <p className="text-xs text-slate-400 font-bold">
              Add a completely new Program bracket to any track.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Track
                </label>
                <select
                  value={progTrack}
                  onChange={(e) => setProgTrack(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  New Program Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master of Science (MSc)"
                  value={progName}
                  onChange={(e) => setProgName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Program</span>
            </button>
          </form>
        )}

        {/* Tab 4: Manage Data */}
        {activeTab === 'manage' && (
          <div className="space-y-4 text-left">
            <p className="text-xs text-slate-400 font-bold">
              Safely rename or delete existing items.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Edit Type
                </label>
                <select
                  value={manageType}
                  onChange={(e) => {
                    setManageType(e.target.value as any);
                    setManageTarget('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="subject">Subject</option>
                  <option value="program">Program</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Track
                </label>
                <select
                  value={manageTrack}
                  onChange={(e) => {
                    setManageTrack(e.target.value);
                    setManageTarget('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Target Item
                </label>
                <select
                  value={manageTarget}
                  onChange={(e) => setManageTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Select an item...</option>
                  {manageType === 'subject'
                    ? (syllabusStructure[manageTrack] || []).map((s) => (
                        <option key={s.subject} value={s.subject}>
                          {s.subject}
                        </option>
                      ))
                    : (customPrograms[manageTrack] || []).map((p, idx) => {
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
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  New Name
                </label>
                <input
                  type="text"
                  placeholder="Enter new name..."
                  value={manageNewName}
                  onChange={(e) => setManageNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleManageRename}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={handleManageDelete}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Manage Tracks */}
        {activeTab === 'track' && (
          <div className="space-y-6 text-left">
            <form onSubmit={handleAddTrack} className="space-y-4">
              <p className="text-xs text-slate-400 font-bold">
                Add a new track or configure existing track branches.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Track ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. professional"
                    value={newTrackId}
                    onChange={(e) => setNewTrackId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Track Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Professional Certifications"
                    value={newTrackName}
                    onChange={(e) => setNewTrackName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Track</span>
              </button>
            </form>

            <div className="border-t border-slate-800/80 pt-4 space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                Existing Tracks ({tracks.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tracks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{t.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400">ID: {t.id}</span>
                    </div>
                    {tracks.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete track "${t.name}"?`)) {
                            deleteTrack(t.id);
                            showToast(`Track "${t.name}" deleted.`);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
