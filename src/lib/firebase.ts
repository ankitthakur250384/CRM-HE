import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { setupInitialUsers } from '../services/firestore/setupUsers';

const firebaseConfig = {
  apiKey: "AIzaSyABVXrylOIescVfarC8WhtDcDvJa8bxDKU",
  authDomain: "ai-crm-database.firebaseapp.com",
  projectId: "ai-crm-database",
  storageBucket: "ai-crm-database.firebasestorage.app",
  messagingSenderId: "201042126488",
  appId: "1:201042126488:web:9c85da043d8db0686452ed"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.error('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.error('The current browser does not support persistence.');
    } else {
      console.error('Error enabling persistence:', err);
    }
  });

// Set up initial users
setupInitialUsers().catch(console.error);