'use client';

/**
 * X-29 Edit Daily Action Modal (features/daily-actions/components/modals/EditDailyActionModal.tsx)
 * 
 * 100% Parity with legacy #edit-daily-action-modal:
 * - Update Action Title, Description/Question, Start Date, Color, Icon, Track
 * - Delete Action confirmation and execution
 */

import React, { useState, useEffect } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';
import { Edit3, X, Trash2, Check } from 'lucide-react';

interface EditDailyActionModalProps {
  isOpen: boolean;
  actionId: string | null;
  onClose: () => void;
}

export const EditDailyActionModal: React.FC<EditDailyActionModalProps> = ({
  isOpen,
  actionId,
  onClose,
}) => {
  const { habits, updateHabit, deleteHabit } = useDailyActionStore();
  const { tracks } = useTaxonomyStore();

  const currentAction = habits.find((h) => h.id === actionId);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [color, setColor] = useState('indigo');
  const [icon, setIcon] = useState('generic');
  const [track, setTrack] = useState('');

  useEffect(() => {
    if (currentAction) {
      setTitle(currentAction.title || currentAction.name || '');
      setDesc(currentAction.desc || currentAction.question || '');
      setStartDate(currentAction.startDate || '');
      setColor(currentAction.color || 'indigo');
      setIcon(currentAction.icon || 'generic');
      setTrack(currentAction.track || '');
    }
  }, [currentAction]);

  if (!isOpen || !currentAction) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateHabit(currentAction.id, {
      title: title.trim(),
      name: title.trim(),
      desc: desc.trim(),
      startDate,
      color,
      icon,
      track,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${currentAction.title || currentAction.name}"?`)) {
      deleteHabit(currentAction.id);
      onClose();
    }
  };

  return (
    <div
      id="edit-daily-action-modal"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl transition-opacity duration-300"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200/50 dark:border-slate-700/50 z-10 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                Edit Daily Action
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Configure habit metadata & aesthetics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:rotate-90 transition-transform active:scale-95 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Action Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Description / Prompt
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Track
              </label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tracks (Default)</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Theme Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="indigo">Indigo</option>
                <option value="emerald">Emerald</option>
                <option value="orange">Orange</option>
                <option value="purple">Purple</option>
                <option value="rose">Rose</option>
                <option value="cyan">Cyan</option>
                <option value="blue">Blue</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Icon
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="generic">List / Default</option>
                <option value="book">Graduation Cap / Academic</option>
                <option value="briefcase">Briefcase / Professional</option>
                <option value="gym">Heart / Gym & Health</option>
                <option value="freelance">Lightning / Work & Code</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
