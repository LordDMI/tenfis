# Supabase Setup Guide

This project uses Supabase for authentication and database management. Follow these steps to set up Supabase properly.

## Prerequisites

- A Supabase account (https://app.supabase.com)
- An existing Supabase project

## Setup Steps

### 1. Get Your Supabase Credentials

1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to your project
3. Go to **Settings → API** tab
4. Copy the following values:
   - **Project URL** (under `Project Settings`)
   - **Anon Key** (public key, safe to expose in client code)

### 2. Configure Environment Variables

1. Copy the provided `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Ensure `.env.local` is in `.gitignore`

The project already has `.env*.local` in `.gitignore`, which prevents accidental credential commits.

## Database Tables

The app uses the following tables. Make sure they exist in your Supabase project:

- **profiles**: User profiles (patients and psychologists)
- **posts**: Social feed posts
- **comments**: Post comments
- **likes**: Post likes
- **appointments**: Appointments between patients and therapists
- **chat_rooms**: Chat conversations
- **chat_messages**: Individual messages

## Supabase Security Tips

✅ **Do:**
- Keep the Anon Key private in `.env.local`
- Use Row Level Security (RLS) policies for table protection
- Regenerate keys if exposed

❌ **Don't:**
- Commit `.env.local` to version control
- Share your Anon Key publicly
- Use service role key in client code

## Testing the Connection

The app includes a test component at `app/(root)/Screens/SupabaseTest.tsx` to verify the connection.

## Troubleshooting

### Missing Credentials
If you see warnings about missing Supabase configuration:
1. Verify `.env.local` exists
2. Check the keys are correct
3. Restart your development server

### Connection Errors
1. Verify your Supabase project is active
2. Check internet connectivity
3. Ensure your API keys have the correct permissions
