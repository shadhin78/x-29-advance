/**
 * Unit Test Suite for X-29 Pure Timer Engine (features/focus/services/timerEngine.ts)
 */

import assert from 'node:assert';
import {
  parseStartTimeSafe,
  calculateElapsedMs,
  calculateRemainingMs,
  calculateProgressPercentage,
  calculateNeedleAngles,
  formatTimerDigits,
  formatHoursToHrMin,
  formatSecondsToClock,
  calculateAlarmDuration,
  resolveTimerCompletion,
  calculateDialTickHighlight,
} from '../features/focus/services/timerEngine.ts';

console.log('\n=== Testing X-29 Pure Timer Engine (timerEngine.ts) ===\n');

// 1. parseStartTimeSafe
console.log('1. Testing parseStartTimeSafe...');
assert.strictEqual(parseStartTimeSafe(null), 0);
assert.strictEqual(parseStartTimeSafe(undefined), 0);
assert.strictEqual(parseStartTimeSafe(0), 0);
assert.strictEqual(parseStartTimeSafe(1710000000000), 1710000000000);
assert.strictEqual(parseStartTimeSafe(new Date(1710000000000)), 1710000000000);
assert.strictEqual(
  parseStartTimeSafe({ toDate: () => new Date(1710000000000) }),
  1710000000000
);
assert.strictEqual(
  parseStartTimeSafe('2024-03-09T18:40:00.000Z'),
  new Date('2024-03-09T18:40:00.000Z').getTime()
);

// 2. calculateElapsedMs
console.log('2. Testing calculateElapsedMs...');
// Not running: returns base elapsedBeforeStart
assert.strictEqual(calculateElapsedMs(null, 5000, 10000, false), 5000);
assert.strictEqual(calculateElapsedMs(1000, 5000, 10000, false), 5000);
// Running: adds (now - start) to elapsedBeforeStart
assert.strictEqual(calculateElapsedMs(1000, 5000, 10000, true), 14000);
// Negative guards: now < start should not subtract
assert.strictEqual(calculateElapsedMs(10000, 5000, 5000, true), 5000);

// 3. calculateRemainingMs
console.log('3. Testing calculateRemainingMs...');
// 25 min timer (1500 sec = 1500000 ms), 500000 ms elapsed -> 1000000 ms remaining
assert.strictEqual(calculateRemainingMs(1500, 500000), 1000000);
// Over elapsed -> clamps to 0
assert.strictEqual(calculateRemainingMs(1500, 2000000), 0);

// 4. calculateProgressPercentage
console.log('4. Testing calculateProgressPercentage...');
assert.strictEqual(calculateProgressPercentage(0, 1500), 0);
assert.strictEqual(calculateProgressPercentage(750000, 1500), 50);
assert.strictEqual(calculateProgressPercentage(1500000, 1500), 100);
assert.strictEqual(calculateProgressPercentage(3000000, 1500), 100); // capped at 100%
assert.strictEqual(calculateProgressPercentage(5000, 0), 0);

// 5. calculateNeedleAngles
console.log('5. Testing calculateNeedleAngles...');
// 0s: both 0 deg
assert.deepStrictEqual(calculateNeedleAngles(0), { mainHandDeg: 0, subdialDeg: 0 });
// 15s: 15 * 6 = 90 deg, subdial: (15 / 1800) * 360 = 3 deg
assert.deepStrictEqual(calculateNeedleAngles(15000), { mainHandDeg: 90, subdialDeg: 3 });
// 60s: main hand wraps back to 0 deg, subdial: (60 / 1800) * 360 = 12 deg
assert.deepStrictEqual(calculateNeedleAngles(60000), { mainHandDeg: 0, subdialDeg: 12 });
// 30 min (1800s): subdial completes full 360 deg rotation
assert.deepStrictEqual(calculateNeedleAngles(1800000), { mainHandDeg: 0, subdialDeg: 0 });

// 6. formatTimerDigits
console.log('6. Testing formatTimerDigits...');
const d1 = formatTimerDigits(0);
assert.strictEqual(d1.fullClock, '00:00:00');
assert.strictEqual(d1.hhmm, '00:00:');
assert.strictEqual(d1.ss, '00');
assert.strictEqual(d1.hundredths, '00');

const d2 = formatTimerDigits((1 * 3600 + 25 * 60 + 42) * 1000 + 850);
assert.strictEqual(d2.hours, '01');
assert.strictEqual(d2.minutes, '25');
assert.strictEqual(d2.seconds, '42');
assert.strictEqual(d2.hundredths, '85');
assert.strictEqual(d2.fullClock, '01:25:42');

// 7. formatHoursToHrMin
console.log('7. Testing formatHoursToHrMin...');
assert.strictEqual(formatHoursToHrMin(0), '0 min');
assert.strictEqual(formatHoursToHrMin(-1), '0 min');
assert.strictEqual(formatHoursToHrMin(0.5), '30 min');
assert.strictEqual(formatHoursToHrMin(1.0), '1 hr');
assert.strictEqual(formatHoursToHrMin(1.5), '1 hr 30 min');
assert.strictEqual(formatHoursToHrMin(3.25), '3 hr 15 min');

// 8. formatSecondsToClock
console.log('8. Testing formatSecondsToClock...');
assert.strictEqual(formatSecondsToClock(0), '00:00:00');
assert.strictEqual(formatSecondsToClock(65), '00:01:05');
assert.strictEqual(formatSecondsToClock(3665), '01:01:05');

// 9. calculateAlarmDuration
console.log('9. Testing calculateAlarmDuration...');
// Same day: 09:00 to 10:30 = 1.5 hrs = 5400s
assert.strictEqual(calculateAlarmDuration('09:00', '10:30'), 5400);
// Across midnight: 23:00 to 01:00 = 2 hrs = 7200s
assert.strictEqual(calculateAlarmDuration('23:00', '01:00'), 7200);
// Same time: 10:00 to 10:00 = 24 hrs = 86400s
assert.strictEqual(calculateAlarmDuration('10:00', '10:00'), 86400);

// 10. resolveTimerCompletion
console.log('10. Testing resolveTimerCompletion...');
assert.strictEqual(resolveTimerCompletion('timer', 1499000, 1500, true), false);
assert.strictEqual(resolveTimerCompletion('timer', 1500000, 1500, true), true);
assert.strictEqual(resolveTimerCompletion('timer', 1500000, 1500, false), false); // not running
assert.strictEqual(resolveTimerCompletion('stopwatch', 1500000, 0, true), false); // open-ended stopwatch

// 11. calculateDialTickHighlight
console.log('11. Testing calculateDialTickHighlight...');
// Open-ended stopwatch
const h1 = calculateDialTickHighlight('stopwatch', 10000, 0);
assert.strictEqual(h1.isTargeted, false);

// Targeted stopwatch at 50%
const h2 = calculateDialTickHighlight('stopwatch', 750000, 1500);
assert.strictEqual(h2.isTargeted, true);
assert.strictEqual(h2.highlightThreshold, 30);
assert.strictEqual(h2.isForwardFill, true);

// Countdown timer at 25% elapsed (75% remaining)
const h3 = calculateDialTickHighlight('timer', 375000, 1500);
assert.strictEqual(h3.isTargeted, true);
assert.strictEqual(h3.highlightThreshold, 15);
assert.strictEqual(h3.isForwardFill, false);

console.log('\n>>> ALL TIMER ENGINE PURE DOMAIN TESTS PASSED! <<<\n');
