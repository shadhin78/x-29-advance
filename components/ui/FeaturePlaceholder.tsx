'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, type LucideIcon } from 'lucide-react';

interface FeaturePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
  badgeColor?: string;
}

export const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({
  title,
  description,
  icon: Icon,
  phase,
  badgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}) => {
  return (
    <div className="space-y-6 animate-page-enter">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
              <Icon className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <span
                className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border mb-1 ${badgeColor}`}
              >
                {phase}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">{title}</h1>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{description}</p>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            This feature module boundary will be migrated incrementally in the next implementation stage. The working legacy implementation is accessible in the reference app.
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeaturePlaceholder;
