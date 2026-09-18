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
