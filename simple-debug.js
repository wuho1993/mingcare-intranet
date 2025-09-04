const { createClient } = require('@supabase/supabase-js');

console.log('Starting debug...');

// 手動設定環境變數
const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

console.log('Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomers() {
  try {
    console.log('Testing customer data...');
    
    // 測試基本查詢
    const { data, error, count } = await supabase
      .from('customer_personal_data')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`Found ${count} customers total`);
      console.log(`Returned ${data.length} customers`);
      if (data.length > 0) {
        console.log('Sample customer:', data[0]);
      }
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testCustomers();
