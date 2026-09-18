import React from 'react';
import { AuthGate } from '@/components/auth/AuthGate';
import { AppShell } from '@/components/shell/AppShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
