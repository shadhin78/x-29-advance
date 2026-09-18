import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMonthRangeKey,
  getWeekRangeKey,
  splitChapterAcrossDays,
  autoSpreadChapters,
  calculateTargetProgress,
} from '../features/targets/services/targetAllocationEngine.ts';

test('getMonthRangeKey formats month range correctly', () => {
  const d = new Date('2026-09-18T10:00:00');
  const key = getMonthRangeKey(d);
  assert.equal(key, '01 Sep 2026 - 30 Sep 2026');
});

test('getWeekRangeKey formats 7-day week range correctly', () => {
  const d = new Date('2026-09-16T10:00:00'); // Wednesday
  const key = getWeekRangeKey(d);
  assert.ok(key.includes('Sep 2026'));
  assert.ok(key.includes(' - '));
});

test('splitChapterAcrossDays divides chapter size accurately', () => {
  const chapterItem = {
    track: 'academic',
    program: 'HSC 2026',
    subject: 'Physics',
    chapter: 'Ch. 1',
    size: 60,
  };

  const days = ['2026-09-01', '2026-09-02', '2026-09-03'];
  const targets = splitChapterAcrossDays(chapterItem, days);

  assert.equal(targets.length, 3);
  assert.equal(targets[0].portionSize, 20);
  assert.equal(targets[1].portionSize, 20);
  assert.equal(targets[2].portionSize, 20);
});

test('autoSpreadChapters in sequential mode assigns dates and weekly ranges', () => {
  const input = {
    chapters: [
      { track: 'academic', program: 'HSC 2026', subject: 'Physics', chapter: 'Ch. 1', size: 30 },
      { track: 'academic', program: 'HSC 2026', subject: 'Physics', chapter: 'Ch. 2', size: 40 },
    ],
    startDate: '2026-09-01',
    daysCount: 30,
    mode: 'sequential',
  };

  const result = autoSpreadChapters(input);
  assert.equal(result.monthlyTargets.length, 2);
  assert.equal(result.dailyTargets.length, 2);
  assert.equal(result.weeklyTargets.length, 2);
  assert.equal(result.monthlyTargets[0].totalChapterSize, 30);
  assert.equal(result.monthlyTargets[1].totalChapterSize, 40);
  assert.ok(result.monthlyTargets[0].targetMonth.includes('Sep 2026'));
});

test('calculateTargetProgress evaluates progress from daily completed records', () => {
  const target = {
    id: 'mt-1',
    track: 'academic',
    program: 'HSC 2026',
    subject: 'Physics',
    chapter: 'Ch. 1',
    totalChapterSize: 40,
    targetMonth: '01 Sep 2026 - 30 Sep 2026',
  };

  const daily = [
    {
      id: 'dt-1',
      monthlyTargetId: 'mt-1',
      subject: 'Physics',
      chapter: 'Ch. 1',
      portionSize: 20,
      completed: true,
      date: '2026-09-02',
    },
    {
      id: 'dt-2',
      monthlyTargetId: 'mt-1',
      subject: 'Physics',
      chapter: 'Ch. 1',
      portionSize: 20,
      completed: false,
      date: '2026-09-03',
    },
  ];

  const progress = calculateTargetProgress(target, daily);
  assert.equal(progress.completedSize, 20);
  assert.equal(progress.percent, 50);
  assert.equal(progress.isCompleted, false);
});
