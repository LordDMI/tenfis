-- Fix: Ensure profiles table has updated_at and fix trigger
-- Run this in Supabase SQL Editor

-- Step 1: Ensure updated_at column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Step 2: Update the trigger function to be safer
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the column exists (safer approach)
    BEGIN
        NEW.updated_at := NOW();
    EXCEPTION WHEN OTHERS THEN
        -- Column doesn't exist, skip
        NULL;
    END;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Recreate the profiles trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'updated_at';

