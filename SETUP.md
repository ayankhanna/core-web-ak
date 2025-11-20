# Setup Instructions

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd core-web
npm install
```

This will install:
- React & React DOM
- React Router
- Supabase JS client
- Tailwind CSS
- TypeScript & Vite

### 2. Create Environment Files

You need to create two environment files manually:

#### Create `.env.local.example`

```bash
cat > .env.local.example << 'EOF'
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:8000
EOF
```

#### Create `.env.development`

```bash
cat > .env.development << 'EOF'
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=https://your-deployed-api-url.vercel.app
EOF
```

### 3. Get Your Supabase Credentials

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **core** (project ID: ztnfztpquyvoipttozgz)
3. Go to Settings → API
4. Copy:
   - **Project URL** → use as `VITE_SUPABASE_URL`
   - **anon public** key → use as `VITE_SUPABASE_ANON_KEY`

### 4. Update Environment Files

Replace the placeholder values in both `.env.local.example` and `.env.development`:

```env
VITE_SUPABASE_URL=https://ztnfztpquyvoipttozgz.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

For `.env.development`, also update the API URL to your deployed Vercel API.

### 5. Configure Supabase OAuth Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add these to **Redirect URLs**:
   ```
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   ```
3. Save changes

### 6. Start the Backend API

In a separate terminal:

```bash
cd ../core-api
make start
```

This starts the API on `http://localhost:8000`

### 7. Start the Frontend

Back in the core-web directory:

```bash
# For local API development
npm run local

# OR for deployed API
npm run dev
```

The app will open at `http://localhost:5173`

### 8. Test the Flow

1. Navigate to `http://localhost:5173/login`
2. Click "Continue with Google"
3. Sign in with Google and approve permissions
4. You'll be redirected to the dashboard
5. Today's calendar events should appear (if you have any)

## Common Issues

### Port 5173 already in use

Kill the process using port 5173:
```bash
lsof -ti:5173 | xargs kill -9
```

Or use a different port:
```bash
vite --port 3001
```

### TypeScript errors about path aliases

Restart your TypeScript server:
- VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
- Or restart your editor

### Supabase connection errors

Verify your `.env.local` file:
```bash
cat .env.local
```

Make sure it has the correct values and restart the dev server.

### API connection errors

1. Check core-api is running: `curl http://localhost:8000/api/health`
2. Check `.env.local` has `VITE_API_URL=http://localhost:8000`
3. Look at browser console for CORS errors

### Google OAuth not working

1. Verify redirect URLs in Supabase dashboard
2. Check Supabase has Google OAuth enabled (Dashboard → Authentication → Providers)
3. Ensure you're using `http://localhost:5173` (not 127.0.0.1)

## Quick Commands Reference

```bash
# Install everything
npm install

# Development mode (local API)
npm run local

# Development mode (deployed API)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## File Structure After Setup

```
core-web/
├── .env.local              # Created by npm scripts (gitignored)
├── .env.local.example      # Template for local development
├── .env.development        # Template for deployed API
├── node_modules/           # Dependencies (gitignored)
├── dist/                   # Build output (gitignored)
├── src/
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api-client.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── AuthCallback.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Next Steps

After getting the basic setup working:

1. Add more calendar functionality (sync button, date range picker)
2. Add email functionality
3. Add tasks/todos
4. Add AI chat features
5. Customize the UI to your liking

Enjoy building with Vite + React! 🚀





