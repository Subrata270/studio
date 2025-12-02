const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./firestore-import/serviceAccountKey.json")
});

const db = admin.firestore();

async function updateSpecificUserRole() {
  try {
    const targetEmail = "subratasahu2327@gmail.com";
    const newRole = "hod";
    const newSubRole = null;
    
    console.log(`Searching for user: ${targetEmail}...`);
    
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", targetEmail).get();

    if (snapshot.empty) {
      console.log(`❌ User not found: ${targetEmail}`);
      return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`Found user: ${userData.email}`);
    console.log(`Current role: ${userData.role}`);
    console.log(`Current subrole: ${userData.subrole || 'none'}`);
    console.log(`Updating to role: ${newRole}, subrole: ${newSubRole}...`);

    await usersRef.doc(userDoc.id).update({ 
      role: newRole,
      subrole: newSubRole 
    });

    console.log(`✅ Successfully updated ${targetEmail} to role: ${newRole} (${newSubRole})`);

  } catch (error) {
    console.error("❌ Error updating user role:", error);
    process.exit(1);
  }
}

updateSpecificUserRole()
  .then(() => {
    console.log("\nUpdate completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Update failed:", error);
    process.exit(1);
  });
