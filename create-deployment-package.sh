#!/bin/bash
# Create deployment package for Hostinger

echo "📦 Creating Hostinger Deployment Package"
echo "========================================"

# Create deployment directory
mkdir -p hostinger-deployment

echo "1. Copying essential files..."

# Copy the correct build
cp -r .next hostinger-deployment/
cp -r public hostinger-deployment/
cp package.json hostinger-deployment/
cp next.config.js hostinger-deployment/  # Make sure it's the RIGHT config
cp .env.local hostinger-deployment/

echo "2. Creating deployment instructions..."
cat > hostinger-deployment/DEPLOY-INSTRUCTIONS.md << 'EOF'
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
EOF

echo "3. Verifying package contents..."
echo "   .next folder: $(ls -la hostinger-deployment/.next | wc -l) items"
echo "   public folder: $(ls -la hostinger-deployment/public | wc -l) items"
echo "   Config file: $([ -f hostinger-deployment/next.config.js ] && echo "✅" || echo "❌")"
echo "   Env file: $([ -f hostinger-deployment/.env.local ] && echo "✅" || echo "❌")"

echo ""
echo "✅ Deployment package created in 'hostinger-deployment/' folder"
echo ""
echo "🚀 NEXT STEPS:"
echo "   1. Zip the 'hostinger-deployment' folder"
echo "   2. Upload to Hostinger (replace old files completely)"
echo "   3. Run 'npm install && npm start' on Hostinger"
echo "   4. Clear browser cache"
