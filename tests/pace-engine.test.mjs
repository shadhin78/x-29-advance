import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveTargetedSubjects,
  calculatePaceStats,
  buildPaceTrendChartData,
  buildPaceCandleData,
  formatDateResponsive,
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

  // Global goal defaults to all subjects
  const globalGoal = {
    id: 'g3',
    type: 'global',
    target: 'All Target',
    startDate: '2026-01-01',
    deadline: '2026-10-31',
  };
  const subs3 = resolveTargetedSubjects(globalGoal, allSubs);
  assert.equal(subs3.size, 3);
});

test('calculatePaceStats calculates velocity and projected finish accurately', () => {
  const goal = {
    id: 'g1',
    type: 'subject',
    target: 'Algorithms',
    startDate: '2026-01-01',
    deadline: '2026-01-31',
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
  assert.ok(stats.timeGoalCountdownStr?.includes('Days Left'));
});

test('calculatePaceStats handles finished status when completed >= total', () => {
  const goal = {
    id: 'g_done',
    type: 'subject',
    target: 'Data Structures',
    startDate: '2026-01-01',
    deadline: '2026-01-31',
  };

  const targeted = new Set(['Data Structures']);
  const subjectStats = {
    'Data Structures': { totalChapters: 20, completedChapters: 20 },
  };

  const stats = calculatePaceStats(goal, targeted, subjectStats, new Date('2026-01-15'));
  assert.equal(stats.status, 'finished');
  assert.equal(stats.remaining, 0);
  assert.equal(stats.finishDisplay, 'Finished');
  assert.equal(stats.timeGoalCountdownStr, 'Done');
  assert.equal(stats.estDaysNeededStr, '0 Days');
});

test('calculatePaceStats handles overdue and future status cleanly', () => {
  // 1. Future goal
  const futureGoal = {
    id: 'g_future',
    type: 'subject',
    target: 'Future Topic',
    startDate: '2026-06-01',
    deadline: '2026-12-31',
  };
  const statsFuture = calculatePaceStats(
    futureGoal,
    new Set(['Future Topic']),
    { 'Future Topic': { totalChapters: 10, completedChapters: 0 } },
    new Date('2026-01-01')
  );
  assert.equal(statsFuture.status, 'future');
  assert.equal(statsFuture.finishDisplay, 'Future');

  // 2. Overdue goal
  const overdueGoal = {
    id: 'g_overdue',
    type: 'subject',
    target: 'Late Topic',
    startDate: '2025-01-01',
    deadline: '2025-06-01',
  };
  const statsOverdue = calculatePaceStats(
    overdueGoal,
    new Set(['Late Topic']),
    { 'Late Topic': { totalChapters: 10, completedChapters: 2 } },
    new Date('2026-01-01')
  );
  assert.equal(statsOverdue.status, 'overdue');
  assert.ok(statsOverdue.timeGoalCountdownStr?.includes('Overdue'));
});

test('buildPaceTrendChartData produces valid trajectories', () => {
  const goal = {
    id: 'g_trend',
    type: 'global',
    target: 'Semester Goal',
    startDate: '2026-01-01',
    deadline: '2026-06-30',
  };
  const stats = {
    total: 100,
    completed: 40,
    remaining: 60,
    percentage: 40,
    totalDays: 180,
    daysElapsed: 60,
    daysRemaining: 120,
    reqPace: 0.5,
    curPace: 0.67,
    projectedFinish: '2026-05-15',
    daysNeeded: 90,
    isBehind: false,
    status: 'on-track',
  };

  const chart = buildPaceTrendChartData(stats, goal, 10);
  assert.equal(chart.labels.length, 11);
  assert.equal(chart.reqTrajectory.length, 11);
  assert.equal(chart.reqTrajectory[0], 0);
  assert.equal(chart.reqTrajectory[10], 100);
});

test('buildPaceCandleData creates interval candles', () => {
  const candles = buildPaceCandleData(7);
  assert.equal(candles.length, 7);
  candles.forEach((c) => {
    assert.ok(c.date);
    assert.ok(c.high >= Math.max(c.open, c.close));
    assert.ok(c.low <= Math.min(c.open, c.close));
    assert.equal(typeof c.isBullish, 'boolean');
  });
});

test('formatDateResponsive formats valid dates cleanly', () => {
  const formatted = formatDateResponsive('2026-10-31');
  assert.ok(formatted.includes('31'));
  assert.ok(formatted.includes('Oct'));
  assert.ok(formatted.includes('2026'));
});
