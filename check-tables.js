const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Checking available tables...');
  
  // 檢查可能的客戶相關表
  const tablesToCheck = [
    'customer_personal_data',
    'customers',
    'client_data',
    'customer_data',
    'personal_data',
    'customer_info'
  ];
  
  for (const table of tablesToCheck) {
    try {
      console.log(`\nChecking table: ${table}`);
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Found! Count: ${count}`);
        if (data && data.length > 0) {
          console.log(`  Sample columns:`, Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
  }
}

checkTables();
