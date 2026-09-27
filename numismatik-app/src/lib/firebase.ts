import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, inMemoryPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

function createAuth() {
  if (!Capacitor.isNativePlatform()) {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, { persistence: inMemoryPersistence });
  } catch (error) {
    console.error('In-memory auth could not start:', error);
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();

export default app;
