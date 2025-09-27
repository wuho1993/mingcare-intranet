const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';

// 測試兩種不同的 key
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

async function testVoucherRateAccess() {
  console.log('🧪 測試 voucher_rate 表的 RLS 權限');
  console.log('=====================================\n');

  // 測試 1: 匿名 key (內聯網使用的)
  console.log('1️⃣ 測試匿名 key (內聯網實際使用的)');
  const anonClient = createClient(supabaseUrl, anonKey);
  
  try {
    const { data, error } = await anonClient
      .from('voucher_rate')
      .select('service_type, service_rate')
      .limit(3);
    
    if (error) {
      console.log('❌ 匿名用戶無法讀取 voucher_rate');
      console.log('錯誤:', error.message);
      console.log('⚠️  內聯網會受影響！');
    } else {
      console.log('✅ 匿名用戶可以讀取 voucher_rate');
      console.log('結果:', data);
      console.log('✅ 內聯網不受影響');
    }
  } catch (err) {
    console.log('❌ 測試錯誤:', err.message);
  }
  
  console.log('\n2️⃣ 測試 service role key (管理員)');
  const serviceClient = createClient(supabaseUrl, serviceKey);
  
  try {
    const { data, error } = await serviceClient
      .from('voucher_rate')
      .select('service_type, service_rate')
      .limit(3);
    
    if (error) {
      console.log('❌ Service role 無法讀取:', error.message);
    } else {
      console.log('✅ Service role 可以讀取');
      console.log('結果數量:', data.length);
    }
  } catch (err) {
    console.log('❌ Service role 測試錯誤:', err.message);
  }
}

testVoucherRateAccess().catch(console.error);