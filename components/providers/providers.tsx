'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from '@/services/authService';
import { ModalHost } from '@/components/ui/ModalHost';

export function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);

  useEffect(() => {
    setStatus('loading');
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      setUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, [setUser, setStatus]);

  return (
    <>
      {children}
      <ModalHost />
    </>
  );
}

export default Providers;
