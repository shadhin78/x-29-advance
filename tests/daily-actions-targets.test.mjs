import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  getMonthRangeKey,
  getWeekRangeKey,
  splitChapterAcrossDays,
  autoSpreadChapters,
  calculateTargetProgress,
} from '../features/targets/services/targetAllocationEngine.ts';

import { calculateHabitRadar } from '../features/analytics/services/analyticsService.ts';

test('Target Cascading: Batch allocation generates coherent Monthly -> Weekly -> Daily targets', () => {
  const result = autoSpreadChapters({
    chapters: [
      {
        track: 'academic',
        program: 'Computer Science',
        subject: 'Algorithms',
        chapter: 'Ch. 1',
        size: 20,
      },
      {
        track: 'academic',
        program: 'Computer Science',
        subject: 'Algorithms',
        chapter: 'Ch. 2',
        size: 30,
      },
    ],
    startDate: '2026-06-01',
    daysCount: 30,
    mode: 'sequential',
  });

  assert.equal(result.monthlyTargets.length, 2);
  assert.equal(result.weeklyTargets.length, 2);
  assert.equal(result.dailyTargets.length, 2);

  const mt1 = result.monthlyTargets[0];
  assert.equal(mt1.chapter, 'Ch. 1');
  assert.equal(mt1.totalChapterSize, 20);

  const wt1 = result.weeklyTargets[0];
  assert.equal(wt1.chapter, 'Ch. 1');
  assert.equal(wt1.monthlyTargetId, mt1.id);

  const dt1 = result.dailyTargets[0];
  assert.equal(dt1.chapter, 'Ch. 1');
  assert.equal(dt1.monthlyTargetId, mt1.id);
  assert.equal(dt1.weeklyTargetId, wt1.id);
  assert.equal(dt1.portionSize, 20);
});

test('Target Progress & Completion Cascade: all daily targets completed marks monthly completed', () => {
  const mt = {
    id: 'mt_test_1',
    track: 'academic',
    program: 'CS',
    subject: 'Algorithms',
    chapter: 'Ch. 1',
    totalChapterSize: 20,
    targetMonth: '01 Jun 2026 - 30 Jun 2026',
  };

  const daily = [
    {
      id: 'dt_1',
      monthlyTargetId: 'mt_test_1',
      track: 'academic',
      program: 'CS',
      subject: 'Algorithms',
      chapter: 'Ch. 1',
      date: '2026-06-01',
      portionSize: 10,
      completed: true,
    },
    {
      id: 'dt_2',
      monthlyTargetId: 'mt_test_1',
      track: 'academic',
      program: 'CS',
      subject: 'Algorithms',
      chapter: 'Ch. 1',
      date: '2026-06-02',
      portionSize: 10,
      completed: false,
    },
  ];

  const p1 = calculateTargetProgress(mt, daily);
  assert.equal(p1.completedSize, 10);
  assert.equal(p1.percent, 50);
  assert.equal(p1.isCompleted, false);

  // Complete second target
  daily[1].completed = true;
  const p2 = calculateTargetProgress(mt, daily);
  assert.equal(p2.completedSize, 20);
  assert.equal(p2.percent, 100);
  assert.equal(p2.isCompleted, true);
});

test('Habit Radar and Streak: computes adherence matrix and streaks across days', () => {
  const habits = [
    {
      id: 'gym',
      name: 'Physical Fitness & Gym',
      title: 'Physical Fitness & Gym',
      history: {
        '2026-06-01': true,
        '2026-06-02': true,
        '2026-06-03': true,
      },
    },
    {
      id: 'code',
      name: 'Core Engineering / Code',
      title: 'Core Engineering / Code',
      history: {
        '2026-06-01': true,
        '2026-06-02': false,
        '2026-06-03': true,
      },
    },
  ];

  const radar = calculateHabitRadar(habits, new Date('2026-06-15T00:00:00Z'));
  assert.equal(radar.habits.length, 2);
  assert.equal(radar.daysInMonth, 30);
  assert.ok(radar.fulfilledCount >= 5);
});
