-- Update RLS policy to require confirmed appointments for chat rooms
-- Run this in Supabase SQL Editor

-- Drop existing policy
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;

-- Create new policy that requires confirmed appointments
CREATE POLICY "Users can create chat rooms only with confirmed appointments" ON chat_rooms 
FOR INSERT 
WITH CHECK (
    (auth.uid() = patient_id OR auth.uid() = therapist_id) AND
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.patient_id = chat_rooms.patient_id
        AND appointments.therapist_id = chat_rooms.therapist_id
        AND appointments.status = 'confirmed'
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
WHERE tablename = 'chat_rooms' 
AND policyname = 'Users can create chat rooms only with confirmed appointments';

