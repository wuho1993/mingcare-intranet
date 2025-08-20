const { createClient } = require('@supabase/supabase-js')

// 使用你的 Supabase 配置
const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStorage() {
  console.log('🔍 檢查 Supabase Storage 狀態...\n')
  
  try {
    // 1. 列出所有 buckets
    console.log('1️⃣ 檢查現有 buckets:')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ 獲取 buckets 失敗:', bucketsError)
      return
    }
    
    console.log('📁 現有 buckets:', buckets.map(b => b.name))
    
    // 2. 檢查是否有 staff-files bucket
    const staffFilesBucket = buckets.find(bucket => bucket.name === 'staff-files')
    
    if (!staffFilesBucket) {
      console.log('\n⚠️  找不到 "staff-files" bucket，正在創建...')
      
      // 創建 staff-files bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('staff-files', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (createError) {
        console.error('❌ 創建 bucket 失敗:', createError)
        
        // 嘗試使用 care-staff-files 名稱
        console.log('\n🔄 嘗試創建 "care-staff-files" bucket...')
        const { data: altBucket, error: altCreateError } = await supabase.storage.createBucket('care-staff-files', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
          fileSizeLimit: 10485760 // 10MB
        })
        
        if (altCreateError) {
          console.error('❌ 創建備用 bucket 也失敗:', altCreateError)
        } else {
          console.log('✅ 成功創建 "care-staff-files" bucket!')
        }
      } else {
        console.log('✅ 成功創建 "staff-files" bucket!')
      }
    } else {
      console.log('✅ "staff-files" bucket 已存在')
    }
    
    // 3. 重新檢查所有 buckets
    console.log('\n2️⃣ 重新檢查所有 buckets:')
    const { data: updatedBuckets, error: updatedError } = await supabase.storage.listBuckets()
    
    if (updatedError) {
      console.error('❌ 重新獲取 buckets 失敗:', updatedError)
    } else {
      console.log('📁 更新後的 buckets:', updatedBuckets.map(b => `${b.name} (public: ${b.public})`))
    }
    
    // 4. 測試 care_staff_profiles 表
    console.log('\n3️⃣ 檢查 care_staff_profiles 表:')
    const { data: staffData, error: staffError } = await supabase
      .from('care_staff_profiles')
      .select('staff_id, full_name')
      .limit(3)
    
    if (staffError) {
      console.error('❌ 查詢員工資料失敗:', staffError)
    } else {
      console.log('👥 員工資料樣本:', staffData)
    }
    
  } catch (error) {
    console.error('❌ 檢查過程發生錯誤:', error)
  }
}

checkStorage()
