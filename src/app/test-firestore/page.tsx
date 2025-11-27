"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/app-store';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function TestFirestorePage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { users, subscriptions, notifications, syncFromFirestore } = useAppStore();

  const testFirestoreWrite = async () => {
    setLoading(true);
    setStatus('Testing Firestore connection...');

    try {
      // Import Firebase
      const { initializeFirebase } = await import('@/firebase');
      const { collection, doc, setDoc, getDocs } = await import('firebase/firestore');
      const { signInAnonymously } = await import('firebase/auth');

      const { auth, firestore } = initializeFirebase();

      setStatus('Step 1: Checking authentication...');
      
      // Try to sign in anonymously
      if (!auth.currentUser) {
        setStatus('Step 2: Signing in anonymously...');
        try {
          const userCredential = await signInAnonymously(auth);
          setStatus(`✅ Signed in anonymously: ${userCredential.user.uid}`);
        } catch (error: any) {
          if (error.code === 'auth/operation-not-allowed') {
            setStatus(`❌ CRITICAL: Anonymous Authentication is NOT enabled!\n\nPlease enable it at:\nhttps://console.firebase.google.com/project/studio-1932959431-4b486/authentication/providers\n\n1. Click "Sign-in method" tab\n2. Enable "Anonymous"\n3. Save`);
            setLoading(false);
            return;
          }
          throw error;
        }
      } else {
        setStatus(`✅ Already authenticated: ${auth.currentUser.uid}`);
      }

      setStatus('Step 3: Writing test document to Firestore...');
      
      // Write test document
      const testDoc = {
        id: 'test-' + Date.now(),
        message: 'Test from AutoTrack Pro',
        timestamp: new Date().toISOString(),
      };

      await setDoc(doc(firestore, 'test-collection', testDoc.id), testDoc);
      setStatus('✅ Test document written successfully!');

      setStatus('Step 4: Reading back from Firestore...');
      const snapshot = await getDocs(collection(firestore, 'test-collection'));
      setStatus(`✅ Read ${snapshot.size} documents from test-collection`);

      setStatus('Step 5: Writing actual data (users, subscriptions, notifications)...');
      
      // Write users
      const usersCol = collection(firestore, 'users');
      for (const user of users) {
        await setDoc(doc(usersCol, user.id), user);
      }
      setStatus(`✅ Written ${users.length} users`);

      // Write subscriptions
      const subsCol = collection(firestore, 'subscriptions');
      for (const sub of subscriptions) {
        await setDoc(doc(subsCol, sub.id), sub);
      }
      setStatus(`✅ Written ${subscriptions.length} subscriptions`);

      // Write notifications
      const notifsCol = collection(firestore, 'notifications');
      for (const notif of notifications) {
        await setDoc(doc(notifsCol, notif.id), notif);
      }
      setStatus(`✅ Written ${notifications.length} notifications`);

      setStatus(`🎉 SUCCESS! All data written to Firestore!\n\nCheck your Firebase Console:\nhttps://console.firebase.google.com/project/studio-1932959431-4b486/firestore`);

    } catch (error: any) {
      console.error('Firestore test error:', error);
      setStatus(`❌ Error: ${error.message}\n\nCode: ${error.code || 'unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    setStatus('✅ Local storage cleared! Please refresh the page.');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Firestore Connection Test</CardTitle>
            <CardDescription>
              Test your Firestore connection and manually seed data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{users.length}</div>
                    <div className="text-sm text-muted-foreground">Users in Store</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{subscriptions.length}</div>
                    <div className="text-sm text-muted-foreground">Subscriptions</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{notifications.length}</div>
                    <div className="text-sm text-muted-foreground">Notifications</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={testFirestoreWrite} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  '🔥 Test Firestore & Write Data'
                )}
              </Button>

              <Button 
                onClick={() => syncFromFirestore()} 
                variant="outline"
                className="w-full"
              >
                🔄 Sync from Firestore
              </Button>

              <Button 
                onClick={clearLocalStorage} 
                variant="destructive"
                className="w-full"
              >
                🗑️ Clear Local Storage
              </Button>
            </div>

            {status && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {status}
                  </pre>
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold">Important: Enable Anonymous Authentication</p>
                    <p className="text-sm">Before data can be written to Firestore, you must enable Anonymous Authentication in Firebase Console:</p>
                    <ol className="text-sm list-decimal list-inside space-y-1">
                      <li>Go to Firebase Console → Authentication</li>
                      <li>Click "Sign-in method" tab</li>
                      <li>Find "Anonymous" and click on it</li>
                      <li>Toggle "Enable" to ON</li>
                      <li>Click "Save"</li>
                    </ol>
                    <a 
                      href="https://console.firebase.google.com/project/studio-1932959431-4b486/authentication/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-primary hover:underline text-sm font-medium"
                    >
                      → Open Firebase Authentication Settings
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
