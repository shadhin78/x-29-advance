'use client';

/**
 * X-29 Edit Daily Action Modal (features/daily-actions/components/modals/EditDailyActionModal.tsx)
 * 
 * 100% Visual and Behavioral Parity with legacy #edit-daily-action-modal:
 * - Reference: index.html lines 760-860
 * - Raw SVG icons with stroke-width 2.5/3
 * - Title, Subtitle, Inputs, Color/Icon/Track dropdowns
 * - Delete button, Cancel button, and Save Changes button
 */

import React, { useState, useEffect } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';

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
      question: desc.trim(),
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
    >
      {/* Backdrop */}
      <div
        id="edam-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl transition-opacity duration-300 cursor-pointer"
        data-modal-close="edit-daily-action-modal"
      />

      {/* Content Container */}
      <div
        id="edam-content"
        className="relative bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200/50 dark:border-slate-700/50 transform scale-100 opacity-100 transition-all duration-300 mx-4 z-10 flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black truncate max-w-[220px] text-slate-800 dark:text-slate-100">
                Edit Daily Action
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Modify tracker details or start date
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-modal-close="edit-daily-action-modal"
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:rotate-90 transition-transform active:scale-95 cursor-pointer text-slate-500 dark:text-slate-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4 mb-6">
          <input type="hidden" id="edam-action-id" value={currentAction.id} />

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Action Title
            </label>
            <input
              type="text"
              id="edam-action-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-bold w-full text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Question / Description
            </label>
            <input
              type="text"
              id="edam-action-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (Optional)"
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-bold w-full text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Start Date
              </label>
              <input
                type="date"
                id="edam-action-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-bold w-full text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Theme Color
              </label>
              <select
                id="edam-action-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-bold w-full text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Icon
              </label>
              <select
                id="edam-action-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-bold w-full text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="generic">List / Default</option>
                <option value="book">Graduation Cap / Academic</option>
                <option value="briefcase">Briefcase / Professional</option>
                <option value="gym">Heart / Gym & Health</option>
                <option value="freelance">Lightning / Work & Code</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Track (Optional)
              </label>
              <select
                id="edam-action-track"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-bold w-full text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              id="edam-btn-delete"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 font-black text-[10px] uppercase tracking-widest py-2 px-3 rounded-lg transition-colors active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Delete</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-black text-[10px] uppercase tracking-widest py-2.5 px-4 rounded-lg transition-colors active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="edam-btn-save"
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest py-2.5 px-5 rounded-lg transition-colors shadow-md shadow-blue-500/10 active:scale-95 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
