/**
 * X-29 Outcome Types (types/outcome.ts)
 */

export interface SuccessResult {
  id: string;
  type: 'cgpa' | 'achievement' | string;
  evaluationType?: 'cgpa' | 'grade';
  title: string; // e.g. Program Name (BSc CSE)
  subject?: string; // empty string for overall program result, or subject name
  value?: string; // numeric CGPA string, e.g. "3.85"
  grade?: string; // letter grade, e.g. "A"
  targetGrade?: string;
  targetCGPA?: string;
  date: string;
  notes?: string;
  isEstimated?: boolean;
}

export interface CelebrationTargets {
  programs: string[];
  subjects: string[];
}

export interface OutcomeProgramGroup {
  id: string;
  program: string;
  date: string;
  evaluationType: 'cgpa' | 'grade';
  overall: SuccessResult | null;
  subjects: SuccessResult[];
  computedCgpa: string;
  computedGrade: string;
  isEstimated: boolean;
  targetCGPA?: string;
  targetGrade?: string;
  isGoalMet: boolean;
}
