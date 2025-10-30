const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function checkSchema() {
  console.log('=== 檢查 customer_personal_data 表結構 ===\n');
  
  // 嘗試獲取一筆記錄看看所有欄位
  const { data, error } = await supabase
    .from('customer_personal_data')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ 查詢錯誤:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✅ 表存在，欄位列表:');
    const fields = Object.keys(data[0]);
    fields.forEach(field => {
      console.log(`  - ${field}: ${typeof data[0][field]} = ${JSON.stringify(data[0][field])}`);
    });
    console.log(`\n總共 ${fields.length} 個欄位`);
  } else {
    console.log('⚠️ 表存在但沒有資料');
  }
  
  // 檢查是否有 updated_at 欄位
  console.log('\n=== 測試查詢 updated_at 欄位 ===');
  const { data: testData, error: testError } = await supabase
    .from('customer_personal_data')
    .select('id, customer_name, updated_at')
    .limit(1);
  
  if (testError) {
    console.error('❌ updated_at 欄位查詢失敗:', testError.message);
  } else {
    console.log('✅ updated_at 欄位存在');
    if (testData && testData.length > 0) {
      console.log('   範例值:', testData[0].updated_at);
    }
  }
  
  // 測試完整查詢（和前端一樣的查詢）
  console.log('\n=== 測試完整查詢 ===');
  const { data: fullData, error: fullError } = await supabase
    .from('customer_personal_data')
    .select(`
      id,
      customer_id,
      customer_name,
      phone,
      district,
      service_address,
      project_manager,
      created_at,
      customer_type,
      introducer,
      voucher_application_status,
      lds_status,
      home_visit_status,
      copay_level
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 19);
  
  if (fullError) {
    console.error('❌ 完整查詢失敗:', {
      message: fullError.message,
      details: fullError.details,
      hint: fullError.hint,
      code: fullError.code
    });
  } else {
    console.log(`✅ 完整查詢成功，返回 ${fullData?.length || 0} 筆記錄`);
  }
}

checkSchema();
