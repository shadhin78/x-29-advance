'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
}

interface NavButtonConfig {
  id: string;
  href: string;
  label: string;
  activeClass: string;
  hoverClass: string;
  renderIcon: () => React.ReactNode;
}

const NAV_BUTTONS: NavButtonConfig[] = [
  {
    id: 'dashboard',
    href: '/',
    label: 'Dashboard',
    activeClass: 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-lg',
    hoverClass: 'hover:border-blue-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'spectra-analytics',
    href: '/analytics',
    label: 'Analytics',
    activeClass: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-transparent shadow-lg shadow-fuchsia-500/20',
    hoverClass: 'hover:border-fuchsia-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'timer',
    href: '/focus',
    label: 'Focus',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-lg',
    hoverClass: 'hover:border-emerald-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'daily-actions',
    href: '/daily-actions',
    label: 'Daily Actions',
    activeClass: 'bg-orange-500 text-white border-orange-500 shadow-lg',
    hoverClass: 'hover:border-orange-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    href: '/schedule',
    label: 'Daily Schedule',
    activeClass: 'bg-cyan-600 text-white border-cyan-600 shadow-lg',
    hoverClass: 'hover:border-cyan-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'subjects',
    href: '/subjects',
    label: 'Subjects',
    activeClass: 'bg-violet-600 text-white border-violet-600 shadow-lg',
    hoverClass: 'hover:border-violet-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'paces-management',
    href: '/pace',
    label: 'Pace Management',
    activeClass: 'bg-red-600 text-white border-red-600 shadow-lg',
    hoverClass: 'hover:border-red-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'master-config',
    href: '/master-config',
    label: 'Master Config',
    activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-lg',
    hoverClass: 'hover:border-indigo-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'outcome',
    href: '/outcome',
    label: 'Outcome',
    activeClass: 'bg-yellow-500 text-white border-yellow-500 shadow-lg',
    hoverClass: 'hover:border-yellow-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    id: 'exam',
    href: '/exam',
    label: 'Exam Routine',
    activeClass: 'bg-rose-600 text-white border-rose-600 shadow-lg',
    hoverClass: 'hover:border-rose-400',
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
      </svg>
    ),
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  const displayName = user?.displayName || 'ris2k29';
  const email = user?.email || 'ris2k29@gmail.com';
  const initial = (displayName.charAt(0) || 'R').toUpperCase();

  return (
    <aside
      id="sidebar-container"
      className={`flex flex-col w-72 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none ${className}`}
    >
      <div className="flex flex-col h-full min-h-0 justify-between p-5 md:p-6 overflow-y-auto custom-scrollbar">
        {/* Sidebar Top Section */}
        <div className="space-y-8 pt-4">
          <div className="flex items-center justify-between gap-4">
            {/* Branding Tag with Aura Glow */}
            <div className="relative group flex-1">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 opacity-70 blur-xl animate-aura"></div>
              <div className="relative px-5 py-3 bg-slate-950/80 border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-center gap-2.5">
                <img
                  src="/icons/logo-sticker.png"
                  alt="X-29 Logo"
                  className="w-6 h-6 object-contain drop-shadow"
                />
                <span
                  id="dash-top-tag"
                  className="text-sm md:text-base font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-400 drop-shadow-sm"
                >
                  X-29
                </span>
              </div>
            </div>

            {/* Close button for mobile */}
            {onClose && (
              <button
                id="sidebar-close-btn"
                onClick={onClose}
                className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Navigation List */}
          <nav className="flex flex-col gap-2.5 mt-8 border-t border-slate-100 dark:border-slate-800/60 pt-6">
            {NAV_BUTTONS.map((btn) => {
              const isActive =
                btn.href === '/'
                  ? (pathname || '/') === '/'
                  : !!(pathname && pathname.startsWith(btn.href));

              const baseClass =
                'w-full text-left border-2 px-4 py-3 rounded-2xl font-black text-xs transition-all duration-300 hover:translate-x-1.5 hover:shadow-md active:scale-98 flex items-center gap-3';
              const stateClass = isActive
                ? btn.activeClass
                : `bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${btn.hoverClass}`;

              return (
                <Link
                  key={btn.id}
                  id={`btn-nav-${btn.id}`}
                  href={btn.href}
                  onClick={() => {
                    if (onNavigate) onNavigate();
                    if (onClose) onClose();
                  }}
                  className={`${baseClass} ${stateClass}`}
                >
                  {btn.renderIcon()}
                  <span>{btn.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Section (Profile & Sync) */}
        <div className="mt-8 space-y-4">
          {/* Sync / Load statuses */}
          <div className="flex flex-col gap-2">
            <div
              id="sync-status"
              className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 transition-all opacity-100 scale-100 duration-300"
            >
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span
                id="sync-text"
                className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
              >
                Synced / Ready
              </span>
            </div>
          </div>

          {/* Profile Card */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <div
              id="profile-card-btn"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
            >
              <div
                id="profile-avatar"
                className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase text-sm shrink-0 shadow-sm"
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <span id="profile-name" className="block text-xs font-black truncate text-slate-800 dark:text-slate-200">
                  {displayName}
                </span>
                <span id="profile-email" className="block text-[9px] font-semibold text-slate-400 truncate">
                  {email}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="btn-logout"
              onClick={handleLogout}
              className="w-full bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl font-black text-xs text-rose-500 transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
