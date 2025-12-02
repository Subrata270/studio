const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importUsers() {
  try {
    console.log('📖 Reading users data...');
    const usersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8')
    );

    console.log(`📊 Found ${usersData.length} departments to process\n`);

    const batch = db.batch();
    const processedUsers = new Set();
    let userCount = 0;
    let departmentCount = 0;

    for (const dept of usersData) {
      // Create department document
      const deptRef = db.collection('departments').doc(dept.Departments);
      batch.set(deptRef, {
        name: dept.Departments,
        number: dept.No,
        hod: {
          name: dept.HOD,
          email: dept['HOD Mails']
        },
        apa: {
          name: dept.APA,
          email: dept['APA mail']
        },
        am: {
          name: dept.AM,
          email: dept['AM Mail']
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      departmentCount++;

      // Create HOD user if not already processed
      const hodEmail = dept['HOD Mails'];
      if (hodEmail && !processedUsers.has(hodEmail)) {
        const hodUserId = hodEmail.split('@')[0].replace(/\./g, '-');
        const hodRef = db.collection('users').doc(hodUserId);
        batch.set(hodRef, {
          email: hodEmail,
          name: dept.HOD,
          role: 'hod',
          department: dept.Departments,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        processedUsers.add(hodEmail);
        userCount++;
        console.log(`✅ HOD: ${dept.HOD} (${hodEmail})`);
      }

      // Create APA user if not already processed
      const apaEmail = dept['APA mail'];
      if (apaEmail && !processedUsers.has(apaEmail)) {
        const apaUserId = apaEmail.split('@')[0].replace(/\./g, '-');
        const apaRef = db.collection('users').doc(apaUserId);
        batch.set(apaRef, {
          email: apaEmail,
          name: dept.APA,
          role: 'finance',
          subrole: 'apa',
          department: dept.Departments,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        processedUsers.add(apaEmail);
        userCount++;
        console.log(`✅ APA: ${dept.APA} (${apaEmail})`);
      }

      // Create AM user if not already processed
      const amEmail = dept['AM Mail'];
      if (amEmail && !processedUsers.has(amEmail)) {
        const amUserId = amEmail.split('@')[0].replace(/\./g, '-');
        const amRef = db.collection('users').doc(amUserId);
        batch.set(amRef, {
          email: amEmail,
          name: dept.AM,
          role: 'finance',
          subrole: 'am',
          department: dept.Departments,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        processedUsers.add(amEmail);
        userCount++;
        console.log(`✅ AM: ${dept.AM} (${amEmail})`);
      }
    }

    console.log('\n💾 Committing to Firestore...');
    await batch.commit();

    console.log('\n✨ Import Complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Departments created: ${departmentCount}`);
    console.log(`   - Users created: ${userCount}`);
    console.log(`   - HODs: ${[...processedUsers].filter(e => !e.includes('srikanth') && !e.includes('chennakesava') && !e.includes('limbayyagari') && !e.includes('rajamoni') && !e.includes('puligilla')).length}`);
    console.log(`   - APAs: ${[...processedUsers].filter(e => e.includes('srikanth') || e.includes('chennakesava') || e.includes('limbayyagari') || e.includes('rajamoni') || e.includes('satti')).length}`);
    console.log(`   - AMs: ${[...processedUsers].filter(e => e.includes('puligilla')).length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

// Run the import
importUsers();
