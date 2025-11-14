-- Quick Setup: Create Admin Account
-- Follow these steps:

-- STEP 1: Update role constraint to allow 'admin'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('patient', 'psychologue', 'admin'));

-- STEP 2: Create the user in Supabase Authentication Dashboard
-- Go to: Authentication > Users > Add User
-- Email: admin@tenfis.com
-- Password: (choose a secure password)
-- Auto Confirm: Yes
-- Click "Create User"
-- Copy the User UUID (you'll see it in the users list)

-- STEP 3: Run this SQL (replace USER_UUID_HERE with the UUID from step 2)
-- You can find the UUID in Authentication > Users after creating the user

INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_verified,
    created_at
) VALUES (
    'USER_UUID_HERE',  -- Replace with UUID from Authentication > Users
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

-- STEP 4: Verify it worked
SELECT id, email, full_name, role, is_verified 
FROM profiles 
WHERE email = 'admin@tenfis.com';

-- Now you can log in with:
-- Email: admin@tenfis.com
-- Password: (the password you set in step 2)

