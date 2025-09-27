const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

async function deepTestVoucherRate() {
  console.log('🔍 深度測試 voucher_rate RLS 行為');
  console.log('=====================================\n');

  const client = createClient(supabaseUrl, anonKey);
  
  // 測試1: 基本查詢
  console.log('1️⃣ 基本查詢測試');
  try {
    const { data, error, count } = await client
      .from('voucher_rate')
      .select('*', { count: 'exact' });
    
    console.log('Data:', data);
    console.log('Count:', count);
    console.log('Error:', error);
  } catch (err) {
    console.log('❌ 基本查詢錯誤:', err.message);
  }

  // 測試2: 檢查 RLS 狀態
  console.log('\n2️⃣ 檢查 RLS 狀態');
  try {
    const { data, error } = await client.rpc('check_table_rls', {
      table_name: 'voucher_rate'
    });
    console.log('RLS 狀態:', data, error);
  } catch (err) {
    console.log('RLS 檢查錯誤:', err.message);
  }

  // 測試3: 模擬內聯網的實際查詢
  console.log('\n3️⃣ 模擬內聯網查詢 (fetchVoucherRates)');
  try {
    const fetchVoucherRates = async () => {
      const { data, error } = await client
        .from('voucher_rate')
        .select('*');
      
      if (error) throw error;
      return data;
    };
    
    const rates = await fetchVoucherRates();
    console.log('✅ fetchVoucherRates 成功');
    console.log('返回記錄數:', rates?.length || 0);
    
    if (rates && rates.length > 0) {
      console.log('首筆記錄:', rates[0]);
    }
  } catch (err) {
    console.log('❌ fetchVoucherRates 失敗:', err.message);
    console.log('🚨 內聯網會受影響！');
  }

  // 測試4: 檢查用戶角色
  console.log('\n4️⃣ 檢查當前用戶角色');
  try {
    const { data: { user } } = await client.auth.getUser();
    console.log('當前用戶:', user ? user.role : 'null (匿名)');
  } catch (err) {
    console.log('用戶檢查錯誤:', err.message);
  }
}

deepTestVoucherRate().catch(console.error);