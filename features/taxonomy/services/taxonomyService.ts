/**
 * X-29 Taxonomy Domain Service (features/taxonomy/services/taxonomyService.ts)
 * 
 * Pure domain service for curriculum taxonomy:
 * Tracks, Programs, Subjects, Chapters, and Priority Sorting.
 * 
 * ZERO DOM, ZERO React, ZERO direct window dependencies.
 * Deterministic and 100% unit-testable.
 */

import type {
  Track,
  Program,
  SyllabusItem,
  SyllabusStructure,
  CustomProgramsMap,
  NormalizedSubject,
  PassedItemsState,
} from '@/types/taxonomy';

export const DEFAULT_TRACKS: Track[] = [
  { id: 'trackA', name: 'Academic Core', order: 1, color: '#3b82f6', badge: 'Core' },
  { id: 'trackB', name: 'Competitive Track', order: 2, color: '#10b981', badge: 'Competitive' },
  { id: 'trackC', name: 'Self-Paced Specialization', order: 3, color: '#8b5cf6', badge: 'Special' },
];

export const DEFAULT_SYLLABUS: SyllabusStructure = {
  trackA: [
    { track: 'trackA', program: 'Computer Science', subject: 'Data Structures & Algorithms', chapters: 18, priority: 1, order: 1 },
    { track: 'trackA', program: 'Computer Science', subject: 'Operating Systems', chapters: 12, priority: 2, order: 2 },
    { track: 'trackA', program: 'Computer Science', subject: 'Database Management Systems', chapters: 10, priority: 2, order: 3 },
    { track: 'trackA', program: 'Mathematics', subject: 'Discrete Mathematics', chapters: 8, priority: 1, order: 1 },
    { track: 'trackA', program: 'Mathematics', subject: 'Linear Algebra & Calculus', chapters: 14, priority: 2, order: 2 },
  ],
  trackB: [
    { track: 'trackB', program: 'Competitive Exam', subject: 'General Aptitude', chapters: 10, priority: 1, order: 1 },
    { track: 'trackB', program: 'Competitive Exam', subject: 'Reasoning & Logic', chapters: 8, priority: 2, order: 2 },
  ],
  trackC: [
    { track: 'trackC', program: 'Software Engineering', subject: 'Fullstack Web Architecture', chapters: 15, priority: 1, order: 1 },
    { track: 'trackC', program: 'Software Engineering', subject: 'Cloud & DevOps Engineering', chapters: 12, priority: 2, order: 2 },
  ],
};

export const DEFAULT_CUSTOM_PROGRAMS: CustomProgramsMap = {
  trackA: [
    { name: 'Computer Science', priority: 1, order: 1, trackId: 'trackA' },
    { name: 'Mathematics', priority: 2, order: 2, trackId: 'trackA' },
  ],
  trackB: [
    { name: 'Competitive Exam', priority: 1, order: 1, trackId: 'trackB' },
  ],
  trackC: [
    { name: 'Software Engineering', priority: 1, order: 1, trackId: 'trackC' },
  ],
};

const DEFAULT_SUBJECT_COLORS: Record<string, string> = {
  'Data Structures & Algorithms': '#3b82f6',
  'Operating Systems': '#06b6d4',
  'Database Management Systems': '#10b981',
  'Discrete Mathematics': '#8b5cf6',
  'Linear Algebra & Calculus': '#ec4899',
  'General Aptitude': '#f59e0b',
  'Reasoning & Logic': '#14b8a6',
  'Fullstack Web Architecture': '#6366f1',
  'Cloud & DevOps Engineering': '#f97316',
  'General Study': '#3b82f6',
};

/**
 * Returns a consistent color hex for a subject.
 */
export function getSubjectColor(subjectName: string, customColors?: Record<string, string>): string {
  if (customColors && customColors[subjectName]) {
    return customColors[subjectName];
  }
  if (DEFAULT_SUBJECT_COLORS[subjectName]) {
    return DEFAULT_SUBJECT_COLORS[subjectName];
  }

  // Consistent hash color fallback
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#06b6d4', '#6366f1', '#14b8a6',
    '#f97316', '#a855f7', '#0ea5e9', '#84cc16'
  ];
  return palette[Math.abs(hash) % palette.length];
}

/**
 * Normalizes raw/legacy tracks, syllabus, and program data into clean, typed NormalizedSubject models.
 */
export function normalizeTaxonomy(
  tracks: Track[] = DEFAULT_TRACKS,
  syllabus: SyllabusStructure = DEFAULT_SYLLABUS,
  passedItems?: PassedItemsState,
  customColors?: Record<string, string>
): NormalizedSubject[] {
  const normalized: NormalizedSubject[] = [];
  const trackMap = new Map<string, Track>();
  tracks.forEach(t => trackMap.set(t.id, t));

  const passedSubjectsSet = new Set(passedItems?.subjects || []);

  Object.entries(syllabus).forEach(([trackId, items]) => {
    const parentTrack = trackMap.get(trackId) || { id: trackId, name: trackId };
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (!item || !item.subject) return;
        const subName = item.subject.trim();
        const pName = (item.program || 'General').trim();
        const isPassed = passedSubjectsSet.has(subName);

        normalized.push({
          id: `sub_${trackId}_${subName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          name: subName,
          trackId: trackId,
          trackName: parentTrack.name,
          program: pName,
          chaptersCount: Math.max(1, Number(item.chapters) || 1),
          priority: item.priority !== undefined ? Number(item.priority) : 3,
          order: item.order !== undefined ? Number(item.order) : 999,
          color: getSubjectColor(subName, customColors),
          isPassed,
        });
      });
    }
  });

  // Sort by track order, priority, then order
  return normalized.sort((a, b) => {
    const tA = trackMap.get(a.trackId)?.order ?? 99;
    const tB = trackMap.get(b.trackId)?.order ?? 99;
    if (tA !== tB) return tA - tB;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.order - b.order;
  });
}

/**
 * Pure selector: groups normalized subjects by program name.
 */
export function groupSubjectsByProgram(subjects: NormalizedSubject[]): Map<string, NormalizedSubject[]> {
  const map = new Map<string, NormalizedSubject[]>();
  subjects.forEach(s => {
    const list = map.get(s.program) || [];
    list.push(s);
    map.set(s.program, list);
  });
  return map;
}

/**
 * Pure selector: groups normalized subjects by track ID.
 */
export function groupSubjectsByTrack(subjects: NormalizedSubject[]): Map<string, NormalizedSubject[]> {
  const map = new Map<string, NormalizedSubject[]>();
  subjects.forEach(s => {
    const list = map.get(s.trackId) || [];
    list.push(s);
    map.set(s.trackId, list);
  });
  return map;
}

/**
 * Pure helper: returns an array of chapter numbers 1..N for a given subject.
 */
export function getChapterNumbers(chaptersCount: number): number[] {
  const count = Math.max(1, Math.floor(chaptersCount));
  return Array.from({ length: count }, (_, i) => i + 1);
}
