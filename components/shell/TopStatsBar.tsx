'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Trophy, Flame, GraduationCap } from 'lucide-react';

export const TopStatsBar: React.FC = () => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      {/* 1. Exam Countdown / Status Widget */}
      <div className="glass-card rounded-2xl p-3.5 flex items-center gap-3 border border-slate-800/80 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 truncate">
            Exam Tracker
          </p>
          <p className="text-xs md:text-sm font-black text-slate-100 truncate">Active Routine</p>
        </div>
      </div>

      {/* 2. Live System Clock Widget */}
      <div className="glass-card rounded-2xl p-3.5 flex items-center gap-3 border border-slate-800/80 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 truncate">
            {dateStr || 'Today'}
          </p>
          <p className="text-xs md:text-sm font-mono font-black text-slate-100 truncate">
            {timeStr || '--:--:--'}
          </p>
        </div>
      </div>

      {/* 3. Success Score Widget */}
      <div className="glass-card rounded-2xl p-3.5 flex items-center gap-3 border border-slate-800/80 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 truncate">
            Success Score
          </p>
          <p className="text-xs md:text-sm font-black text-slate-100 truncate">Syllabus Pacing</p>
        </div>
      </div>

      {/* 4. Execution Velocity / Focus Time */}
      <div className="glass-card rounded-2xl p-3.5 flex items-center gap-3 border border-slate-800/80 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Flame className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 truncate">
            Focus Daily Target
          </p>
          <p className="text-xs md:text-sm font-black text-emerald-400 truncate">Active Execution</p>
        </div>
      </div>
    </div>
  );
};

export default TopStatsBar;
