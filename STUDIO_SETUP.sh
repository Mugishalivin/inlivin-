#!/bin/bash

# Supabase Studio Setup Guide
# This script helps deploy the studio tables to Supabase

echo "🚀 Setting up Studio tables in Supabase..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo ""
echo "📋 Options:"
echo "1. Deploy migrations (local Supabase)"
echo "2. Push to production Supabase"
echo "3. Check migration status"
echo ""
read -p "Select option (1-3): " option

case $option in
    1)
        echo "📂 Deploying local migrations..."
        supabase migration list
        echo ""
        echo "To deploy, run: supabase db push"
        ;;
    2)
        echo "🔐 Pushing to production Supabase..."
        echo "Make sure your SUPABASE_ACCESS_TOKEN is set:"
        export SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN}
        supabase migration list --db-url $DATABASE_URL
        ;;
    3)
        echo "📊 Checking migration status..."
        supabase migration list
        ;;
    *)
        echo "Invalid option"
        ;;
esac

echo ""
echo "✅ Studio setup complete!"
