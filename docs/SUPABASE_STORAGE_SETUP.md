# Supabase Storage Setup Guide

## Required Storage Buckets

Your Supabase project needs the following storage buckets for file uploads to work:

### 1. **avatars** Bucket
Used for storing user profile pictures (psychologues and patients)

**Steps to create:**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `avatars`
4. Make it **Public** (allow public read access)
5. Click "Create bucket"

**Policies needed:**
```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public read access for avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### 2. **certificates** Bucket
Used for storing psychologue certificates (for verification)

**Steps to create:**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `certificates`
4. Make it **Public** (allow public read access)
5. Click "Create bucket"

**Policies needed:**
```sql
-- Allow authenticated psychologues to upload certificates
CREATE POLICY "Psychologues can upload certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (for admin verification)
CREATE POLICY "Public read access for certificates"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'certificates');
```

### 3. **posts** Bucket (Optional)
Used for storing post images in the feed

**Steps to create:**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `posts`
4. Make it **Public**
5. Click "Create bucket"

**Policies needed:**
```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload post images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public read access for posts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'posts');
```

## Troubleshooting

### Error: "error reading file base64"

**Cause 1: File URI is invalid**
- The image picker might return an invalid or temporary URI
- This is common on Android if permissions aren't granted

**Solution:**
- Make sure app has permission to access device storage
- In `app.json`, ensure:
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

**Cause 2: Storage buckets don't exist**
- Upload functions try to upload to `avatars` and `certificates` buckets
- If buckets don't exist, the operation fails

**Solution:**
- Follow the steps above to create the required buckets
- Verify buckets appear in Supabase Dashboard → Storage

**Cause 3: Incorrect bucket permissions**
- Buckets exist but policies don't allow uploads

**Solution:**
- Copy the SQL policies above
- Go to Supabase Dashboard → SQL Editor
- Paste and run each policy
- Verify policies are created in each bucket's Policies tab

### Error: "Upload failed" or "Permission denied"

**Cause:** Bucket policies are too restrictive

**Solution:**
1. Go to Supabase Dashboard → Storage → [bucket-name] → Policies
2. Make sure policies allow INSERT for authenticated users
3. Make sure policies allow SELECT for public (public read)

### File uploads work but no URL returned

**Cause:** Bucket is not set to public

**Solution:**
1. Go to Supabase Dashboard → Storage
2. Click on bucket name
3. In top-right, make sure bucket is "Public"
4. If not, click to make it public

## Testing Upload Functionality

### Step 1: Verify Buckets Exist
```bash
# In Supabase Dashboard, go to Storage
# You should see: avatars, certificates, posts (optional)
```

### Step 2: Test with Signup
1. Open the app
2. Go to Psychologue Signup
3. Complete all steps including:
   - Select profile picture
   - Select certificate image
4. Submit signup form

### Step 3: Check Logs
- If upload fails, check browser console for errors
- Check Supabase logs: Dashboard → Logs
- Look for storage-related errors

### Step 4: Verify in Supabase
1. Go to Supabase Dashboard → Storage
2. Open each bucket
3. You should see folders with user IDs containing uploaded files
4. Click file to see public URL (should be accessible)

## File Upload Flow

```
User selects image
    ↓
Image Picker returns URI
    ↓
uploadProfilePicture() or uploadCertificate()
    ↓
FileSystem.readAsStringAsync() - converts to base64
    ↓
atob() - converts to byte array
    ↓
supabase.storage.upload() - uploads to bucket
    ↓
getPublicUrl() - returns public URL
    ↓
URL saved to profiles table
```

## Environment Variables

Make sure `.env.local` has:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Without these, even if buckets exist, uploads will fail.

## Common Issues Checklist

- [ ] Buckets `avatars` and `certificates` exist in Supabase
- [ ] Buckets are set to **Public**
- [ ] Storage policies allow INSERT for authenticated users
- [ ] Storage policies allow SELECT for public read
- [ ] `.env.local` has correct Supabase credentials
- [ ] App has file access permissions
- [ ] Image files are valid (not corrupted)
- [ ] User is authenticated before uploading
- [ ] File URI is not expired or invalid

## Example: Creating Bucket via SQL

If you prefer SQL, run this in Supabase SQL Editor:

```sql
-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;
```

Then add policies using the SQL provided in each bucket section above.
