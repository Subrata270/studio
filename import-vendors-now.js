const { initializeApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, doc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAOjvF9pMXQ6OZvjBDwyM4bEDMLrhQjAag",
  authDomain: "studio-1932959431-4b486.firebaseapp.com",
  projectId: "studio-1932959431-4b486",
  storageBucket: "studio-1932959431-4b486.firebasestorage.app",
  messagingSenderId: "1932959431",
  appId: "1:1932959431:web:9e6dcea3fae4b2da2c8aa9",
  measurementId: "G-CZSK74BMEC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    
    data.push(row);
  }
  
  return data;
}

async function importVendors() {
  try {
    console.log('Starting vendor import...');
    
    // Read CSV file
    const csvPath = path.join(__dirname, 'vandor-import', 'vendors.csv');
    console.log('Reading CSV from:', csvPath);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    console.log('Parsing CSV data...');
    const vendors = parseCSV(csvContent);
    console.log(`Parsed ${vendors.length} vendors from CSV`);
    
    // Import to Firestore in batches
    const batchSize = 500;
    let totalImported = 0;
    
    for (let i = 0; i < vendors.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchVendors = vendors.slice(i, i + batchSize);
      
      batchVendors.forEach((vendor) => {
        const docRef = doc(collection(db, 'vendors details'));
        batch.set(docRef, vendor);
      });
      
      await batch.commit();
      totalImported += batchVendors.length;
      const percent = Math.round((totalImported / vendors.length) * 100);
      console.log(`Progress: ${totalImported}/${vendors.length} (${percent}%)`);
    }
    
    console.log('✅ SUCCESS! Imported', totalImported, 'vendors to "vendors details" collection');
    console.log('Check your Firestore console at: https://console.firebase.google.com/project/studio-1932959431-4b486/firestore');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importVendors();
