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

    // PWA Service Worker Registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version ready for offline use.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
    }

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
