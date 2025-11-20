#!/bin/bash

echo "🚀 Setting up Core Web environment files..."
echo ""

# Create .env.local.example
if [ ! -f .env.local.example ]; then
    echo "📝 Creating .env.local.example..."
    cat > .env.local.example << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://ztnfztpquyvoipttozgz.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Core API Configuration - Local Development
VITE_API_URL=http://localhost:8000
EOF
    echo "✅ Created .env.local.example"
else
    echo "⏭️  .env.local.example already exists"
fi

# Create .env.development
if [ ! -f .env.development ]; then
    echo "📝 Creating .env.development..."
    cat > .env.development << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://ztnfztpquyvoipttozgz.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Core API Configuration - Deployed API
VITE_API_URL=https://your-deployed-api-url.vercel.app
EOF
    echo "✅ Created .env.development"
else
    echo "⏭️  .env.development already exists"
fi

echo ""
echo "✨ Environment files created!"
echo ""
echo "📋 Next steps:"
echo "1. Get your Supabase anon key from: https://supabase.com/dashboard/project/ztnfztpquyvoipttozgz/settings/api"
echo "2. Edit .env.local.example and replace 'your-supabase-anon-key-here'"
echo "3. Edit .env.development and replace both the anon key and API URL"
echo "4. Run 'npm run local' to start with local API"
echo ""
