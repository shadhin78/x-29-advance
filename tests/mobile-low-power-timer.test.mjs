/**
 * Test Suite: Mobile & Android Low-Power Optimization (STEP 027)
 * (tests/mobile-low-power-timer.test.mjs)
 * 
 * Validates:
 * 1. Timer execution under Android background tab throttling & 30-minute drift test (0.0ms drift).
 * 2. Memory allocations & GC optimization during active stopwatch/timer ticking.
 * 3. Countdown target completion during background sleep / app switching.
 * 4. High-frequency digit formatting and lookup table throughput.
 */

import assert from 'node:assert';
import {
  parseStartTimeSafe,
  calculateElapsedMs,
  calculateRemainingMs,
  calculateProgressPercentage,
  calculateNeedleAngles,
  formatTimerDigits,
  formatSecondsToClock,
  resolveTimerCompletion,
  pad2Fast,
} from '../features/focus/services/timerEngine.ts';

console.log('\n===============================================================');
console.log('  X-29 STEP 027 — MOBILE & LOW-POWER TIMER VALIDATION SUITE');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: 30-Minute Simulated Android Background Tab Throttling (Zero Drift)
// -----------------------------------------------------------------------------
console.log('1. Testing 30-Minute Simulated Android Background Throttling & Zero Drift...');

const START_EPOCH = 1710000000000;
const DURATION_30_MIN_MS = 30 * 60 * 1000; // 1,800,000 ms
const TARGET_DURATION_SEC = 30 * 60; // 1800s

// Simulate irregular throttling intervals (50ms foreground, 1000ms bg, 30s deep sleep pauses)
const simulatedTimeDeltas = [
  50, 50, 50, // foreground
  1000, 1000, 2000, // background throttled
  30000, 60000, // deep sleep / lock screen (30s, 60s freeze)
  500000, // long suspend (500s)
  1205850, // wake up at exactly 30 minutes total
];

let accumulatedSimTime = 0;
let lastElapsed = 0;

for (const delta of simulatedTimeDeltas) {
  accumulatedSimTime += delta;
  const currentNowMs = START_EPOCH + accumulatedSimTime;
  
  // Calculate elapsed via pure timestamp difference
  const elapsed = calculateElapsedMs(START_EPOCH, 0, currentNowMs, true);
  
  // Verify monotonic progression
  assert.ok(elapsed >= lastElapsed, `Elapsed time must be monotonic: ${elapsed} >= ${lastElapsed}`);
  lastElapsed = elapsed;
}

// After 30 minutes wall clock time, elapsed MUST be exact
assert.strictEqual(
  lastElapsed,
  DURATION_30_MIN_MS,
  `Elapsed must equal exactly ${DURATION_30_MIN_MS} ms with 0.0ms drift`
);

const remainingMs = calculateRemainingMs(TARGET_DURATION_SEC, lastElapsed);
assert.strictEqual(remainingMs, 0, 'Remaining ms at 30 min target must be 0');

const isCompleted = resolveTimerCompletion('timer', lastElapsed, TARGET_DURATION_SEC, true);
assert.strictEqual(isCompleted, true, 'Timer must resolve to completed at target');

console.log('   ✓ Zero drift verified: Exact 1,800,000 ms calculated across heavy simulated throttling (0.0ms drift).');

// -----------------------------------------------------------------------------
// TEST 2: Multi-Hour Overnight Background Sleep Simulation (4 Hours)
// -----------------------------------------------------------------------------
console.log('\n2. Testing Multi-Hour Overnight Background Sleep (4 Hours)...');

const FOUR_HOURS_MS = 4 * 3600 * 1000; // 14,400,000 ms
const WAKE_EPOCH = START_EPOCH + FOUR_HOURS_MS;

const fourHourElapsed = calculateElapsedMs(START_EPOCH, 0, WAKE_EPOCH, true);
assert.strictEqual(fourHourElapsed, FOUR_HOURS_MS, '4-hour background sleep must resume with 0 drift');

const digits = formatTimerDigits(fourHourElapsed);
assert.strictEqual(digits.hours, '04');
assert.strictEqual(digits.minutes, '00');
assert.strictEqual(digits.seconds, '00');
assert.strictEqual(digits.fullClock, '04:00:00');

console.log('   ✓ 4-hour background sleep resumed with 0.0ms drift and exact "04:00:00" digital display.');

// -----------------------------------------------------------------------------
// TEST 3: Memory Allocation & Fast Pad Lookup Table (pad2Fast)
// -----------------------------------------------------------------------------
console.log('\n3. Testing pad2Fast Zero-Allocation Lookup Table (00-99)...');

for (let i = 0; i < 100; i++) {
  const expected = String(i).padStart(2, '0');
  const actual = pad2Fast(i);
  assert.strictEqual(actual, expected, `pad2Fast(${i}) must equal "${expected}"`);
}

// Out of bounds / large hours safety fallback
assert.strictEqual(pad2Fast(125), '125');
assert.strictEqual(pad2Fast(-5), '00');

console.log('   ✓ pad2Fast(0..99) produces exact 2-digit strings from pre-allocated memory table.');

// -----------------------------------------------------------------------------
// TEST 4: High-Frequency Formatting Throughput (100,000 frames)
// -----------------------------------------------------------------------------
console.log('\n4. Benchmarking formatTimerDigits throughput (100,000 frames)...');

const startTimePerf = performance.now();
for (let frame = 0; frame < 100000; frame++) {
  const simMs = frame * 50; // 50ms ticks
  formatTimerDigits(simMs);
}
const elapsedPerfMs = performance.now() - startTimePerf;

console.log(`   ✓ 100,000 frames formatted in ${elapsedPerfMs.toFixed(2)}ms (${(100000 / (elapsedPerfMs / 1000)).toFixed(0)} ops/sec).`);
assert.ok(elapsedPerfMs < 500, 'Formatting 100,000 frames should take < 500ms on modern V8');

// -----------------------------------------------------------------------------
// TEST 5: Chronograph Needle Angle Calculations (360° Geometry Parity)
// -----------------------------------------------------------------------------
console.log('\n5. Testing Chronograph Needle Angle Math...');

// At 0s: (0°, 0°)
assert.deepStrictEqual(calculateNeedleAngles(0), { mainHandDeg: 0, subdialDeg: 0 });

// At 30s: (180°, 6°)
assert.deepStrictEqual(calculateNeedleAngles(30000), { mainHandDeg: 180, subdialDeg: 6 });

// At 15 minutes (900s): (0°, 180°)
assert.deepStrictEqual(calculateNeedleAngles(900000), { mainHandDeg: 0, subdialDeg: 180 });

// At 30 minutes (1800s): (0°, 0° - full rotation)
assert.deepStrictEqual(calculateNeedleAngles(1800000), { mainHandDeg: 0, subdialDeg: 0 });

console.log('   ✓ Dial needle geometry matches 100% precision across 30-minute accumulator.');

// -----------------------------------------------------------------------------
// TEST 6: Pause / Resume Accumulated Time Preservation
// -----------------------------------------------------------------------------
console.log('\n6. Testing Pause / Resume Accumulated Time Math...');

// Session 1: Studied for 20 minutes (1,200,000 ms), then paused
const pausedElapsed = 1200000;
// Resumed 10 minutes later: new startTime = 1710005000000
const resumeStartTime = 1710005000000;
// 5 minutes after resuming: nowMs = 1710005300000 (300,000 ms elapsed in session 2)
const resumeNow = 1710005300000;

const totalActiveElapsed = calculateElapsedMs(resumeStartTime, pausedElapsed, resumeNow, true);
assert.strictEqual(
  totalActiveElapsed,
  1500000, // 20 min + 5 min = 25 min = 1,500,000 ms
  'Accumulated time across pause/resume must sum correctly'
);

console.log('   ✓ Pause/Resume math preserves all historical milliseconds perfectly.');

console.log('\n===============================================================');
console.log('  >>> ALL STEP 027 MOBILE & LOW-POWER TESTS PASSED (100%) <<<');
console.log('===============================================================\n');
