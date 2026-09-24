import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'X-29 — Tracking & Execution Workspace',
  description: 'Dynamic Multi-Track Execution & Tracking Dashboard',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/x-29-adv-logo.jpeg',
    apple: '/icons/x-29-adv-logo.jpeg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark scroll-smooth`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700;800&family=Rajdhani:wght@600;700;800&family=Chakra+Petch:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans overflow-hidden h-screen w-screen touch-action-manipulation" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
