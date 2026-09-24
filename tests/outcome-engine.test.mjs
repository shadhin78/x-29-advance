import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapCgpaToGrade,
  mapGradeToNumeric,
  validateAndFormatCgpa,
  getProgramTarget,
  groupAndProcessResults,
  calculateCelebrationProgress,
} from '../features/outcome/services/outcomeEngine.ts';

test('mapCgpaToGrade converts CGPA accurately according to X-29 standard scale', () => {
  // 4.0 scale CGPA
  assert.equal(mapCgpaToGrade(4.0), 'A+');
  assert.equal(mapCgpaToGrade(3.9), 'A');
  assert.equal(mapCgpaToGrade(3.75), 'A');
  assert.equal(mapCgpaToGrade(3.6), 'A-');
  assert.equal(mapCgpaToGrade(3.3), 'B+');
  assert.equal(mapCgpaToGrade(3.0), 'B');
  assert.equal(mapCgpaToGrade(2.8), 'B-');
  assert.equal(mapCgpaToGrade(2.55), 'C+');
  assert.equal(mapCgpaToGrade(2.3), 'C');
  assert.equal(mapCgpaToGrade(2.0), 'D');
  assert.equal(mapCgpaToGrade(1.9), 'F');
  assert.equal(mapCgpaToGrade(0), 'F');

  // Letter grade scale
  assert.equal(mapCgpaToGrade(4.0, 'grade'), 'A');
  assert.equal(mapCgpaToGrade(3.2, 'grade'), 'B');
  assert.equal(mapCgpaToGrade(2.5, 'grade'), 'C');
  assert.equal(mapCgpaToGrade(2.0, 'grade'), 'D');
  assert.equal(mapCgpaToGrade(1.5, 'grade'), 'E');
  assert.equal(mapCgpaToGrade(0, 'grade'), 'F');
});

test('mapGradeToNumeric maps letter grades to numerical equivalents', () => {
  assert.equal(mapGradeToNumeric('A+'), 4.0);
  assert.equal(mapGradeToNumeric('A'), 3.75);
  assert.equal(mapGradeToNumeric('A-'), 3.50);
  assert.equal(mapGradeToNumeric('B+'), 3.25);
  assert.equal(mapGradeToNumeric('B'), 3.00);
  assert.equal(mapGradeToNumeric('C'), 2.25);
  assert.equal(mapGradeToNumeric('D'), 2.00);
  assert.equal(mapGradeToNumeric('F'), 0.00);

  // Eval type 'grade'
  assert.equal(mapGradeToNumeric('A', 'grade'), 4.0);
  assert.equal(mapGradeToNumeric('B', 'grade'), 3.0);
  assert.equal(mapGradeToNumeric('C', 'grade'), 2.25);
  assert.equal(mapGradeToNumeric('D', 'grade'), 2.0);
  assert.equal(mapGradeToNumeric('E', 'grade'), 0.0);
  assert.equal(mapGradeToNumeric('F', 'grade'), 0.0);
});

test('validateAndFormatCgpa constrains values to 0.00 - 4.00 with 2 decimals', () => {
  assert.equal(validateAndFormatCgpa('3.8'), '3.80');
  assert.equal(validateAndFormatCgpa('4'), '4.00');
  assert.equal(validateAndFormatCgpa('5.5'), '4.00'); // capped
  assert.equal(validateAndFormatCgpa('-1.5'), '0.00'); // min
  assert.equal(validateAndFormatCgpa(''), '');
});

test('getProgramTarget resolves target CGPA and grade correctly', () => {
  const customProgs = {
    track1: [{ name: 'BSc CSE', targetCGPA: '3.75' }],
  };
  const target = getProgramTarget('BSc CSE', customProgs, []);
  assert.equal(target.targetCGPA, '3.75');
  assert.equal(target.targetGrade, 'A');

  // Fallback to historical results if not in customPrograms
  const history = [
    { id: '1', type: 'cgpa', title: 'MSc Data', targetCGPA: '3.90', date: '2026-01-01' },
  ];
  const targetHistory = getProgramTarget('MSc Data', {}, history);
  assert.equal(targetHistory.targetCGPA, '3.90');
  assert.equal(targetHistory.targetGrade, 'A');
});

test('groupAndProcessResults: edge case with all A+ courses', () => {
  const mockRawResults = [
    { id: '1', type: 'cgpa', title: 'Top Program', subject: 'Course 1', value: '4.00', date: '2026-06-01' },
    { id: '2', type: 'cgpa', title: 'Top Program', subject: 'Course 2', value: '4.00', date: '2026-06-01' },
  ];
  const allSubs = [
    { program: 'Top Program', subject: 'Course 1' },
    { program: 'Top Program', subject: 'Course 2' },
  ];
  const customProgs = {
    track1: [{ name: 'Top Program', targetCGPA: '3.80' }],
  };

  const processed = groupAndProcessResults(mockRawResults, allSubs, customProgs);
  assert.equal(processed.length, 1);
  assert.equal(processed[0].computedCgpa, '4.00');
  assert.equal(processed[0].computedGrade, 'A+');
  assert.equal(processed[0].isGoalMet, true);
});

test('groupAndProcessResults: edge case with mixed grades and failed courses', () => {
  const mockRawResults = [
    { id: '1', type: 'cgpa', title: 'Mixed Program', subject: 'Math', value: '3.75', date: '2026-06-01' },
    { id: '2', type: 'cgpa', title: 'Mixed Program', subject: 'Physics', value: '0.00', grade: 'F', date: '2026-06-01' },
  ];
  const allSubs = [
    { program: 'Mixed Program', subject: 'Math' },
    { program: 'Mixed Program', subject: 'Physics' },
  ];
  const customProgs = {
    track1: [{ name: 'Mixed Program', targetCGPA: '3.00' }],
  };

  const processed = groupAndProcessResults(mockRawResults, allSubs, customProgs);
  assert.equal(processed.length, 1);
  // (3.75 + 0.00) / 2 = 1.875 -> '1.88'
  assert.equal(processed[0].computedCgpa, '1.88');
  assert.equal(processed[0].computedGrade, 'F'); // < 2.0 -> F
  assert.equal(processed[0].isGoalMet, false); // 1.88 < 3.00
});

test('calculateCelebrationProgress measures core course completion', () => {
  const allSubs = [
    { program: 'Core Prog', subject: 'Subject 1' },
    { program: 'Core Prog', subject: 'Subject 2' },
  ];

  const passed = { programs: [], subjects: ['Subject 1'] };
  const celebrationTargets = { programs: [], subjects: [] }; // default: all

  const progress = calculateCelebrationProgress(allSubs, celebrationTargets, passed);
  assert.equal(progress.totalCore, 2);
  assert.equal(progress.passedCore, 1);
  assert.equal(progress.percent, 50);
  assert.equal(progress.isCelebrated, false);

  // Passing Subject 2 completes celebration
  passed.subjects.push('Subject 2');
  const progress2 = calculateCelebrationProgress(allSubs, celebrationTargets, passed);
  assert.equal(progress2.passedCore, 2);
  assert.equal(progress2.percent, 100);
  assert.equal(progress2.isCelebrated, true);
});
