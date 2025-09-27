const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOptionTables() {
  console.log('🏷️  CHECKING OPTION TABLES COMPLETE LIST');
  console.log('==========================================\n');
  
  // Check job_position_options
  console.log('📋 JOB POSITION OPTIONS:');
  console.log('-------------------------');
  const { data: jobPositions } = await supabase
    .from('job_position_options')
    .select('*')
    .order('id');
    
  if (jobPositions) {
    jobPositions.forEach(job => {
      console.log(`| ${job.id.toString().padEnd(2)} | ${job.label} |`);
    });
  }
  
  console.log('\n📋 LANGUAGE OPTIONS:');
  console.log('---------------------');
  const { data: languages } = await supabase
    .from('language_options')
    .select('*')
    .order('id');
    
  if (languages) {
    languages.forEach(lang => {
      console.log(`| ${lang.id.toString().padEnd(2)} | ${lang.label} |`);
    });
  }
}

async function checkEmptyTableStructures() {
  console.log('\n🔍 CHECKING EMPTY TABLE STRUCTURES');
  console.log('===================================\n');
  
  const emptyTables = ['service_signatures', 'signature_files', 'clock_records'];
  
  for (const tableName of emptyTables) {
    console.log(`📋 TABLE: ${tableName}`);
    console.log('-------------------------');
    
    try {
      // Try to insert empty record to see required fields
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({})
        .select();
        
      if (insertError && insertError.code === '23502') {
        console.log(`❗ Required fields (NOT NULL): ${insertError.message}`);
        
        // Extract column name from error
        const match = insertError.message.match(/column "([^"]+)"/);
        if (match) {
          console.log(`❗ Missing required column: ${match[1]}`);
        }
      } else if (insertError) {
        console.log(`🔒 Error: ${insertError.message}`);
      } else {
        console.log('✅ No required fields, accepts empty records');
      }
      
      // Try to select structure
      const { error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (selectError) {
        console.log(`❌ Cannot query table: ${selectError.message}`);
      } else {
        console.log('✅ Table accessible, awaiting data');
      }
      
    } catch (err) {
      console.log(`❌ Error checking ${tableName}: ${err.message}`);
    }
    console.log('');
  }
}

async function main() {
  await checkOptionTables();
  await checkEmptyTableStructures();
}

main().catch(console.error);