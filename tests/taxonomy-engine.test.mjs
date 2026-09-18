/**
 * Unit Test Suite for X-29 Taxonomy Domain Engine
 */

import assert from 'node:assert';
import {
  DEFAULT_TRACKS,
  DEFAULT_SYLLABUS,
  normalizeTaxonomy,
  groupSubjectsByProgram,
  groupSubjectsByTrack,
  getChapterNumbers,
  getSubjectColor,
} from '../features/taxonomy/services/taxonomyService.ts';

console.log('\n=== Testing X-29 Taxonomy Domain Engine (taxonomyService.ts) ===\n');

// 1. normalizeTaxonomy
console.log('1. Testing normalizeTaxonomy...');
const normalized = normalizeTaxonomy(DEFAULT_TRACKS, DEFAULT_SYLLABUS);
assert.ok(Array.isArray(normalized));
assert.strictEqual(normalized.length, 9); // 5 in trackA, 2 in trackB, 2 in trackC

const first = normalized[0];
assert.strictEqual(first.trackId, 'trackA');
assert.ok(first.chaptersCount > 0);
assert.ok(typeof first.color === 'string' && first.color.startsWith('#'));

// 2. Passed items flag
console.log('2. Testing passedItems flag in normalizeTaxonomy...');
const passedNorm = normalizeTaxonomy(DEFAULT_TRACKS, DEFAULT_SYLLABUS, {
  programs: [],
  subjects: ['Data Structures & Algorithms'],
});
const dsa = passedNorm.find(s => s.name === 'Data Structures & Algorithms');
assert.ok(dsa);
assert.strictEqual(dsa.isPassed, true);

// 3. groupSubjectsByProgram
console.log('3. Testing groupSubjectsByProgram...');
const byProgram = groupSubjectsByProgram(normalized);
assert.ok(byProgram.has('Computer Science'));
assert.strictEqual(byProgram.get('Computer Science')?.length, 3);
assert.ok(byProgram.has('Mathematics'));
assert.strictEqual(byProgram.get('Mathematics')?.length, 2);

// 4. groupSubjectsByTrack
console.log('4. Testing groupSubjectsByTrack...');
const byTrack = groupSubjectsByTrack(normalized);
assert.strictEqual(byTrack.get('trackA')?.length, 5);
assert.strictEqual(byTrack.get('trackB')?.length, 2);
assert.strictEqual(byTrack.get('trackC')?.length, 2);

// 5. getChapterNumbers
console.log('5. Testing getChapterNumbers...');
assert.deepStrictEqual(getChapterNumbers(4), [1, 2, 3, 4]);
assert.deepStrictEqual(getChapterNumbers(1), [1]);

// 6. getSubjectColor
console.log('6. Testing getSubjectColor...');
assert.strictEqual(getSubjectColor('Data Structures & Algorithms'), '#3b82f6');
assert.ok(getSubjectColor('Unknown Random Subject').startsWith('#'));

console.log('\n>>> ALL TAXONOMY ENGINE TESTS PASSED! <<<\n');
