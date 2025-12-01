import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: 'studio-1932959431-4b486',
      // You would need to add your service account key here
      // For now, we'll use application default credentials
    })
  });
}

const db = getFirestore();

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',');
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    
    data.push(row);
  }
  
  return data;
}

async function importVendors() {
  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'vandor-import', 'vendors.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const vendors = parseCSV(csvContent);
    console.log(`Parsed ${vendors.length} vendors from CSV`);
    
    // Import to Firestore in batches
    const batchSize = 500;
    let totalImported = 0;
    
    for (let i = 0; i < vendors.length; i += batchSize) {
      const batch = db.batch();
      const batchVendors = vendors.slice(i, i + batchSize);
      
      batchVendors.forEach((vendor) => {
        const docRef = db.collection('vendors details').doc();
        batch.set(docRef, vendor);
      });
      
      await batch.commit();
      totalImported += batchVendors.length;
      console.log(`Imported ${totalImported} / ${vendors.length} vendors`);
    }
    
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error importing vendors:', error);
  }
}

importVendors();
