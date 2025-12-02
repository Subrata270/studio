const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./firestore-import/serviceAccountKey.json")
});

const db = admin.firestore();

async function verifyMultipleUsers() {
  try {
    const emails = [
      "subratasahu2327@gmail.com",
      "pavanikodela2005@gmail.com",
      "subrata.sahu@nxtwave.co.in",
      "vinuthnaathelli@gmail.com",
      "abhinavsosa23@gmail.com"
    ];

    console.log("Verifying users...\n");

    const usersRef = db.collection("users");

    for (const email of emails) {
      const snapshot = await usersRef.where("email", "==", email).get();

      if (snapshot.empty) {
        console.log(`❌ NOT FOUND: ${email}`);
        continue;
      }

      const userData = snapshot.docs[0].data();
      console.log(`✅ ${email}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Subrole: ${userData.subrole || 'none'}`);
      console.log(`   Name: ${userData.name || 'N/A'}`);
      console.log(`   Department: ${userData.department || 'N/A'}\n`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

verifyMultipleUsers()
  .then(() => {
    console.log("Verification completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
