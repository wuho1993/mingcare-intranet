# Hostinger Deployment Instructions

## 🚨 CRITICAL STEPS:

1. **Delete old deployment completely** on Hostinger
2. Upload ALL these files to your Hostinger root directory:
   - `.next/` (entire folder - this is critical!)
   - `public/` (entire folder)
   - `package.json`
   - `next.config.js`
   - `.env.local`

3. **On Hostinger terminal/panel:**
   ```bash
   npm install
   npm start
   ```

4. **Verify the deployment:**
   - Check that CSS loads from: `www.mingcarehome.net/_next/static/css/`
   - Check that images load from: `www.mingcarehome.net/images/`
   - NO paths should contain `/mingcare-intranet/`

5. **Clear browser cache** after deployment

## Expected Results:
✅ www.mingcarehome.net/_next/static/css/*.css
✅ www.mingcarehome.net/images/mingcare-logo.png
✅ www.mingcarehome.net/icon.png

❌ NOT: www.mingcarehome.net/mingcare-intranet/*
