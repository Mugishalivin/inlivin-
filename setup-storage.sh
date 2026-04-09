#!/bin/bash
# Setup Supabase Storage Buckets
# This script creates the required storage bucket for the marketplace feature

echo "Setting up Supabase Storage Buckets..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "Creating 'item_images' bucket..."
echo ""

# Create the bucket using Supabase CLI
supabase storage create-bucket item_images --public

if [ $? -eq 0 ]; then
    echo "✅ Storage bucket 'item_images' created successfully!"
    echo ""
    echo "Setting RLS policies..."
    # Note: RLS policies should be applied via SQL or dashboard
    echo "Please ensure the following RLS policies are set in Supabase dashboard:"
    echo "  1. Authenticated users can upload to their own folders"
    echo "  2. Anyone can read public files"
else
    echo "⚠️  Bucket might already exist or there was an error."
    echo "Please verify in your Supabase Dashboard:"
    echo "  1. Go to Storage > Buckets"
    echo "  2. If 'item_images' exists, skip this step"
    echo "  3. If not, create it with Public access enabled"
fi

echo ""
echo "Done! You can now upload images in the marketplace."
