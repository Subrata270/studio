// Quick script to update user password in Firestore
// Run this in browser console on your app page

async function updateUserPassword() {
  const { initializeFirebase } = await import('./firebase/index.ts');
  const { doc, updateDoc } = await import('firebase/firestore');
  
  const { firestore } = initializeFirebase();
  const userDocRef = doc(firestore, 'users', 'ff3wJQD8ocYGCGY0P2oH8b3OOvz2');
  
  try {
    await updateDoc(userDocRef, {
      password: '12345678'
    });
    console.log('✅ Password updated successfully!');
    console.log('Try logging in with: suneel@gmail.com / 12345678');
  } catch (error) {
    console.error('❌ Failed to update password:', error);
  }
}

// Run the function
updateUserPassword();
