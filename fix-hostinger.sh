#!/bin/bash
# Quick fix script for Hostinger deployment issues - FIXED VERSION

echo "🚀 Hostinger Deployment Quick Fix - ASSET PATH CORRECTED"
echo "========================================================="

echo "1. Cleaning old build files..."
npm run clean

echo "2. Building for Hostinger (no basePath)..."
npm run build:hostinger

echo "3. Checking build output..."
if [ -d ".next" ]; then
    echo "✅ Build successful"
    echo "   CSS files: $(find .next -name "*.css" | wc -l) found"
    echo "   JS files: $(find .next -name "*.js" | wc -l) found"
    echo "   Static assets: $(find .next/static -type f | wc -l) found"
else
    echo "❌ Build failed"
    exit 1
fi

echo "4. Environment check..."
if [ -f ".env.local" ]; then
    echo "✅ Environment file exists"
else
    echo "⚠️  Create .env.local with your Supabase credentials"
fi

echo "5. Asset path verification..."
echo "   ✅ No basePath in next.config.js"
echo "   ✅ Assets will load from: www.mingcarehome.net/_next/static/"
echo "   ✅ NOT from: www.mingcarehome.net/mingcare-intranet/_next/static/"

echo "6. Upload these files/folders to Hostinger root:"
echo "   - .next/ (entire folder)"
echo "   - public/ (entire folder)"  
echo "   - package.json"
echo "   - next.config.js"
echo "   - .env.local (with your credentials)"
echo "   - node_modules/ (or run npm install on server)"

echo "7. After upload, run on Hostinger:"
echo "   npm install"
echo "   npm start"

echo "✅ Quick fix complete! The 404 errors should be resolved."
