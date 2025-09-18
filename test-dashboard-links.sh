#!/bin/bash
echo "🔍 Testing All Dashboard Links"
echo "=============================="

echo ""
echo "Testing main routes..."

routes=(
  "/"
  "/dashboard"
  "/clients"
  "/services" 
  "/care-staff"
  "/payroll"
  "/commissions"
  "/care-staff-apply"
  "/salary-calculator"
)

for route in "${routes[@]}"; do
  echo -n "Testing $route ... "
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$route)
  if [ $status -eq 200 ]; then
    echo "✅ OK ($status)"
  else
    echo "❌ FAILED ($status)"
  fi
done

echo ""
echo "🎯 Dashboard Link Test Complete!"