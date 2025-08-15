const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read .env.local file manually
let supabaseUrl, supabaseAnonKey
try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const lines = envContent.split('\n')
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1]
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1]
    }
  }
} catch (error) {
  console.log('❌ Error reading .env.local:', error.message)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkDatabase() {
  console.log('🔍 Checking Database Structure...\n')
  
  // Check if care-staff-files bucket exists and is accessible
  console.log('📁 Testing Storage Bucket Access:')
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError)
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name))
      
      // Check if care-staff-files bucket exists
      const careStaffBucket = buckets.find(b => b.name === 'care-staff-files')
      if (careStaffBucket) {
        console.log('✅ care-staff-files bucket found')
        
        // Try to list files in the bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('care-staff-files')
          .list()
        
        if (filesError) {
          console.log('❌ Error accessing bucket contents:', filesError)
        } else {
          console.log('✅ Bucket accessible, files count:', files?.length || 0)
        }
      } else {
        console.log('❌ care-staff-files bucket not found')
      }
    }
  } catch (error) {
    console.log('❌ Storage check failed:', error.message)
  }
  
  console.log('\n🗄️ Testing Database Tables:')
  
  // Check care_staff_profiles table structure
  try {
    const { data, error } = await supabase
      .from('care_staff_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Error accessing care_staff_profiles:', error)
    } else {
      console.log('✅ care_staff_profiles table accessible')
      if (data && data.length > 0) {
        console.log('📋 Sample fields:', Object.keys(data[0]).join(', '))
      }
    }
  } catch (error) {
    console.log('❌ Table check failed:', error.message)
  }
  
  // Check option tables
  try {
    const { data: langOptions, error: langError } = await supabase
      .from('language_options')
      .select('*')
      .limit(5)
    
    if (langError) {
      console.log('❌ Error accessing language_options:', langError)
    } else {
      console.log('✅ language_options table accessible, count:', langOptions?.length || 0)
    }
    
    const { data: jobOptions, error: jobError } = await supabase
      .from('job_position_options')
      .select('*')
      .limit(5)
    
    if (jobError) {
      console.log('❌ Error accessing job_position_options:', jobError)
    } else {
      console.log('✅ job_position_options table accessible, count:', jobOptions?.length || 0)
    }
  } catch (error) {
    console.log('❌ Option tables check failed:', error.message)
  }
  
  console.log('\n🔧 Testing Storage Upload:')
  
  // Test storage upload capability
  try {
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('care-staff-files')
      .upload(`test-${Date.now()}.txt`, testFile)
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError)
    } else {
      console.log('✅ Upload test successful:', uploadData.path)
      
      // Clean up test file
      await supabase.storage
        .from('care-staff-files')
        .remove([uploadData.path])
      console.log('🧹 Test file cleaned up')
    }
  } catch (error) {
    console.log('❌ Upload test failed:', error.message)
  }
}

checkDatabase().catch(console.error)
