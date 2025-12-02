# Persistent Authentication Implementation

## Overview
Implemented persistent authentication with role-based access control for the multi-role web portal supporting POC, HOD, Finance APA, and Finance AM users.

## Tech Stack
- **Framework**: Next.js 15.5.6 with App Router
- **Authentication**: Firebase Authentication
- **State Management**: Zustand with localStorage persistence
- **Database**: Cloud Firestore
- **TypeScript**: Full type safety

## Features Implemented

### 1. Token-Based Authentication
- **Session Storage**: Uses localStorage via Zustand persist middleware
- **Session Duration**: 7 days from login
- **Storage Key**: `autotrack-pro-storage`
- **Persisted Data**: 
  - Current user information
  - User role and subrole
  - Session expiry timestamp
  - All users, subscriptions, and notifications

### 2. Session Validation
- **Automatic Check**: Validates session on every page load
- **Expiry Handling**: Sessions expire after 7 days
- **Legacy Session Migration**: Automatically sets expiry for old sessions
- **Location**: `src/store/app-store.ts` - `checkSession()` function

```typescript
checkSession: () => {
  const { currentUser, sessionExpiry } = get();
  
  if (!currentUser) return false;
  
  if (!sessionExpiry) {
    // Set new expiry for legacy sessions
    const newExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
    set({ sessionExpiry: newExpiry });
    return true;
  }
  
  if (Date.now() > sessionExpiry) {
    get().logout();
    return false;
  }
  
  return true;
}
```

### 3. Protected Routes with AuthGuard
- **Component**: `src/components/auth-guard.tsx`
- **Features**:
  - Checks if user is authenticated
  - Validates session expiry
  - Enforces role-based access control
  - Redirects unauthorized users to login
  - Redirects users to their correct dashboard based on role
  
- **Route Protection Map**:
  ```typescript
  '/dashboard/poc' → ['poc']
  '/dashboard/hod' → ['hod']
  '/dashboard/finance' → ['finance'] (APA or AM)
  ```

### 4. Login Flow

#### Email/Password Login
```typescript
// Sets session expiry to 7 days
const sessionExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
set({ currentUser: user, sessionExpiry });
```

#### Microsoft OAuth Login
- **Direct Firestore Fetch**: Always fetches latest user data from Firestore
- **No Cache Issues**: Bypasses localStorage to get current role
- **Automatic Redirect**: Redirects to correct dashboard based on role

```typescript
autoLoginWithMicrosoft: async () => {
  // Sign in with Microsoft
  const result = await signInWithPopup(auth, provider);
  
  // Fetch fresh data from Firestore
  const firestoreUsers = await getDocs(usersRef);
  const appUser = firestoreUsers.find(u => u.email === microsoftUser.email);
  
  // Set session expiry
  const sessionExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
  set({ currentUser: updatedUser, sessionExpiry });
}
```

### 5. Logout Functionality
- **Location**: `src/store/app-store.ts` - `logout()` function
- **Process**:
  1. Signs out from Firebase Authentication
  2. Clears current user from state
  3. Clears session expiry
  4. Removes localStorage data
  5. Redirects to login page

```typescript
logout: async () => {
  await auth.signOut();
  set({ currentUser: null, sessionExpiry: null });
  localStorage.removeItem('autotrack-pro-storage');
}
```

### 6. Automatic Dashboard Redirect
- **On Login**: Redirects to `/dashboard` which then routes to role-specific dashboard
- **Dashboard Router**: `src/app/(app)/dashboard/page.tsx`
  ```typescript
  useEffect(() => {
    if (currentUser) {
      router.replace(`/dashboard/${currentUser.role}`);
    }
  }, [currentUser]);
  ```

## File Structure

```
src/
├── components/
│   └── auth-guard.tsx                 # Route protection component
├── store/
│   └── app-store.ts                   # Zustand store with persistence
├── app/
│   ├── layout.tsx                     # Root layout
│   ├── store-initializer.tsx          # Firestore sync initializer
│   ├── page.tsx                       # Login page
│   └── (app)/
│       ├── layout.tsx                 # Protected layout with AuthGuard
│       ├── dashboard/
│       │   ├── page.tsx              # Dashboard router
│       │   ├── poc/                  # POC dashboard
│       │   ├── hod/                  # HOD dashboard
│       │   └── finance/              # Finance dashboard (APA/AM)
│       └── components/
│           └── user-nav.tsx          # User navigation with logout
└── firebase/
    └── index.ts                       # Firebase configuration
```

## User Roles and Permissions

| Role | Subrole | Dashboard Route | Access Level |
|------|---------|----------------|--------------|
| POC | - | `/dashboard/poc` | Request subscriptions, view own requests |
| HOD | - | `/dashboard/hod` | Approve/decline POC requests |
| Finance | APA | `/dashboard/finance` | Process approved requests, forward to AM |
| Finance | AM | `/dashboard/finance` | Final approval and payment execution |

## Session Management

### Session Lifecycle
1. **Login**: User logs in → Session created with 7-day expiry
2. **Page Load**: AuthGuard checks session validity
3. **Valid Session**: User stays on current page
4. **Expired Session**: User logged out and redirected to login
5. **Logout**: User explicitly logs out → Session cleared

### Session Expiry Configuration
- **Duration**: 7 days (604,800,000 milliseconds)
- **Location**: Can be configured in login functions
- **To Change**: Modify the multiplier in session expiry calculation:
  ```typescript
  const sessionExpiry = Date.now() + (DAYS * 24 * 60 * 60 * 1000);
  ```

## Security Features

1. **localStorage Encryption**: Data stored in localStorage (consider encrypting sensitive data)
2. **Session Expiry**: Automatic logout after 7 days
3. **Role Validation**: Every route checks user role on access
4. **Firebase Auth**: Backend authentication through Firebase
5. **Fresh Data Fetch**: Microsoft login always fetches from Firestore

## Testing Checklist

- [x] User can log in and stay logged in after page refresh
- [x] User is redirected to correct role-based dashboard
- [x] Session expires after 7 days
- [x] Unauthorized users are redirected to login
- [x] Users cannot access other roles' dashboards
- [x] Logout properly clears session and redirects to login
- [x] Microsoft login fetches latest role from Firestore
- [x] Page reload maintains authentication state

## Known Considerations

1. **localStorage Limitations**: 
   - Maximum 5-10MB per domain
   - Data stored in plain text (consider encryption for production)
   
2. **Session Security**:
   - Sessions are client-side only
   - For production, consider server-side session validation
   
3. **Token Refresh**:
   - Currently fixed 7-day expiry
   - Consider implementing sliding window sessions

## Future Enhancements

1. **Server-Side Sessions**: Implement server-side session validation
2. **Token Refresh**: Add automatic session renewal on activity
3. **Remember Me**: Add option for extended sessions
4. **Multi-Device Logout**: Implement global logout across devices
5. **Session Activity Tracking**: Log user session activities
6. **Two-Factor Authentication**: Add 2FA for enhanced security

## Troubleshooting

### Issue: User redirected to login after refresh
**Solution**: Check browser console for session validation logs. Ensure localStorage is enabled.

### Issue: Wrong dashboard after login
**Solution**: Clear localStorage and check user role in Firestore database.

### Issue: Session not expiring
**Solution**: Verify sessionExpiry is set correctly in localStorage.

### Issue: Microsoft login shows old role
**Solution**: Implementation now fetches directly from Firestore, bypassing cache.

## Support

For issues or questions, check the console logs which include detailed authentication flow information marked with emojis:
- 🔒 Authentication checks
- ✅ Success messages
- ❌ Error messages
- 🚪 Logout events
- 🔄 Data syncing
- 💾 Storage operations
