#!/bin/bash
# Quick fix script for Hostinger deployment issues

echo "🚀 Hostinger Deployment Quick Fix"
echo "=================================="

echo "1. Building the application..."
npm run build:hostinger

echo "2. Checking build output..."
if [ -d ".next" ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo "3. Environment check..."
if [ -f ".env.local" ]; then
    echo "✅ Environment file exists"
else
    echo "⚠️  Create .env.local with your Supabase credentials"
fi

echo "4. Next steps:"
echo "   - Upload the entire project to Hostinger"
echo "   - Set up environment variables in Hostinger panel"
echo "   - Configure Supabase to allow www.mingcarehome.net"
echo "   - Test the application"

echo "✅ Quick fix complete!"
