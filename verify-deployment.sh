#!/bin/bash
# Hostinger Deployment Verification Script

echo "🔍 Verifying Deployment Configuration"
echo "====================================="

echo "1. Checking current Next.js config..."
if [ -f "next.config.js" ]; then
    echo "✅ next.config.js exists"
    if grep -v "^[ ]*\/\/" next.config.js | grep -q "basePath.*mingcare-intranet"; then
        echo "❌ ERROR: next.config.js still contains active basePath!"
        echo "   Make sure you're using the CORRECT next.config.js"
        echo "   It should NOT contain uncommented: basePath: '/mingcare-intranet'"
        exit 1
    else
        echo "✅ next.config.js looks correct (no active basePath)"
    fi
else
    echo "❌ next.config.js not found!"
    exit 1
fi

echo ""
echo "2. Checking .next build folder..."
if [ -d ".next" ]; then
    echo "✅ .next folder exists"
    
    if [ -f ".next/server/app/index.html" ]; then
        echo "✅ HTML file exists"
        
        if grep -q "mingcare-intranet" .next/server/app/index.html; then
            echo "❌ ERROR: HTML still contains 'mingcare-intranet' paths!"
            echo "   You need to rebuild with: npm run build:hostinger"
            exit 1
        else
            echo "✅ HTML looks correct (no mingcare-intranet paths)"
        fi
    else
        echo "❌ HTML file missing"
        exit 1
    fi
else
    echo "❌ .next folder not found - run npm run build:hostinger"
    exit 1
fi

echo ""
echo "3. Checking environment file..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
else
    echo "⚠️  .env.local missing - create it with your Supabase credentials"
fi

echo ""
echo "4. Files to upload to Hostinger:"
echo "   ✅ .next/ (entire folder)"
echo "   ✅ public/ (entire folder)"
echo "   ✅ package.json"
echo "   ✅ next.config.js (NOT next.config.github.js)"
echo "   ✅ .env.local (with your credentials)"
echo "   ✅ node_modules/ (or run npm install on server)"

echo ""
echo "5. Expected asset paths after deployment:"
echo "   ✅ www.mingcarehome.net/_next/static/css/*.css"
echo "   ✅ www.mingcarehome.net/images/mingcare-logo.png"
echo "   ✅ www.mingcarehome.net/icon.png"

echo ""
echo "🚀 Deployment verification complete!"
echo ""
echo "🔥 IMPORTANT:"
echo "   - Delete OLD deployment on Hostinger completely"
echo "   - Upload NEW files (especially .next folder)"
echo "   - Clear browser cache after upload"
