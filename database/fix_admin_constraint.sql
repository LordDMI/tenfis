-- Fix: Update profiles table to allow 'admin' role
-- Run this FIRST before creating admin account

-- Drop existing constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with 'admin' included
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('patient', 'psychologue', 'admin'));

-- Verify the constraint was updated
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND conname = 'profiles_role_check';

-- Now you can run the admin creation script

