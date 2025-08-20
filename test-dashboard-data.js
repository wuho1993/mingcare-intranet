const { createClient } = require('@supabase/supabase-js')

// 配置 Supabase
const supabaseUrl = 'https://cwbbhjrqpuwonzrsmkmo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YmJoanJxcHV3b256cnNta21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMzNTMxNTAsImV4cCI6MjAzODkyOTE1MH0.1i_HGSvE4YpRTJNMJn-sWIq3J2iTLNHH0XYvfp6D3po'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDashboardData() {
  console.log('🔍 測試 Dashboard 數據加載...\n')

  try {
    // 獲取總客戶數 - 使用正確的表名
    console.log('1. 檢查客戶表 (customer_personal_data):')
    const { count: customerCount, error: customerError } = await supabase
      .from('customer_personal_data')
      .select('*', { count: 'exact', head: true })
    
    if (customerError) {
      console.error('❌ 客戶表錯誤:', customerError)
    } else {
      console.log(`✅ 總客戶數: ${customerCount}`)
    }

    // 獲取護理人員總數
    console.log('\n2. 檢查護理人員表 (care_staff_profiles):')
    const { count: staffCount, error: staffError } = await supabase
      .from('care_staff_profiles')
      .select('*', { count: 'exact', head: true })
    
    if (staffError) {
      console.error('❌ 護理人員表錯誤:', staffError)
    } else {
      console.log(`✅ 總護理人員數: ${staffCount}`)
    }

    // 獲取今日服務數量
    console.log('\n3. 檢查今日服務 (billing_salary_data):')
    const today = new Date().toISOString().split('T')[0]
    console.log(`今日日期: ${today}`)
    
    const { count: todayServicesCount, error: servicesError } = await supabase
      .from('billing_salary_data')
      .select('*', { count: 'exact', head: true })
      .eq('service_date', today)
    
    if (servicesError) {
      console.error('❌ 今日服務錯誤:', servicesError)
    } else {
      console.log(`✅ 今日服務數量: ${todayServicesCount}`)
    }

    // 獲取本月收入
    console.log('\n4. 檢查本月收入:')
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    console.log(`當前月份: ${currentMonth}`)
    
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('billing_salary_data')
      .select('service_fee')
      .gte('service_date', `${currentMonth}-01`)
      .lt('service_date', `${currentMonth}-32`)

    if (monthlyError) {
      console.error('❌ 本月收入錯誤:', monthlyError)
    } else {
      const monthlyRevenue = monthlyData?.reduce((sum, record) => 
        sum + (record.service_fee || 0), 0) || 0
      console.log(`✅ 本月收入: $${monthlyRevenue.toLocaleString()}`)
      console.log(`本月服務記錄數: ${monthlyData?.length || 0}`)
    }

    // 顯示摘要
    console.log('\n📊 Dashboard 統計摘要:')
    console.log('====================')
    console.log(`總客戶數: ${customerCount || 0}`)
    console.log(`總護理人員數: ${staffCount || 0}`)
    console.log(`今日服務數: ${todayServicesCount || 0}`)
    
    if (monthlyData && !monthlyError) {
      const monthlyRevenue = monthlyData.reduce((sum, record) => 
        sum + (record.service_fee || 0), 0)
      console.log(`本月收入: $${monthlyRevenue.toLocaleString()}`)
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error)
  }
}

testDashboardData()
