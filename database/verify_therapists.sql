-- SQL Script to Verify Therapists Manually
-- Run this in Supabase SQL Editor

-- Verify a specific therapist by ID
UPDATE profiles 
SET is_verified = true 
WHERE id = 'therapist-uuid-here' AND role = 'psychologue';

-- Verify a therapist by email
UPDATE profiles 
SET is_verified = true 
WHERE email = 'therapist@example.com' AND role = 'psychologue';

-- Verify all therapists (use with caution!)
UPDATE profiles 
SET is_verified = true 
WHERE role = 'psychologue';

-- Unverify a therapist
UPDATE profiles 
SET is_verified = false 
WHERE id = 'therapist-uuid-here' AND role = 'psychologue';

-- View all unverified therapists
SELECT 
    id,
    full_name,
    email,
    license_number,
    years_of_experience,
    specialties,
    created_at
FROM profiles
WHERE role = 'psychologue' AND is_verified = false
ORDER BY created_at DESC;

-- View all verified therapists
SELECT 
    id,
    full_name,
    email,
    license_number,
    years_of_experience,
    specialties,
    is_verified,
    created_at
FROM profiles
WHERE role = 'psychologue' AND is_verified = true
ORDER BY created_at DESC;

