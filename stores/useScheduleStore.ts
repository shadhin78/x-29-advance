/**
 * X-29 Authoritative Daily Schedule Store (stores/useScheduleStore.ts)
 * 
 * Manages:
 * - Routine Set 1 and Set 2 schedule blocks
 * - Active routine set selection
 * - Custom work groups and work item associations
 * - Local-first IndexedDB persistence with Firestore synchronization
 */

import { create } from 'zustand';
import type { ScheduleBlock, ScheduleGroup } from '@/types/schedule';
import {
  DEFAULT_SCHEDULE_BLOCKS,
  DEFAULT_SCHEDULE_BLOCKS_2,
  DEFAULT_SCHEDULE_GROUPS,
} from '@/features/schedule/services/scheduleService';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';

const KEY_SCHEDULE_BLOCKS = 'x29_schedule_blocks';
const KEY_SCHEDULE_BLOCKS_2 = 'x29_schedule_blocks2';
const KEY_SCHEDULE_GROUPS = 'x29_schedule_groups';
const KEY_ACTIVE_ROUTINE_SET = 'x29_schedule_active_set';

interface ScheduleStoreState {
  scheduleBlocks: ScheduleBlock[];
  scheduleBlocks2: ScheduleBlock[];
  scheduleGroups: ScheduleGroup[];
  activeRoutineSet: number;
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;
  addBlock: (block: Omit<ScheduleBlock, 'id'>, routineSet?: number) => void;
  updateBlock: (id: string, updates: Partial<ScheduleBlock>, routineSet?: number) => void;
  deleteBlock: (id: string, routineSet?: number) => void;
  addGroup: (name: string, items?: string[]) => void;
  updateGroup: (id: string, name: string, items?: string[]) => void;
  deleteGroup: (id: string) => void;
  assignItemToGroup: (itemName: string, groupId: string) => void;
  removeItemFromGroup: (itemName: string) => void;
  setActiveRoutineSet: (setNum: number) => void;
}

export const useScheduleStore = create<ScheduleStoreState>((set, get) => ({
  scheduleBlocks: DEFAULT_SCHEDULE_BLOCKS,
  scheduleBlocks2: DEFAULT_SCHEDULE_BLOCKS_2,
  scheduleGroups: DEFAULT_SCHEDULE_GROUPS,
  activeRoutineSet: 1,
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let blocks1 = DEFAULT_SCHEDULE_BLOCKS;
    let blocks2 = DEFAULT_SCHEDULE_BLOCKS_2;
    let groups = DEFAULT_SCHEDULE_GROUPS;
    let activeSet = 1;

    try {
      const [idb1, idb2, idbGrp, idbSetNum] = await Promise.all([
        idbGet<ScheduleBlock[]>(KEY_SCHEDULE_BLOCKS),
        idbGet<ScheduleBlock[]>(KEY_SCHEDULE_BLOCKS_2),
        idbGet<ScheduleGroup[]>(KEY_SCHEDULE_GROUPS),
        idbGet<number>(KEY_ACTIVE_ROUTINE_SET),
      ]);

      if (Array.isArray(idb1) && idb1.length > 0) blocks1 = idb1;
      if (Array.isArray(idb2) && idb2.length > 0) blocks2 = idb2;
      if (Array.isArray(idbGrp) && idbGrp.length > 0) groups = idbGrp;
      if (idbSetNum !== null && idbSetNum !== undefined) activeSet = idbSetNum;

      // Fallback check to legacy localStorage if indexeddb was empty
      if (!idb1 && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.scheduleBlocks) && parsed.scheduleBlocks.length > 0) {
              blocks1 = parsed.scheduleBlocks;
              await idbSet(KEY_SCHEDULE_BLOCKS, blocks1);
            }
            if (Array.isArray(parsed.scheduleBlocks2) && parsed.scheduleBlocks2.length > 0) {
              blocks2 = parsed.scheduleBlocks2;
              await idbSet(KEY_SCHEDULE_BLOCKS_2, blocks2);
            }
            if (Array.isArray(parsed.scheduleGroups) && parsed.scheduleGroups.length > 0) {
              groups = parsed.scheduleGroups;
              await idbSet(KEY_SCHEDULE_GROUPS, groups);
            }
            if (parsed.activeRoutineSet !== undefined) {
              activeSet = Number(parsed.activeRoutineSet);
              await idbSet(KEY_ACTIVE_ROUTINE_SET, activeSet);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[useScheduleStore] Storage load error:', err);
    }

    set({
      scheduleBlocks: blocks1,
      scheduleBlocks2: blocks2,
      scheduleGroups: groups,
      activeRoutineSet: activeSet,
      isInitialized: true,
    });
  },

  addBlock: (blockData, routineSet) => {
    const targetSet = routineSet || get().activeRoutineSet;
    const newBlock: ScheduleBlock = {
      ...blockData,
      id: `sched_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      day: 'Daily',
    };

    if (targetSet === 2) {
      let current = [...get().scheduleBlocks2];
      if (newBlock.isDayStart) {
        current = current.map((b) => ({ ...b, isDayStart: false }));
      }
      current.push(newBlock);
      set({ scheduleBlocks2: current });
      idbSet(KEY_SCHEDULE_BLOCKS_2, current);

      const user = auth.currentUser;
      if (user) {
        setDoc(doc(db, 'users', user.uid), { scheduleBlocks2: current, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      }
    } else {
      let current = [...get().scheduleBlocks];
      if (newBlock.isDayStart) {
        current = current.map((b) => ({ ...b, isDayStart: false }));
      }
      current.push(newBlock);
      set({ scheduleBlocks: current });
      idbSet(KEY_SCHEDULE_BLOCKS, current);

      const user = auth.currentUser;
      if (user) {
        setDoc(doc(db, 'users', user.uid), { scheduleBlocks: current, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      }
    }
  },

  updateBlock: (id, updates, routineSet) => {
    const targetSet = routineSet || get().activeRoutineSet;

    if (targetSet === 2) {
      let current = get().scheduleBlocks2.map((b) => {
        if (b.id === id) {
          return { ...b, ...updates };
        }
        if (updates.isDayStart) {
          return { ...b, isDayStart: false };
        }
        return b;
      });
      set({ scheduleBlocks2: current });
      idbSet(KEY_SCHEDULE_BLOCKS_2, current);

      const user = auth.currentUser;
      if (user) {
        setDoc(doc(db, 'users', user.uid), { scheduleBlocks2: current, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      }
    } else {
      let current = get().scheduleBlocks.map((b) => {
        if (b.id === id) {
          return { ...b, ...updates };
        }
        if (updates.isDayStart) {
          return { ...b, isDayStart: false };
        }
        return b;
      });
      set({ scheduleBlocks: current });
      idbSet(KEY_SCHEDULE_BLOCKS, current);

      const user = auth.currentUser;
      if (user) {
        setDoc(doc(db, 'users', user.uid), { scheduleBlocks: current, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      }
    }
  },

  deleteBlock: (id, routineSet) => {
    const targetSet = routineSet || get().activeRoutineSet;

    if (targetSet === 2) {
      const current = get().scheduleBlocks2.filter((b) => b.id !== id);
      set({ scheduleBlocks2: current });
      idbSet(KEY_SCHEDULE_BLOCKS_2, current);

      const user = auth.currentUser;
      if (user) {
        setDoc(doc(db, 'users', user.uid), { scheduleBlocks2: current, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      }
    } else {
      const current = get().scheduleBlocks.filter((b) => b.id !== id);
      set({ scheduleBlocks: current });
      idbSet(KEY_SCHEDULE_BLOCKS, current);

      const user = auth.currentUser;
      if (user) {
        setDoc(doc(db, 'users', user.uid), { scheduleBlocks: current, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      }
    }
  },

  addGroup: (name, items = []) => {
    const colors = ['#6366f1', '#10b981', '#f97316', '#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b', '#64748b'];
    const { scheduleGroups } = get();

    if (scheduleGroups.some((g) => g.name.toLowerCase() === name.trim().toLowerCase())) {
      return;
    }

    const newGroup: ScheduleGroup = {
      id: `sgrp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      color: colors[scheduleGroups.length % colors.length],
      items,
    };

    const updated = [...scheduleGroups, newGroup];
    set({ scheduleGroups: updated });
    idbSet(KEY_SCHEDULE_GROUPS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { scheduleGroups: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  updateGroup: (id, name, items) => {
    const { scheduleGroups } = get();
    const updated = scheduleGroups.map((g) => {
      if (g.id === id) {
        return {
          ...g,
          name: name.trim(),
          items: items !== undefined ? items : g.items,
        };
      }
      return g;
    });

    set({ scheduleGroups: updated });
    idbSet(KEY_SCHEDULE_GROUPS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { scheduleGroups: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  deleteGroup: (id) => {
    const { scheduleGroups } = get();
    const updated = scheduleGroups.filter((g) => g.id !== id);

    set({ scheduleGroups: updated });
    idbSet(KEY_SCHEDULE_GROUPS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { scheduleGroups: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  assignItemToGroup: (itemName, groupId) => {
    const { scheduleGroups } = get();
    const updated = scheduleGroups.map((g) => {
      // Remove item from any group it might already belong to
      const cleanItems = (g.items || []).filter((i) => i !== itemName);
      if (g.id === groupId) {
        cleanItems.push(itemName);
      }
      return { ...g, items: cleanItems };
    });

    set({ scheduleGroups: updated });
    idbSet(KEY_SCHEDULE_GROUPS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { scheduleGroups: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  removeItemFromGroup: (itemName) => {
    const { scheduleGroups } = get();
    const updated = scheduleGroups.map((g) => ({
      ...g,
      items: (g.items || []).filter((i) => i !== itemName),
    }));

    set({ scheduleGroups: updated });
    idbSet(KEY_SCHEDULE_GROUPS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { scheduleGroups: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  setActiveRoutineSet: (setNum) => {
    set({ activeRoutineSet: setNum });
    idbSet(KEY_ACTIVE_ROUTINE_SET, setNum);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { activeRoutineSet: setNum, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },
}));
