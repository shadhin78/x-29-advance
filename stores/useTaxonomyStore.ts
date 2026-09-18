/**
 * X-29 Authoritative Taxonomy Store (stores/useTaxonomyStore.ts)
 * 
 * Owns Tracks, Programs, Subjects, Chapters, and Passed Items state.
 * Single source of truth consumed by Subjects, Config, Targets, Pace, and Dashboard.
 */

import { create } from 'zustand';
import type {
  Track,
  Program,
  SyllabusItem,
  SyllabusStructure,
  CustomProgramsMap,
  NormalizedSubject,
  PassedItemsState,
} from '@/types/taxonomy';
import {
  DEFAULT_TRACKS,
  DEFAULT_SYLLABUS,
  DEFAULT_CUSTOM_PROGRAMS,
  normalizeTaxonomy,
  getSubjectColor,
} from '@/features/taxonomy/services/taxonomyService';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';

const KEY_TAXONOMY_TRACKS = 'x29_taxonomy_tracks';
const KEY_TAXONOMY_SYLLABUS = 'x29_taxonomy_syllabus';
const KEY_TAXONOMY_PROGRAMS = 'x29_taxonomy_custom_programs';
const KEY_PASSED_ITEMS = 'x29_taxonomy_passed_items';
const KEY_SUBJECT_COLORS = 'x29_taxonomy_subject_colors';

interface TaxonomyStoreState {
  tracks: Track[];
  syllabusStructure: SyllabusStructure;
  customPrograms: CustomProgramsMap;
  passedItems: PassedItemsState;
  subjectColors: Record<string, string>;
  isInitialized: boolean;

  // Actions
  initFromStorage: () => Promise<void>;
  getNormalizedSubjects: () => NormalizedSubject[];
  addSubject: (trackId: string, item: SyllabusItem) => void;
  updateSubject: (trackId: string, subjectName: string, updates: Partial<SyllabusItem>) => void;
  deleteSubject: (trackId: string, subjectName: string) => void;
  addProgram: (trackId: string, program: Program) => void;
  deleteProgram: (trackId: string, programName: string) => void;
  toggleSubjectPassed: (subjectName: string) => void;
  toggleProgramPassed: (programName: string) => void;
  setSubjectColor: (subjectName: string, colorHex: string) => void;
  addTrack: (track: Track) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (trackId: string) => void;
  addChapter: (trackId: string, subjectName: string, chapterTitle: string) => void;
}

export const useTaxonomyStore = create<TaxonomyStoreState>((set, get) => ({
  tracks: DEFAULT_TRACKS,
  syllabusStructure: DEFAULT_SYLLABUS,
  customPrograms: DEFAULT_CUSTOM_PROGRAMS,
  passedItems: { programs: [], subjects: [] },
  subjectColors: {},
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let tracks = DEFAULT_TRACKS;
    let syllabus = DEFAULT_SYLLABUS;
    let customPrograms = DEFAULT_CUSTOM_PROGRAMS;
    let passed: PassedItemsState = { programs: [], subjects: [] };
    let colors: Record<string, string> = {};

    try {
      const [idbTracks, idbSyllabus, idbPrograms, idbPassed, idbColors] = await Promise.all([
        idbGet<Track[]>(KEY_TAXONOMY_TRACKS),
        idbGet<SyllabusStructure>(KEY_TAXONOMY_SYLLABUS),
        idbGet<CustomProgramsMap>(KEY_TAXONOMY_PROGRAMS),
        idbGet<PassedItemsState>(KEY_PASSED_ITEMS),
        idbGet<Record<string, string>>(KEY_SUBJECT_COLORS),
      ]);

      if (idbTracks && idbTracks.length > 0) tracks = idbTracks;
      if (idbSyllabus && Object.keys(idbSyllabus).length > 0) syllabus = idbSyllabus;
      if (idbPrograms) customPrograms = idbPrograms;
      if (idbPassed) passed = idbPassed;
      if (idbColors) colors = idbColors;

      // Check legacy local storage fallback if idb is empty
      if (!idbTracks && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.tracks) && parsed.tracks.length > 0) {
              tracks = parsed.tracks;
              await idbSet(KEY_TAXONOMY_TRACKS, tracks);
            }
            if (parsed.syllabusStructure && Object.keys(parsed.syllabusStructure).length > 0) {
              syllabus = parsed.syllabusStructure;
              await idbSet(KEY_TAXONOMY_SYLLABUS, syllabus);
            }
            if (parsed.customPrograms) {
              customPrograms = parsed.customPrograms;
              await idbSet(KEY_TAXONOMY_PROGRAMS, customPrograms);
            }
            if (parsed.passedItems) {
              passed = parsed.passedItems;
              await idbSet(KEY_PASSED_ITEMS, passed);
            }
            if (parsed.subjectColors) {
              colors = parsed.subjectColors;
              await idbSet(KEY_SUBJECT_COLORS, colors);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[useTaxonomyStore] Storage load error:', err);
    }

    set({
      tracks,
      syllabusStructure: syllabus,
      customPrograms,
      passedItems: passed,
      subjectColors: colors,
      isInitialized: true,
    });
  },

  getNormalizedSubjects: () => {
    const { tracks, syllabusStructure, passedItems, subjectColors } = get();
    return normalizeTaxonomy(tracks, syllabusStructure, passedItems, subjectColors);
  },

  addSubject: (trackId: string, item: SyllabusItem) => {
    const { syllabusStructure } = get();
    const currentList = syllabusStructure[trackId] || [];
    const updatedList = [...currentList, item];
    const updatedSyllabus = { ...syllabusStructure, [trackId]: updatedList };

    set({ syllabusStructure: updatedSyllabus });
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { syllabusStructure: updatedSyllabus, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  updateSubject: (trackId: string, subjectName: string, updates: Partial<SyllabusItem>) => {
    const { syllabusStructure } = get();
    const currentList = syllabusStructure[trackId] || [];
    const updatedList = currentList.map(item => {
      if (item.subject === subjectName) {
        return { ...item, ...updates };
      }
      return item;
    });
    const updatedSyllabus = { ...syllabusStructure, [trackId]: updatedList };

    set({ syllabusStructure: updatedSyllabus });
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { syllabusStructure: updatedSyllabus, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  deleteSubject: (trackId: string, subjectName: string) => {
    const { syllabusStructure } = get();
    const currentList = syllabusStructure[trackId] || [];
    const updatedList = currentList.filter(item => item.subject !== subjectName);
    const updatedSyllabus = { ...syllabusStructure, [trackId]: updatedList };

    set({ syllabusStructure: updatedSyllabus });
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { syllabusStructure: updatedSyllabus, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  addProgram: (trackId: string, program: Program) => {
    const { customPrograms } = get();
    const currentList = customPrograms[trackId] || [];
    const updatedList = [...currentList, program];
    const updatedPrograms = { ...customPrograms, [trackId]: updatedList };

    set({ customPrograms: updatedPrograms });
    idbSet(KEY_TAXONOMY_PROGRAMS, updatedPrograms);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { customPrograms: updatedPrograms, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  deleteProgram: (trackId: string, programName: string) => {
    const { customPrograms } = get();
    const currentList = customPrograms[trackId] || [];
    const updatedList = currentList.filter(p => p.name !== programName);
    const updatedPrograms = { ...customPrograms, [trackId]: updatedList };

    set({ customPrograms: updatedPrograms });
    idbSet(KEY_TAXONOMY_PROGRAMS, updatedPrograms);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { customPrograms: updatedPrograms, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  toggleSubjectPassed: (subjectName: string) => {
    const { passedItems } = get();
    const subjects = new Set(passedItems.subjects || []);
    if (subjects.has(subjectName)) {
      subjects.delete(subjectName);
    } else {
      subjects.add(subjectName);
    }
    const updatedPassed = { ...passedItems, subjects: Array.from(subjects) };

    set({ passedItems: updatedPassed });
    idbSet(KEY_PASSED_ITEMS, updatedPassed);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { passedItems: updatedPassed, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  toggleProgramPassed: (programName: string) => {
    const { passedItems } = get();
    const programs = new Set(passedItems.programs || []);
    if (programs.has(programName)) {
      programs.delete(programName);
    } else {
      programs.add(programName);
    }
    const updatedPassed = { ...passedItems, programs: Array.from(programs) };

    set({ passedItems: updatedPassed });
    idbSet(KEY_PASSED_ITEMS, updatedPassed);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { passedItems: updatedPassed, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  setSubjectColor: (subjectName: string, colorHex: string) => {
    const { subjectColors } = get();
    const updatedColors = { ...subjectColors, [subjectName]: colorHex };

    set({ subjectColors: updatedColors });
    idbSet(KEY_SUBJECT_COLORS, updatedColors);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { subjectColors: updatedColors, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  addTrack: (track: Track) => {
    const { tracks } = get();
    const updated = [...tracks, track];
    set({ tracks: updated });
    idbSet(KEY_TAXONOMY_TRACKS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { tracks: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  updateTrack: (trackId: string, updates: Partial<Track>) => {
    const { tracks } = get();
    const updated = tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t));
    set({ tracks: updated });
    idbSet(KEY_TAXONOMY_TRACKS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { tracks: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  deleteTrack: (trackId: string) => {
    const { tracks } = get();
    const updated = tracks.filter((t) => t.id !== trackId);
    set({ tracks: updated });
    idbSet(KEY_TAXONOMY_TRACKS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { tracks: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  addChapter: (trackId: string, subjectName: string, chapterTitle: string) => {
    const { syllabusStructure } = get();
    const currentList = syllabusStructure[trackId] || [];
    const updatedList = currentList.map((item) => {
      if (item.subject === subjectName) {
        const newChapters = Number(item.chapters || 0) + 1;
        return { ...item, chapters: newChapters };
      }
      return item;
    });

    const updatedSyllabus = { ...syllabusStructure, [trackId]: updatedList };
    set({ syllabusStructure: updatedSyllabus });
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { syllabusStructure: updatedSyllabus, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },
}));
