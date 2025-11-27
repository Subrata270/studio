# Registration and Login Flow Guide

## 🎯 Overview
Your AutoTrack Pro application now has a complete registration and login system where users **must register first** before they can log in.

## 📋 Registration Flow

### Step 1: Navigate to Registration
- Visit: `http://localhost:3003/register`
- Or click **"Create Account"** link from any login page

### Step 2: Fill Registration Form
The registration form requires:
- ✅ **Full Name**: Your complete name
- ✅ **Email**: Valid email address (e.g., john.doe@example.com)
- ✅ **Password**: Minimum 6 characters
- ✅ **Role**: Choose from:
  - Employee
  - HOD (Head of Department)
  - Finance
  - Admin
- ✅ **Department**: Your department name (e.g., Marketing, IT, HR)

### Step 3: Account Creation
- Click **"Create Account"** button
- System validates all fields
- If email already exists, you'll get an error message
- Upon success:
  - ✅ User account is created
  - 💾 Data is saved to Firestore database
  - ✨ Success toast notification appears
  - ➡️ Automatic redirect to appropriate login portal after 2 seconds

## 🔐 Login Flow

### Step 1: Navigate to Login Portal
After registration, you'll be redirected to the appropriate portal:
- **Admin**: `http://localhost:3003/login/admin`
- **Employee**: `http://localhost:3003/login/employee`
- **HOD**: `http://localhost:3003/login/hod`
- **Finance**: `http://localhost:3003/login/finance`

### Step 2: Login Methods
You can login using:

#### Option 1: Email & Password
- Enter your registered email
- Enter your password
- Select sub-role (Finance users only)
- Click **"Login"** button

#### Option 2: Google Sign-In
- Click **"Sign in with Google"** button
- Authenticate with your Google account

#### Option 3: Microsoft Sign-In
- Click **"Sign in with Microsoft"** button (🪟)
- Authenticate with your Microsoft account

### Step 3: Error Handling
If you try to login without registering:
- ❌ Error: "Account not found. Please register first."
- 📝 Click **"Create Account"** link to register

If credentials are wrong:
- ❌ Error: "Invalid credentials. Please check your password and portal."

## 🔄 Complete User Journey

```
┌─────────────────┐
│   Landing Page  │
│   (Home/Root)   │
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         v                     v
┌─────────────────┐   ┌─────────────────┐
│  Login Portal   │   │  Registration   │
│  (Any Role)     │◄──┤     Form        │
└────────┬────────┘   └────────┬────────┘
         │                     │
         │                     │ (After Registration)
         │◄────────────────────┘
         │
         v
   [Authentication Check]
         │
         ├─────────────────────┐
         │                     │
    ✅ Success            ❌ Failed
         │                     │
         v                     v
┌─────────────────┐   ┌─────────────────┐
│    Dashboard    │   │  Error Message  │
│  (Role-based)   │   │  + Try Again    │
└─────────────────┘   └─────────────────┘
```

## 🔥 Firebase Requirements

### Critical: Anonymous Authentication
**⚠️ IMPORTANT**: Before testing, enable Anonymous Authentication in Firebase:

1. Visit: https://console.firebase.google.com/project/studio-1932959431-4b486/authentication/providers
2. Go to **"Sign-in method"** tab
3. Enable **"Anonymous"** provider
4. Click **Save**

**Why?** Firestore security rules require authentication. Without this, no data will be saved!

### Verify Data in Firestore
After registration, check your Firebase Console:
1. Go to: https://console.firebase.google.com/project/studio-1932959431-4b486/firestore
2. Look for **"users"** collection
3. You should see your registered user document

## 📊 Testing the Flow

### Test Scenario 1: New User Registration
```
1. Go to /register
2. Fill form with:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Role: Employee
   - Department: Testing
3. Click "Create Account"
4. Should redirect to /login/employee
5. Login with test@example.com / test123
6. Should redirect to /dashboard
```

### Test Scenario 2: Duplicate Registration
```
1. Try to register with existing email
2. Should show error: "An account with this email already exists."
3. Click "Go to Login Portals" link
4. Login with existing credentials
```

### Test Scenario 3: Login Without Registration
```
1. Go directly to /login/employee
2. Enter unregistered email: newuser@test.com
3. Click Login
4. Should show error: "Account not found. Please register first."
5. Click "Create Account" link
6. Complete registration
```

## 🎨 UI Features

### Registration Page
- ✨ Smooth fade-in animation
- 📝 Real-time form validation
- 🔄 Loading states during submission
- ✅ Success state with checkmark icon
- 🔗 Link to login if already registered

### Login Pages
- 🎭 Role-specific portals
- 🔐 Multiple authentication methods
- 💡 Helper text and error messages
- 🔗 Link to registration for new users
- ⏳ Disabled state during sync

## 🛠️ Technical Details

### Data Flow
1. **Registration**: User data → Zustand Store → Firestore
2. **Login**: Firestore → Zustand Store → Session Storage
3. **Authentication**: Firebase Auth (Anonymous) → Firestore Security

### Store Actions
- `register(userData)` - Creates new user account
- `login(email, password, role, subrole?)` - Authenticates user
- `loginWithGoogle(role, subrole?)` - Google OAuth
- `loginWithMicrosoft(role, subrole?)` - Microsoft OAuth

### Security
- All Firestore operations require authentication
- Password validation (minimum 6 characters)
- Email validation (proper format)
- Role-based access control
- Duplicate email prevention

## 📱 Available URLs

| Purpose | URL | Description |
|---------|-----|-------------|
| Home | http://localhost:3003 | Landing page |
| Register | http://localhost:3003/register | Create new account |
| Admin Login | http://localhost:3003/login/admin | Admin portal |
| Employee Login | http://localhost:3003/login/employee | Employee portal |
| HOD Login | http://localhost:3003/login/hod | HOD portal |
| Finance Login | http://localhost:3003/login/finance | Finance portal (with sub-roles) |
| Dashboard | http://localhost:3003/dashboard | Main application (after login) |
| Test Page | http://localhost:3003/firebase-test | Firebase diagnostics |

## 🐛 Troubleshooting

### Issue: Login button stays disabled
**Solution**: Wait for store to sync from Firestore. Check test page for status.

### Issue: "Account not found" error
**Solution**: User needs to register first. Click "Create Account" link.

### Issue: Registration succeeds but data not in Firestore
**Solution**: Enable Anonymous Authentication in Firebase Console (see above).

### Issue: Can't see registered users
**Solution**: Check Firebase Console → Firestore → users collection.

## 🎉 Success Indicators

✅ Registration form shows success message
✅ Automatic redirect to login portal
✅ User document appears in Firestore
✅ Login succeeds with registered credentials
✅ Dashboard loads after successful login
✅ User session persists on page refresh

---

**Happy Building! 🚀**
