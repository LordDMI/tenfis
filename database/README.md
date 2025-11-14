# Database Setup Instructions

## Quick Setup

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `migration.sql`
4. Click **Run** to execute the migration

## What This Migration Does

### 1. Creates/Updates Profiles Table
- Ensures the `profiles` table exists
- Adds new columns safely (won't duplicate if they exist):
  - `specialties` (TEXT[])
  - `bio` (TEXT)
  - `rate` (DECIMAL)
  - `is_verified` (BOOLEAN)
  - `license_number` (TEXT)
  - `years_of_experience` (INTEGER)

### 2. Creates All Required Tables
- `posts` - Social feed posts
- `comments` - Post comments
- `likes` - Post likes
- `chat_rooms` - Chat rooms between patients and therapists
- `messages` - Real-time chat messages
- `appointments` - Appointment bookings
- `ratings` - Therapist ratings

### 3. Sets Up Security
- Enables Row Level Security (RLS) on all tables
- Creates policies for secure data access
- Ensures users can only access their own data

### 4. Creates Indexes
- Optimizes query performance
- Indexes foreign keys and frequently queried columns

### 5. Sets Up Triggers
- Auto-updates `updated_at` timestamps
- Works for all tables with `updated_at` column

## Storage Setup

After running the migration, you also need to:

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket named `avatars`
3. Set it to **Public** (or configure policies as needed)
4. Add policy to allow authenticated users to upload:
   ```sql
   CREATE POLICY "Users can upload their own avatars"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'avatars' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

## Troubleshooting

### Error: "column profiles.is_verified does not exist"
- Run the migration script again - it will safely add missing columns

### Error: "could not find the table 'public.posts'"
- Make sure you ran the entire migration script
- Check that all tables were created in the **Table Editor** in Supabase

### RLS Policy Errors
- The migration script drops and recreates policies, so it's safe to run multiple times

## Verification

After running the migration, verify in Supabase Dashboard:

1. **Table Editor** - Check that all 7 tables exist:
   - profiles
   - posts
   - comments
   - likes
   - chat_rooms
   - messages
   - appointments
   - ratings

2. **Authentication > Policies** - Verify RLS is enabled and policies exist

3. **Storage** - Verify `avatars` bucket exists

