'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from '@/services/authService';

export default function LoginPage() {
  const router = useRouter();
  const { user, status } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-redirect if already authenticated as authorized admin
  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.replace('/');
    }
  }, [status, user, router]);

  // Check URL query parameters on mount (e.g. ?error=denied)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'denied') {
        setErrorMsg('Access denied. X-29 is private.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      await AuthService.signIn({ email, password });
      router.replace('/');
    } catch (err: unknown) {
      console.error('[Login] Authentication failed:', err);
      
      const errorObj = err as { code?: string; message?: string };
      let friendlyMsg = 'Authentication failed. Please check your credentials.';

      if (
        errorObj.code === 'auth/wrong-password' ||
        errorObj.code === 'auth/user-not-found' ||
        errorObj.code === 'auth/invalid-credential'
      ) {
        friendlyMsg = 'Invalid email or password.';
      } else if (errorObj.code === 'auth/invalid-email') {
        friendlyMsg = 'Invalid email address format.';
      } else if (errorObj.code === 'auth/user-disabled') {
        friendlyMsg = 'This user account has been disabled.';
      } else if (errorObj.message && errorObj.message.includes('Access denied')) {
        friendlyMsg = 'Access denied. X-29 is private.';
      }

      setErrorMsg(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#0b0f19] text-slate-100 min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      {/* Login Container */}
      <div className="w-full max-w-md z-10 transition-all duration-300">
        {/* Logo / Header Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-24 h-24 mb-4 relative drop-shadow-md">
            <Image
              src="/icons/logo-sticker.png"
              alt="X-29 Logo"
              width={96}
              height={96}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md mb-3">
            Private Access System
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            X-29
          </h1>
          <p className="text-slate-500 font-bold text-xs md:text-sm tracking-wide mt-2">
            Sign in to access your tracking workspace
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-card rounded-[2rem] p-6 md:p-8 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-400 text-xs font-semibold animate-fade-in transition-all"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email-input"
                className="block text-[10px] uppercase font-black tracking-widest text-slate-400"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  id="email-input"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm placeholder-slate-600 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 glowing-input transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password-input"
                className="block text-[10px] uppercase font-black tracking-widest text-slate-400"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  id="password-input"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm placeholder-slate-600 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 glowing-input transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Authenticate</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Notice */}
        <div className="text-center mt-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            Unauthorized access is strictly prohibited.
          </p>
        </div>
      </div>
    </main>
  );
}
