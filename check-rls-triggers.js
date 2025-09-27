const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('🔒 CHECKING RLS POLICIES');
  console.log('========================\n');
  
  const tables = [
    'auth_user_bridge',
    'billing_salary_data', 
    'care_staff_profiles',
    'clock_records',
    'commission_rate_introducer',
    'customer_personal_data',
    'job_position_options',
    'language_options',
    'service_signatures',
    'signature_files',
    'voucher_rate'
  ];
  
  for (const table of tables) {
    try {
      // Try to query the table with anon key to see RLS status
      const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I');
      
      const { data, error } = await anonSupabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        if (error.code === '42501') {
          console.log(`🔒 ${table}: RLS ENABLED (access denied)`);
        } else if (error.code === 'PGRST116') {
          console.log(`❓ ${table}: Table not found or no access`);
        } else {
          console.log(`🔒 ${table}: RLS LIKELY ENABLED (${error.message})`);
        }
      } else {
        console.log(`🔓 ${table}: RLS DISABLED or PUBLIC ACCESS (${data ? data.length : 0} records accessible)`);
      }
      
    } catch (err) {
      console.log(`❌ ${table}: Error checking RLS - ${err.message}`);
    }
  }
}

async function checkTriggers() {
  console.log('\n⚡ CHECKING TRIGGERS');
  console.log('====================\n');
  
  try {
    // Check for common trigger patterns
    const tables = ['billing_salary_data', 'care_staff_profiles', 'customer_personal_data', 'voucher_rate'];
    
    for (const table of tables) {
      // Check if updated_at is automatically updated
      console.log(`⚡ ${table}: Checking for auto-update triggers...`);
      
      try {
        const { data: sample } = await supabase
          .from(table)
          .select('created_at, updated_at')
          .limit(1);
          
        if (sample && sample[0] && sample[0].updated_at) {
          console.log(`  ✅ Has updated_at field (likely has auto-update trigger)`);
        } else if (sample && sample[0]) {
          console.log(`  ⚪ No updated_at field`);
        }
      } catch (e) {
        console.log(`  ❌ Cannot check: ${e.message}`);
      }
    }
    
    // Check for staff_id auto-generation
    console.log(`⚡ care_staff_profiles: Checking for staff_id auto-generation...`);
    try {
      const { data } = await supabase
        .from('care_staff_profiles')
        .select('staff_id')
        .like('staff_id', 'MC-%')
        .limit(3);
        
      if (data && data.length > 0) {
        console.log(`  ✅ Found auto-generated staff_id pattern: ${data.map(r => r.staff_id).join(', ')}`);
      }
    } catch (e) {
      console.log(`  ❌ Cannot check staff_id pattern: ${e.message}`);
    }
    
    // Check for age calculation from dob
    console.log(`⚡ customer_personal_data: Checking for age auto-calculation...`);
    try {
      const { data } = await supabase
        .from('customer_personal_data')
        .select('dob, age')
        .not('dob', 'is', null)
        .not('age', 'is', null)
        .limit(3);
        
      if (data && data.length > 0) {
        console.log(`  ✅ Found records with both dob and age (likely has age calculation trigger)`);
        data.forEach(record => {
          if (record.dob && record.age) {
            const birthYear = new Date(record.dob).getFullYear();
            const currentYear = new Date().getFullYear();
            const calculatedAge = currentYear - birthYear;
            console.log(`    DOB: ${record.dob}, Age: ${record.age}, Calculated: ${calculatedAge}`);
          }
        });
      } else {
        console.log(`  ⚪ No records with both dob and age found`);
      }
    } catch (e) {
      console.log(`  ❌ Cannot check age calculation: ${e.message}`);
    }
    
  } catch (err) {
    console.log(`❌ Error checking triggers: ${err.message}`);
  }
}

async function main() {
  await checkRLS();
  await checkTriggers();
  console.log('\n✅ RLS and Trigger check complete!');
}

main().catch(console.error);