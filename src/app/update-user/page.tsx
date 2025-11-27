'use client';

import { useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function UpdateUserPage() {
  const [userId, setUserId] = useState('ff3wJQD8ocYGCGY0P2oH8b3OOvz2');
  const [newPassword, setNewPassword] = useState('12345678');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    setStatus('Updating...');
    
    try {
      const { firestore } = initializeFirebase();
      const userDocRef = doc(firestore, 'users', userId);
      
      // First check if user exists
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        setStatus('❌ Error: User not found!');
        setLoading(false);
        return;
      }
      
      console.log('Current user data:', userDoc.data());
      
      // Update password
      await updateDoc(userDocRef, {
        password: newPassword
      });
      
      // Verify update
      const updatedDoc = await getDoc(userDocRef);
      console.log('Updated user data:', updatedDoc.data());
      
      setStatus(`✅ Password updated successfully to: ${newPassword}`);
    } catch (error: any) {
      console.error('Failed to update:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '30px' }}>🔧 Update User Password</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          User ID:
        </label>
        <input 
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '10px', 
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          New Password:
        </label>
        <input 
          type="text"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '10px', 
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      <button
        onClick={handleUpdate}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#0969da',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Updating...' : 'Update Password'}
      </button>

      {status && (
        <div style={{
          padding: '15px',
          backgroundColor: status.includes('✅') ? '#d4edda' : '#f8d7da',
          color: status.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {status}
        </div>
      )}

      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f6f8fa',
        borderRadius: '6px',
        border: '1px solid #d0d7de'
      }}>
        <h3 style={{ marginTop: 0 }}>📝 Current User Info</h3>
        <p><strong>User ID:</strong> ff3wJQD8ocYGCGY0P2oH8b3OOvz2</p>
        <p><strong>Email:</strong> suneel@gmail.com</p>
        <p><strong>Name:</strong> suneel</p>
        <p><strong>Role:</strong> employee</p>
        <p><strong>Department:</strong> Student success</p>
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          After updating, try logging in at:<br />
          <a href="/login/employee" style={{ color: '#0969da' }}>
            /login/employee
          </a>
        </p>
      </div>
    </div>
  );
}
