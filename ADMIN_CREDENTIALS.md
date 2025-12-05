# Admin Login Credentials

## Default Admin Account

**Email:** admin@example.com  
**Password:** admin123

## Access Admin Portal

1. **From Main Login Page:**
   - Go to the main login page
   - Select "Admin Portal" from the portal dropdown
   - Enter the credentials above
   - Click Login

2. **Direct Link:**
   - Navigate to `/login/admin`
   - Enter the credentials above
   - Click Login

## Admin Features

### Full Access
- View all subscriptions across all departments
- Edit any subscription details
- Delete subscriptions with confirmation
- No department restriction (admin sees everything)

### Dashboard Location
After login, admin users are redirected to:
- `/dashboard/admin`

## Creating New Admin Users

### Via Registration Page
1. Go to `/register`
2. Fill in name, email, password
3. Select **"Admin"** from the Role dropdown
4. Note: Department field is hidden for admin role (automatically set to "Administration")
5. Click "Create Account"

### Via Database
Add a user to the database with:
```json
{
  "id": "unique-id",
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin",
  "subrole": null,
  "department": "Administration"
}
```

## Security Notes

⚠️ **Important:**
- Change the default password in production
- Restrict admin role assignment to authorized personnel only
- Admin role has unrestricted access to all subscription data
- Consider implementing additional authentication for admin access

## Admin Capabilities

✅ **Can Do:**
- View all department subscriptions
- Edit subscription details (cost, duration, vendor, etc.)
- Delete subscriptions (with confirmation dialog)
- Access comprehensive subscription history
- View all user data

❌ **Cannot Do:**
- Does not need HOD approval workflow
- Not part of standard POC/HOD/Finance flow
- Intended for system administration only
