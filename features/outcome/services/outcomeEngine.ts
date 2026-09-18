/**
 * X-29 Outcome Calculation Engine (features/outcome/services/outcomeEngine.ts)
 * 
 * Pure mathematical and data transformation functions:
 * - CGPA <-> Letter Grade conversions
 * - Numeric GPA validation and formatting
 * - Program-level result grouping and dynamic CGPA estimation
 * - Milestone celebration criteria fulfillment calculation
 * 
 * Contains NO React, DOM, or persistence dependencies.
 */

import type {
  SuccessResult,
  CelebrationTargets,
  OutcomeProgramGroup,
} from '@/types/outcome';

/**
 * Maps numeric CGPA value to letter grade (4.0 scale).
 */
export function mapCgpaToGrade(cgpa: number | string, evalType: 'cgpa' | 'grade' = 'cgpa'): string {
  const v = typeof cgpa === 'number' ? cgpa : parseFloat(cgpa);
  if (isNaN(v)) return '';

  if (evalType === 'grade') {
    if (v >= 4.0) return 'A';
    if (v >= 3.0) return 'B';
    if (v >= 2.25) return 'C';
    if (v >= 2.0) return 'D';
    if (v >= 0.01) return 'E';
    return 'F';
  } else {
    if (v >= 4.0) return 'A+';
    if (v >= 3.75) return 'A';
    if (v >= 3.5) return 'A-';
    if (v >= 3.25) return 'B+';
    if (v >= 3.0) return 'B';
    if (v >= 2.75) return 'B-';
    if (v >= 2.5) return 'C+';
    if (v >= 2.25) return 'C';
    if (v >= 2.0) return 'D';
    return 'F';
  }
}

/**
 * Maps letter grade to numeric grade point equivalent.
 */
export function mapGradeToNumeric(grade: string, evalType: 'cgpa' | 'grade' = 'cgpa'): number {
  if (!grade) return 0.0;
  const g = String(grade).toUpperCase().trim();

  if (evalType === 'grade') {
    switch (g) {
      case 'A': return 4.0;
      case 'B': return 3.0;
      case 'C': return 2.25;
      case 'D': return 2.00;
      case 'E': return 0.0;
      case 'F': return 0.0;
      default: return 0.0;
    }
  } else {
    switch (g) {
      case 'A+': return 4.0;
      case 'A': return 3.75;
      case 'A-': return 3.50;
      case 'B+': return 3.25;
      case 'B': return 3.00;
      case 'B-': return 2.75;
      case 'C+': return 2.50;
      case 'C': return 2.25;
      case 'D': return 2.00;
      case 'F': return 0.00;
      default: return 0.0;
    }
  }
}

/**
 * Validates and formats CGPA input string to two decimal places (0.00 - 4.00).
 */
export function validateAndFormatCgpa(valStr: string): string {
  if (!valStr || String(valStr).trim() === '') return '';
  let val = parseFloat(valStr);
  if (isNaN(val)) return '';
  if (val < 0) val = 0.0;
  if (val > 4.0) val = 4.0;
  return val.toFixed(2);
}

/**
 * Resolves main target CGPA and Grade for a program.
 */
export function getProgramTarget(
  programName: string,
  customPrograms: Record<string, any>,
  historicalResults: SuccessResult[]
): { targetCGPA: string; targetGrade: string } {
  let targetCGPA = '';

  for (const trackId in customPrograms) {
    const list = customPrograms[trackId];
    if (Array.isArray(list)) {
      const p = list.find((item) => (typeof item === 'string' ? item : item.name) === programName);
      if (p && typeof p === 'object' && p.targetCGPA !== undefined && p.targetCGPA !== null) {
        targetCGPA = String(p.targetCGPA).trim();
        if (targetCGPA) break;
      }
    }
  }

  if (!targetCGPA) {
    const records = historicalResults
      .filter((r) => r.type === 'cgpa' && !r.subject && r.title === programName && r.targetCGPA)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (records.length > 0 && records[0].targetCGPA) {
      targetCGPA = String(records[0].targetCGPA).trim();
    }
  }

  let targetGrade = '';
  if (targetCGPA) {
    if (targetCGPA.toLowerCase() === 'none' || targetCGPA === '0') {
      targetCGPA = 'none';
      targetGrade = 'none';
    } else {
      targetGrade = mapCgpaToGrade(targetCGPA);
    }
  }

  return { targetCGPA, targetGrade };
}

/**
 * Groups and calculates outcome results into cohesive program scorecards.
 */
export function groupAndProcessResults(
  rawResults: SuccessResult[],
  allSubjects: { program: string; subject: string }[],
  customPrograms: Record<string, any>
): OutcomeProgramGroup[] {
  const groups: Record<string, { program: string; date: string; overall: SuccessResult | null; subjects: SuccessResult[] }> = {};

  rawResults.forEach((res) => {
    if (res.type !== 'cgpa') return;
    const prog = res.title || '';
    const date = res.date || '';
    const key = `${prog}|||${date}`;

    if (!groups[key]) {
      groups[key] = {
        program: prog,
        date,
        overall: null,
        subjects: [],
      };
    }

    if (!res.subject) {
      groups[key].overall = { ...res };
    } else {
      groups[key].subjects.push({ ...res });
    }
  });

  const output: OutcomeProgramGroup[] = [];

  for (const key in groups) {
    const grp = groups[key];
    const overall = grp.overall;
    const subjects = grp.subjects;

    const evalType: 'cgpa' | 'grade' =
      overall?.evaluationType || subjects[0]?.evaluationType || 'cgpa';
    const isGrade = evalType === 'grade';

    const progSubjects = allSubjects.filter((s) => s.program === grp.program);
    const totalCount = progSubjects.length;

    let sum = 0;
    progSubjects.forEach((ps) => {
      const res = subjects.find((s) => s.subject === ps.subject);
      if (res) {
        if (isGrade) {
          if (res.grade && res.grade.trim() !== '' && res.grade !== 'F') {
            sum += mapGradeToNumeric(res.grade, 'grade');
          }
        } else {
          const val = parseFloat(res.value || '0');
          if (!isNaN(val) && val > 0) {
            sum += val;
          }
        }
      }
    });

    let computedCgpa = '';
    let computedGrade = '';
    let isEstimated = false;

    if (totalCount > 0) {
      const avg = sum / totalCount;
      computedCgpa = avg.toFixed(2);
      computedGrade = mapCgpaToGrade(avg, evalType);
    }

    if (overall) {
      if (isGrade) {
        computedGrade = overall.grade || computedGrade;
        computedCgpa = overall.value || (overall.grade ? mapGradeToNumeric(overall.grade, evalType).toFixed(2) : computedCgpa);
      } else {
        computedCgpa = overall.value || computedCgpa;
        computedGrade = overall.grade || (overall.value ? mapCgpaToGrade(overall.value, evalType) : computedGrade);
      }
      isEstimated = !!overall.isEstimated;
    } else {
      isEstimated = true;
    }

    const { targetCGPA, targetGrade } = getProgramTarget(grp.program, customPrograms, rawResults);

    // Goal met check
    let isGoalMet = false;
    if (isGrade) {
      if (computedGrade && targetGrade && targetGrade !== 'none') {
        isGoalMet = mapGradeToNumeric(computedGrade, 'grade') >= mapGradeToNumeric(targetGrade, 'grade');
      }
    } else {
      if (computedCgpa && targetCGPA && targetCGPA !== 'none') {
        isGoalMet = parseFloat(computedCgpa) >= parseFloat(targetCGPA);
      }
    }

    output.push({
      id: overall?.id || `prog_${grp.program}_${grp.date}`,
      program: grp.program,
      date: grp.date,
      evaluationType: evalType,
      overall,
      subjects,
      computedCgpa,
      computedGrade,
      isEstimated,
      targetCGPA: overall?.targetCGPA || targetCGPA,
      targetGrade: overall?.targetGrade || targetGrade,
      isGoalMet,
    });
  }

  return output;
}

/**
 * Calculates milestone celebration criteria progress.
 */
export function calculateCelebrationProgress(
  allSubjects: { subject: string; program: string }[],
  celebrationTargets: CelebrationTargets,
  passedItems: { programs: string[]; subjects: string[] }
): {
  totalCore: number;
  passedCore: number;
  percent: number;
  isCelebrated: boolean;
  isCustom: boolean;
} {
  const isCustom =
    (celebrationTargets.programs && celebrationTargets.programs.length > 0) ||
    (celebrationTargets.subjects && celebrationTargets.subjects.length > 0);

  let targetSubjectList: { subject: string; program: string }[] = [];

  if (isCustom) {
    const progSet = new Set(celebrationTargets.programs || []);
    const subSet = new Set(celebrationTargets.subjects || []);

    targetSubjectList = allSubjects.filter(
      (s) => progSet.has(s.program) || subSet.has(s.subject)
    );
  } else {
    // Default mode: all subjects are required
    targetSubjectList = allSubjects;
  }

  const totalCore = targetSubjectList.length;
  if (totalCore === 0) {
    return {
      totalCore: 0,
      passedCore: 0,
      percent: 0,
      isCelebrated: false,
      isCustom,
    };
  }

  const passedProgSet = new Set(passedItems.programs || []);
  const passedSubSet = new Set(passedItems.subjects || []);

  let passedCore = 0;
  targetSubjectList.forEach((s) => {
    if (passedProgSet.has(s.program) || passedSubSet.has(s.subject)) {
      passedCore++;
    }
  });

  const percent = Math.min(100, Math.round((passedCore / totalCore) * 100));
  const isCelebrated = totalCore > 0 && passedCore >= totalCore;

  return {
    totalCore,
    passedCore,
    percent,
    isCelebrated,
    isCustom,
  };
}
