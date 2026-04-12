# 🚀 Create Your Supabase Project

## Problem
You don't have a Supabase project yet. Let's create one!

---

## Step 1: Go to Supabase

Open https://app.supabase.com in your browser

If you don't have an account, click **"Sign up"** and create one (free!)

---

## Step 2: Create a New Project

1. Click **"New project"** button (or **"Create a new project"**)
2. Fill in the form:
   - **Project name:** `ilivin` (or any name)
   - **Database password:** Create a strong password
   - **Region:** Choose closest to you (e.g., US East, Europe, etc.)
   - Click **"Create new project"**

3. Wait for project to be created (takes ~1-2 minutes)
   - You'll see a progress bar
   - It will show "Setting up your project..."

---

## Step 3: You'll See a Project Dashboard

Once created, you'll have:
- 📊 A Dashboard with your project overview
- 🔑 API Keys (you'll need these later)
- 🗄️ Database section
- 💾 Storage section

---

## Step 4: Get Your Project Info

You'll need these values for your `.env` file:

1. Click **"Settings"** (bottom of sidebar) → **"API"**
2. Copy these values:
   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **anon public** → This is your `VITE_SUPABASE_ANON_KEY`

3. Your `.env` file should look like:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 5: Create Storage Buckets

Once your project is created:

1. Click **Storage** (left sidebar)
2. Click **"+ New bucket"**
3. Create:
   - **`item_images`** (PUBLIC)
   - **`digital_products`** (PUBLIC)

*See CREATE_BUCKETS_NOW.md for detailed instructions*

---

## ✅ Done!

Your Supabase project is ready! Now:
1. Update your `.env` file with the credentials
2. Create the two storage buckets
3. Your app will work! 🎉

---

## 🆘 Still Need Help?

- Supabase docs: https://supabase.com/docs
- Having issues? Check that you're at https://app.supabase.com (not just supabase.com)
