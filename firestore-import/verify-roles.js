const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("./firestore-import/serviceAccountKey.json")
});

const db = admin.firestore();

async function verifyRoles() {
  try {
    console.log("Verifying user roles in database...\n");
    
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log("No users found in database.");
      return;
    }

    const roleCounts = {
      poc: 0,
      hod: 0,
      finance: 0,
      admin: 0,
      employee: 0,
      other: 0
    };

    console.log("Current users in database:");
    console.log("=" .repeat(80));
    console.log(sprintf("%-35s %-15s %-20s", "Email", "Role", "Department"));
    console.log("=" .repeat(80));

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const role = userData.role || 'unknown';
      
      if (roleCounts.hasOwnProperty(role)) {
        roleCounts[role]++;
      } else {
        roleCounts.other++;
      }
      
      console.log(sprintf("%-35s %-15s %-20s", 
        userData.email || 'N/A', 
        role, 
        userData.department || 'N/A'
      ));
    });

    console.log("=" .repeat(80));
    console.log("\nRole Statistics:");
    console.log(`  POC:      ${roleCounts.poc}`);
    console.log(`  HOD:      ${roleCounts.hod}`);
    console.log(`  Finance:  ${roleCounts.finance}`);
    console.log(`  Admin:    ${roleCounts.admin} ${roleCounts.admin > 0 ? '⚠️  (Should be 0)' : '✓'}`);
    console.log(`  Employee: ${roleCounts.employee} ${roleCounts.employee > 0 ? '⚠️  (Should be 0)' : '✓'}`);
    console.log(`  Other:    ${roleCounts.other}`);
    console.log(`\nTotal Users: ${snapshot.size}`);

  } catch (error) {
    console.error("Error verifying roles:", error);
    process.exit(1);
  }
}

function sprintf(format, ...args) {
  let i = 0;
  return format.replace(/%-?(\d+)s/g, (match, width) => {
    const arg = String(args[i++] || '');
    const isLeftAlign = match.startsWith('%-');
    const paddedArg = isLeftAlign 
      ? arg.padEnd(parseInt(width), ' ')
      : arg.padStart(parseInt(width), ' ');
    return paddedArg;
  });
}

verifyRoles()
  .then(() => {
    console.log("\n✅ Verification completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
