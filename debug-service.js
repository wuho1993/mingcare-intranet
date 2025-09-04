// Debug version of CustomerManagementService.getCustomers
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

const supabase = createClient(supabaseUrl, anonKey);

async function debugCustomerService() {
  console.log('🔍 Debug: CustomerManagementService.getCustomers simulation\n');
  
  try {
    // 完全複製 CustomerManagementService.getCustomers 的邏輯
    const filters = {};
    const page = 1;
    const pageSize = 20;
    
    console.log('Building query...');
    let query = supabase
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
      `, { count: 'exact' });

    console.log('Adding filters...');
    // 符合 API 規格的篩選條件
    if (filters?.customer_type) {
      query = query.eq('customer_type', filters.customer_type);
    }
    if (filters?.district) {
      query = query.eq('district', filters.district);
    }
    if (filters?.introducer) {
      query = query.eq('introducer', filters.introducer);
    }
    if (filters?.project_manager) {
      query = query.eq('project_manager', filters.project_manager);
    }
    if (filters?.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,customer_id.ilike.%${filters.search}%`);
    }

    console.log('Adding pagination...');
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    console.log('Adding sorting...');
    query = query.order('created_at', { ascending: false });

    console.log('Executing query...');
    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Query error:', error);
      throw error;
    }

    console.log('✅ Query success!');
    console.log(`   Total count: ${count}`);
    console.log(`   Returned data: ${data?.length || 0} items`);
    
    if (data && data.length > 0) {
      console.log('   Sample data:');
      console.log(`   - ${data[0].customer_name} (${data[0].customer_id})`);
      console.log(`   - Phone: ${data[0].phone}`);
      console.log(`   - District: ${data[0].district}`);
    }

    const result = {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };

    console.log('\n📋 Final result structure:');
    console.log(JSON.stringify(result, null, 2));

    return result;

  } catch (error) {
    console.error('💥 Service error:', error);
    console.log('\n🔄 Returning empty result due to error');
    return {
      data: [],
      count: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0
    };
  }
}

debugCustomerService();
