'use client';

import { useEffect, useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { useAppStore } from '@/store/app-store';

export default function FirebaseTestPage() {
  const [authStatus, setAuthStatus] = useState('Checking...');
  const [firestoreStatus, setFirestoreStatus] = useState('Checking...');
  const [logs, setLogs] = useState<string[]>([]);
  
  const { hasFetchedFromFirestore, isSyncing, users, subscriptions, notifications } = useAppStore();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    const testFirebase = async () => {
      try {
        addLog('Initializing Firebase...');
        const { auth, firestore } = initializeFirebase();
        
        if (auth) {
          addLog('✅ Auth initialized');
          
          // Check current auth state
          if (auth.currentUser) {
            setAuthStatus(`✅ Authenticated: ${auth.currentUser.uid} (${auth.currentUser.isAnonymous ? 'Anonymous' : 'Email'})`);
            addLog(`User already authenticated: ${auth.currentUser.uid}`);
          } else {
            setAuthStatus('⏳ Waiting for authentication...');
            addLog('No user authenticated yet, waiting...');
          }
          
          // Listen for auth changes
          auth.onAuthStateChanged((user) => {
            if (user) {
              setAuthStatus(`✅ Authenticated: ${user.uid} (${user.isAnonymous ? 'Anonymous' : 'Email'})`);
              addLog(`✅ User authenticated: ${user.uid} (${user.isAnonymous ? 'Anonymous' : 'Email'})`);
            } else {
              setAuthStatus('❌ Not authenticated');
              addLog('❌ User signed out or not authenticated');
            }
          });
        } else {
          setAuthStatus('❌ Auth failed to initialize');
          addLog('❌ Auth service failed to initialize');
        }

        if (firestore) {
          setFirestoreStatus('✅ Firestore initialized');
          addLog('✅ Firestore initialized');
        } else {
          setFirestoreStatus('❌ Firestore failed to initialize');
          addLog('❌ Firestore failed to initialize');
        }
      } catch (error: any) {
        addLog(`❌ Error: ${error.message}`);
      }
    };

    testFirebase();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#1e1e1e', color: '#d4d4d4', minHeight: '100vh' }}>
      <h1 style={{ color: '#4ec9b0' }}>🔥 Firebase Connection Test</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ color: '#dcdcaa' }}>Service Status</h2>
        <div style={{ backgroundColor: '#252526', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
          <p><strong>Authentication:</strong> {authStatus}</p>
          <p><strong>Firestore:</strong> {firestoreStatus}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2 style={{ color: '#dcdcaa' }}>Store Status</h2>
        <div style={{ backgroundColor: '#252526', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
          <p><strong>Has Fetched:</strong> {hasFetchedFromFirestore ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Is Syncing:</strong> {isSyncing ? '⏳ Yes' : '✅ No'}</p>
          <p><strong>Store Ready:</strong> {hasFetchedFromFirestore && !isSyncing ? '✅ Ready' : '⏳ Not Ready'}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2 style={{ color: '#dcdcaa' }}>Data Loaded</h2>
        <div style={{ backgroundColor: '#252526', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
          <p><strong>Users:</strong> {users.length} records</p>
          <p><strong>Subscriptions:</strong> {subscriptions.length} records</p>
          <p><strong>Notifications:</strong> {notifications.length} records</p>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2 style={{ color: '#dcdcaa' }}>Activity Log</h2>
        <div style={{ 
          backgroundColor: '#252526', 
          padding: '15px', 
          borderRadius: '5px', 
          marginTop: '10px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '5px', fontSize: '14px' }}>
              {log}
            </div>
          ))}
          {logs.length === 0 && <p style={{ color: '#808080' }}>No activity yet...</p>}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#1a472a', borderRadius: '5px', border: '1px solid #2ea043' }}>
        <h3 style={{ color: '#3fb950', marginTop: 0 }}>✅ Next Steps</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Check if "Authentication" shows as authenticated</li>
          <li>If not authenticated, enable Anonymous auth in Firebase Console</li>
          <li>Check if "Store Ready" shows as Ready</li>
          <li>Verify data counts match expected values</li>
          <li>Open browser console (F12) for detailed logs</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a 
 
          style={{ 
            display: 'inline-block',
            padding: '10px 20px', 
            backgroundColor: '#0969da', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px',
            marginRight: '10px'
          }}
        >
          Go to Admin Login
        </a>
        <a 
          href="https://console.firebase.google.com/project/autosubscription-6c04a/firestore" 
          target="_blank"
          style={{ 
            display: 'inline-block',
            padding: '10px 20px', 
            backgroundColor: '#ff6b00', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px'
          }}
        >
          Open Firebase Console
        </a>
      </div>
    </div>
  );
}
