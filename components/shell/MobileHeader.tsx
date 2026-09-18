'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Clock } from 'lucide-react';

interface MobileHeaderProps {
  onToggleMenu: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onToggleMenu }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="md:hidden sticky top-0 z-40 w-full bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMenu}
          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white active:scale-95 transition-all"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black tracking-tight text-white">X-29</span>
          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
            ADV
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/40 shadow-inner">
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span>{timeStr || '--:--:--'}</span>
      </div>
    </header>
  );
};

export default MobileHeader;
