#!/bin/bash
# GitHub vs Local Version Comparison Script

echo "🔍 MingCare Intranet - Version Comparison Tool"
echo "============================================="

echo ""
echo "📦 Local Package Information:"
echo "----------------------------"
if [ -f "package.json" ]; then
    echo "Name: $(cat package.json | grep '"name"' | cut -d'"' -f4)"
    echo "Version: $(cat package.json | grep '"version"' | cut -d'"' -f4)"
    echo "Description: $(cat package.json | grep '"description"' | cut -d'"' -f4)"
else
    echo "❌ package.json not found"
fi

echo ""
echo "📁 Project Structure Analysis:"
echo "------------------------------"
echo "✅ App Directory Structure:"
find app -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | sort

echo ""
echo "✅ Components Directory:"
if [ -d "components" ]; then
    find components -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | sort
else
    echo "❌ No components directory found"
fi

echo ""
echo "✅ Lib Directory:"
if [ -d "lib" ]; then
    find lib -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | sort
else
    echo "❌ No lib directory found"
fi

echo ""
echo "📄 Configuration Files:"
echo "-----------------------"
echo "✅ Configuration files present:"
for file in "next.config.js" "tailwind.config.js" "tsconfig.json" ".env.local" "postcss.config.js"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done

echo ""
echo "🎨 Style Files:"
echo "---------------"
for file in "app/globals.css" "tailwind.config.js"; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        echo "  ✓ $file ($lines lines)"
    else
        echo "  ❌ $file (missing)"
    fi
done

echo ""
echo "🔧 Dependencies Check:"
echo "---------------------"
if [ -f "package.json" ]; then
    echo "Key dependencies:"
    grep -E '"(next|react|typescript|tailwind|supabase)"' package.json | head -10
fi

echo ""
echo "🚀 Development Status:"
echo "---------------------"
if pgrep -f "next dev" > /dev/null; then
    echo "✅ Development server is running"
    echo "📍 Likely running on: http://localhost:3001"
else
    echo "❌ Development server not running"
fi

echo ""
echo "📊 File Count Summary:"
echo "---------------------"
echo "TSX/JSX files: $(find . -name "*.tsx" -o -name "*.jsx" | wc -l)"
echo "TypeScript files: $(find . -name "*.ts" | wc -l)"
echo "CSS files: $(find . -name "*.css" | wc -l)"
echo "SQL files: $(find . -name "*.sql" | wc -l)"
echo "JavaScript files: $(find . -name "*.js" | grep -v node_modules | wc -l)"

echo ""
echo "🔍 Missing Components Check:"
echo "---------------------------"
# Check for critical components
critical_files=(
    "components/Logo.tsx"
    "components/UnifiedSearchBar.tsx"
    "lib/supabase.ts"
    "app/layout.tsx"
    "app/page.tsx"
    "app/dashboard/page.tsx"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ❌ $file (MISSING - Critical)"
    fi
done

echo ""
echo "🔗 Navigation Routes Check:"
echo "---------------------------"
routes=(
    "app/clients/page.tsx"
    "app/services/page.tsx"
    "app/care-staff/page.tsx"
    "app/payroll/page.tsx"
    "app/commissions/page.tsx"
    "app/care-staff-apply/page.tsx"
    "app/care-staff-edit/[staff_id]/page.tsx"
)

for route in "${routes[@]}"; do
    if [ -f "$route" ]; then
        echo "  ✓ $route"
    else
        echo "  ❌ $route (MISSING)"
    fi
done

echo ""
echo "✅ Analysis Complete!"
echo "===================="
echo ""
echo "💡 To check what's different from GitHub:"
echo "   1. Compare the output above with GitHub repo structure"
echo "   2. Look for missing files marked with ❌"
echo "   3. Check if all navigation routes exist"
echo "   4. Verify critical components are present"