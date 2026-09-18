/**
 * X-29 Authentication Service (services/authService.ts)
 * 
 * Modular wrapper around Firebase Auth with authorized admin validation.
 */

import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { AUTHORIZED_ADMIN_EMAIL, type AuthUser, type LoginCredentials } from '@/types/auth';

export class AuthService {
  /**
   * Verifies if a user is the designated admin account
   */
  static isAuthorizedAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
  }

  /**
   * Formats a Firebase User to application AuthUser model
   */
  static mapUser(user: User | null): AuthUser | null {
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL
    };
  }

  /**
   * Authenticates user via email and password
   */
  static async signIn(credentials: LoginCredentials): Promise<AuthUser> {
    const cleanEmail = credentials.email.trim().toLowerCase();
    
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, credentials.password);
    const user = userCredential.user;

    if (!this.isAuthorizedAdmin(user.email)) {
      await fbSignOut(auth);
      throw new Error('Access denied. X-29 is a private dashboard restricted to authorized administrators.');
    }

    const mappedUser = this.mapUser(user);
    if (!mappedUser) {
      throw new Error('Failed to resolve authenticated user profile.');
    }

    return mappedUser;
  }

  /**
   * Signs out the current user session
   */
  static async signOut(): Promise<void> {
    await fbSignOut(auth);
  }

  /**
   * Observers auth state changes
   */
  static onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return fbOnAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        callback(null);
        return;
      }

      if (!this.isAuthorizedAdmin(user.email)) {
        await fbSignOut(auth);
        callback(null);
        return;
      }

      callback(this.mapUser(user));
    });
  }

  /**
   * Gets current user synchronously from auth instance
   */
  static getCurrentUser(): AuthUser | null {
    return this.mapUser(auth.currentUser);
  }
}

export default AuthService;
