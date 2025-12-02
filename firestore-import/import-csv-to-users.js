const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json")
});

const db = admin.firestore();

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    data.push(row);
  }

  return data;
}

async function importCSVToUsers() {
  try {
    console.log("📖 Reading CSV data...");
    const csvText = fs.readFileSync("users-data.csv", "utf8");
    const data = parseCSV(csvText);
    console.log(`📊 Found ${data.length} departments to process\n`);

    const batch = db.batch();

    for (const row of data) {
      // Create a document ID from department name
      const deptId = row["Departments"]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      
      const deptRef = db.collection("users").doc(deptId);
      
      // Store the complete department data
      batch.set(deptRef, {
        no: row["No"] || "",
        department: row["Departments"] || "",
        hod: {
          name: row["HOD"] || "",
          email: row["HOD Mails"] || ""
        },
        apa: {
          name: row["APA"] || "",
          email: row["APA mail"] || ""
        },
        am: {
          name: row["AM"] || "",
          email: row["AM Mail"] || ""
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Added Department ${row["No"]}: ${row["Departments"]}`);
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
importCSVToUsers()
  .then(() => {
    console.log("\n✅ Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });
