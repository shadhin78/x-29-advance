'use client';

/**
 * X-29 AppShell Component (components/shell/AppShell.tsx)
 * 
 * Exact 100% parity with legacy index.html shell architecture + WCAG 2.1 AA Modern Accessibility:
 * - Skip to Main Content link for keyboard-only navigation (Tab)
 * - Semantic landmark roles (<main id="main-content-panel" role="main">)
 * - Accessible mobile navigation drawer with Escape key listener and backdrop dismiss
 * - #app-wrapper (flex-col md:flex-row h-screen w-screen overflow-hidden)
 * - MobileHeader (md:hidden)
 * - #sidebar-backdrop
 * - #sidebar-container
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { TopStatsBar } from './TopStatsBar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);
  const openMenu = useCallback(() => setMobileMenuOpen(true), []);

  // Close drawer on Escape key for full keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div
      id="app-wrapper"
      className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0f172a]"
    >
      {/* Skip to Main Content Link for WCAG 2.1 AA Keyboard Accessibility */}
      <a
        href="#main-content-panel"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:font-black focus:text-xs focus:uppercase focus:tracking-wider focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Mobile Header */}
      <MobileHeader onToggleMenu={openMenu} isMenuOpen={mobileMenuOpen} />

      {/* Sidebar Backdrop for Mobile */}
      <div
        id="sidebar-backdrop"
        onClick={closeMenu}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar (Left) */}
      <Sidebar
        className={`fixed md:relative inset-y-0 left-0 z-50 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } transition-transform duration-300 ease-in-out`}
        onClose={closeMenu}
      />

      {/* Main Content Landmark (Right) */}
      <main
        id="main-content-panel"
        role="main"
        tabIndex={-1}
        className="flex-1 h-full overflow-y-auto flex flex-col p-4 sm:p-5 md:p-6 lg:p-8 space-y-5 md:space-y-6 lg:space-y-8 min-w-0 custom-scrollbar outline-none"
      >
        <TopStatsBar />
        {children}
      </main>
    </div>
  );
};

export default AppShell;
