# Update Summary - تنفيس App Improvements

## ✅ Completed Features

### 1. Fixed Search Screen Links
- Fixed navigation links for حجز موعد, محادثة, and عرض التقييمات
- Changed from relative paths to absolute paths using `/(root)/Screens/...`
- Added SafeAreaView for better UI

### 2. Psychologue Restrictions
- **Posts**: Unverified psychologues cannot create posts
- **Search**: Only verified psychologues appear in search results
- **Chat**: Patients cannot start conversations with unverified psychologues
- **Appointments**: Only verified psychologues can be booked

### 3. Approved Badge on Posts
- Added green checkmark badge next to verified psychologue names on posts
- Shows "متحقق" text with checkmark icon

### 4. Certificate Upload in Psychologue Signup
- Added certificate upload field in step 3 of psychologue signup
- Certificate is required before completing registration
- Certificate is stored in Supabase storage bucket `certificates`

### 5. New Appointment Flow
- **Patient**: Requests appointment with preferred date/time
- **Therapist**: Can accept and set actual appointment date/time, or reject
- Both parties see the appointment once confirmed
- Added `requested_date` field to appointments table

### 6. Profile Navigation from Posts
- Clicking on profile picture or name in posts navigates to that user's profile
- Profile screen now supports viewing other users' profiles via `userId` parameter

### 7. Edit/Delete Posts
- Users can edit their own posts (inline editing)
- Users can delete their own posts (with confirmation)
- Edit/delete buttons appear only on own posts

### 8. Posts on Profile (Facebook-style)
- User's posts now appear on their profile page
- Posts are displayed in chronological order (newest first)
- Shows post content, images, and creation date

### 9. SafeAreaView on All Pages
- Added SafeAreaView to all screens:
  - feed.tsx
  - search.tsx
  - chat.tsx
  - appointments.tsx
  - profile.tsx
  - rating.tsx
  - admin.tsx

### 10. UI Improvements
- Better spacing and shadows on post cards
- Improved button styling
- Better visual hierarchy
- Enhanced modal designs
- Improved color consistency

## 📋 Database Migration Required

**IMPORTANT**: You need to run the updated migration script to add the new fields:

1. **Add `certificate_url` column to profiles table**
2. **Add `requested_date` column to appointments table**
3. **Make `appointment_date` nullable** (since it's set by therapist when confirming)

Run this SQL in your Supabase SQL Editor:

```sql
-- Add certificate_url to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'certificate_url') THEN
        ALTER TABLE profiles ADD COLUMN certificate_url TEXT;
    END IF;
END $$;

-- Add requested_date to appointments and make appointment_date nullable
DO $$ 
BEGIN
    -- Add requested_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'requested_date') THEN
        ALTER TABLE appointments ADD COLUMN requested_date TIMESTAMP WITH TIME ZONE;
        
        -- Copy existing appointment_date to requested_date for existing records
        UPDATE appointments SET requested_date = appointment_date WHERE requested_date IS NULL;
        
        -- Make requested_date NOT NULL after copying data
        ALTER TABLE appointments ALTER COLUMN requested_date SET NOT NULL;
    END IF;
    
    -- Make appointment_date nullable
    ALTER TABLE appointments ALTER COLUMN appointment_date DROP NOT NULL;
END $$;
```

## 🗄️ Storage Bucket Setup

Create a new storage bucket in Supabase for certificates:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `certificates`
3. Set it to **Public** (or configure RLS policies as needed)

## 📝 Notes

- All navigation paths have been updated to use absolute paths
- The app now properly handles viewing other users' profiles
- Unverified psychologues are restricted from most features until admin verification
- Appointment flow now requires therapist confirmation before scheduling

## 🐛 Known Issues / Future Improvements

- Consider adding image editing for posts
- Add ability to schedule recurring appointments
- Add notifications for appointment confirmations
- Consider adding post sharing functionality

