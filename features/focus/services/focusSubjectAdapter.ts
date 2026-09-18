/**
 * X-29 Focus Subject & Target Adapter (features/focus/services/focusSubjectAdapter.ts)
 * 
 * Bridges taxonomy domain service into the Focus Studio.
 */

import {
  normalizeTaxonomy,
  groupSubjectsByProgram,
  getSubjectColor as taxonomyGetSubjectColor,
  DEFAULT_TRACKS,
  DEFAULT_SYLLABUS,
} from '@/features/taxonomy/services/taxonomyService';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';

export interface ProgramSubjectGroup {
  program: string;
  subjects: string[];
}

/**
 * Loads program-grouped subjects from authoritative useTaxonomyStore or defaults.
 */
export function getAvailableSubjectGroups(): ProgramSubjectGroup[] {
  try {
    const state = useTaxonomyStore.getState();
    const subjects = state.getNormalizedSubjects();
    const grouped = groupSubjectsByProgram(subjects);

    const groups: ProgramSubjectGroup[] = [];
    grouped.forEach((subs, programName) => {
      groups.push({
        program: programName,
        subjects: subs.map(s => s.name),
      });
    });

    if (groups.length > 0) {
      return [
        { program: 'General', subjects: ['General Study'] },
        ...groups,
      ];
    }
  } catch {}

  const defaultNorm = normalizeTaxonomy(DEFAULT_TRACKS, DEFAULT_SYLLABUS);
  const defaultGrouped = groupSubjectsByProgram(defaultNorm);
  const fallbackGroups: ProgramSubjectGroup[] = [
    { program: 'General', subjects: ['General Study'] },
  ];
  defaultGrouped.forEach((subs, prog) => {
    fallbackGroups.push({ program: prog, subjects: subs.map(s => s.name) });
  });
  return fallbackGroups;
}

/**
 * Resolves a visual color hex for a given subject name.
 */
export function getSubjectColor(subject: string): string {
  try {
    const colors = useTaxonomyStore.getState().subjectColors;
    return taxonomyGetSubjectColor(subject, colors);
  } catch {
    return taxonomyGetSubjectColor(subject);
  }
}
