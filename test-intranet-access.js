const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

const supabase = createClient(supabaseUrl, anonKey);

async function testIntranetAccess() {
  console.log('Testing intranet customer access...\n');

  try {
    // 1. 測試基本查詢 (類似 CustomerManagementService.getCustomers)
    console.log('1. Testing basic customer query...');
    const { data: basicData, error: basicError, count } = await supabase
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
        voucher_application_status,
        lds_status,
        home_visit_status,
        copay_level
      `, { count: 'exact' })
      .range(0, 19)
      .order('created_at', { ascending: false });

    if (basicError) {
      console.error('   ❌ Basic query error:', basicError);
    } else {
      console.log(`   ✅ Success! Total: ${count}, Returned: ${basicData.length}`);
      if (basicData.length > 0) {
        console.log(`   Sample: ${basicData[0].customer_name} (${basicData[0].customer_id})`);
      }
    }

    // 2. 測試搜尋功能
    console.log('\n2. Testing search functionality...');
    const { data: searchData, error: searchError } = await supabase
      .from('customer_personal_data')
      .select('customer_name, customer_id, phone')
      .or('customer_name.ilike.%劉%,phone.ilike.%9879%,customer_id.ilike.%MC%')
      .limit(5);

    if (searchError) {
      console.error('   ❌ Search error:', searchError);
    } else {
      console.log(`   ✅ Search success! Found ${searchData.length} results`);
      searchData.forEach(customer => {
        console.log(`   - ${customer.customer_name} (${customer.customer_id}) - ${customer.phone}`);
      });
    }

    // 3. 測試認證狀態
    console.log('\n3. Testing auth status...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('   ⚠️ No authenticated user (expected for anonymous access)');
    } else {
      console.log('   ✅ Authenticated user:', authData.user?.email || 'Anonymous');
    }

    // 4. 測試篩選功能
    console.log('\n4. Testing filter functionality...');
    const { data: filterData, error: filterError } = await supabase
      .from('customer_personal_data')
      .select('customer_name, customer_type, district')
      .eq('customer_type', '明家街客')
      .limit(3);

    if (filterError) {
      console.error('   ❌ Filter error:', filterError);
    } else {
      console.log(`   ✅ Filter success! Found ${filterData.length} "明家街客"`);
    }

  } catch (error) {
    console.error('Exception during testing:', error);
  }
}

testIntranetAccess();
