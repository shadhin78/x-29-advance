import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveTargetedSubjects,
  calculatePaceStats,
} from '../features/pace/services/paceEngine.ts';

test('resolveTargetedSubjects resolves subjects by goal type', () => {
  const allSubs = [
    { subject: 'Operating Systems', program: 'BSc CSE' },
    { subject: 'Database Systems', program: 'BSc CSE' },
    { subject: 'Discrete Math', program: 'Math' },
  ];

  // Program goal
  const progGoal = {
    id: 'g1',
    type: 'program',
    target: 'BSc CSE',
    startDate: '2026-01-01',
    deadline: '2026-10-31',
  };
  const subs1 = resolveTargetedSubjects(progGoal, allSubs);
  assert.equal(subs1.size, 2);
  assert.ok(subs1.has('Operating Systems'));
  assert.ok(subs1.has('Database Systems'));

  // Bundle goal with subjects
  const bundleGoal = {
    id: 'g2',
    type: 'bundle',
    target: 'Custom Bundle',
    startDate: '2026-01-01',
    deadline: '2026-10-31',
    subjects: ['Discrete Math'],
  };
  const subs2 = resolveTargetedSubjects(bundleGoal, allSubs);
  assert.equal(subs2.size, 1);
  assert.ok(subs2.has('Discrete Math'));
});

test('calculatePaceStats calculates velocity and projected finish accurately', () => {
  const goal = {
    id: 'g1',
    type: 'subject',
    target: 'Algorithms',
    startDate: '2026-01-01',
    deadline: '2026-01-31', // 30 days
  };

  const targeted = new Set(['Algorithms']);
  const subjectStats = {
    Algorithms: { totalChapters: 30, completedChapters: 10 },
  };

  // Mock Date: 2026-01-11 (10 days elapsed, 20 days remaining)
  const mockNow = new Date('2026-01-11T12:00:00');
  const stats = calculatePaceStats(goal, targeted, subjectStats, mockNow);

  assert.equal(stats.total, 30);
  assert.equal(stats.completed, 10);
  assert.equal(stats.remaining, 20);
  assert.equal(stats.percentage, 33);
  assert.equal(stats.daysRemaining, 21);
  // reqPace = 20 remaining / 21 days = ~0.95 Ch/day
  assert.equal(stats.reqPace, 0.95);
  // curPace = 10 completed / 11 days elapsed = ~0.91 Ch/day
  assert.equal(stats.curPace, 0.91);
  assert.equal(stats.isBehind, true); // 0.91 < 0.95
});
