# Hostinger Deployment Guide - www.mingcarehome.net

## 🚨 CRITICAL FIX FOR 404 ERRORS

The main issue is asset path configuration. Your site was trying to load assets from `/mingcare-intranet/` path which is only for GitHub Pages.

## 1. Environment Variables Setup
Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.mingcarehome.net
```

## 2. Build Commands for Hostinger (FIXED)
```bash
npm install
npm run build:hostinger  # This removes the problematic basePath
npm start
```

## 3. File Structure After Build
Make sure you upload these files/folders to your Hostinger root directory:
- `.next/` (entire folder)
- `public/` (entire folder)
- `package.json`
- `next.config.js` (NOT next.config.github.js)
- `.env.local` (with your actual Supabase credentials)
- All other project files

## 4. Supabase Configuration
In your Supabase dashboard:
1. Go to Authentication → URL Configuration
2. Add your domain: https://www.mingcarehome.net
3. Add redirect URLs:
   - https://www.mingcarehome.net/auth/callback
   - https://www.mingcarehome.net/dashboard
   - https://www.mingcarehome.net/**

## 5. Hostinger Configuration
- Make sure Node.js is enabled in your hosting panel
- Set the startup file to: `server.js` or use `npm start`
- Ensure the document root points to your project folder
- Enable HTTPS/SSL certificate

## 6. DNS Configuration
- A record: @ → Hostinger IP
- CNAME record: www → your-hostinger-subdomain.hostinger.com

## 7. Quick Fix Command
```bash
# Run this locally first
npm run clean
npm run build:hostinger

# Then upload the entire project to Hostinger
```

## 8. Troubleshooting 404 Errors
If you still see 404 errors for CSS/JS files:
1. Delete the old deployment completely
2. Re-upload with the new build (no `/mingcare-intranet/` paths)
3. Clear browser cache
4. Check that .next folder is uploaded correctly

## ✅ Expected Results
After fixing:
- CSS should load from: `https://www.mingcarehome.net/_next/static/css/...`
- JS should load from: `https://www.mingcarehome.net/_next/static/chunks/...`
- Images should load from: `https://www.mingcarehome.net/_next/static/media/...`
