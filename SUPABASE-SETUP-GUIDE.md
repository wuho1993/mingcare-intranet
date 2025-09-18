# Supabase Project Setup Guide

## Option 1: If You Have an Existing Supabase Project

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select your MingCare project
4. Go to Settings > API
5. Copy the Project URL and anon public key
6. Replace the values in .env.local

## Option 2: Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: "MingCare Intranet"
   - Database Password: (choose a strong password)
   - Region: (choose closest to your location)
5. Wait for project creation (takes ~2 minutes)
6. Once ready, go to Settings > API
7. Copy the Project URL and anon public key
8. Update your .env.local file

## Sample .env.local Configuration

```bash
# Example - replace with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZmdoamtsZGZnc2RmZyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg5MjQwMDAwLCJleHAiOjIwMDQ4MTYwMDB9.sample-key-replace-with-real-one
SKIP_ENV_VALIDATION=true
```

## After Configuration

1. Save the .env.local file
2. Restart your development server: npm run dev
3. Test the connection by trying to login or access customer data