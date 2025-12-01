'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImportVendorsPage() {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Handle quoted values that may contain commas
      const values: string[] = [];
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
      values.push(currentValue.trim()); // Push the last value
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      
      data.push(row);
    }
    
    return data;
  };

  const handleImport = async () => {
    setImporting(true);
    setStatus('Starting import...');
    setProgress(0);

    try {
      // Fetch the CSV file
      const response = await fetch('/vendors.csv');
      const csvText = await response.text();
      
      setStatus('Parsing CSV data...');
      const vendors = parseCSV(csvText);
      
      setStatus(`Parsed ${vendors.length} vendors. Starting Firestore import...`);
      
      // Import to Firestore in batches of 500
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
        const progressPercent = Math.round((totalImported / vendors.length) * 100);
        setProgress(progressPercent);
        setStatus(`Imported ${totalImported} / ${vendors.length} vendors (${progressPercent}%)`);
      }
      
      setStatus(`✅ Successfully imported ${totalImported} vendors to "vendors details" collection!`);
    } catch (error: any) {
      console.error('Import error:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Import Vendors to Firestore</CardTitle>
          <CardDescription>
            Import vendor data from CSV to "vendors details" collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>CSV File: <code>/vandor-import/vendors.csv</code></p>
            <p>Target Collection: <code>vendors details</code></p>
          </div>

          <Button 
            onClick={handleImport} 
            disabled={importing}
            className="w-full"
          >
            {importing ? 'Importing...' : 'Import Vendors to Firestore'}
          </Button>

          {status && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">{status}</p>
              {progress > 0 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-4">
            <p>Note: The CSV file should be located at:</p>
            <code>c:\Users\NXTWAVE\Desktop\auto-debit-next-js-version\studio\vandor-import\vendors.csv</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
