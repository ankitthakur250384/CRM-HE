import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { setupInitialUsers } from '../services/firestore/setupUsers';

// Configure with directly exported config for better reliability
export const firebaseConfig = {
  apiKey: "AIzaSyABVXrylOIescVfarC8WhtDcDvJa8bxDKU",
  authDomain: "ai-crm-database.firebaseapp.com",
  projectId: "ai-crm-database",
  storageBucket: "ai-crm-database.firebasestorage.app",
  messagingSenderId: "201042126488",
  appId: "1:201042126488:web:9c85da043d8db0686452ed",
  // Explicitly enable persistence
  persistence: true
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// Configure auth with persistence
export const auth = getAuth(app);

// Force MAXIMUM persistence - use both Firebase and our own mechanisms
// CRITICAL: This must happen BEFORE any auth operations
try {
  // Check if we've already set persistence in this page load
  const persistenceSet = localStorage.getItem('firebase-persistence-set-time');
  const now = Date.now();
  
  // Only set persistence if it hasn't been set in the last minute
  // This prevents multiple setPersistence calls which can cause issues
  if (!persistenceSet || (now - parseInt(persistenceSet, 10)) > 60000) {
    console.log('🔐 Setting Firebase auth persistence...');
    
    // Set persistence and update timestamp
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('✅ Firebase auth persistence ENABLED - auth state will persist across page reloads');
        
        // Set flags indicating persistence is enabled with timestamp
        localStorage.setItem('firebase-persistence-enabled', 'true');
        localStorage.setItem('firebase-persistence-set-time', Date.now().toString());
        
        // Verify current auth state
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('🔑 Active Firebase user detected on initialization:', currentUser.uid);
        } else {
          console.log('🔒 No active Firebase user on initialization');
        }
      })
      .catch(error => console.error('❌ Error setting auth persistence:', error));
  } else {
    console.log('🔒 Firebase persistence already set recently - skipping');
  }
} catch (error) {
  console.error('❌ Error in Firebase persistence setup:', error);
}

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