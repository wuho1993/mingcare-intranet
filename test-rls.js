const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
// 使用 service role key 來繞過 RLS
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

console.log('Testing with service role key...');
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function testWithServiceRole() {
  try {
    console.log('Checking with admin privileges...');
    
    const { data, error, count } = await supabaseAdmin
      .from('customer_personal_data')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('Admin Error:', error);
    } else {
      console.log(`Admin found ${count} customers total`);
      console.log(`Admin returned ${data.length} customers`);
      if (data.length > 0) {
        console.log('Sample customer:', data[0]);
      }
    }

    // 檢查表結構
    console.log('\nChecking table structure...');
    const { data: structure, error: structError } = await supabaseAdmin
      .from('customer_personal_data')
      .select('*')
      .limit(0);
    
    if (structError) {
      console.error('Structure error:', structError);
    } else {
      console.log('Table exists and is accessible');
    }

    // 嘗試插入一個測試客戶
    console.log('\nTrying to insert a test customer...');
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('customer_personal_data')
      .insert({
        customer_name: '測試客戶',
        phone: '0912345678',
        district: '中西區',
        service_address: '台北市中正區測試路123號',
        project_manager: '測試專員',
        customer_type: '明家街客',
        voucher_application_status: '無申請',
        lds_status: '無評估',
        home_visit_status: '無評估',
        copay_level: '無資訊'
      })
      .select();
    
    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Test customer inserted successfully:', insertData);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

testWithServiceRole();
