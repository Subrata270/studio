'use client'

import { useState } from 'react'
import { collection, writeBatch, doc } from 'firebase/firestore'
import { initializeFirebase } from '@/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet, Database } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ImportDataPage() {
  const [importing, setImporting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [imported, setImported] = useState(0)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [collectionName, setCollectionName] = useState('vendors')
  const { toast } = useToast()

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const obj: any = {}
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      
      data.push(obj)
    }

    return data
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus({ type: 'info', message: 'Reading file...' })

    try {
      const text = await file.text()
      const jsonData = parseCSV(text)

      if (jsonData.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No data found',
          description: 'The CSV file appears to be empty'
        })
        setStatus(null)
        return
      }

      setPreviewData(jsonData.slice(0, 5)) // Preview first 5 rows
      setStatus({ 
        type: 'info', 
        message: `✅ Loaded ${jsonData.length} rows. Review and click Import to continue.` 
      })

      toast({
        title: 'File loaded successfully',
        description: `Found ${jsonData.length} rows in the CSV file`
      })

      // Store data for import
      ;(window as any).__importData = jsonData

    } catch (error: any) {
      console.error('Error reading CSV:', error)
      setStatus({ 
        type: 'error', 
        message: `❌ Error reading file: ${error.message}` 
      })
      toast({
        variant: 'destructive',
        title: 'Failed to read file',
        description: error.message
      })
    }
  }

  const handleImportToFirestore = async () => {
    const jsonData = (window as any).__importData
    if (!jsonData || jsonData.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No data to import',
        description: 'Please upload a CSV file first'
      })
      return
    }

    if (!collectionName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Collection name required',
        description: 'Please enter a collection name'
      })
      return
    }

    setImporting(true)
    setStatus({ type: 'info', message: `Importing to "${collectionName}" collection...` })

    try {
      const { firestore } = initializeFirebase()
      const batchSize = 500 // Firestore batch limit
      let totalImported = 0

      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = writeBatch(firestore)
        const chunk = jsonData.slice(i, i + batchSize)

        chunk.forEach((row: any) => {
          const docRef = doc(collection(firestore, collectionName))
          batch.set(docRef, {
            ...row,
            importedAt: new Date().toISOString(),
            id: docRef.id
          })
        })

        await batch.commit()
        totalImported += chunk.length
        setImported(totalImported)
        setStatus({ 
          type: 'info', 
          message: `Imported ${totalImported} of ${jsonData.length} rows...` 
        })
      }

      setStatus({ 
        type: 'success', 
        message: `✅ Successfully imported ${totalImported} rows to "${collectionName}" collection!` 
      })
      
      toast({
        title: 'Import successful!',
        description: `Imported ${totalImported} rows to Firestore`
      })
      
      // Clear data
      delete (window as any).__importData
      setPreviewData([])
      
    } catch (error: any) {
      console.error('Error importing to Firestore:', error)
      setStatus({ 
        type: 'error', 
        message: `❌ Error: ${error.message}` 
      })
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: error.message
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              Import CSV Data to Firestore
            </CardTitle>
            <CardDescription className="text-base">
              Upload your CSV file to import data into your Firestore database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Collection Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Collection Name</label>
              <Input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g., vendors, users, subscriptions"
                disabled={importing}
              />
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium mb-2">
                  {importing ? 'Importing...' : 'Click to upload CSV file'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports .csv files with headers in the first row
                </p>
              </label>
            </div>

            {/* Preview Data */}
            {previewData.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Preview (first 5 rows)
                </h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="px-4 py-2">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button 
                  onClick={handleImportToFirestore} 
                  disabled={importing}
                  className="w-full"
                  size="lg"
                >
                  {importing ? 'Importing...' : `Import to "${collectionName}" Collection`}
                </Button>
              </div>
            )}

            {/* Status Messages */}
            {status && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {status.type === 'success' && <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                {status.type === 'error' && <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                {status.type === 'info' && <FileSpreadsheet className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="font-medium">{status.message}</p>
                  {importing && imported > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(imported / ((window as any).__importData?.length || 1)) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm mt-1">{imported} rows imported</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-3 text-lg">📝 How to Use:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Enter your desired Firestore collection name (e.g., "vendors", "users")</li>
                <li>Click the upload area above to select your CSV file</li>
                <li>Review the data preview to ensure it looks correct</li>
                <li>Click "Import to Collection" button</li>
                <li>Wait for the import to complete</li>
                <li>Check Firestore Console to verify the data</li>
              </ol>
            </div>

            {/* Example CSV Format */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Example CSV Format:
              </h3>
              <pre className="text-xs bg-white p-4 rounded overflow-x-auto border">
{`name,email,category,status
Vendor A,vendora@example.com,Software,active
Vendor B,vendorb@example.com,Hardware,active`}
              </pre>
            </div>

            {/* Quick Links */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => window.open('https://console.firebase.google.com/project/studio-1932959431-4b486/firestore/data', '_blank')}
                className="flex-1"
              >
                <Database className="w-4 h-4 mr-2" />
                Open Firestore Console
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
