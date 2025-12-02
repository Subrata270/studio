const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./firestore-import/serviceAccountKey.json")
});

const db = admin.firestore();

async function checkUser() {
  try {
    const targetEmail = "subratasahu2327@gmail.com";
    
    console.log(`Checking user: ${targetEmail}...`);
    
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", targetEmail).get();

    if (snapshot.empty) {
      console.log(`❌ User not found: ${targetEmail}`);
      return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`\n✅ User found!`);
    console.log(`Email: ${userData.email}`);
    console.log(`Name: ${userData.name}`);
    console.log(`Role: ${userData.role}`);
    console.log(`Subrole: ${userData.subrole || 'none'}`);
    console.log(`Department: ${userData.department || 'N/A'}`);

  } catch (error) {
    console.error("❌ Error checking user:", error);
    process.exit(1);
  }
}

checkUser()
  .then(() => {
    console.log("\nCheck completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
