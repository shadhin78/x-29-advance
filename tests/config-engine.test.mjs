import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  reorderListWithPriority,
  changePriorityInList,
  createBackupPayload,
  validateBackupPayload,
} from '../features/config/services/configService.ts';

describe('Config & Priority Engine Tests', () => {
  it('reorderListWithPriority should swap adjacent items and reassign 1..N priorities when moving up', () => {
    const list = [
      { id: 'track-1', name: 'Track 1', priority: 1, order: 0 },
      { id: 'track-2', name: 'Track 2', priority: 2, order: 1 },
      { id: 'track-3', name: 'Track 3', priority: 3, order: 2 },
    ];

    // Move index 1 (track-2) UP
    const updated = reorderListWithPriority(list, 1, -1);

    assert.equal(updated.length, 3);
    assert.equal(updated[0].id, 'track-2');
    assert.equal(updated[0].priority, 1);
    assert.equal(updated[0].order, 0);

    assert.equal(updated[1].id, 'track-1');
    assert.equal(updated[1].priority, 2);
    assert.equal(updated[1].order, 1);

    assert.equal(updated[2].id, 'track-3');
    assert.equal(updated[2].priority, 3);
    assert.equal(updated[2].order, 2);
  });

  it('reorderListWithPriority should swap adjacent items when moving down', () => {
    const list = [
      { id: 'track-1', name: 'Track 1', priority: 1, order: 0 },
      { id: 'track-2', name: 'Track 2', priority: 2, order: 1 },
      { id: 'track-3', name: 'Track 3', priority: 3, order: 2 },
    ];

    // Move index 0 (track-1) DOWN
    const updated = reorderListWithPriority(list, 0, 1);

    assert.equal(updated[0].id, 'track-2');
    assert.equal(updated[0].priority, 1);
    assert.equal(updated[1].id, 'track-1');
    assert.equal(updated[1].priority, 2);
  });

  it('reorderListWithPriority should guard out-of-bounds moves at list boundaries', () => {
    const list = [
      { id: 'a', priority: 1, order: 0 },
      { id: 'b', priority: 2, order: 1 },
    ];

    // Attempt to move top item UP
    const topResult = reorderListWithPriority(list, 0, -1);
    assert.deepEqual(topResult, list);

    // Attempt to move bottom item DOWN
    const bottomResult = reorderListWithPriority(list, 1, 1);
    assert.deepEqual(bottomResult, list);
  });

  it('changePriorityInList should shift an item to the target priority and renumber sequentially', () => {
    const list = [
      { id: 'sub-a', subject: 'Accounting', priority: 1, order: 0 },
      { id: 'sub-b', subject: 'Taxation', priority: 2, order: 1 },
      { id: 'sub-c', subject: 'Audit', priority: 3, order: 2 },
      { id: 'sub-d', subject: 'Law', priority: 4, order: 3 },
    ];

    // Shift Law (index 3, priority 4) directly to priority 1
    const updated = changePriorityInList(list, 'id', 'sub-d', 1);

    assert.equal(updated[0].id, 'sub-d');
    assert.equal(updated[0].priority, 1);
    assert.equal(updated[0].order, 0);

    assert.equal(updated[1].id, 'sub-a');
    assert.equal(updated[1].priority, 2);
    assert.equal(updated[1].order, 1);

    assert.equal(updated[2].id, 'sub-b');
    assert.equal(updated[2].priority, 3);

    assert.equal(updated[3].id, 'sub-c');
    assert.equal(updated[3].priority, 4);
  });

  it('changePriorityInList should clamp target priorities outside valid range', () => {
    const list = [
      { id: 'act-1', priority: 1, order: 0 },
      { id: 'act-2', priority: 2, order: 1 },
    ];

    // Request priority 99 (exceeds list size) -> clamped to 2
    const clampedMax = changePriorityInList(list, 'id', 'act-1', 99);
    assert.equal(clampedMax[0].id, 'act-2');
    assert.equal(clampedMax[1].id, 'act-1');
    assert.equal(clampedMax[1].priority, 2);

    // Request priority -5 -> clamped to 1
    const clampedMin = changePriorityInList(clampedMax, 'id', 'act-1', -5);
    assert.equal(clampedMin[0].id, 'act-1');
    assert.equal(clampedMin[0].priority, 1);
  });

  it('createBackupPayload should serialize complete workspace schema with metadata', () => {
    const testData = {
      tracks: [{ id: 'bba', name: 'Bachelor of Business Administration' }],
      customPrograms: { bba: [{ name: 'Marketing', targetCGPA: '3.80' }] },
      syllabusStructure: {
        bba: [{ track: 'bba', program: 'Marketing', subject: 'Digital Marketing', chapters: 12 }],
      },
      habits: [{ id: 'gym', name: 'Gym', history: {} }],
      passedItems: { programs: ['Marketing'], subjects: ['Digital Marketing'] },
      dashboardConfig: { topTag: 'X-29 TEST', mainTitle: 'Study Studio', subTitle: 'Target Hub' },
    };

    const jsonStr = createBackupPayload(testData);
    const parsed = JSON.parse(jsonStr);

    assert.ok(parsed._metadata);
    assert.equal(parsed._metadata.source, 'X-29 Next.js Workspace Backup');
    assert.equal(parsed.tracks[0].id, 'bba');
    assert.equal(parsed.customPrograms.bba[0].name, 'Marketing');
    assert.equal(parsed.syllabusStructure.bba[0].subject, 'Digital Marketing');
    assert.equal(parsed.dashboardConfig.topTag, 'X-29 TEST');
  });

  it('validateBackupPayload should accept valid X-29 workspace payloads and reject invalid files', () => {
    // Valid object
    const valid = {
      tracks: [{ id: 'cs', name: 'Computer Science' }],
      customPrograms: { cs: [] },
    };
    const validRes = validateBackupPayload(valid);
    assert.equal(validRes.isValid, true);
    assert.ok(validRes.data);

    // Corrupt / unrelated object
    const invalidObj = { foo: 'bar', timestamp: 12345 };
    const invalidRes = validateBackupPayload(invalidObj);
    assert.equal(invalidRes.isValid, false);
    assert.match(invalidRes.error, /does not contain recognized X-29/);

    // Non-object
    const nullRes = validateBackupPayload(null);
    assert.equal(nullRes.isValid, false);
  });
});
