'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, CloudCheck, Check } from 'lucide-react';
import { NAV_ITEMS } from '@/components/navigation/navItems';
import { useAuthStore } from '@/stores/useAuthStore';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={`w-72 bg-slate-900/60 border-r border-slate-800/80 backdrop-blur-xl flex flex-col justify-between h-full select-none ${className}`}
    >
      {/* Top Branding */}
      <div>
        <div className="p-6 pb-4 border-b border-slate-800/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1 relative shadow-inner overflow-hidden shrink-0">
            <Image
              src="/icons/logo-sticker.png"
              alt="Logo"
              width={36}
              height={36}
              className="object-contain w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-white">X-29</span>
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 truncate">Execution Workspace</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-230px)] custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname
              ? (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))
              : false;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'scale-110 text-white' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Sync */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
        {/* Sync status pill */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[10px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Ready / Synced</span>
          </div>
          <span className="text-slate-400 text-[9px] font-mono">v1.0-next</span>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white uppercase shrink-0 shadow">
              {user?.displayName ? user.displayName.charAt(0) : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                {user?.displayName || 'Admin'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
