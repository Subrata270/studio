/**
 * Firebase Diagnostic Script
 * Run this in the browser console to check Firebase setup
 */

// Check if Firebase is initialized
console.log('=== Firebase Diagnostic ===');

// Check environment variables
console.log('\n1. Environment Variables:');
console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing');
console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing');
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');

// Check Firebase initialization
try {
  const { initializeFirebase } = require('@/firebase');
  const { auth, firestore } = initializeFirebase();
  console.log('\n2. Firebase Services:');
  console.log('Auth:', auth ? '✓ Initialized' : '✗ Failed');
  console.log('Firestore:', firestore ? '✓ Initialized' : '✗ Failed');
  
  // Check current auth state
  console.log('\n3. Authentication State:');
  console.log('Current User:', auth.currentUser ? auth.currentUser.uid : 'Not signed in');
  console.log('Is Anonymous:', auth.currentUser?.isAnonymous ? 'Yes' : 'No');
  
  // Listen for auth changes
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('✓ User authenticated:', user.uid, user.isAnonymous ? '(anonymous)' : '(email)');
    } else {
      console.log('✗ No user authenticated');
    }
  });
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Check store state
try {
  const { useAppStore } = require('@/store/app-store');
  const store = useAppStore.getState();
  console.log('\n4. Store State:');
  console.log('Has Fetched:', store.hasFetchedFromFirestore);
  console.log('Is Syncing:', store.isSyncing);
  console.log('Is Store Ready:', store.hasFetchedFromFirestore && !store.isSyncing);
  console.log('Users Count:', store.users.length);
  console.log('Subscriptions Count:', store.subscriptions.length);
  console.log('Notifications Count:', store.notifications.length);
} catch (error) {
  console.error('Store check error:', error);
}

console.log('\n=== End Diagnostic ===');
