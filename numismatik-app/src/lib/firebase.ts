import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, inMemoryPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: inMemoryPersistence })
  : getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();

export default app;
