const admin = require("firebase-admin");
const fs = require("fs");

admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json")
});

const db = admin.firestore();

async function uploadData() {
  const data = JSON.parse(fs.readFileSync("users.json", "utf8"));

  const batchSize = 500; // Firestore batch limit
  let batch = db.batch();
  let count = 0;

  for (const user of data) {
    const docRef = db.collection("users").doc(); // or use .doc(user.email) to prevent duplicates
    batch.set(docRef, user);

    count++;

    if (count % batchSize === 0) {
      console.log(`Uploading batch ${count / batchSize}`);
      await batch.commit();
      batch = db.batch();
    }
  }

  if (count % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`Done! Uploaded ${count} users.`);
}

uploadData().catch(console.error);