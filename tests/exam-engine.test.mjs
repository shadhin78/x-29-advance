import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExamTimeRemaining,
  formatExamCountdownString,
  parseExamDateTime,
  formatSessionDate,
  isExamDoneOrOver,
  calculateExamCountdown,
  hexToRgba,
  DEFAULT_EXAM_SESSIONS,
  DEFAULT_EXAM_ROUTINE,
} from '../features/exam/services/examService.ts';

test('calculateExamTimeRemaining: past date returns isPast = true and zeros', () => {
  const now = new Date('2026-10-15T12:00:00Z');
  const past = new Date('2026-10-10T12:00:00Z');
  const rem = calculateExamTimeRemaining(now, past);

  assert.equal(rem.isPast, true);
  assert.equal(rem.days, 0);
  assert.equal(rem.hours, 0);
  assert.equal(rem.mins, 0);
  assert.equal(rem.secs, 0);
  assert.equal(rem.tier, 'days');
});

test('calculateExamTimeRemaining: days tier (< 1 month) computes exact days/hours/mins/secs', () => {
  const now = new Date('2026-10-15T10:00:00Z');
  const target = new Date('2026-10-20T14:30:15Z'); // 5 days, 4 hours, 30 mins, 15 secs
  const rem = calculateExamTimeRemaining(now, target);

  assert.equal(rem.isPast, false);
  assert.equal(rem.tier, 'days');
  assert.equal(rem.days, 5);
  assert.equal(rem.hours, 4);
  assert.equal(rem.mins, 30);
  assert.equal(rem.secs, 15);
});

test('calculateExamTimeRemaining: calendar borrowing across month boundary', () => {
  // From Oct 28 to Nov 5: borrowing from October (31 days)
  const now = new Date('2026-10-28T10:00:00Z');
  const target = new Date('2026-11-05T10:00:00Z');
  const rem = calculateExamTimeRemaining(now, target);

  assert.equal(rem.isPast, false);
  assert.equal(rem.tier, 'days');
  assert.equal(rem.days, 8);
  assert.equal(rem.hours, 0);
  assert.equal(rem.mins, 0);
  assert.equal(rem.secs, 0);
});

test('calculateExamTimeRemaining: months tier (>= 1 month and < 1 year)', () => {
  const now = new Date('2026-05-10T08:00:00Z');
  const target = new Date('2026-08-25T14:20:00Z'); // 3 months, 15 days, 6 hours, 20 mins
  const rem = calculateExamTimeRemaining(now, target);

  assert.equal(rem.isPast, false);
  assert.equal(rem.tier, 'months');
  assert.equal(rem.months, 3);
  assert.equal(rem.days, 15);
  assert.equal(rem.hours, 6);
  assert.equal(rem.mins, 20);
});

test('calculateExamTimeRemaining: years tier (>= 1 year)', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  const target = new Date('2027-04-15T12:00:00Z');
  const rem = calculateExamTimeRemaining(now, target);

  assert.equal(rem.isPast, false);
  assert.equal(rem.tier, 'years');
  assert.equal(rem.years, 1);
  assert.equal(rem.months, 3);
  assert.equal(rem.days, 14);
});

test('formatExamCountdownString formats strings according to tier and past state', () => {
  assert.equal(formatExamCountdownString({ isPast: true }), 'Ended');
  assert.equal(formatExamCountdownString(null), 'Ended');

  // Days tier
  const daysRem = {
    isPast: false,
    tier: 'days',
    days: 4,
    hours: 2,
    mins: 35,
    secs: 9,
  };
  assert.equal(formatExamCountdownString(daysRem), '04d 02h 35m 09s');

  // Months tier
  const monthsRem = {
    isPast: false,
    tier: 'months',
    months: 2,
    days: 14,
    hours: 5,
    mins: 20,
    secs: 0,
  };
  assert.equal(formatExamCountdownString(monthsRem), '02mo 14d 05h 20m');

  // Years tier
  const yearsRem = {
    isPast: false,
    tier: 'years',
    years: 1,
    months: 4,
    days: 10,
    hours: 8,
    mins: 0,
    secs: 0,
  };
  assert.equal(formatExamCountdownString(yearsRem), '01y 04mo 10d 08h');
});

test('parseExamDateTime parses date strings and objects accurately', () => {
  const ts1 = parseExamDateTime('2026-11-20', '15:30');
  const d1 = new Date(ts1);
  assert.equal(d1.getFullYear(), 2026);
  assert.equal(d1.getMonth(), 10); // 0-indexed November
  assert.equal(d1.getDate(), 20);
  assert.equal(d1.getHours(), 15);
  assert.equal(d1.getMinutes(), 30);

  const ts2 = parseExamDateTime({ date: '2026-08-14', time: '09:00' });
  const d2 = new Date(ts2);
  assert.equal(d2.getFullYear(), 2026);
  assert.equal(d2.getDate(), 14);

  assert(isNaN(parseExamDateTime('invalid-date')));
});

test('formatSessionDate converts YYYY-MM-DD into readable date format', () => {
  assert.equal(formatSessionDate('2026-10-15'), '15 Oct 2026');
  assert.equal(formatSessionDate('2026-01-05'), '05 Jan 2026');
  assert.equal(formatSessionDate(''), '');
});

test('isExamDoneOrOver identifies completed and overdue exams', () => {
  const now = new Date('2026-10-20T12:00:00Z').getTime();

  // Completed status
  assert.equal(isExamDoneOrOver({ status: 'completed', date: '2026-10-25', time: '10:00' }, now), true);
  assert.equal(isExamDoneOrOver({ completed: true, date: '2026-10-25', time: '10:00' }, now), true);

  // Past beyond 2-hour grace period
  const oldExam = { date: '2026-10-20', time: '08:00', status: 'upcoming', completed: false };
  assert.equal(isExamDoneOrOver(oldExam, now), true);

  // Upcoming in the future
  const futureExam = { date: '2026-10-25', time: '10:00', status: 'upcoming', completed: false };
  assert.equal(isExamDoneOrOver(futureExam, now), false);
});

test('calculateExamCountdown selects nearest upcoming exam or pinned exam', () => {
  const now = new Date('2026-10-01T10:00:00Z').getTime();
  const testSessions = [
    { id: 'sess_1', program: 'Computer Science', name: 'Midterm 2026' },
    { id: 'sess_2', program: 'Mathematics', name: 'Finals 2026' },
  ];
  const testExams = [
    {
      id: 'ex_1',
      sessionId: 'sess_1',
      program: 'Computer Science',
      subject: 'Data Structures',
      date: '2026-10-10',
      time: '10:00',
      status: 'upcoming',
      completed: false,
    },
    {
      id: 'ex_2',
      sessionId: 'sess_2',
      program: 'Mathematics',
      subject: 'Linear Algebra',
      date: '2026-10-15',
      time: '14:00',
      status: 'upcoming',
      completed: false,
    },
  ];

  // Auto nearest
  const autoCountdown = calculateExamCountdown(testExams, testSessions, 'auto', now);
  assert.equal(autoCountdown.targetExam?.id, 'ex_1');
  assert.equal(autoCountdown.targetSession?.name, 'Midterm 2026');
  assert.equal(autoCountdown.isPast, false);

  // Pinned target
  const pinnedCountdown = calculateExamCountdown(testExams, testSessions, 'ex_2', now);
  assert.equal(pinnedCountdown.targetExam?.id, 'ex_2');
  assert.equal(pinnedCountdown.targetSession?.name, 'Finals 2026');
  assert.equal(pinnedCountdown.targetExam?.subject, 'Linear Algebra');
});

test('hexToRgba produces valid rgba string with alpha', () => {
  assert.equal(hexToRgba('#3b82f6', 0.2), 'rgba(59, 130, 246, 0.2)');
  assert.equal(hexToRgba('#ef4444', 0.5), 'rgba(239, 68, 68, 0.5)');
  assert.equal(hexToRgba('invalid', 0.3), 'rgba(244, 63, 94, 0.3)');
});
