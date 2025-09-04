// 檢查二月和四月的數據庫記錄
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://baxbdkyqvhlybybjwddd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheGJka3lxdmhseWJ5Ymp3ZGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0OTU3ODEsImV4cCI6MjA0NzA3MTc4MX0.PL4aAW3CiDZW69VJqJbXjzs1lJVPsrcYBQ9AxP1l2dw'

// 先設置認證
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
})

async function checkFebruaryAprilRecords() {
  console.log('=== 檢查二月和四月的記錄 ===')
  
  try {
    // 檢查二月記錄
    console.log('\n🔍 檢查二月記錄...')
    const { data: febRecords, error: febError } = await supabase
      .from('billing_salary_data')
      .select('*')
      .gte('service_date', '2024-02-01')
      .lte('service_date', '2024-02-29')
      .order('service_date', { ascending: true })
    
    if (febError) {
      console.error('二月查詢錯誤:', febError)
    } else {
      console.log('二月記錄數量:', febRecords?.length || 0)
      console.log('二月記錄類型:', typeof febRecords)
      console.log('二月記錄是否為 null:', febRecords === null)
      
      if (febRecords && febRecords.length > 0) {
        console.log('二月第一筆記錄:', febRecords[0])
        console.log('二月最後一筆記錄:', febRecords[febRecords.length - 1])
        
        // 檢查是否有異常字段
        const sample = febRecords[0]
        console.log('二月記錄字段檢查:')
        console.log('- customer_name:', sample.customer_name, typeof sample.customer_name)
        console.log('- care_staff_name:', sample.care_staff_name, typeof sample.care_staff_name)
        console.log('- project_category:', sample.project_category, typeof sample.project_category)
        console.log('- service_type:', sample.service_type, typeof sample.service_type)
      }
    }

    // 檢查四月記錄
    console.log('\n🔍 檢查四月記錄...')
    const { data: aprRecords, error: aprError } = await supabase
      .from('billing_salary_data')
      .select('*')
      .gte('service_date', '2024-04-01')
      .lte('service_date', '2024-04-30')
      .order('service_date', { ascending: true })
    
    if (aprError) {
      console.error('四月查詢錯誤:', aprError)
    } else {
      console.log('四月記錄數量:', aprRecords?.length || 0)
      console.log('四月記錄類型:', typeof aprRecords)
      console.log('四月記錄是否為 null:', aprRecords === null)
      
      if (aprRecords && aprRecords.length > 0) {
        console.log('四月第一筆記錄:', aprRecords[0])
        console.log('四月最後一筆記錄:', aprRecords[aprRecords.length - 1])
        
        // 檢查是否有異常字段
        const sample = aprRecords[0]
        console.log('四月記錄字段檢查:')
        console.log('- customer_name:', sample.customer_name, typeof sample.customer_name)
        console.log('- care_staff_name:', sample.care_staff_name, typeof sample.care_staff_name)
        console.log('- project_category:', sample.project_category, typeof sample.project_category)
        console.log('- service_type:', sample.service_type, typeof sample.service_type)
      }
    }

    // 檢查其他月份作為對比
    console.log('\n🔍 檢查三月記錄作為對比...')
    const { data: marRecords, error: marError } = await supabase
      .from('billing_salary_data')
      .select('*')
      .gte('service_date', '2024-03-01')
      .lte('service_date', '2024-03-31')
      .limit(5)
    
    if (marError) {
      console.error('三月查詢錯誤:', marError)
    } else {
      console.log('三月記錄數量:', marRecords?.length || 0)
      if (marRecords && marRecords.length > 0) {
        console.log('三月樣本記錄:', marRecords[0])
      }
    }

    // 檢查是否有 NULL 值
    console.log('\n🔍 檢查二月和四月的 NULL 值...')
    
    const { data: nullRecords, error: nullError } = await supabase
      .from('billing_salary_data')
      .select('service_date, customer_name, care_staff_name, project_category, service_type')
      .or('customer_name.is.null,care_staff_name.is.null,project_category.is.null,service_type.is.null')
      .or('service_date.gte.2024-02-01,service_date.lte.2024-02-29,service_date.gte.2024-04-01,service_date.lte.2024-04-30')
    
    if (nullError) {
      console.error('NULL 值查詢錯誤:', nullError)
    } else {
      console.log('找到的 NULL 記錄:', nullRecords?.length || 0)
      if (nullRecords && nullRecords.length > 0) {
        console.log('NULL 記錄樣本:', nullRecords.slice(0, 3))
      }
    }

  } catch (error) {
    console.error('檢查過程中出錯:', error)
  }
}

// 執行檢查
checkFebruaryAprilRecords().then(() => {
  console.log('\n✅ 檢查完成')
  process.exit(0)
}).catch(error => {
  console.error('❌ 檢查失敗:', error)
  process.exit(1)
})
