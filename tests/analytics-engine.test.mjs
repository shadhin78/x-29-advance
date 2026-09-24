import test from 'node:test';
import assert from 'node:assert';
import {
  calculateCompletionRate,
  calculateRequiredPace,
  calculateDaysRemaining,
  getHeatmapTier,
  calculateFocusHeatmap,
  calculatePolarArc,
  calculateChapterMap,
  calculateHabitRadar,
  calculateFocusAnalyticsMetrics,
  calculateProgramTrends,
  calculateDailyActionMonthlyTrends,
} from '../features/analytics/services/analyticsService.ts';

test('calculateCompletionRate calculates percentages accurately excluding skipped', () => {
  assert.strictEqual(calculateCompletionRate(10, 20, 0), 50.0);
  assert.strictEqual(calculateCompletionRate(15, 20, 5), 100.0);
  assert.strictEqual(calculateCompletionRate(0, 0, 0), 0);
});

test('calculateRequiredPace calculates chapters per day', () => {
  assert.strictEqual(calculateRequiredPace(20, 10), 2.0);
  assert.strictEqual(calculateRequiredPace(15, 0), 15);
  assert.strictEqual(calculateRequiredPace(0, 10), 0);
});

test('calculateDaysRemaining computes future days correctly', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 5);
  assert.strictEqual(calculateDaysRemaining(tomorrow), 5);
});

test('getHeatmapTier categorizes hours into correct color tiers', () => {
  assert.strictEqual(getHeatmapTier(0), 'zero');
  assert.strictEqual(getHeatmapTier(1.5), 'rose');
  assert.strictEqual(getHeatmapTier(3.0), 'blue');
  assert.strictEqual(getHeatmapTier(5.0), 'green');
  assert.strictEqual(getHeatmapTier(7.0), 'gold');
  assert.strictEqual(getHeatmapTier(9.0), 'diamond');
});

test('calculateFocusHeatmap computes weeks and streak from timer logs', () => {
  const logs = [
    { date: new Date().toISOString(), duration: 7200, subject: 'Physics' },
  ];
  const { weeks, stats } = calculateFocusHeatmap(logs, 30);
  assert.ok(weeks.length >= 4);
  assert.strictEqual(stats.activeDays, 1);
  assert.strictEqual(stats.streak, 1);
  assert.strictEqual(stats.rose, undefined);
  assert.strictEqual(stats.redCount, 1); // 2 hours = 7200 sec = rose/red
});

test('calculatePolarArc returns valid SVG path string', () => {
  const path = calculatePolarArc(0, 0, 50, 100, 0, Math.PI / 2);
  assert.ok(path.startsWith('M'));
  assert.ok(path.includes('A 100'));
  assert.ok(path.includes('Z'));
});

test('calculateHabitRadar computes monthly commitment stats', () => {
  const now = new Date();
  const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const habits = [
    {
      id: 'h1',
      name: 'Deep Work',
      history: { [dStr]: true },
    },
  ];

  const radar = calculateHabitRadar(habits, now);
  assert.strictEqual(radar.habits.length, 1);
  assert.ok(radar.fulfilledCount >= 1);
  assert.strictEqual(radar.daysLogged, 1);
  assert.strictEqual(radar.streak, 1);
});

test('calculateChapterMap generates chapter items and completion stats accurately', () => {
  const subjects = [
    {
      id: 'sub1',
      name: 'Calculus',
      trackId: 'stem',
      trackName: 'STEM',
      program: 'Maths',
      chaptersCount: 3,
      priority: 1,
      order: 1,
      color: '#3b82f6',
      isPassed: false,
    },
  ];
  const tasks = [
    { id: 't1', date: '2026-09-01', track: 'stem', subject: 'Calculus', chapter: 1, completed: true },
    { id: 't2', date: '2026-09-02', track: 'stem', subject: 'Calculus', chapter: 2, completed: false, skipped: true },
    { id: 't3', date: '2026-09-03', track: 'stem', subject: 'Calculus', chapter: 3, completed: false },
  ];

  const res = calculateChapterMap(subjects, tasks, 'global');
  assert.strictEqual(res.chapters.length, 3);
  assert.strictEqual(res.stats.completed, 1);
  assert.strictEqual(res.stats.skipped, 1);
  assert.strictEqual(res.stats.incomplete, 1);
  assert.strictEqual(res.stats.completionPercentage, 50.0); // 1 / (3 - 1) * 100
});

test('calculateFocusAnalyticsMetrics computes metrics and points across 1D and 30D', () => {
  const now = new Date();
  const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const logs = [
    { date: dStr, duration: 14400 }, // 4.0 hours
  ];

  // 1-Day view
  const day1Res = calculateFocusAnalyticsMetrics(logs, 1, 'daily', 4.0, 0, now);
  assert.strictEqual(day1Res.points.length, 8);
  assert.strictEqual(day1Res.totalFocusHours, 4.0);
  assert.strictEqual(day1Res.successRate, 100);

  // 30-Day view
  const day30Res = calculateFocusAnalyticsMetrics(logs, 30, 'daily', 4.0, 0, now);
  assert.strictEqual(day30Res.points.length, 30);
  assert.strictEqual(day30Res.totalFocusHours, 4.0);
  assert.ok(day30Res.avgFocusHours > 0);
});

test('calculateProgramTrends produces monthly cumulative percentages', () => {
  const tracks = [{ id: 'track1', name: 'Core' }];
  const customPrograms = { track1: [{ name: 'Engineering', trackId: 'track1' }] };
  const subjects = [
    {
      id: 'sub1',
      name: 'Circuits',
      trackId: 'track1',
      trackName: 'Core',
      program: 'Engineering',
      chaptersCount: 2,
      priority: 1,
      order: 1,
      color: '#6366f1',
      isPassed: false,
    },
  ];
  const tasks = [
    { id: 't1', date: '2026-01-10', actualDateCompleted: '2026-01-10', track: 'track1', subject: 'Circuits', chapter: 1, completed: true },
  ];

  const trends = calculateProgramTrends(tasks, subjects, customPrograms, tracks, '1Y', new Date('2026-12-31'));
  assert.strictEqual(trends.months.length, 12);
  assert.strictEqual(trends.programs.length, 1);
  assert.strictEqual(trends.programs[0].name, 'Engineering');
  assert.strictEqual(trends.programs[0].values[11], 50.0); // 1 out of 2 chapters
});

test('calculateDailyActionMonthlyTrends computes day counts and breakdown', () => {
  const now = new Date('2026-09-15');
  const habits = [
    {
      id: 'h1',
      name: 'Reading',
      title: 'Reading',
      desc: '',
      question: '',
      color: 'emerald',
      icon: 'book',
      history: { '2026-09-01': true, '2026-09-02': true },
    },
  ];

  const res = calculateDailyActionMonthlyTrends(habits, 'ALL', now);
  assert.strictEqual(res.days.length, 30);
  assert.strictEqual(res.dailyCounts[0], 1);
  assert.strictEqual(res.dailyCounts[1], 1);
  assert.strictEqual(res.dailyCounts[2], 0);
  assert.strictEqual(res.totalFulfilled, 2);
  assert.strictEqual(res.habitsBreakdown[0].count, 2);
});
