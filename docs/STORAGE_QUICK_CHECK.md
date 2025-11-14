# Quick Supabase Storage Checklist

## Before Testing File Uploads

### 1. Verify Storage Buckets Exist
In Supabase Dashboard → Storage, you should see these 3 buckets:
- [ ] `avatars` (Public)
- [ ] `certificates` (Public)  
- [ ] `posts` (Public)

If any are missing, create them now.

### 2. Make Buckets Public
For each bucket:
1. Click bucket name
2. Check if status shows "Public" (not "Private")
3. If private, click to make public
4. All 3 buckets must be PUBLIC for uploads to work

### 3. Check Storage Policies (Optional)
Go to each bucket → Policies tab → Check that there are policies for:
- INSERT (allow authenticated users to upload)
- SELECT (allow public read)

If no policies exist, create basic ones or ask admin to set them up.

### 4. Verify Credentials in .env.local
Open `.env.local` file and check:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-very-long-anon-key
```

Both must be filled with YOUR project credentials.

### 5. Check App Permissions (Android/iOS)
The app needs permission to access device files.

In `app.json`, verify this plugin exists:
```json
{
  "plugins": [
    [
      "expo-image-picker",
      {
        "photosPermission": "Allow Tenfis to access your photos",
        "cameraPermission": "Allow Tenfis to access your camera"
      }
    ]
  ]
}
```

### 6. Clear Cache and Restart
```bash
npm run lint
npm start -- --clear
```

Then test on device/emulator.

## Testing File Upload

### Test with Psychologue Signup

1. **Open the app** and navigate to Psychologue Signup
2. **Step 1 - Basic Info:**
   - Enter full name
   - Select profile picture (tap "اختيار صورة شخصية")
   - Select date of birth
3. **Step 2 - Professional:**
   - Enter bio
   - Enter hourly rate
   - Enter phone number
   - Enter email
   - Enter password
   - Select specialties
4. **Step 3 - Verification:**
   - Enter place of birth
   - Enter address
   - Enter license number
   - Enter years of experience
   - **Select certificate** (most important - tap "اختيار الشهادة")
5. **Submit** and watch console logs

### What to Check in Logs

Open browser console (F12) or check Expo Go terminal logs for messages like:

✅ **Success logs:**
```
Starting avatar upload for user: xxxxx
Successfully read file as base64, length: 12345
Uploading to path: xxxxx/filename
Byte array size: 12345
Upload successful: {path: 'xxxxx/filename'}
Public URL: https://...
```

❌ **Error logs (need to fix):**
```
Error reading file as base64: 
→ Missing permissions or invalid file URI
→ Solution: Check app.json has image-picker plugin with permissions

Supabase upload error:
→ Bucket doesn't exist, isn't public, or policies wrong
→ Solution: See steps 1-3 above

Missing required parameters:
→ File wasn't selected properly
→ Solution: Select file again, ensure you see file name/size displayed
```

## Troubleshooting Steps

### If "Error reading file base64":

1. **Check file selection worked:**
   - Does the selected image show on screen?
   - Can you see filename below image picker button?

2. **Check permissions in `app.json`:**
   - Are image-picker permissions defined?
   - Run `npm start -- --clear` to apply permissions

3. **Check file access:**
   - Try restarting app
   - Try selecting a different image
   - Try taking a new photo instead of choosing from gallery

### If "Upload failed" or no public URL:

1. **Check bucket exists:**
   - Go to Supabase → Storage
   - Do you see `avatars` and `certificates` buckets?
   - If not, create them now

2. **Check bucket is public:**
   - Click each bucket
   - Look for "Public" badge
   - If not public, make it public

3. **Check credentials:**
   - Open `.env.local`
   - Copy both values from your Supabase project
   - Verify no spaces before/after values

4. **Check policies:**
   - Go to bucket → Policies
   - Try running SQL from `SUPABASE_STORAGE_SETUP.md` doc

### If upload succeeds but no URL:

1. Check bucket is public (see step 2 above)
2. Verify public URL format: `https://your-project.supabase.co/storage/v1/object/public/bucket-name/path/to/file`

## After Successful Upload

1. **Check Supabase Storage:**
   - Go to Supabase → Storage
   - Open `avatars` and `certificates` buckets
   - You should see folders with user IDs
   - Inside folders should be uploaded files

2. **Check Database:**
   - Go to Supabase → SQL Editor
   - Run: `SELECT avatar_url, certificate_url FROM profiles WHERE id = 'user-id';`
   - Should see URLs for uploaded files

3. **Check URLs work:**
   - Copy public URL from console log
   - Open in browser - should show image

4. **Verify Admin Dashboard:**
   - Psychologue should appear in admin dashboard
   - Certificate should be listed in verification screen
   - Avatar should display in therapist profile

## Getting Help

If uploads still fail, check these docs:
- `SUPABASE_STORAGE_SETUP.md` - Full setup guide with SQL
- `ENV_QUICK_REFERENCE.md` - Environment variables guide
- `SUPABASE_SETUP.md` - Complete Supabase configuration

And share these console logs for debugging:
```
Starting avatar upload for user: ???
Successfully read file as base64, length: ???
Error: ???
```
