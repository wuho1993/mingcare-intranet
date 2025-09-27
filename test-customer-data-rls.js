const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

async function testCustomerDataAccess() {
  console.log('🧪 測試 customer_personal_data 表的 RLS 權限');
  console.log('==========================================\n');

  const client = createClient(supabaseUrl, anonKey);
  
  console.log('1️⃣ 測試基本查詢 customer_personal_data');
  try {
    const { data, error, count } = await client
      .from('customer_personal_data')
      .select('customer_name, phone, service_address', { count: 'exact' })
      .limit(3);
    
    if (error) {
      console.log('❌ 匿名用戶無法讀取 customer_personal_data');
      console.log('錯誤:', error.message);
      console.log('錯誤詳情:', error);
      console.log('🚨 內聯網客戶管理功能會完全失效！');
    } else {
      console.log('✅ 匿名用戶可以讀取 customer_personal_data');
      console.log('總記錄數:', count);
      console.log('返回記錄:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('首筆記錄:', data[0]);
      }
    }
  } catch (err) {
    console.log('❌ 測試錯誤:', err.message);
  }

  console.log('\n2️⃣ 測試寫入操作（應該被拒絕）');
  try {
    const { error } = await client
      .from('customer_personal_data')
      .insert({
        customer_name: 'Test Customer',
        service_address: 'Test Address',
        customer_type: '社區券客戶'
      });
    
    if (error) {
      console.log('✅ 正確拒絕匿名用戶寫入:', error.message);
    } else {
      console.log('⚠️ 匿名用戶可以寫入數據（可能的安全問題）');
    }
  } catch (err) {
    console.log('✅ 寫入被正確阻止:', err.message);
  }
}

testCustomerDataAccess().catch(console.error);