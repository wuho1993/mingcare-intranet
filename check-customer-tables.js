const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function checkCustomerTables() {
  console.log('=== 檢查客戶相關表 ===');
  
  const possibleTables = ['customers', 'customer', 'customer_data', 'clients', 'client_data'];
  
  for (const table of possibleTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`✅ 找到表: ${table}, 記錄數: ${count}`);
      } else {
        console.log(`❌ 表 ${table} 不存在或無權限`);
      }
    } catch (e) {
      console.log(`❌ 表 ${table} 查詢失敗`);
    }
  }
  
  console.log('\n=== 從billing_salary_data獲取客戶信息 ===');
  const { data, error } = await supabase
    .from('billing_salary_data')
    .select('customer_id, customer_name, phone');
  
  if (error) {
    console.error('查詢錯誤:', error);
    return;
  }
  
  if (data) {
    // 獲取唯一客戶
    const uniqueCustomers = new Map();
    data.forEach(record => {
      if (record.customer_id && !uniqueCustomers.has(record.customer_id)) {
        uniqueCustomers.set(record.customer_id, {
          id: record.customer_id,
          name: record.customer_name,
          phone: record.phone
        });
      }
    });
    
    console.log(`從服務記錄中找到的唯一客戶數: ${uniqueCustomers.size}`);
    console.log('前5位客戶:');
    Array.from(uniqueCustomers.values()).slice(0, 5).forEach((customer, index) => {
      console.log(`${index + 1}. ID: ${customer.id}, 姓名: ${customer.name}, 電話: ${customer.phone}`);
    });
  }
}

checkCustomerTables().catch(console.error);
