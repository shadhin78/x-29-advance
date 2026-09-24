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
  SubjectTimeLink,
  RevisionDataState,
  DashboardHeaderConfig,
} from '@/types/taxonomy';
import {
  DEFAULT_TRACKS,
  DEFAULT_SYLLABUS,
  DEFAULT_CUSTOM_PROGRAMS,
  normalizeTaxonomy,
  getSubjectColor,
} from '@/features/taxonomy/services/taxonomyService';
import { idbGet, idbSet, idbDel } from '@/lib/storage/indexeddb';
import { syncCloud } from '@/lib/sync/syncService';

const KEY_TAXONOMY_TRACKS = 'x29_taxonomy_tracks';
const KEY_TAXONOMY_SYLLABUS = 'x29_taxonomy_syllabus';
const KEY_TAXONOMY_PROGRAMS = 'x29_taxonomy_custom_programs';
const KEY_PASSED_ITEMS = 'x29_taxonomy_passed_items';
const KEY_SUBJECT_COLORS = 'x29_taxonomy_subject_colors';
const KEY_SUBJECT_TIME_LINKS = 'x29_taxonomy_subject_time_links';
const KEY_REVISION_DATA = 'x29_taxonomy_revision_data';
const KEY_DASHBOARD_CONFIG = 'x29_dashboard_config';

export const DEFAULT_DASHBOARD_CONFIG: DashboardHeaderConfig = {
  topTag: 'X-29',
  mainTitle: 'X-29 Dashboard',
  subTitle: 'Study Tracker Dashboard',
};

interface TaxonomyStoreState {
  tracks: Track[];
  syllabusStructure: SyllabusStructure;
  customPrograms: CustomProgramsMap;
  passedItems: PassedItemsState;
  subjectColors: Record<string, string>;
  subjectTimeLinks: Record<string, SubjectTimeLink>;
  revisionData: RevisionDataState;
  dashboardConfig: DashboardHeaderConfig;
  isInitialized: boolean;

  // Actions
  initFromStorage: () => Promise<void>;
  getNormalizedSubjects: () => NormalizedSubject[];
  addSubject: (trackId: string, item: SyllabusItem) => void;
  updateSubject: (trackId: string, subjectName: string, updates: Partial<SyllabusItem>) => void;
  deleteSubject: (trackId: string, subjectName: string) => void;
  addProgram: (trackId: string, program: Program) => void;
  deleteProgram: (trackId: string, programName: string) => void;
  renameProgram: (trackId: string, oldName: string, newName: string) => void;
  deleteProgramCascade: (trackId: string, programName: string) => void;
  toggleSubjectPassed: (subjectName: string) => void;
  toggleProgramPassed: (programName: string) => void;
  setSubjectColor: (subjectName: string, colorHex: string) => void;
  setSubjectTimeLink: (subject: string, link: SubjectTimeLink | null) => void;
  toggleRevisionSubject: (subject: string) => void;
  toggleRevisionChapter: (subject: string, chapter: number, completed: boolean) => void;
  addTrack: (track: Track) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (trackId: string) => void;
  deleteTrackCascade: (trackId: string) => void;
  addChapter: (trackId: string, subjectName: string, chapterTitle: string) => void;
  reorderTracks: (tracks: Track[]) => void;
  reorderPrograms: (trackId: string, programs: Program[]) => void;
  reorderAllPrograms: (updatedProgramsMap: CustomProgramsMap) => void;
  reorderSubjects: (trackId: string, subjects: SyllabusItem[]) => void;
  reorderAllSubjects: (updatedSyllabus: SyllabusStructure) => void;
  setDashboardHeaderConfig: (cfg: Partial<DashboardHeaderConfig>) => void;
  resetWorkspaceToCleanSlate: () => Promise<void>;
  importFullTaxonomyState: (data: {
    tracks?: Track[];
    customPrograms?: CustomProgramsMap;
    syllabusStructure?: SyllabusStructure;
    passedItems?: PassedItemsState;
    subjectColors?: Record<string, string>;
    subjectTimeLinks?: Record<string, SubjectTimeLink>;
    revisionData?: RevisionDataState;
    dashboardConfig?: DashboardHeaderConfig;
  }) => Promise<void>;
}

export const useTaxonomyStore = create<TaxonomyStoreState>((set, get) => ({
  tracks: DEFAULT_TRACKS,
  syllabusStructure: DEFAULT_SYLLABUS,
  customPrograms: DEFAULT_CUSTOM_PROGRAMS,
  passedItems: { programs: [], subjects: [] },
  subjectColors: {},
  subjectTimeLinks: {},
  revisionData: { active: [], progress: {} },
  dashboardConfig: DEFAULT_DASHBOARD_CONFIG,
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let tracks = DEFAULT_TRACKS;
    let syllabus = DEFAULT_SYLLABUS;
    let customPrograms = DEFAULT_CUSTOM_PROGRAMS;
    let passed: PassedItemsState = { programs: [], subjects: [] };
    let colors: Record<string, string> = {};
    let timeLinks: Record<string, SubjectTimeLink> = {};
    let revision: RevisionDataState = { active: [], progress: {} };
    let dashboardConfig: DashboardHeaderConfig = DEFAULT_DASHBOARD_CONFIG;

    try {
      const [idbTracks, idbSyllabus, idbPrograms, idbPassed, idbColors, idbTimeLinks, idbRevision, idbConfig] = await Promise.all([
        idbGet<Track[]>(KEY_TAXONOMY_TRACKS),
        idbGet<SyllabusStructure>(KEY_TAXONOMY_SYLLABUS),
        idbGet<CustomProgramsMap>(KEY_TAXONOMY_PROGRAMS),
        idbGet<PassedItemsState>(KEY_PASSED_ITEMS),
        idbGet<Record<string, string>>(KEY_SUBJECT_COLORS),
        idbGet<Record<string, SubjectTimeLink>>(KEY_SUBJECT_TIME_LINKS),
        idbGet<RevisionDataState>(KEY_REVISION_DATA),
        idbGet<DashboardHeaderConfig>(KEY_DASHBOARD_CONFIG),
      ]);

      if (idbTracks && idbTracks.length > 0) tracks = idbTracks;
      if (idbSyllabus && Object.keys(idbSyllabus).length > 0) syllabus = idbSyllabus;
      if (idbPrograms) customPrograms = idbPrograms;
      if (idbPassed) passed = idbPassed;
      if (idbColors) colors = idbColors;
      if (idbTimeLinks) timeLinks = idbTimeLinks;
      if (idbRevision) revision = idbRevision;
      if (idbConfig) dashboardConfig = idbConfig;

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
            if (parsed.subjectTimeLinks) {
              timeLinks = parsed.subjectTimeLinks;
              await idbSet(KEY_SUBJECT_TIME_LINKS, timeLinks);
            }
            if (parsed.revisionData) {
              revision = parsed.revisionData;
              await idbSet(KEY_REVISION_DATA, revision);
            }
            if (parsed.dashboardConfig) {
              dashboardConfig = { ...DEFAULT_DASHBOARD_CONFIG, ...parsed.dashboardConfig };
              await idbSet(KEY_DASHBOARD_CONFIG, dashboardConfig);
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
      subjectTimeLinks: timeLinks,
      revisionData: revision,
      dashboardConfig,
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

    syncCloud({ syllabusStructure: updatedSyllabus });
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

    syncCloud({ syllabusStructure: updatedSyllabus });
  },

  deleteSubject: (trackId: string, subjectName: string) => {
    const { syllabusStructure } = get();
    const currentList = syllabusStructure[trackId] || [];
    const updatedList = currentList.filter(item => item.subject !== subjectName);
    const updatedSyllabus = { ...syllabusStructure, [trackId]: updatedList };

    set({ syllabusStructure: updatedSyllabus });
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);

    syncCloud({ syllabusStructure: updatedSyllabus });
  },

  addProgram: (trackId: string, program: Program) => {
    const { customPrograms } = get();
    const currentList = customPrograms[trackId] || [];
    const updatedList = [...currentList, program];
    const updatedPrograms = { ...customPrograms, [trackId]: updatedList };

    set({ customPrograms: updatedPrograms });
    idbSet(KEY_TAXONOMY_PROGRAMS, updatedPrograms);

    syncCloud({ customPrograms: updatedPrograms });
  },

  deleteProgram: (trackId: string, programName: string) => {
    const { customPrograms } = get();
    const currentList = customPrograms[trackId] || [];
    const updatedList = currentList.filter(p => p.name !== programName);
    const updatedPrograms = { ...customPrograms, [trackId]: updatedList };

    set({ customPrograms: updatedPrograms });
    idbSet(KEY_TAXONOMY_PROGRAMS, updatedPrograms);

    syncCloud({ customPrograms: updatedPrograms });
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

    syncCloud({ passedItems: updatedPassed });
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

    syncCloud({ passedItems: updatedPassed });
  },

  setSubjectColor: (subjectName: string, colorHex: string) => {
    const { subjectColors } = get();
    const updatedColors = { ...subjectColors, [subjectName]: colorHex };

    set({ subjectColors: updatedColors });
    idbSet(KEY_SUBJECT_COLORS, updatedColors);

    syncCloud({ subjectColors: updatedColors });
  },

  setSubjectTimeLink: (subject: string, link: SubjectTimeLink | null) => {
    const { subjectTimeLinks } = get();
    const updated = { ...subjectTimeLinks };
    if (!link) {
      delete updated[subject];
    } else {
      updated[subject] = link;
    }
    set({ subjectTimeLinks: updated });
    idbSet(KEY_SUBJECT_TIME_LINKS, updated);
    syncCloud({ subjectTimeLinks: updated });
  },

  toggleRevisionSubject: (subject: string) => {
    const { revisionData } = get();
    const active = revisionData.active || [];
    const isActive = active.includes(subject);
    const nextActive = isActive ? active.filter((s) => s !== subject) : [...active, subject];
    const updated: RevisionDataState = {
      ...revisionData,
      active: nextActive,
      progress: revisionData.progress || {},
    };
    set({ revisionData: updated });
    idbSet(KEY_REVISION_DATA, updated);
    syncCloud({ revisionData: updated });
  },

  toggleRevisionChapter: (subject: string, chapter: number, completed: boolean) => {
    const { revisionData } = get();
    const currentProg = revisionData.progress || {};
    const subProg = { ...(currentProg[subject] || {}) };
    subProg[chapter] = completed;
    const updated: RevisionDataState = {
      ...revisionData,
      progress: {
        ...currentProg,
        [subject]: subProg,
      },
    };
    set({ revisionData: updated });
    idbSet(KEY_REVISION_DATA, updated);
    syncCloud({ revisionData: updated });
  },

  addTrack: (track: Track) => {
    const { tracks } = get();
    const updated = [...tracks, track];
    set({ tracks: updated });
    idbSet(KEY_TAXONOMY_TRACKS, updated);

    syncCloud({ tracks: updated });
  },

  updateTrack: (trackId: string, updates: Partial<Track>) => {
    const { tracks } = get();
    const updated = tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t));
    set({ tracks: updated });
    idbSet(KEY_TAXONOMY_TRACKS, updated);

    syncCloud({ tracks: updated });
  },

  deleteTrack: (trackId: string) => {
    const { tracks } = get();
    const updated = tracks.filter((t) => t.id !== trackId);
    set({ tracks: updated });
    idbSet(KEY_TAXONOMY_TRACKS, updated);

    syncCloud({ tracks: updated });
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

    syncCloud({ syllabusStructure: updatedSyllabus });
  },

  renameProgram: (trackId: string, oldName: string, newName: string) => {
    const { customPrograms, syllabusStructure, passedItems } = get();

    // 1. Rename in customPrograms
    const trackPrograms = customPrograms[trackId] || [];
    const updatedProgramsList = trackPrograms.map((p) =>
      p.name === oldName ? { ...p, name: newName } : p
    );
    const updatedProgramsMap = { ...customPrograms, [trackId]: updatedProgramsList };

    // 2. Cascade rename to subjects
    const trackSubjects = syllabusStructure[trackId] || [];
    const updatedSubjectsList = trackSubjects.map((s) =>
      s.program === oldName ? { ...s, program: newName } : s
    );
    const updatedSyllabus = { ...syllabusStructure, [trackId]: updatedSubjectsList };

    // 3. Cascade rename to passedItems
    const updatedPassedPrograms = (passedItems.programs || []).map((p) =>
      p === oldName ? newName : p
    );
    const updatedPassed = { ...passedItems, programs: updatedPassedPrograms };

    set({
      customPrograms: updatedProgramsMap,
      syllabusStructure: updatedSyllabus,
      passedItems: updatedPassed,
    });

    idbSet(KEY_TAXONOMY_PROGRAMS, updatedProgramsMap);
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);
    idbSet(KEY_PASSED_ITEMS, updatedPassed);

    syncCloud({ customPrograms: updatedProgramsMap,
          syllabusStructure: updatedSyllabus,
          passedItems: updatedPassed, });
  },

  deleteProgramCascade: (trackId: string, programName: string) => {
    const { customPrograms, syllabusStructure, passedItems } = get();

    // 1. Remove from customPrograms
    const trackPrograms = customPrograms[trackId] || [];
    const updatedProgramsList = trackPrograms.filter((p) => p.name !== programName);
    const updatedProgramsMap = { ...customPrograms, [trackId]: updatedProgramsList };

    // 2. Cascade delete all subjects belonging to this program
    const trackSubjects = syllabusStructure[trackId] || [];
    const subjectsToDelete = trackSubjects
      .filter((s) => s.program === programName)
      .map((s) => s.subject);
    const updatedSubjectsList = trackSubjects.filter((s) => s.program !== programName);
    const updatedSyllabus = { ...syllabusStructure, [trackId]: updatedSubjectsList };

    // 3. Clean up passedItems
    const updatedPassedPrograms = (passedItems.programs || []).filter((p) => p !== programName);
    const updatedPassedSubjects = (passedItems.subjects || []).filter(
      (s) => !subjectsToDelete.includes(s)
    );
    const updatedPassed = {
      programs: updatedPassedPrograms,
      subjects: updatedPassedSubjects,
    };

    set({
      customPrograms: updatedProgramsMap,
      syllabusStructure: updatedSyllabus,
      passedItems: updatedPassed,
    });

    idbSet(KEY_TAXONOMY_PROGRAMS, updatedProgramsMap);
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);
    idbSet(KEY_PASSED_ITEMS, updatedPassed);

    syncCloud({ customPrograms: updatedProgramsMap,
          syllabusStructure: updatedSyllabus,
          passedItems: updatedPassed, });
  },

  deleteTrackCascade: (trackId: string) => {
    const { tracks, customPrograms, syllabusStructure } = get();
    const updatedTracks = tracks.filter((t) => t.id !== trackId);
    const updatedPrograms = { ...customPrograms };
    delete updatedPrograms[trackId];
    const updatedSyllabus = { ...syllabusStructure };
    delete updatedSyllabus[trackId];

    set({
      tracks: updatedTracks,
      customPrograms: updatedPrograms,
      syllabusStructure: updatedSyllabus,
    });

    idbSet(KEY_TAXONOMY_TRACKS, updatedTracks);
    idbSet(KEY_TAXONOMY_PROGRAMS, updatedPrograms);
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);

    syncCloud({ tracks: updatedTracks,
          customPrograms: updatedPrograms,
          syllabusStructure: updatedSyllabus, });
  },

  reorderTracks: (updatedTracks: Track[]) => {
    set({ tracks: updatedTracks });
    idbSet(KEY_TAXONOMY_TRACKS, updatedTracks);

    syncCloud({ tracks: updatedTracks });
  },

  reorderPrograms: (trackId: string, programs: Program[]) => {
    const { customPrograms } = get();
    const updatedPrograms = { ...customPrograms, [trackId]: programs };
    set({ customPrograms: updatedPrograms });
    idbSet(KEY_TAXONOMY_PROGRAMS, updatedPrograms);

    syncCloud({ customPrograms: updatedPrograms });
  },

  reorderAllPrograms: (updatedProgramsMap: CustomProgramsMap) => {
    set({ customPrograms: updatedProgramsMap });
    idbSet(KEY_TAXONOMY_PROGRAMS, updatedProgramsMap);

    syncCloud({ customPrograms: updatedProgramsMap });
  },

  reorderSubjects: (trackId: string, subjects: SyllabusItem[]) => {
    const { syllabusStructure } = get();
    const updatedSyllabus = { ...syllabusStructure, [trackId]: subjects };
    set({ syllabusStructure: updatedSyllabus });
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);

    syncCloud({ syllabusStructure: updatedSyllabus });
  },

  reorderAllSubjects: (updatedSyllabus: SyllabusStructure) => {
    set({ syllabusStructure: updatedSyllabus });
    idbSet(KEY_TAXONOMY_SYLLABUS, updatedSyllabus);

    syncCloud({ syllabusStructure: updatedSyllabus });
  },

  setDashboardHeaderConfig: (cfg: Partial<DashboardHeaderConfig>) => {
    const { dashboardConfig } = get();
    const updated = { ...dashboardConfig, ...cfg };
    set({ dashboardConfig: updated });
    idbSet(KEY_DASHBOARD_CONFIG, updated);

    syncCloud({ dashboardConfig: updated });
  },

  resetWorkspaceToCleanSlate: async () => {
    await Promise.all([
      idbDel(KEY_TAXONOMY_TRACKS),
      idbDel(KEY_TAXONOMY_SYLLABUS),
      idbDel(KEY_TAXONOMY_PROGRAMS),
      idbDel(KEY_PASSED_ITEMS),
      idbDel(KEY_SUBJECT_COLORS),
      idbDel(KEY_SUBJECT_TIME_LINKS),
      idbDel(KEY_REVISION_DATA),
      idbDel(KEY_DASHBOARD_CONFIG),
    ]);

    set({
      tracks: [],
      syllabusStructure: {},
      customPrograms: {},
      passedItems: { programs: [], subjects: [] },
      subjectColors: {},
      subjectTimeLinks: {},
      revisionData: { active: [], progress: {} },
      dashboardConfig: DEFAULT_DASHBOARD_CONFIG,
    });

    syncCloud({
      tracks: [],
      syllabusStructure: {},
      customPrograms: {},
      passedItems: { programs: [], subjects: [] },
      subjectColors: {},
      subjectTimeLinks: {},
      revisionData: { active: [], progress: {} },
      dashboardConfig: DEFAULT_DASHBOARD_CONFIG,
    });
  },

  importFullTaxonomyState: async (data) => {
    const {
      tracks = get().tracks,
      customPrograms = get().customPrograms,
      syllabusStructure = get().syllabusStructure,
      passedItems = get().passedItems,
      subjectColors = get().subjectColors,
      subjectTimeLinks = get().subjectTimeLinks,
      revisionData = get().revisionData,
      dashboardConfig = get().dashboardConfig,
    } = data;

    await Promise.all([
      idbSet(KEY_TAXONOMY_TRACKS, tracks),
      idbSet(KEY_TAXONOMY_PROGRAMS, customPrograms),
      idbSet(KEY_TAXONOMY_SYLLABUS, syllabusStructure),
      idbSet(KEY_PASSED_ITEMS, passedItems),
      idbSet(KEY_SUBJECT_COLORS, subjectColors),
      idbSet(KEY_SUBJECT_TIME_LINKS, subjectTimeLinks),
      idbSet(KEY_REVISION_DATA, revisionData),
      idbSet(KEY_DASHBOARD_CONFIG, dashboardConfig),
    ]);

    set({
      tracks,
      customPrograms,
      syllabusStructure,
      passedItems,
      subjectColors,
      subjectTimeLinks,
      revisionData,
      dashboardConfig,
    });

    syncCloud({ tracks,
          customPrograms,
          syllabusStructure,
          passedItems,
          subjectColors,
          subjectTimeLinks,
          revisionData,
          dashboardConfig, });
  },
}));
