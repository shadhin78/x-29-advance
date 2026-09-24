import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime12h,
  formatTime12h,
  calculateBlockHours,
  calculateTotalAllocatedHours,
  segmentBlocksInto1HourSlots,
  calculateGroupSummaries,
  getActiveScheduleSlot,
  DEFAULT_SCHEDULE_BLOCKS,
  DEFAULT_SCHEDULE_GROUPS,
} from '../features/schedule/services/scheduleService.ts';

test('timeToMinutes converts HH:MM to minute totals', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(timeToMinutes('14:45'), 885);
  assert.equal(timeToMinutes('23:59'), 1439);
});

test('minutesToTime12h converts minute totals to 12h AM/PM strings', () => {
  assert.equal(minutesToTime12h(0), '12:00 AM');
  assert.equal(minutesToTime12h(570), '9:30 AM');
  assert.equal(minutesToTime12h(720), '12:00 PM');
  assert.equal(minutesToTime12h(885), '2:45 PM');
});

test('calculateBlockHours computes exact decimal duration', () => {
  assert.equal(calculateBlockHours('09:00', '10:00'), 1.0);
  assert.equal(calculateBlockHours('10:00', '12:30'), 2.5);
  assert.equal(calculateBlockHours('12:00', '11:00'), 0); // invalid range returns 0
});

test('segmentBlocksInto1HourSlots creates 1-hour segments and rotates by dayStart', () => {
  const blocks = [
    {
      id: 'b1',
      day: 'Daily',
      startTime: '08:00',
      endTime: '10:00',
      task: 'Task 1',
      isDayStart: false,
    },
    {
      id: 'b2',
      day: 'Daily',
      startTime: '06:00',
      endTime: '08:00',
      task: 'Task 2',
      isDayStart: true,
    },
  ];

  const segments = segmentBlocksInto1HourSlots(blocks);
  assert.equal(segments.length, 4);
  // Rotated to start from isDayStart (06:00)
  assert.equal(segments[0].startTime, '6:00 AM');
  assert.equal(segments[0].endTime, '7:00 AM');
  assert.equal(segments[0].isDayStart, true);
});

test('calculateGroupSummaries groups tasks and accurately sums hours', () => {
  const summaries = calculateGroupSummaries(DEFAULT_SCHEDULE_BLOCKS, DEFAULT_SCHEDULE_GROUPS);
  assert.equal(summaries.groupSummaries.length, 2);
  const studyGrp = summaries.groupSummaries.find(g => g.group.id === 'grp-study');
  assert.ok(studyGrp);
  // Deep Study 1 (2h) + Deep Study 2 (3h) + Problem Solving (3h) + Night Session (3h) = 11h
  assert.equal(studyGrp.totalHours, 11);
});

test('getActiveScheduleSlot detects active slot correctly', () => {
  const mockDate = new Date('2026-09-18T07:30:15');
  const info = getActiveScheduleSlot(DEFAULT_SCHEDULE_BLOCKS, mockDate);
  assert.ok(info.activeBlock);
  assert.equal(info.activeBlock.id, 'sched-2'); // 07:00 to 09:00
  assert.equal(info.elapsedMinutes, 30);
  assert.equal(info.remainingMinutes, 90);
  assert.equal(info.progressPercent, 25);
  // Total remaining seconds: (9*60 - 7*60 - 30)*60 - 15 = 90*60 - 15 = 5385s = 1h 29m 45s => '01:29:45'
  assert.equal(info.countdownStr, '01:29:45');
});

test('getActiveScheduleSlot returns null activeBlock during idle free time', () => {
  const mockMidnight = new Date('2026-09-18T02:00:00');
  const info = getActiveScheduleSlot(DEFAULT_SCHEDULE_BLOCKS, mockMidnight);
  assert.equal(info.activeBlock, null);
  assert.equal(info.remainingMinutes, 0);
  assert.equal(info.progressPercent, 0);
  assert.equal(info.countdownStr, '00:00:00');
  assert.ok(info.nextBlock);
  assert.equal(info.nextBlock.id, 'sched-1'); // next up is morning workout at 06:00
});

test('calculateTotalAllocatedHours accurately computes total schedule duration', () => {
  const total = calculateTotalAllocatedHours(DEFAULT_SCHEDULE_BLOCKS);
  // 1 + 2 + 1 + 3 + 1.5 + 3 + 1.5 + 3 + 1 = 17 hrs
  assert.equal(total, 17);
});

test('formatTime12h converts 24h string into 12h AM/PM string', () => {
  assert.equal(formatTime12h('09:00'), '9:00 AM');
  assert.equal(formatTime12h('17:30'), '5:30 PM');
  assert.equal(formatTime12h('00:15'), '12:15 AM');
});

