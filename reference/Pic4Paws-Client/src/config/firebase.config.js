import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithCustomToken,
  getAdditionalUserInfo
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const createMissingFirebaseAuth = () => ({
  onAuthStateChanged(callback) {
    callback(null);
    return () => {};
  },
  signOut() {
    return Promise.resolve();
  }
});

if (isFirebaseConfigured) {
  initializeApp(firebaseConfig);
}

export const auth = isFirebaseConfigured
  ? getAuth()
  : createMissingFirebaseAuth();

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const requireFirebase = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase environment variables are not configured.');
  }
};

export const signInWithGoogle = () => {
  requireFirebase();
  return signInWithPopup(auth, provider);
};

export const signInEmailPassword = token => {
  requireFirebase();
  return signInWithCustomToken(auth, token);
};

export const getAdditionalInfo = user => getAdditionalUserInfo(user);
