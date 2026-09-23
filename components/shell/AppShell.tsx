'use client';

/**
 * X-29 AppShell Component (components/shell/AppShell.tsx)
 * 
 * Exact 100% parity with legacy index.html shell architecture:
 * - #app-wrapper (flex-col md:flex-row h-screen w-screen overflow-hidden)
 * - MobileHeader (md:hidden)
 * - #sidebar-backdrop (fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden)
 * - #sidebar-container (w-72 h-screen fixed md:relative transform -translate-x-full md:translate-x-0 transition-transform)
 * - #main-content-panel (flex-1 h-full overflow-y-auto flex flex-col p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 min-w-0)
 */

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { TopStatsBar } from './TopStatsBar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      id="app-wrapper"
      className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0f172a]"
    >
      {/* Mobile Header */}
      <MobileHeader onToggleMenu={() => setMobileMenuOpen(true)} />

      {/* Sidebar Backdrop */}
      <div
        id="sidebar-backdrop"
        onClick={() => setMobileMenuOpen(false)}
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
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Panel (Right) */}
      <div
        id="main-content-panel"
        className="flex-1 h-full overflow-y-auto flex flex-col p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 min-w-0 custom-scrollbar"
      >
        <TopStatsBar />
        {children}
      </div>
    </div>
  );
};

export default AppShell;
