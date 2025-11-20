# 🚀 Quick Start Guide

Your React + Vite project is ready! Here's how to get started in 3 minutes.

## ✅ What's Done

- ✅ All dependencies installed
- ✅ Environment file templates created
- ✅ Routing configured (React Router)
- ✅ Login page with Google OAuth
- ✅ Dashboard with calendar events
- ✅ Tailwind CSS configured
- ✅ TypeScript configured
- ✅ Path aliases (@/) set up

## 🎯 What You Need to Do

### 1. Add Your Supabase Credentials

Edit `.env.local.example`:

```bash
# Get your anon key from:
# https://supabase.com/dashboard/project/ztnfztpquyvoipttozgz/settings/api

# Edit this file and replace the placeholder:
nano .env.local.example
```

Replace `your-supabase-anon-key-here` with your actual anon key.

### 2. Start the Backend API

In a separate terminal:

```bash
cd ../core-api
make start
```

The API will run on `http://localhost:8000`

### 3. Start the Frontend

```bash
npm run local
```

The app will open at `http://localhost:5173`

## 🎉 That's It!

1. Go to `http://localhost:5173/login`
2. Click "Continue with Google"
3. Sign in and approve permissions
4. You'll see your dashboard with today's calendar events!

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── api-client.ts        # API functions
├── pages/
│   ├── Login.tsx            # Login page
│   ├── Dashboard.tsx        # Main dashboard
│   └── AuthCallback.tsx     # OAuth handler
├── App.tsx                  # Routes
├── main.tsx                 # Entry point
└── index.css                # Tailwind styles
```

## 🛠️ Development Commands

```bash
# Local API development
npm run local

# Deployed API
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## 🔥 Features

- **Fast HMR**: Changes appear instantly
- **TypeScript**: Full type safety
- **Tailwind CSS**: Beautiful, responsive UI
- **React Router**: Client-side routing
- **Path Aliases**: Use `@/` for clean imports
- **Modern Stack**: React 19 + Vite 7

## 📝 Environment Files

Two environment files control API connection:

- **`.env.local.example`** → Used by `npm run local` (localhost:8000)
- **`.env.development`** → Used by `npm run dev` (deployed API)

Both get copied to `.env.local` when you run the respective command.

## 🐛 Troubleshooting

### Port in use
```bash
lsof -ti:5173 | xargs kill -9
```

### Environment variables not loading
Restart the dev server after changing `.env` files.

### TypeScript errors
Restart TS server in VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

### API connection issues
1. Check core-api is running: `curl http://localhost:8000/api/health`
2. Verify `.env.local` has `VITE_API_URL=http://localhost:8000`

## 🚀 Next Steps

1. Customize the UI in `src/pages/Dashboard.tsx`
2. Add more API functions in `src/lib/api-client.ts`
3. Create new pages in `src/pages/`
4. Style with Tailwind classes

## 💡 Pro Tips

- Use browser DevTools to debug API calls
- Check browser console for React errors
- Vite's HMR is instant - just save and see changes!
- TypeScript will catch errors before you even run the code

---

**Need Help?** Check `SETUP.md` for detailed instructions or `README.md` for full documentation.

Enjoy building with React + Vite! ⚡





