'use client';

import React from 'react';
import { ShieldCheck, Sparkles, Layers, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 md:space-y-8 animate-page-enter">
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next.js 16 + React 19 Foundation Active</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.displayName || 'Admin'}</span>
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            The X-29 Next.js application shell, authentication gate, and domain state foundations are running. The legacy Vanilla application remains available and functional.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Verified</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Modular Client Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Roadmap Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-card rounded-3xl p-5 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Foundation</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-white">Shell & Routing</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Next.js App Router, responsive desktop & mobile shells, and Zustand stores initialized.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Security</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-white">Auth Gate</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Modular Firebase Auth observer with strict admin route gating and session restoration.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Next Step</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-white">Feature Migration</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upcoming incremental migration for Focus, Exam Routine, Daily Schedule, and Outcomes.
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">
          Navigation Routes (Proof of Architecture)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { href: '/analytics', label: 'Analytics' },
            { href: '/focus', label: 'Focus Timer' },
            { href: '/daily-actions', label: 'Daily Actions' },
            { href: '/schedule', label: 'Daily Schedule' },
            { href: '/subjects', label: 'Subjects' },
            { href: '/pace', label: 'Pace Management' },
            { href: '/master-config', label: 'Master Config' },
            { href: '/outcome', label: 'Outcome' },
            { href: '/exam', label: 'Exam Routine' },
          ].map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 transition-all text-xs font-bold text-slate-200 group"
            >
              <span>{r.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
