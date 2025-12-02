const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json")
});

const db = admin.firestore();

async function importDepartmentsToUsers() {
  try {
    console.log("📖 Reading departments data...");
    const data = JSON.parse(fs.readFileSync("departments-data.json", "utf8"));
    console.log(`📊 Found ${data.length} departments to process\n`);

    const batch = db.batch();
    const processedEmails = new Set();
    let userCount = 0;

    for (const dept of data) {
      // Process HOD
      if (dept["HOD Mails"] && !processedEmails.has(dept["HOD Mails"])) {
        const hodId = dept["HOD Mails"].split("@")[0].replace(/\./g, "-");
        const hodRef = db.collection("users").doc(hodId);
        
        batch.set(hodRef, {
          email: dept["HOD Mails"],
          name: dept["HOD"] || "",
          role: "hod",
          department: dept["Departments"] || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        processedEmails.add(dept["HOD Mails"]);
        userCount++;
        console.log(`✅ Added HOD: ${dept["HOD"]} (${dept["HOD Mails"]})`);
      }

      // Process APA (Finance APA)
      if (dept["APA mail"] && !processedEmails.has(dept["APA mail"])) {
        const apaId = dept["APA mail"].split("@")[0].replace(/\./g, "-");
        const apaRef = db.collection("users").doc(apaId);
        
        batch.set(apaRef, {
          email: dept["APA mail"],
          name: dept["APA"] || "",
          role: "finance",
          subrole: "apa",
          department: "Finance",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        processedEmails.add(dept["APA mail"]);
        userCount++;
        console.log(`✅ Added APA: ${dept["APA"]} (${dept["APA mail"]})`);
      }

      // Process AM (Account Manager)
      if (dept["AM Mail"] && !processedEmails.has(dept["AM Mail"])) {
        const amId = dept["AM Mail"].split("@")[0].replace(/\./g, "-");
        const amRef = db.collection("users").doc(amId);
        
        batch.set(amRef, {
          email: dept["AM Mail"],
          name: dept["AM"] || "",
          role: "finance",
          subrole: "am",
          department: "Finance",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        processedEmails.add(dept["AM Mail"]);
        userCount++;
        console.log(`✅ Added AM: ${dept["AM"]} (${dept["AM Mail"]})`);
      }
    }

    console.log(`\n💾 Committing batch write to Firestore...`);
    await batch.commit();
    
    console.log(`\n✨ Success!`);
    console.log(`📦 Total users imported: ${userCount}`);
    console.log(`🏢 Total departments: ${data.length}`);
    console.log(`\n🔍 Check Firebase Console -> Firestore Database -> users collection`);

  } catch (error) {
    console.error("\n❌ Error importing data:", error);
    process.exit(1);
  }
}

// Run the import
importDepartmentsToUsers()
  .then(() => {
    console.log("\n✅ Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });
