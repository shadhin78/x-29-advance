import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, JetBrains_Mono, Rajdhani, Chakra_Petch } from 'next/font/google';
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

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-chakra',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'X-29 — Tracking & Execution Workspace',
  description: 'Dynamic Multi-Track Execution & Tracking Dashboard',
  applicationName: 'X-29',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'X-29',
  },
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
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} ${rajdhani.variable} ${chakraPetch.variable} dark scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body className="bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans overflow-hidden h-screen w-screen touch-manipulation" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
