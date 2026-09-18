'use client';

/**
 * X-29 Schedule Group Modal (features/schedule/components/ScheduleGroupModal.tsx)
 * 
 * Accessible dialog for creating and editing schedule work groups.
 */

import React, { useState, useEffect } from 'react';
import type { ScheduleGroup, ScheduleBlock } from '@/types/schedule';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FolderPlus, Check } from 'lucide-react';

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

  // Unique work items across current blocks
  const availableWorkItems = React.useMemo(() => {
    const itemSet = new Set<string>();
    blocks.forEach((b) => {
      if (b.task) itemSet.add(b.task);
    });
    return Array.from(itemSet).sort();
  }, [blocks]);

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name);
      setSelectedItems(groupToEdit.items || []);
    } else {
      setName('');
      setSelectedItems([]);
    }
  }, [groupToEdit, open]);

  const toggleItem = (itemName: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(name.trim(), selectedItems, groupToEdit?.id);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-emerald-500" />
              <Dialog.Title className="text-base font-black uppercase tracking-wider">
                {groupToEdit ? 'Edit Work Group' : 'Create Work Group'}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Group Name
              </label>
              <input
                type="text"
                placeholder="e.g. Study & Academic"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Assign Work Items
              </label>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {availableWorkItems.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No work items found in current routine.
                  </p>
                ) : (
                  availableWorkItems.map((item) => {
                    const isChecked = selectedItems.includes(item);
                    return (
                      <label
                        key={item}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-950/30 border-emerald-800/80 text-white'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold truncate pr-2">{item}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
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
