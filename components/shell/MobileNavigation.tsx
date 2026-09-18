'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-slide-right flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
          aria-label="Close Navigation"
        >
          <X className="w-4 h-4" />
        </button>
        <Sidebar onNavigate={onClose} className="w-full" />
      </div>
    </div>
  );
};

export default MobileNavigation;
