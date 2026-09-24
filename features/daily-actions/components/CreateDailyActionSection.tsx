'use client';

/**
 * X-29 Create Daily Action Section (features/daily-actions/components/CreateDailyActionSection.tsx)
 * 
 * 100% Parity with legacy #add-daily-action-section:
 * - Collapsible details container with animated chevron
 * - Fields: Action Title, Description/Question, Start Date, Theme Color, Icon, Track
 * - Submission creates and persists action into store and IndexedDB
 */

import React, { useState } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';

export const CreateDailyActionSection: React.FC = () => {
  const { addHabit } = useDailyActionStore();
  const { tracks } = useTaxonomyStore();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [color, setColor] = useState('indigo');
  const [icon, setIcon] = useState('generic');
  const [track, setTrack] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addHabit({
      title: title.trim(),
      name: title.trim(),
      desc: desc.trim(),
      question: desc.trim(),
      startDate,
      color,
      icon,
      track,
    });

    setTitle('');
    setDesc('');
    setStartDate('');
  };

  return (
    <details
      id="add-daily-action-section"
      className="mt-8 md:mt-10 bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm group overflow-hidden"
    >
      <summary className="cursor-pointer p-5 md:p-8 outline-none select-none list-none flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/80 transition-colors [&::-webkit-details-marker]:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black dark:text-white leading-tight">
              Create Daily Action Tracker
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Click to configure and add new daily habits or trackers
            </p>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 group-open:rotate-180 transition-all duration-300 shrink-0 border border-slate-200/50 dark:border-slate-600/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </summary>

      <div className="p-5 md:p-8 space-y-6">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50"
        >
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Action Title
            </label>
            <input
              type="text"
              id="add-act-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
              placeholder="Action Title"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Question / Description (Optional)
            </label>
            <input
              type="text"
              id="add-act-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
              placeholder="Description (Optional)"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Start Date (Optional)
            </label>
            <input
              type="date"
              id="add-act-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Theme Color
            </label>
            <select
              id="add-act-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
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

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Icon
            </label>
            <select
              id="add-act-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
            >
              <option value="generic">List / Default</option>
              <option value="book">Graduation Cap / Academic</option>
              <option value="briefcase">Briefcase / Professional</option>
              <option value="gym">Heart / Gym & Health</option>
              <option value="freelance">Lightning / Work & Code</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Track (Optional)
            </label>
            <select
              id="add-act-track"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full"
            >
              <option value="">All Tracks (Default)</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-full pt-2 flex justify-end">
            <button
              type="submit"
              data-append-new-action
              id="btn-append-new-action"
              className="w-full sm:w-auto px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest py-3 rounded-lg transition-all active:scale-95 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              Create Action
            </button>
          </div>
        </form>
      </div>
    </details>
  );
};
