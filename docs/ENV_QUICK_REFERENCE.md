# Quick Reference - Supabase Configuration

## One-Time Setup

```bash
# 1. Copy example environment file
cp .env.example .env.local

# 2. Get your credentials from https://app.supabase.com
#    - Settings → API → Project URL
#    - Settings → API → Anon Key

# 3. Update .env.local with your credentials
#    EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 4. Start development server
npm start
# or
expo start
```

## Environment Variables

### Required (Supabase)
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Public API key from Supabase

### Optional (Firebase - if using)
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## Files Changed

| File | Change |
|------|--------|
| `utils/supabaseClient.ts` | Now uses environment variables |
| `FireBaseConfig.ts` | Now uses environment variables |
| `config/env.ts` | NEW - Environment validation |
| `.env.local` | NEW - Your local credentials |
| `.env.example` | NEW - Template for developers |
| `docs/SUPABASE_SETUP.md` | NEW - Setup guide |
| `docs/SUPABASE_SECURITY.md` | NEW - Security guide |

## Important Notes

⚠️ **NEVER commit `.env.local` to git** - It's already in `.gitignore`

🔐 **Keep credentials private** - Don't share your API keys

✅ **Use Expo variables prefix** - All use `EXPO_PUBLIC_` to make them available

🔄 **Restart dev server** - After changing `.env.local`, restart `npm start`

## Validation

The app automatically validates configuration on startup:
- Check console for `⚠️` warnings if variables are missing
- Both Supabase and Firebase will log if not configured

## Need Help?

1. Check `docs/SUPABASE_SETUP.md` for detailed database setup
2. Check `docs/SUPABASE_SECURITY.md` for security best practices
3. Test with `app/(root)/Screens/SupabaseTest.tsx`
