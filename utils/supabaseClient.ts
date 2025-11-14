import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || ""
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || ""

// Log for debugging (remove in production)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase configuration!')
    console.error('SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing')
    console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing')
    console.error('Please ensure .env.local exists with:')
    console.error('  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
    console.error('  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
}

// Create client with validation
let supabase
try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase credentials are not configured. Check .env.local file.')
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
} catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    // Create a dummy client to prevent crashes
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
}

export { supabase }
