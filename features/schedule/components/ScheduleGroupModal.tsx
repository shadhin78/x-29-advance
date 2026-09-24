'use client';

/**
 * X-29 Schedule Group Modal (features/schedule/components/ScheduleGroupModal.tsx)
 * 
 * 100% Parity with legacy index.html (#create-schedule-group-modal) & scheduleRoutine.js (lines 358-472).
 * Accessible Radix Dialog for creating and editing work groups,
 * with available/ungrouped work item checkboxes.
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { ScheduleGroup, ScheduleBlock } from '@/types/schedule';
import * as Dialog from '@radix-ui/react-dialog';

interface ScheduleGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit: ScheduleGroup | null;
  blocks: ScheduleBlock[];
  groups: ScheduleGroup[];
  onSave: (name: string, items: string[], existingId?: string) => void;
}

export const ScheduleGroupModal: React.FC<ScheduleGroupModalProps> = ({
  open,
  onOpenChange,
  groupToEdit,
  blocks,
  groups,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Identify work items that are either ungrouped OR in this current group
  const availableWorkItems = useMemo(() => {
    const itemSet = new Set<string>();
    blocks.forEach((b) => {
      if (b.task && b.task.trim()) {
        itemSet.add(b.task.trim());
      }
    });

    const allWorkNames = Array.from(itemSet).sort();

    // Map which group owns which work item
    const workToGroupMap: Record<string, string> = {};
    groups.forEach((g) => {
      (g.items || []).forEach((itemName) => {
        workToGroupMap[itemName] = g.id;
      });
    });

    // Show items that are not in any group OR are in groupToEdit
    return allWorkNames.filter((itemName) => {
      const owningGroupId = workToGroupMap[itemName];
      return !owningGroupId || (groupToEdit && owningGroupId === groupToEdit.id);
    });
  }, [blocks, groups, groupToEdit]);

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name);
      setSelectedItems(groupToEdit.items || []);
      setErrorMessage('');
    } else {
      setName('');
      setSelectedItems([]);
      setErrorMessage('');
    }
  }, [groupToEdit, open]);

  const toggleItem = (itemName: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a group name.');
      return;
    }

    // Check duplicate name
    const isDuplicate = groups.some(
      (g) =>
        (!groupToEdit || g.id !== groupToEdit.id) &&
        g.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage('A group with that name already exists.');
      return;
    }

    setErrorMessage('');
    onSave(trimmed, selectedItems, groupToEdit?.id);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          id="csgm-backdrop"
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[80] transition-opacity duration-300"
        />
        <Dialog.Content
          id="create-schedule-group-modal"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 z-[80] focus:outline-none flex flex-col mx-4"
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <Dialog.Title
                  id="csgm-title"
                  className="text-xl font-black text-slate-800 dark:text-slate-100"
                >
                  {groupToEdit ? 'Edit Work Group' : 'Create Work Group'}
                </Dialog.Title>
                <Dialog.Description className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Organize your schedule slots
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              data-modal-close="create-schedule-group-modal"
              className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:rotate-90 transition-transform active:scale-95"
            >
              <svg className="w-5 h-5 text-slate-500 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400">
                {errorMessage}
              </div>
            )}

            {/* Group Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Group Name:
              </label>
              <input
                type="text"
                id="group-input-name"
                placeholder="e.g. Core Work, Study Session"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-inner"
              />
            </div>

            {/* Ungrouped Work Items Checkboxes */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Select Ungrouped Work Items to Add:
              </label>
              <div
                id="group-modal-ungrouped-list"
                className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar"
              >
                {availableWorkItems.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider py-2">
                    No work items available to group.
                  </p>
                ) : (
                  availableWorkItems.map((itemName) => {
                    const isChecked = selectedItems.includes(itemName);
                    return (
                      <label
                        key={itemName}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none w-full"
                      >
                        <input
                          type="checkbox"
                          name="group-work-item"
                          value={itemName}
                          checked={isChecked}
                          onChange={() => toggleItem(itemName)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {itemName}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <button
                type="button"
                data-modal-close="create-schedule-group-modal"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="csgm-submit-btn"
                data-submit-create-group
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-black uppercase tracking-wider text-white active:scale-95 transition-all shadow-md"
              >
                {groupToEdit ? 'Save Changes' : 'Create Group'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
