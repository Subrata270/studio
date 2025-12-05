// Script to add admin user to Firestore
// Run with: node firestore-import/add-admin-user.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert("./firestore-import/serviceAccountKey.json")
  });
}

const db = admin.firestore();

const adminUser = {
  id: 'user-admin',
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
  subrole: null,
  department: 'Administration'
};

async function addAdminUser() {
  try {
    console.log('🔄 Adding admin user to Firestore...');
    
    // Check if admin user already exists
    const userRef = db.collection('users').doc(adminUser.id);
    const doc = await userRef.get();
    
    if (doc.exists) {
      console.log('⚠️  Admin user already exists. Updating...');
      await userRef.update(adminUser);
      console.log('✅ Admin user updated successfully!');
    } else {
      await userRef.set(adminUser);
      console.log('✅ Admin user added successfully!');
    }
    
    console.log('\n📧 Admin Credentials:');
    console.log('Email:', adminUser.email);
    console.log('Password:', adminUser.password);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    process.exit(1);
  }
}

addAdminUser();
