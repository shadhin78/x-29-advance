/**
 * X-29 Authentication & User Types
 */

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const AUTHORIZED_ADMIN_EMAIL = 'ris2k29@gmail.com';
