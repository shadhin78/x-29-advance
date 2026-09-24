/**
 * X-29 Curriculum Taxonomy & Tracks Types
 */

export interface Track {
  id: string;
  name: string;
  priority?: number;
  order?: number;
  color?: string;
  badge?: string;
}

export interface DashboardHeaderConfig {
  topTag: string;
  mainTitle: string;
  subTitle: string;
}

export interface Program {
  name: string;
  priority?: number;
  order?: number;
  trackId?: string;
  _trackId?: string;
  _trackName?: string;
  isPassed?: boolean;
  targetCGPA?: string | number;
}

export interface SyllabusItem {
  track: string;
  subject: string;
  program: string;
  chapters: number;
  priority?: number;
  order?: number;
}

export interface SyllabusStructure {
  [trackId: string]: SyllabusItem[];
}

export interface CustomProgramsMap {
  [trackId: string]: Program[];
}

export interface NormalizedSubject {
  id: string;
  name: string;
  trackId: string;
  trackName: string;
  program: string;
  chaptersCount: number;
  priority: number;
  order: number;
  color: string;
  isPassed: boolean;
}

export interface PassedItemsState {
  programs: string[];
  subjects: string[];
}

export interface SubjectTimeLink {
  type: 'date' | 'goal';
  startDate?: string;
  date?: string;
  id?: string;
}

export interface RevisionDataState {
  active: string[];
  progress: Record<string, Record<number, boolean>>;
}
