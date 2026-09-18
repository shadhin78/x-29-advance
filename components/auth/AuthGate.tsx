'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const router = useRouter();
  const { user, status } = useAuthStore();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0f19] text-white">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
            <span className="text-xl font-black tracking-widest text-white">X29</span>
          </div>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-indeterminate" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGate;
