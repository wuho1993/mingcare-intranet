const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTUzOTE3MSwiZXhwIjoyMDE1MTE5MTcxfQ.sLPeAmHJK20QAhJj7k86wCNgz1Zl5VXr5KtwxXWkAQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getFullDatabaseStructure() {
  console.log('🔍 完整資料庫結構檢查');
  console.log('========================');
  
  try {
    // Get table info
    const { data: tables } = await supabase.rpc('get_table_info');
    console.log('📋 所有表格:', tables);
    
    // Get billing_salary_data structure
    const { data: billingSalary } = await supabase
      .from('billing_salary_data')
      .select('*')
      .limit(1);
    console.log('\n📊 billing_salary_data 結構 (範例記錄):', billingSalary?.[0]);
    
    // Get customer_personal_data structure
    const { data: customerData } = await supabase
      .from('customer_personal_data')
      .select('*')
      .limit(1);
    console.log('\n📊 customer_personal_data 結構 (範例記錄):', customerData?.[0]);
    
    // Get care_staff_profiles structure
    const { data: careStaff } = await supabase
      .from('care_staff_profiles')
      .select('*')
      .limit(1);
    console.log('\n📊 care_staff_profiles 結構 (範例記錄):', careStaff?.[0]);
    
    // Check for additional tables
    const { data: vouchers } = await supabase
      .from('voucher_rate')
      .select('*')
      .limit(1);
    if (vouchers) {
      console.log('\n📊 voucher_rate 結構 (範例記錄):', vouchers?.[0]);
    }
    
    const { data: commissions } = await supabase
      .from('commission_rate_introducer')
      .select('*')
      .limit(1);
    if (commissions) {
      console.log('\n📊 commission_rate_introducer 結構 (範例記錄):', commissions?.[0]);
    }
    
    // Check for options tables
    const { data: jobOptions } = await supabase
      .from('job_position_options')
      .select('*')
      .limit(5);
    if (jobOptions) {
      console.log('\n📊 job_position_options 結構:', jobOptions);
    }
    
    const { data: languageOptions } = await supabase
      .from('language_options')
      .select('*')
      .limit(5);
    if (languageOptions) {
      console.log('\n📊 language_options 結構:', languageOptions);
    }
    
    // Get record counts
    const { count: billingCount } = await supabase
      .from('billing_salary_data')
      .select('*', { count: 'exact', head: true });
    console.log('\n📈 記錄統計:');
    console.log('  - billing_salary_data:', billingCount, '筆記錄');
    
    const { count: customerCount } = await supabase
      .from('customer_personal_data')
      .select('*', { count: 'exact', head: true });
    console.log('  - customer_personal_data:', customerCount, '筆記錄');
    
    const { count: staffCount } = await supabase
      .from('care_staff_profiles')
      .select('*', { count: 'exact', head: true });
    console.log('  - care_staff_profiles:', staffCount, '筆記錄');
    
  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

getFullDatabaseStructure();