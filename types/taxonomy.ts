/**
 * X-29 Curriculum Taxonomy & Tracks Types
 */

export interface Track {
  id: string;
  name: string;
  order?: number;
  color?: string;
  badge?: string;
}

export interface Program {
  name: string;
  priority?: number;
  order?: number;
  trackId?: string;
  _trackId?: string;
  _trackName?: string;
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
