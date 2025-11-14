-- Add RLS policy to allow admins to delete any post
-- Run this in Supabase SQL Editor

-- Drop existing admin delete policy if it exists
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;

-- Create policy for admins to delete any post
CREATE POLICY "Admins can delete any post" ON posts 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'posts' 
AND policyname = 'Admins can delete any post';

