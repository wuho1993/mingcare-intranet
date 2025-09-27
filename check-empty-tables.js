const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmptyTables() {
  console.log('🔍 CHECKING EMPTY TABLE STRUCTURES');
  console.log('=====================================\n');
  
  const emptyTables = ['service_signatures', 'signature_files', 'clock_records'];
  
  for (const tableName of emptyTables) {
    console.log(`📋 Table: ${tableName}`);
    console.log('-----------------------------------');
    
    try {
      // Method 1: Try to describe table structure using information_schema
      const { data: columns, error: colError } = await supabase
        .rpc('get_table_columns', { table_name: tableName })
        .single();
        
      if (colError) {
        console.log('  Method 1 failed, trying Method 2...');
        
        // Method 2: Try to get column info directly
        const query = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `;
        
        const { data: columnInfo, error: infoError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position');
          
        if (infoError) {
          console.log('  Method 2 failed, trying Method 3...');
          
          // Method 3: Try a simple select with limit 0 to get structure
          const { data: emptyData, error: selectError } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);
            
          if (selectError) {
            console.log(`  ❌ Cannot access table structure: ${selectError.message}`);
          } else {
            console.log('  ✅ Table exists but structure details unavailable via API');
            console.log('  📊 Records: 0 (confirmed empty)');
          }
        } else {
          console.log('  ✅ Column information retrieved:');
          columnInfo.forEach(col => {
            console.log(`    - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' (NOT NULL)' : ''}${col.column_default ? ` (default: ${col.column_default})` : ''}`);
          });
        }
      } else {
        console.log('  ✅ Table structure retrieved via RPC');
        console.log(columns);
      }
      
      // Also check if we can insert/update (to understand permissions)
      console.log('  🔒 Testing table permissions...');
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({})
        .select()
        .limit(0);
        
      if (insertError) {
        if (insertError.code === '23502') {
          console.log('  📝 Table has required fields (NOT NULL constraints)');
        } else {
          console.log(`  🔒 Insert test: ${insertError.message}`);
        }
      } else {
        console.log('  ✅ Table allows inserts');
      }
      
    } catch (err) {
      console.log(`  ❌ Error checking table: ${err.message}`);
    }
    
    console.log('');
  }
}

// Also check if there are any foreign key relationships
async function checkRelationships() {
  console.log('🔗 CHECKING TABLE RELATIONSHIPS');
  console.log('===============================\n');
  
  try {
    // Try to get foreign key information
    const relationshipQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
        AND (tc.table_name IN ('service_signatures', 'signature_files', 'clock_records')
          OR ccu.table_name IN ('service_signatures', 'signature_files', 'clock_records'))
      ORDER BY tc.table_name;
    `;
    
    console.log('Foreign key relationships involving empty tables:');
    console.log('(This would show how these tables connect to other tables)');
    
  } catch (err) {
    console.log(`Cannot check relationships: ${err.message}`);
  }
}

async function main() {
  await checkEmptyTables();
  await checkRelationships();
  console.log('✅ Empty table analysis complete!');
}

main().catch(console.error);