// 檢查資料庫中的 null 數據問題
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://baxbdkyqvhlybybjwddd.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheGJka3lxdmhseWJ5Ymp3ZGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0OTU3ODEsImV4cCI6MjA0NzA3MTc4MX0.PL4aAW3CiDZW69VJqJbXjzs1lJVPsrcYBQ9AxP1l2dw'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseNulls() {
  console.log('=== 檢查資料庫 NULL 數據 ===')
  
  try {
    // 檢查 billing_salary_records 表
    console.log('\n1. 檢查 billing_salary_records 表...')
    const { data: records, error: recordsError } = await supabase
      .from('billing_salary_records')
      .select('*')
      .limit(10)
    
    if (recordsError) {
      console.error('查詢 billing_salary_records 錯誤:', recordsError)
    } else {
      console.log('records 數據樣本:', records?.slice(0, 3))
      console.log('records 是否為 null:', records === null)
      console.log('records 類型:', typeof records)
      console.log('records 長度:', records?.length)
    }

    // 檢查 customers 表
    console.log('\n2. 檢查 customers 表...')
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('customer_id, customer_name, phone_number')
      .limit(10)
    
    if (customersError) {
      console.error('查詢 customers 錯誤:', customersError)
    } else {
      console.log('customers 數據樣本:', customers?.slice(0, 3))
      console.log('customers 是否為 null:', customers === null)
      console.log('customers 類型:', typeof customers)
      console.log('customers 長度:', customers?.length)
    }

    // 檢查 care_staff 表
    console.log('\n3. 檢查 care_staff 表...')
    const { data: staff, error: staffError } = await supabase
      .from('care_staff')
      .select('name_chinese')
      .limit(10)
    
    if (staffError) {
      console.error('查詢 care_staff 錯誤:', staffError)
    } else {
      console.log('staff 數據樣本:', staff?.slice(0, 3))
      console.log('staff 是否為 null:', staff === null)
      console.log('staff 類型:', typeof staff)
      console.log('staff 長度:', staff?.length)
    }

    // 測試 RLS 權限
    console.log('\n4. 測試 RLS 權限...')
    const { data: authUser } = await supabase.auth.getUser()
    console.log('當前用戶:', authUser?.user?.email || '未登入')

    // 檢查特定查詢
    console.log('\n5. 檢查特定日期範圍查詢...')
    const { data: dateRecords, error: dateError } = await supabase
      .from('billing_salary_records')
      .select('*')
      .gte('service_date', '2024-01-01')
      .lte('service_date', '2024-12-31')
      .limit(5)
    
    if (dateError) {
      console.error('日期範圍查詢錯誤:', dateError)
    } else {
      console.log('日期範圍查詢結果:', dateRecords)
      console.log('是否為 null:', dateRecords === null)
      console.log('長度:', dateRecords?.length)
    }

  } catch (error) {
    console.error('檢查過程中出錯:', error)
  }
}

checkDatabaseNulls()
