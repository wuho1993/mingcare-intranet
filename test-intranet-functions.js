const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

async function testIntranetFunctions() {
  console.log('🧪 測試內聯網客戶管理功能');
  console.log('============================\n');

  const client = createClient(supabaseUrl, anonKey);
  
  // 測試1: 客戶搜尋功能
  console.log('1️⃣ 測試客戶搜尋（按姓名）');
  try {
    const { data, error } = await client
      .from('customer_personal_data')
      .select('customer_id, customer_name, phone, service_address, district, customer_type')
      .ilike('customer_name', '%劉%')
      .limit(5);
    
    if (error) {
      console.log('❌ 客戶搜尋失敗:', error.message);
    } else {
      console.log(`✅ 找到 ${data.length} 筆匹配記錄`);
      if (data.length > 0) {
        console.log('範例記錄:', data[0]);
      }
    }
  } catch (err) {
    console.log('❌ 搜尋錯誤:', err.message);
  }

  // 測試2: 按地區篩選
  console.log('\n2️⃣ 測試地區篩選');
  try {
    const { data, error } = await client
      .from('customer_personal_data')
      .select('customer_name, district, customer_type')
      .eq('district', '九龍城區')
      .limit(3);
    
    if (error) {
      console.log('❌ 地區篩選失敗:', error.message);
    } else {
      console.log(`✅ 九龍城區客戶: ${data.length} 筆`);
    }
  } catch (err) {
    console.log('❌ 篩選錯誤:', err.message);
  }

  // 測試3: 客戶類型統計
  console.log('\n3️⃣ 測試客戶類型統計');
  try {
    const { data, error } = await client
      .from('customer_personal_data')
      .select('customer_type')
      .not('customer_type', 'is', null);
    
    if (error) {
      console.log('❌ 統計查詢失敗:', error.message);
    } else {
      // 簡單統計
      const stats = {};
      data.forEach(item => {
        stats[item.customer_type] = (stats[item.customer_type] || 0) + 1;
      });
      console.log('✅ 客戶類型統計:', stats);
    }
  } catch (err) {
    console.log('❌ 統計錯誤:', err.message);
  }

  // 測試4: 確認無法寫入
  console.log('\n4️⃣ 確認安全性（寫入測試）');
  try {
    const { error } = await client
      .from('customer_personal_data')
      .insert({
        customer_name: 'Security Test',
        service_address: 'Test Address',
        customer_type: '社區券客戶'
      });
    
    if (error) {
      console.log('✅ 安全保護正常，匿名用戶無法寫入:', error.message.substring(0, 50) + '...');
    } else {
      console.log('⚠️ 安全風險：匿名用戶仍可寫入');
    }
  } catch (err) {
    console.log('✅ 寫入被正確阻止:', err.message.substring(0, 50) + '...');
  }
}

testIntranetFunctions().catch(console.error);