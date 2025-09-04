const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function checkRLS() {
  try {
    console.log('Checking RLS policies...');
    
    // 查詢 RLS 政策
    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'customer_personal_data');
    
    if (policyError) {
      console.error('Policy check error:', policyError);
    } else {
      console.log('RLS Policies found:', policies?.length || 0);
      if (policies && policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`\nPolicy ${index + 1}:`);
          console.log(`  Name: ${policy.policyname}`);
          console.log(`  Command: ${policy.cmd}`);
          console.log(`  Roles: ${policy.roles}`);
          console.log(`  Using: ${policy.using}`);
          console.log(`  Check: ${policy.check}`);
        });
      }
    }

    // 檢查表的 RLS 狀態
    console.log('\nChecking RLS status...');
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'customer_personal_data');
    
    if (tableError) {
      console.error('Table info error:', tableError);
    } else {
      console.log('Table RLS status:', tableInfo);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

checkRLS();
