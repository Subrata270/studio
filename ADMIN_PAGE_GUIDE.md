# Admin Dashboard Guide

## Overview
The Admin Dashboard provides a centralized interface for managing all subscriptions across departments with full edit and delete capabilities.

## Features

### 1. **Subscription Table View**
- Displays all subscriptions in a clean table format
- Columns:
  - Tool Name
  - Cost (with currency)
  - Expires In (calculated dynamically)
  - Status (with color-coded badges)
  - Action buttons (Edit & Delete)

### 2. **Edit Functionality**
- Click the "Edit" button on any subscription row
- Opens a comprehensive dialog with all subscription details organized in sections:
  - **Subscription Information**: Tool name, vendor, department, location, purpose, request type, frequency
  - **Timeline & Duration**: Request date, expiry date, duration in days
  - **Budget Information**: Cost and currency
- All fields are editable
- Shows status banner at the top
- "Save Changes" button triggers a confirmation dialog

### 3. **Delete Functionality**
- Click the "Delete" button on any subscription row
- Shows confirmation alert: "Are you sure you want to delete?"
- Displays subscription name in the confirmation message
- Permanent deletion with no undo option

### 4. **Alert Dialogs**
- **Delete Confirmation**: "Are you sure you want to delete? This will permanently delete the subscription for [Tool Name]. This action cannot be undone."
- **Save Confirmation**: "Save Changes? Are you sure you want to save these changes to [Tool Name]? This will update the subscription information."

## Access

To access the admin dashboard, users must have the `admin` role:
- Navigate to `/dashboard/admin`
- Available in the sidebar navigation under the Shield icon

## Technical Implementation

### Files Created
1. `src/app/(app)/dashboard/admin/page.tsx` - Main admin dashboard page
2. `src/app/(app)/dashboard/admin/edit-subscription-dialog.tsx` - Edit dialog component

### Store Functions Added
- `updateSubscription(subscriptionId, updatedData)` - Updates subscription data
- `deleteSubscription(subscriptionId)` - Deletes a subscription

### Type Updates
- Added `admin` to the `Role` type in `src/lib/types.ts`
- Added admin navigation items to `main-sidebar.tsx`

## Usage

### For Admins
1. Log in with admin credentials
2. Navigate to Admin Dashboard from sidebar
3. View all department subscriptions
4. Click **Edit** to modify subscription details
5. Click **Delete** to remove subscriptions (with confirmation)

### Design Matching Requirements
- Table layout matches the first image with Tool, Cost, Expires In, Status, and Action columns
- Edit dialog displays comprehensive details matching images 2 and 3
- All fields are editable in the dialog
- Confirmation alerts for both save and delete actions
- Responsive design with gradient backgrounds and modern UI

## Security Note
Ensure that only authorized users have the `admin` role assigned to prevent unauthorized access to subscription management features.
