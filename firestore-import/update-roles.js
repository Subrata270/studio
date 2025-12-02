const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./firestore-import/serviceAccountKey.json")
});

const db = admin.firestore();

async function updateUserRoles() {
  try {
    console.log("Starting role update process...");
    
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log("No users found in database.");
      return;
    }

    const batch = db.batch();
    let employeeCount = 0;
    let adminCount = 0;
    let totalProcessed = 0;

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const docRef = usersRef.doc(doc.id);
      
      // Change 'employee' to 'poc'
      if (userData.role === 'employee') {
        console.log(`✓ Updating user ${userData.email}: employee -> poc`);
        batch.update(docRef, { role: 'poc' });
        employeeCount++;
        totalProcessed++;
      }
      
      // Delete admin users
      if (userData.role === 'admin') {
        console.log(`✗ Deleting admin user: ${userData.email}`);
        batch.delete(docRef);
        adminCount++;
        totalProcessed++;
      }
    });

    if (totalProcessed > 0) {
      await batch.commit();
      console.log("\n✅ Database update completed!");
      console.log(`   - Changed ${employeeCount} users from 'employee' to 'poc'`);
      console.log(`   - Deleted ${adminCount} admin users`);
    } else {
      console.log("✓ No updates needed. Database is already up to date.");
    }

  } catch (error) {
    console.error("❌ Error updating roles:", error);
    process.exit(1);
  }
}

updateUserRoles()
  .then(() => {
    console.log("\nScript completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
