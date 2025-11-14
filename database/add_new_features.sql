-- Migration script for new features
-- Run this in Supabase SQL Editor

-- 1. Add certificate_url column to profiles table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'certificate_url') THEN
        ALTER TABLE profiles ADD COLUMN certificate_url TEXT;
        RAISE NOTICE 'Added certificate_url column to profiles table';
    ELSE
        RAISE NOTICE 'certificate_url column already exists in profiles table';
    END IF;
END $$;

-- 2. Add requested_date column to appointments table and handle existing data
DO $$ 
BEGIN
    -- Check if requested_date column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'requested_date') THEN
        -- Add requested_date column (nullable first)
        ALTER TABLE appointments ADD COLUMN requested_date TIMESTAMP WITH TIME ZONE;
        
        -- Copy existing appointment_date to requested_date for existing records
        UPDATE appointments 
        SET requested_date = appointment_date 
        WHERE requested_date IS NULL AND appointment_date IS NOT NULL;
        
        -- For records without appointment_date, set requested_date to created_at
        UPDATE appointments 
        SET requested_date = created_at 
        WHERE requested_date IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE appointments ALTER COLUMN requested_date SET NOT NULL;
        
        RAISE NOTICE 'Added requested_date column to appointments table';
    ELSE
        RAISE NOTICE 'requested_date column already exists in appointments table';
    END IF;
    
    -- Make appointment_date nullable (if it's currently NOT NULL)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'appointment_date' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE appointments ALTER COLUMN appointment_date DROP NOT NULL;
        RAISE NOTICE 'Made appointment_date nullable in appointments table';
    ELSE
        RAISE NOTICE 'appointment_date is already nullable in appointments table';
    END IF;
END $$;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'certificate_url';

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('appointment_date', 'requested_date')
ORDER BY column_name;

