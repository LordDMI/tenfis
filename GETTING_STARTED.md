# Getting Started - Tenfis App

## Prerequisites
- Node.js and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- A Supabase project created at https://app.supabase.com

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
The `.env.local` file already has your Supabase credentials configured:
```
EXPO_PUBLIC_SUPABASE_URL=https://vtpseddpbuldndpzmlwq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Clear Cache and Start (IMPORTANT!)
```bash
npm start -- --clear
```

**Important**: After creating or modifying `.env.local`, always use `--clear` to clear the Expo cache and reload environment variables.

### 4. Run on Device/Emulator
- **Web**: Press `w`
- **Android**: Press `a` (requires Android emulator or device)
- **iOS**: Press `i` (requires Mac/iOS emulator)

## Troubleshooting

### "Invalid URL" Error
If you see: `Invalid URL: your_supabase_url_here/`

**Solution**:
1. Ensure `.env.local` exists with correct credentials
2. Clear Expo cache: `npm start -- --clear`
3. Restart the development server
4. Check console logs for `SUPABASE_URL: ✓ Set` messages

### Port Already in Use (8081)
```bash
# Use a different port
expo start -p 8082
```

### Module Not Found Errors
```bash
# Clean install
rm -r node_modules
npm install
```

## Project Structure

```
tenfis-main/
├── app/                    # Main app routes and screens
│   ├── _layout.tsx        # Root layout with AuthWrapper
│   ├── (root)/            # Protected routes
│   │   ├── Screens/       # All screens
│   │   └── components/    # Screen components
│   └── globals.css        # Global styles
├── utils/                 # Utility functions
│   ├── supabaseClient.ts  # Supabase client (uses .env)
│   └── ...                # Upload utilities
├── config/                # Configuration
│   └── env.ts            # Environment validation
├── .env.local            # ✓ Local env vars (in .gitignore)
├── .env.example          # Template for .env.local
└── package.json          # Dependencies
```

## Key Features

✅ **Supabase Auth** - User authentication  
✅ **Social Feed** - Posts, comments, likes  
✅ **Appointments** - Booking system  
✅ **Chat** - Real-time messaging  
✅ **Profiles** - Patient & therapist profiles  
✅ **Admin Dashboard** - Management interface  

## Common Commands

```bash
# Start development server
npm start

# Run linter
npm run lint

# Build for production
expo export

# Clear cache
expo start --clear

# Reset to fresh state
rm -rf node_modules .expo && npm install && npm start --clear
```

## Development Tips

1. **Check Supabase Connection**: Look for `✓ Set` messages in console logs
2. **Use React DevTools**: Press `j` in Expo CLI for debugger
3. **Watch Lint Warnings**: Run `npm run lint` before committing
4. **Hot Reload**: Changes auto-reload (files save = instant update)

## Environment Variables

Your `.env.local` should contain:

```dotenv
# Required - Supabase
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional - Firebase (deprecated, can be removed)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## Next Steps

1. ✅ Verify environment variables are loaded
2. ✅ Run app with `npm start -- --clear`
3. ✅ Test Supabase connection
4. ✅ Create test account
5. ✅ Explore app features

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
