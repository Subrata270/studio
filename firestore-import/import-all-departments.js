const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json")
});

const db = admin.firestore();

async function importAllDepartmentsToUsers() {
  try {
    console.log("📖 Reading departments data...");
    const data = JSON.parse(fs.readFileSync("departments-data.json", "utf8"));
    console.log(`📊 Found ${data.length} departments to process\n`);

    const batch = db.batch();

    for (const dept of data) {
      // Create a document ID from department name
      const deptId = dept["Departments"]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      
      const deptRef = db.collection("users").doc(deptId);
      
      // Store the complete department data
      batch.set(deptRef, {
        no: dept["No"],
        department: dept["Departments"],
        hod: {
          name: dept["HOD"] || "",
          email: dept["HOD Mails"] || ""
        },
        apa: {
          name: dept["APA"] || "",
          email: dept["APA mail"] || ""
        },
        am: {
          name: dept["AM"] || "",
          email: dept["AM Mail"] || ""
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Added Department ${dept["No"]}: ${dept["Departments"]}`);
    }

    console.log(`\n💾 Committing batch write to Firestore...`);
    await batch.commit();
    
    console.log(`\n✨ Success!`);
    console.log(`📦 Total departments imported: ${data.length}`);
    console.log(`\n🔍 Check Firebase Console -> Firestore Database -> users collection`);

  } catch (error) {
    console.error("\n❌ Error importing data:", error);
    process.exit(1);
  }
}

// Run the import
importAllDepartmentsToUsers()
  .then(() => {
    console.log("\n✅ Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });
