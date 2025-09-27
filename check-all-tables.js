const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  console.log('🔍 Checking All Tables in Database');
  console.log('====================================\n');
  
  // List of tables I see in your screenshot
  const tablesToCheck = [
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
  
  for (const tableName of tablesToCheck) {
    try {
      console.log(`📊 TABLE: ${tableName}`);
      console.log('=' + '='.repeat(tableName.length + 8));
      
      // Get sample record to understand structure
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error && error.code !== 'PGRST116') {
        console.log(`❌ Error accessing ${tableName}:`, error.message);
        console.log('');
        continue;
      }
      
      console.log(`📈 Records: ${count || 0}`);
      
      if (data && data.length > 0) {
        console.log('🏗️  Structure (from sample):');
        const sample = data[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          let type = typeof value;
          if (value === null) type = 'null';
          else if (Array.isArray(value)) type = 'array';
          else if (value instanceof Date) type = 'date';
          console.log(`  - ${key}: ${type} = ${JSON.stringify(value)}`);
        });
      } else {
        console.log('🏗️  No sample data available');
        
        // Try to get column info from information_schema
        try {
          const { data: columns } = await supabase
            .rpc('get_table_columns', { table_name: tableName });
          if (columns) {
            console.log('🏗️  Columns from schema:');
            columns.forEach(col => {
              console.log(`  - ${col.column_name}: ${col.data_type}`);
            });
          }
        } catch (e) {
          console.log('  (Unable to get column info)');
        }
      }
      
      console.log('');
    } catch (err) {
      console.log(`❌ Failed to check ${tableName}:`, err.message);
      console.log('');
    }
  }
}

async function checkEnums() {
  console.log('🏷️  CHECKING ENUM TYPES');
  console.log('========================\n');
  
  try {
    // Get all enum types
    const { data } = await supabase
      .rpc('get_enum_types');
      
    if (data) {
      data.forEach(enumInfo => {
        console.log(`${enumInfo.type_name} = { ${enumInfo.values.join(', ')} }`);
      });
    } else {
      console.log('Using fallback method to check enums...');
      
      // Fallback - check common enum fields from sample data
      const enumFields = [
        { table: 'customer_personal_data', field: 'customer_type' },
        { table: 'customer_personal_data', field: 'district' },
        { table: 'customer_personal_data', field: 'health_status' },
        { table: 'customer_personal_data', field: 'introducer' },
        { table: 'billing_salary_data', field: 'service_type' },
        { table: 'billing_salary_data', field: 'project_category' },
        { table: 'billing_salary_data', field: 'project_manager' },
        { table: 'care_staff_profiles', field: 'gender' },
        { table: 'care_staff_profiles', field: 'preferred_area' },
      ];
      
      for (const { table, field } of enumFields) {
        try {
          const { data } = await supabase
            .from(table)
            .select(field)
            .not(field, 'is', null)
            .limit(20);
            
          if (data) {
            const uniqueValues = [...new Set(data.map(row => row[field]))];
            if (uniqueValues.length > 0) {
              console.log(`${field}_enum = { ${uniqueValues.join(', ')} }`);
            }
          }
        } catch (e) {
          // Skip if table/field doesn't exist
        }
      }
    }
  } catch (err) {
    console.log('❌ Error getting enum types:', err.message);
  }
}

async function main() {
  await checkAllTables();
  await checkEnums();
  console.log('✅ Database structure check complete!');
}

main().catch(console.error);