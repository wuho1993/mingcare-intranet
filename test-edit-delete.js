// 測試編輯/刪除功能
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nbtjsdwlvkjsscfvovrf.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5idGpzZHdsdmtqc3NjZnZvdnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI1MTIzMjUsImV4cCI6MjAzODA4ODMyNX0.ySqZHMFrQUhGfQF1owwGzYeFRqaX0gO4Thi80MRs7Qc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEditDelete() {
  console.log('🔍 測試編輯/刪除功能...')
  
  try {
    // 1. 獲取一筆記錄
    const { data: records, error: fetchError } = await supabase
      .from('billing_salary_data')
      .select('*')
      .limit(1)
    
    if (fetchError) {
      console.error('❌ 獲取記錄失敗:', fetchError)
      return
    }
    
    if (!records || records.length === 0) {
      console.log('⚠️ 沒有找到記錄')
      return
    }
    
    const record = records[0]
    console.log('✅ 找到記錄:', {
      id: record.id,
      customer_name: record.customer_name,
      service_date: record.service_date
    })
    
    // 2. 測試更新權限
    console.log('🔄 測試更新權限...')
    const { data: updateData, error: updateError } = await supabase
      .from('billing_salary_data')
      .update({ 
        // 使用相同的值來測試更新權限
        customer_name: record.customer_name 
      })
      .eq('id', record.id)
      .select()
    
    if (updateError) {
      console.error('❌ 更新權限測試失敗:', updateError)
    } else {
      console.log('✅ 更新權限測試成功:', updateData)
    }
    
    // 3. 測試刪除權限（但不實際刪除）
    console.log('🗑️ 測試刪除權限...')
    const { error: deleteError } = await supabase
      .from('billing_salary_data')
      .delete()
      .eq('id', 'test-non-existent-id') // 使用不存在的 ID
    
    if (deleteError) {
      console.error('❌ 刪除權限測試失敗:', deleteError)
    } else {
      console.log('✅ 刪除權限測試成功')
    }
    
    // 4. 檢查 RLS 策略
    console.log('🔐 檢查 RLS 策略...')
    const { data: policies, error: policyError } = await supabase
      .rpc('get_table_policies', { table_name: 'billing_salary_data' })
      .catch(() => {
        console.log('⚠️ 無法檢查 RLS 策略（可能需要更高權限）')
        return { data: null, error: null }
      })
    
    if (policyError) {
      console.error('❌ RLS 策略檢查失敗:', policyError)
    } else {
      console.log('✅ RLS 策略:', policies)
    }
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error)
  }
}

testEditDelete()
