const fs = require("fs");
const csv = require("csv-parser");
const admin = require("firebase-admin");

// 1. Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
});

const db = admin.firestore();

// 2. CSV file path
const CSV_FILE_PATH = "vendors.csv";

// 3. Read CSV and store rows in an array
const rows = [];

fs.createReadStream(CSV_FILE_PATH)
  .pipe(csv())
  .on("data", (row) => {
    rows.push(row); // each row is an object with keys from header row
  })
  .on("end", async () => {
    console.log(`✅ CSV file read completed. Total rows: ${rows.length}`);

    // 4. Import each row into Firestore
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Map CSV columns to Firestore fields
      // Make sure these keys match your CSV headers exactly
      const vendorData = {
        vendorName: (row["Vendor Name"] || "").trim(),
        email: (row["Email"] || "").trim(),
        phone: (row["Phone"] || "").trim(),
        gstNumber: (row["GST Number"] || "").trim(),
        address: (row["Address"] || "").trim(),
        // add more fields here if your CSV has more columns

        createdFrom: "csv-import",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      try {
        await db.collection("vendors").add(vendorData);
        console.log(`Row ${i + 1}/${rows.length} imported ✅`);
      } catch (error) {
        console.error(`Row ${i + 1} failed ❌, error`);
      }
    }

    console.log("🎉 Import finished.");
    process.exit(0);
  })
  .on("error", (err) => {
    console.error("Error reading CSV file:", err);
    process.exit(1);
  });