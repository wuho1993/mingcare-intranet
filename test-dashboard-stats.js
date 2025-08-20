require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 環境變數未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDashboardStats() {
  console.log('🔍 測試儀表板統計數據...\n')

  try {
    // 1. 測試總客戶數
    console.log('1️⃣ 測試總客戶數 (customer_personal_data)')
    const { count: totalCustomers, error: customerError } = await supabase
      .from('customer_personal_data')
      .select('*', { count: 'exact', head: true })
    
    if (customerError) {
      console.error('❌ 客戶數據錯誤:', customerError)
    } else {
      console.log(`✅ 總客戶數: ${totalCustomers || 0}`)
    }

    // 2. 測試護理人員總數
    console.log('\n2️⃣ 測試護理人員總數 (care_staff_profiles)')
    const { count: totalCareStaff, error: staffError } = await supabase
      .from('care_staff_profiles')
      .select('*', { count: 'exact', head: true })
    
    if (staffError) {
      console.error('❌ 護理人員數據錯誤:', staffError)
    } else {
      console.log(`✅ 護理人員總數: ${totalCareStaff || 0}`)
    }

    // 3. 測試今日服務數
    console.log('\n3️⃣ 測試今日服務數 (billing_salary_data)')
    const today = new Date().toISOString().split('T')[0]
    console.log(`今日日期: ${today}`)
    
    const { count: todayServices, error: todayError } = await supabase
      .from('billing_salary_data')
      .select('*', { count: 'exact', head: true })
      .eq('service_date', today)
    
    if (todayError) {
      console.error('❌ 今日服務數據錯誤:', todayError)
    } else {
      console.log(`✅ 今日服務數: ${todayServices || 0}`)
    }

    // 4. 測試本月收入
    console.log('\n4️⃣ 測試本月收入 (billing_salary_data)')
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
    const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
    
    console.log(`本月範圍: ${startDate} 到 ${endDate}`)
    
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('billing_salary_data')
      .select('service_fee')
      .gte('service_date', startDate)
      .lte('service_date', endDate)

    if (monthlyError) {
      console.error('❌ 本月收入數據錯誤:', monthlyError)
    } else {
      const monthlyRevenue = monthlyData?.reduce((sum, record) => {
        return sum + (Number(record.service_fee) || 0)
      }, 0) || 0
      
      console.log(`✅ 本月服務記錄數: ${monthlyData?.length || 0}`)
      console.log(`✅ 本月收入總額: $${monthlyRevenue.toLocaleString()}`)
    }

    // 5. 額外測試：檢查一些樣本數據
    console.log('\n📊 額外檢查...')
    
    // 檢查最近的服務記錄
    const { data: recentServices } = await supabase
      .from('billing_salary_data')
      .select('service_date, customer_name, service_fee')
      .order('service_date', { ascending: false })
      .limit(5)
    
    if (recentServices?.length) {
      console.log('最近5筆服務記錄:')
      recentServices.forEach((service, index) => {
        console.log(`  ${index + 1}. ${service.service_date} - ${service.customer_name} - $${service.service_fee}`)
      })
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error)
  }
}

testDashboardStats()
