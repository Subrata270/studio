const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./firestore-import/serviceAccountKey.json")
});

const db = admin.firestore();

async function createUser() {
  try {
    const newUser = {
      email: "abhinavsosa23@gmail.com",
      name: "Abhinav Sosa",
      role: "finance",
      subrole: "am",
      department: "Finance",
      password: "Finance@123",
      id: `id-${Date.now()}`,
      microsoftUid: null,
      googleUid: null
    };

    console.log(`Creating user: ${newUser.email}...`);
    
    const usersRef = db.collection("users");
    
    // Check if user already exists
    const existing = await usersRef.where("email", "==", newUser.email).get();
    if (!existing.empty) {
      console.log("❌ User already exists!");
      return;
    }

    // Create the user document
    await usersRef.doc(newUser.id).set(newUser);
    
    console.log(`✅ Successfully created user:`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Subrole: ${newUser.subrole}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Department: ${newUser.department}`);

  } catch (error) {
    console.error("❌ Error creating user:", error);
    process.exit(1);
  }
}

createUser()
  .then(() => {
    console.log("\nUser creation completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
