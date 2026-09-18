/**
 * X-29 Schedule Service (features/schedule/services/scheduleService.ts)
 * 
 * Pure calculation functions for:
 * - Time conversion (24h <-> minutes <-> 12h AM/PM)
 * - Work allocation duration sums
 * - 1-Hour box segmentation with day-start rotation
 * - Active schedule slot and progress determination
 * 
 * Contains NO React, DOM, or persistence dependencies.
 */

import type { ScheduleBlock, ScheduleGroup, ScheduleSegment, ActiveSlotInfo } from '@/types/schedule';

export const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlock[] = [
  {
    id: 'sched-1',
    day: 'Daily',
    startTime: '06:00',
    endTime: '07:00',
    task: 'Morning Workout & Routine',
    color: '#10b981',
    isDayStart: true,
  },
  {
    id: 'sched-2',
    day: 'Daily',
    startTime: '07:00',
    endTime: '09:00',
    task: 'Deep Study Block 1',
    color: '#6366f1',
    isDayStart: false,
  },
  {
    id: 'sched-3',
    day: 'Daily',
    startTime: '09:00',
    endTime: '10:00',
    task: 'Breakfast & Review',
    color: '#f59e0b',
    isDayStart: false,
  },
  {
    id: 'sched-4',
    day: 'Daily',
    startTime: '10:00',
    endTime: '13:00',
    task: 'Deep Study Block 2',
    color: '#3b82f6',
    isDayStart: false,
  },
  {
    id: 'sched-5',
    day: 'Daily',
    startTime: '13:00',
    endTime: '14:30',
    task: 'Lunch & Break',
    color: '#8b5cf6',
    isDayStart: false,
  },
  {
    id: 'sched-6',
    day: 'Daily',
    startTime: '14:30',
    endTime: '17:30',
    task: 'Problem Solving & Coding',
    color: '#06b6d4',
    isDayStart: false,
  },
  {
    id: 'sched-7',
    day: 'Daily',
    startTime: '17:30',
    endTime: '19:00',
    task: 'Evening Walk & Rest',
    color: '#ec4899',
    isDayStart: false,
  },
  {
    id: 'sched-8',
    day: 'Daily',
    startTime: '19:00',
    endTime: '22:00',
    task: 'Night Session & Recall',
    color: '#6366f1',
    isDayStart: false,
  },
  {
    id: 'sched-9',
    day: 'Daily',
    startTime: '22:00',
    endTime: '23:00',
    task: 'Wind Down & Planning',
    color: '#64748b',
    isDayStart: false,
  },
];

export const DEFAULT_SCHEDULE_BLOCKS_2: ScheduleBlock[] = [
  {
    id: 'sched2-1',
    day: 'Daily',
    startTime: '08:00',
    endTime: '10:00',
    task: 'Morning Lecture & Notes',
    color: '#8b5cf6',
    isDayStart: true,
  },
  {
    id: 'sched2-2',
    day: 'Daily',
    startTime: '10:00',
    endTime: '13:00',
    task: 'Intensive Lab & Practice',
    color: '#3b82f6',
    isDayStart: false,
  },
  {
    id: 'sched2-3',
    day: 'Daily',
    startTime: '14:00',
    endTime: '18:00',
    task: 'Project Development',
    color: '#10b981',
    isDayStart: false,
  },
  {
    id: 'sched2-4',
    day: 'Daily',
    startTime: '19:00',
    endTime: '22:00',
    task: 'Exam Review Session',
    color: '#f43f5e',
    isDayStart: false,
  },
];

export const DEFAULT_SCHEDULE_GROUPS: ScheduleGroup[] = [
  {
    id: 'grp-study',
    name: 'Study & Academic',
    color: '#6366f1',
    items: ['Deep Study Block 1', 'Deep Study Block 2', 'Problem Solving & Coding', 'Night Session & Recall'],
  },
  {
    id: 'grp-wellness',
    name: 'Health & Wellness',
    color: '#10b981',
    items: ['Morning Workout & Routine', 'Breakfast & Review', 'Lunch & Break', 'Evening Walk & Rest', 'Wind Down & Planning'],
  },
];

export function timeToMinutes(t: string): number {
  if (!t || typeof t !== 'string') return 0;
  const parts = t.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function minutesToTime12h(totalMinutes: number): string {
  let hrs = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  return `${hrs}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

export function formatTime12h(time24: string): string {
  return minutesToTime12h(timeToMinutes(time24));
}

export function calculateBlockHours(startTime: string, endTime: string): number {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (endMin <= startMin) return 0;
  return (endMin - startMin) / 60;
}

export function calculateTotalAllocatedHours(blocks: ScheduleBlock[]): number {
  return blocks.reduce((sum, b) => sum + calculateBlockHours(b.startTime, b.endTime), 0);
}

/**
 * Segments blocks into 1-hour slots, sorted and rotated by dayStart if specified
 */
export function segmentBlocksInto1HourSlots(blocks: ScheduleBlock[]): ScheduleSegment[] {
  const segments: ScheduleSegment[] = [];

  const dailyBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  dailyBlocks.forEach((block) => {
    const startMin = timeToMinutes(block.startTime);
    const endMin = timeToMinutes(block.endTime);

    if (endMin <= startMin) return;

    let currentStart = startMin;
    let isFirst = true;

    while (currentStart < endMin) {
      const currentEnd = Math.min(currentStart + 60, endMin);
      segments.push({
        id: block.id,
        task: block.task,
        track: block.track,
        program: block.program,
        color: block.color || '#6366f1',
        startTime: minutesToTime12h(currentStart),
        endTime: minutesToTime12h(currentEnd),
        startMin: currentStart,
        endMin: currentEnd,
        duration: currentEnd - currentStart,
        isDayStart: isFirst && !!block.isDayStart,
      });
      isFirst = false;
      currentStart = currentEnd;
    }
  });

  segments.sort((a, b) => a.startMin - b.startMin);

  // Re-order starting from isDayStart block if present
  const dayStartIdx = segments.findIndex((s) => s.isDayStart);
  if (dayStartIdx > 0) {
    return [...segments.slice(dayStartIdx), ...segments.slice(0, dayStartIdx)];
  }

  return segments;
}

export interface GroupSummaryResult {
  group: ScheduleGroup;
  items: { name: string; hours: number; color: string }[];
  totalHours: number;
}

/**
 * Computes work hours for each group and identifies ungrouped items
 */
export function calculateGroupSummaries(
  blocks: ScheduleBlock[],
  groups: ScheduleGroup[]
): {
  groupSummaries: GroupSummaryResult[];
  ungroupedItems: { name: string; hours: number; color: string }[];
  allWorkTotals: Record<string, number>;
} {
  const workTotals: Record<string, number> = {};
  const workColors: Record<string, string> = {};

  blocks.forEach((b) => {
    const name = b.task || 'Untitled Work';
    const hrs = calculateBlockHours(b.startTime, b.endTime);
    if (hrs > 0) {
      workTotals[name] = (workTotals[name] || 0) + hrs;
      workColors[name] = b.color || '#6366f1';
    }
  });

  const groupedNamesSet = new Set<string>();

  const groupSummaries: GroupSummaryResult[] = groups.map((grp) => {
    const items: { name: string; hours: number; color: string }[] = [];
    let totalHours = 0;

    (grp.items || []).forEach((itemName) => {
      if (workTotals[itemName] !== undefined) {
        groupedNamesSet.add(itemName);
        const hrs = workTotals[itemName];
        totalHours += hrs;
        items.push({
          name: itemName,
          hours: hrs,
          color: workColors[itemName] || grp.color,
        });
      }
    });

    return {
      group: grp,
      items,
      totalHours,
    };
  });

  const ungroupedItems: { name: string; hours: number; color: string }[] = [];
  Object.keys(workTotals).forEach((name) => {
    if (!groupedNamesSet.has(name)) {
      ungroupedItems.push({
        name,
        hours: workTotals[name],
        color: workColors[name] || '#6366f1',
      });
    }
  });

  return {
    groupSummaries,
    ungroupedItems,
    allWorkTotals: workTotals,
  };
}

/**
 * Calculates current active slot and time remaining
 */
export function getActiveScheduleSlot(
  blocks: ScheduleBlock[],
  now: Date = new Date()
): ActiveSlotInfo {
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const sorted = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  let activeBlock: ScheduleBlock | null = null;
  let nextBlock: ScheduleBlock | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    const sMin = timeToMinutes(b.startTime);
    const eMin = timeToMinutes(b.endTime);

    if (sMin <= currentMin && currentMin < eMin) {
      activeBlock = b;
      nextBlock = sorted[(i + 1) % sorted.length] || null;
      break;
    } else if (currentMin < sMin && !nextBlock) {
      nextBlock = b;
    }
  }

  if (!nextBlock && sorted.length > 0) {
    nextBlock = sorted[0];
  }

  let remainingMinutes = 0;
  let elapsedMinutes = 0;
  let progressPercent = 0;

  if (activeBlock) {
    const sMin = timeToMinutes(activeBlock.startTime);
    const eMin = timeToMinutes(activeBlock.endTime);
    const totalDuration = Math.max(1, eMin - sMin);
    elapsedMinutes = currentMin - sMin;
    remainingMinutes = Math.max(0, eMin - currentMin);
    progressPercent = Math.min(100, Math.max(0, (elapsedMinutes / totalDuration) * 100));
  }

  return {
    activeBlock,
    remainingMinutes,
    elapsedMinutes,
    progressPercent,
    nextBlock,
  };
}
