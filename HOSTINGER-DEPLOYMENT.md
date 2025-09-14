# Hostinger Deployment Guide

## 1. Environment Variables Setup
Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.mingcarehome.net
```

## 2. Build Commands for Hostinger
```bash
npm install
npm run build
npm start
```

## 3. Supabase Configuration
In your Supabase dashboard:
1. Go to Authentication > URL Configuration
2. Add your domain: https://www.mingcarehome.net
3. Add redirect URLs:
   - https://www.mingcarehome.net/auth/callback
   - https://www.mingcarehome.net/dashboard

## 4. DNS Configuration
Make sure your domain is properly pointed to Hostinger:
- A record: @ -> Hostinger IP
- CNAME record: www -> your-hostinger-subdomain.hostinger.com

## 5. SSL Certificate
Ensure SSL is enabled in Hostinger panel for https://www.mingcarehome.net

## 6. File Permissions
Make sure the uploaded files have proper permissions (755 for directories, 644 for files)
