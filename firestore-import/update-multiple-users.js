const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./firestore-import/serviceAccountKey.json")
});

const db = admin.firestore();

async function updateMultipleUsers() {
  try {
    const updates = [
      { email: "subratasahu2327@gmail.com", role: "hod", subrole: null },
      { email: "pavanikodela2005@gmail.com", role: "poc", subrole: null },
      { email: "subrata.sahu@nxtwave.co.in", role: "finance", subrole: "apa" },
      { email: "vinuthnaathelli@gmail.com", role: "finance", subrole: "apa" },
      { email: "abhinavsosa23@gmail.com", role: "finance", subrole: "am" }
    ];

    console.log("Starting bulk user update...\n");

    const usersRef = db.collection("users");

    for (const update of updates) {
      console.log(`Processing: ${update.email}...`);
      
      const snapshot = await usersRef.where("email", "==", update.email).get();

      if (snapshot.empty) {
        console.log(`❌ User not found: ${update.email}\n`);
        continue;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      
      console.log(`  Current: role=${userData.role}, subrole=${userData.subrole || 'none'}`);
      
      const updateData = { role: update.role };
      if (update.subrole) {
        updateData.subrole = update.subrole;
      } else {
        updateData.subrole = null;
      }

      await usersRef.doc(userDoc.id).update(updateData);
      
      console.log(`  ✅ Updated: role=${update.role}, subrole=${update.subrole || 'none'}\n`);
    }

    console.log("✅ All updates completed successfully!");

  } catch (error) {
    console.error("❌ Error updating users:", error);
    process.exit(1);
  }
}

updateMultipleUsers()
  .then(() => {
    console.log("\nScript completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
