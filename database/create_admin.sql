-- Script to create admin account
-- Run this in Supabase SQL Editor after creating the user in Auth

-- STEP 1: First, update the constraint to allow 'admin' role
-- Run this FIRST before inserting the admin profile

ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('patient', 'psychologue', 'admin'));

-- STEP 2: Now create the admin profile
-- Replace 'd05a7339-0274-471e-ae8c-bdf96a9bf7af' with the actual UUID from Supabase Auth
-- You can find it in Authentication > Users after creating the user

INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_verified,
    created_at
) VALUES (
    'd05a7339-0274-471e-ae8c-bdf96a9bf7af',  -- Replace with actual UUID from Authentication
    'admin@tenfis.com',
    'مدير النظام',
    'admin',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
    role = 'admin',
    is_verified = true,
    email = 'admin@tenfis.com',
    full_name = COALESCE(profiles.full_name, 'مدير النظام');

-- OR: Update existing user to admin
-- UPDATE profiles 
-- SET role = 'admin', is_verified = true
-- WHERE email = 'admin@tenfis.com';

