# Core Web (React + Vite)

Modern React/Vite frontend for the Core productivity app.

## Quick Start

### Running with Local API (localhost:8000)
```bash
npm run local
```
Use this when you're running the API locally with `make start`.

### Running with Deployed API
```bash
npm run dev
```
Use this to connect to your deployed API on Vercel.

Open [http://localhost:5173](http://localhost:5173)

## Setup

### First Time Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create environment files:**

Create `.env.local.example`:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:8000
```

Create `.env.development`:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=https://your-deployed-api-url.vercel.app
```

3. **Update with your actual Supabase credentials** (get these from your Supabase dashboard)

## Environment Configuration

### For Local Development (npm run local)
- Frontend: `http://localhost:5173`
- API: `http://localhost:8000` (local)
- Config file: `.env.local.example` → `.env.local`

### For Deployed API (npm run dev)  
- Frontend: `http://localhost:5173`
- API: Your deployed Vercel URL
- Config file: `.env.development` → `.env.local`

## Project Structure

```
core-web/
├── src/
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── api-client.ts    # API client for backend
│   ├── pages/
│   │   ├── Login.tsx        # Login page
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   └── AuthCallback.tsx # OAuth callback handler
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind styles
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
└── tailwind.config.js       # Tailwind configuration
```

## Available Commands

```bash
# Development with local API
npm run local

# Development with deployed API
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Supabase** - Authentication and database
- **Tailwind CSS** - Styling
- **PostCSS & Autoprefixer** - CSS processing

## How It Works

When you run:
- **`npm run local`**: Copies `.env.local.example` to `.env.local` (points to `localhost:8000`)
- **`npm run dev`**: Copies `.env.development` to `.env.local` (points to deployed API)

The API client at `src/lib/api-client.ts` automatically uses `VITE_API_URL` from the active `.env.local` file.

## Features

### Current Features
- Google OAuth authentication via Supabase
- Today's calendar events display
- User profile management
- Clean, modern UI with Tailwind CSS

### Authentication Flow
1. User clicks "Sign in with Google" on login page
2. Redirected to Google OAuth consent screen
3. After approval, redirected to `/auth/callback`
4. Callback handler:
   - Exchanges auth code for session tokens
   - Calls backend API to create user in database
   - Stores Google OAuth tokens in `ext_connections` table
   - Redirects to dashboard
5. Dashboard fetches today's events from API

## API Integration

The app communicates with `core-api` for all backend operations:

- `POST /auth/complete-oauth` - Create user and store OAuth tokens
- `GET /api/calendar/events/today` - Fetch today's calendar events
- `POST /api/calendar/sync` - Sync events from Google Calendar

See `src/lib/api-client.ts` for all available API functions.

## Development Tips

### Path Aliases
Use `@/` to import from src directory:
```typescript
import { supabase } from '@/lib/supabase'
```

### Environment Variables
Access env vars with `import.meta.env`:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

### Hot Module Replacement
Vite provides instant HMR - changes appear immediately without full page reload.

## Troubleshooting

### "Module not found" errors
Run `npm install` to ensure all dependencies are installed.

### "Cannot find module '@/...'" errors
Make sure tsconfig paths are configured correctly. Restart TypeScript server in VS Code (Cmd+Shift+P → "TypeScript: Restart TS Server").

### Environment variables not working
- Ensure env var names start with `VITE_`
- Restart dev server after changing env vars
- Check `.env.local` exists and has correct values

### Login redirect not working
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase dashboard for configured redirect URLs
- Ensure `http://localhost:5173/auth/callback` is added to allowed redirect URLs in Supabase

### Calendar events not loading
- Ensure core-api is running
- Check `VITE_API_URL` points to correct API
- Verify user has completed Google OAuth flow
- Check browser console for API errors

## Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

To preview the production build locally:
```bash
npm run preview
```

## Why Vite + React?

- **Fast**: Instant server start and lightning-fast HMR
- **Simple**: No complex configuration needed
- **Modern**: Uses native ES modules
- **Clean**: Less boilerplate than Next.js for simple apps
- **Flexible**: Easy to customize and extend
