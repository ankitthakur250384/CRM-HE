/**
 * DEPRECATED: Firebase has been completely removed from the application
 * This is a stub file to prevent any legacy import errors
 * The application now uses PostgreSQL instead of Firebase
 */

// Mock Firebase auth
export const auth = {
  onAuthStateChanged: (_callback: any) => {
    return () => {}; // Return noop unsubscribe function
  },
  signInWithEmailAndPassword: async () => {
    console.warn('Firebase auth is deprecated. Use the PostgreSQL auth service instead.');
    return Promise.reject(new Error('Firebase auth is disabled'));
  },
  signOut: async () => {
    console.warn('Firebase auth is deprecated. Use the PostgreSQL auth service instead.');
    return Promise.resolve();
  },
  currentUser: null
};

// Create mock Firestore database object
export const db = {
  collection: (_path: string) => ({
    doc: (_id: string) => ({
      get: async () => ({
        exists: false,
        data: () => null,
        id: _id,
      }),
      set: async () => Promise.resolve(),
      update: async () => Promise.resolve(),
      delete: async () => Promise.resolve(),
    }),
    add: async () => ({ id: 'mock-id' }),
    where: () => ({
      get: async () => ({
        empty: true,
        docs: [],
        forEach: () => {},
      }),
    }),
  }),
};

// Export mock firestore object
export const firestore = {
  collection: (_collection: string) => ({
    doc: (_id: string) => ({
      get: async () => Promise.resolve({
        exists: false,
        data: () => null,
      }),
      set: async (_data: any) => Promise.resolve(),
      update: async (_data: any) => Promise.resolve(),
      delete: async () => Promise.resolve(),
    }),
    where: (_field: string, _operator: string, _value: any) => ({
      get: async () => Promise.resolve({
        empty: true,
        docs: [],
      }),
    }),
  }),
};

// Export a function that logs a warning when any Firebase function is called
export function initFirebase() {
  console.warn('Firebase is no longer used. The application now uses PostgreSQL.');
  return { auth, firestore, db };
}

export default { auth, firestore, db };