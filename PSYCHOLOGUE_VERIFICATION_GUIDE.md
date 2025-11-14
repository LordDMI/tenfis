# Psychologue Verification System Guide

## Overview
This document describes the complete psychologue registration and verification workflow in the Tenfis application.

## Registration Flow

### Step 1: Psychologue Signup
- New psychologues sign up using the dedicated signup screen at `/(root)/Screens/psychologue/psysignup`
- Three-step registration process:
  1. **Basic Info**: Full name, date of birth, profile picture
  2. **Professional Info**: Specialties, bio, hourly rate, contact info
  3. **Address & Verification**: Address, license number, years of experience, certificate upload

### Step 2: Account Creation
Upon signup completion:
- User account created in Supabase Auth with `is_verified: false`
- Profile record inserted in `profiles` table with `is_verified: false`
- Certificate and avatar uploaded to Supabase Storage
- User redirected to login screen

## Verification Process

### Admin Dashboard
**Location**: `/(root)/Screens/admin-dashboard`

Admins can see:
- ✅ Total therapists count
- ✅ Verified therapists count (badge showing number)
- ✅ Pending therapists count (orange badge)
- ✅ Quick action to review pending applications

### Admin Verification Screen
**Location**: `/(root)/Screens/admin`

**Features**:
1. **List all psychologues** with:
   - Profile picture
   - Name and email
   - License number and years of experience
   - Specialties (first 3 displayed)
   - Bio preview
   - Verification status badge

2. **Actions per psychologue**:
   - ✅ **Accept**: Sets `is_verified: true`
   - ❌ **Reject**: Sets `is_verified: false` (can toggle)

## Unverified Psychologue Restrictions

### Home Screen (Mainps)
**Location**: `/(root)/Screens/psychologue/Mainps`

**Display**:
- Shows "قيد المراجعة" (Under Review) badge when unverified
- Logout button accessible in top-right corner

**Restrictions**:
- ❌ **Appointments**: Disabled/grayed out
- ❌ **Chat**: Disabled/grayed out
- ✅ **Feed**: Can view/watch posts (read-only)
- ✅ **Profile**: Can view and edit profile

**Blocked Features**:
When clicking restricted features, user sees:
```
Dialog: "حساب قيد المراجعة" (Account Under Review)
"يجب أن يتم التحقق من حسابك من قبل الإدارة أولاً قبل الوصول إلى هذه الميزة. 
يمكنك فقط مشاهدة المنشورات وتعديل ملفك الشخصي في الوقت الحالي."
```

### Feed (Post Creation)
**Location**: `/(root)/Screens/feed`

When unverified psychologue tries to create a post:
```
Alert: "تنبيه" (Warning)
"يجب التحقق من حسابك أولاً قبل إنشاء المنشورات"
```
- Post creation button is disabled
- Cannot share content

### Appointments
**Location**: `/(root)/Screens/appointments`

- Page shows alert and redirects unverified users
- Error message: "لا يمكنك الوصول إلى المواعيد حتى يتم التحقق من حسابك من قبل الإدارة"

### Chat
**Location**: `/(root)/Screens/chat`

- Page shows alert and redirects unverified users
- Error message: "لا يمكنك الوصول إلى المحادثات حتى يتم التحقق من حسابك من قبل الإدارة"

## Verification Status Changes

### When Admin Accepts
1. `is_verified` set to `true` in profiles table
2. Psychologue can immediately:
   - Create and share posts
   - Access appointments (book/manage)
   - Send and receive messages
   - All features fully enabled

### When Admin Rejects
1. `is_verified` set to `false`
2. Psychologue loses access to:
   - Post creation
   - Appointments
   - Chat messaging
3. Can only view content and edit profile

## Error Handling

### File Upload Errors
**Certificate Upload** (`utils/uploadCertificate.ts`):
- Validates file exists before reading
- Checks if base64 conversion succeeds
- Detailed console logging for debugging
- Returns `null` on any failure
- User sees: "فشل رفع الشهادة. تأكد من أن الملف صحيح وحاول مرة أخرى."

**Avatar Upload** (`utils/uploadProfilePicture.ts`):
- Same validation and error handling as certificate
- Ensures file exists and is readable
- Provides detailed error messages

### Common Issues
1. **"Cannot read property 'base64' of undefined"**
   - File doesn't exist or path is invalid
   - FileSystem.readAsStringAsync fails
   - Solution: Ensure file is properly selected from device

2. **Upload fails silently**
   - Check Supabase Storage bucket exists: `certificates` and `avatars`
   - Check bucket permissions allow uploads
   - Check user has valid Supabase token

## Database Schema

### profiles table changes
```sql
ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
```

### Required columns
- `id` (UUID): User ID
- `is_verified` (BOOLEAN): Verification status
- `certificate_url` (TEXT): Link to uploaded certificate
- `role` (TEXT): 'psychologue'
- Other columns: full_name, email, phone, etc.

## Testing Checklist

- [ ] New psychologue can sign up with all required info
- [ ] Certificate uploads successfully
- [ ] Profile shows as pending in admin dashboard
- [ ] Admin can view unverified psychologues
- [ ] Admin can accept/reject verification
- [ ] Unverified psychologue sees "Under Review" badge
- [ ] Unverified psychologue cannot access appointments
- [ ] Unverified psychologue cannot access chat
- [ ] Unverified psychologue cannot create posts
- [ ] Unverified psychologue CAN view feed
- [ ] Unverified psychologue CAN view/edit profile
- [ ] Verified psychologue has full access
- [ ] Logout works from any screen

## Code Files

### Modified Files
- `app/(root)/Screens/psychologue/psysignup.tsx` - Registration form
- `app/(root)/Screens/psychologue/Mainps.tsx` - Home screen with restrictions
- `app/(root)/Screens/admin.tsx` - Verification interface
- `app/(root)/Screens/admin-dashboard.tsx` - Dashboard stats
- `app/(root)/Screens/appointments.tsx` - Verification check
- `app/(root)/Screens/chat.tsx` - Verification check
- `app/(root)/Screens/feed.tsx` - Post creation check
- `utils/uploadCertificate.ts` - Certificate upload with error handling
- `utils/uploadProfilePicture.ts` - Avatar upload with error handling

### Key Functions
- `checkAccessPermission()` - Verifies user status before allowing access
- `handleRestrictedAccess()` - Shows alert for restricted features
- `uploadCertificate()` - Handles certificate file upload
- `uploadProfilePicture()` - Handles avatar file upload
