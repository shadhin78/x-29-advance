/**
 * X-29 Firestore Client Instance (lib/firebase/firestore.ts)
 * 
 * Isolated in a dedicated module so that pages that do not need Firestore
 * (like Login, Shell, Not-Found) do not eagerly load the ~140KB Firestore bundle.
 */

import { getFirestore, type Firestore } from 'firebase/firestore';
import { app } from './client';

export const db: Firestore = getFirestore(app);
export default db;
