const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json")
});

const db = admin.firestore();

async function deleteAllUsers() {
  try {
    console.log("🗑️  Fetching all documents from users collection...");
    
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log("📭 No documents found in users collection.");
      return;
    }

    console.log(`📊 Found ${snapshot.size} documents to delete\n`);

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
      console.log(`🗑️  Queued for deletion: ${doc.id}`);
    });

    console.log(`\n💾 Committing batch deletion...`);
    await batch.commit();
    
    console.log(`\n✨ Success!`);
    console.log(`🗑️  Total documents deleted: ${count}`);

  } catch (error) {
    console.error("\n❌ Error deleting data:", error);
    process.exit(1);
  }
}

// Run the deletion
deleteAllUsers()
  .then(() => {
    console.log("\n✅ Deletion completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deletion failed:", error);
    process.exit(1);
  });
