// 測試佣金計算邏輯
const { createBrowserClient } = require('@supabase/ssr')

const supabase = createBrowserClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
)

async function testCommissionCalculation() {
  console.log('=== 佣金計算測試 ===')
  
  try {
    // 1. 測試佣金率表是否存在
    console.log('\n1. 檢查佣金率表...')
    const { data: commissionRates, error: commissionError } = await supabase
      .from('commission_rate_introducer')
      .select('*')
    
    if (commissionError) {
      console.error('❌ 佣金率表錯誤:', commissionError.message)
      return
    }
    
    console.log('✅ 佣金率表數據:', commissionRates.length, '條記錄')
    commissionRates.forEach(rate => {
      console.log(`   - ${rate.introducer}: 首月 $${rate.first_month_commission}, 後續 $${rate.subsequent_month_commission}`)
    })

    // 2. 測試客戶數據
    console.log('\n2. 檢查符合條件的客戶...')
    const { data: customerData, error: customerError } = await supabase
      .from('customer_personal_data')
      .select(`
        customer_id,
        customer_name,
        introducer,
        customer_type
      `)
      .eq('customer_type', '社區券客戶')
    
    if (customerError) {
      console.error('❌ 客戶數據錯誤:', customerError.message)
      return
    }
    
    console.log('✅ 社區券客戶數量:', customerData.length)

    // 3. 測試服務數據
    console.log('\n3. 檢查符合條件的服務記錄...')
    const { data: billingData, error: billingError } = await supabase
      .from('billing_salary_data')
      .select(`
        customer_id,
        service_date,
        service_hours,
        service_fee,
        project_category
      `)
      .not('project_category', 'in', '("MC街客","Steven140")')
    
    if (billingError) {
      console.error('❌ 服務數據錯誤:', billingError.message)
      return
    }
    
    console.log('✅ 符合條件的服務記錄:', billingData.length)
    
    // 4. 計算示例
    console.log('\n4. 佣金計算示例...')
    
    const monthlyStats = new Map()
    
    // 找出有服務記錄的社區券客戶
    const qualifiedCustomers = customerData.filter(customer =>
      billingData.some(billing => billing.customer_id === customer.customer_id)
    )
    
    console.log('有服務記錄的社區券客戶:', qualifiedCustomers.length)
    
    // 按客戶和月份統計
    qualifiedCustomers.forEach(customer => {
      const customerBilling = billingData.filter(b => b.customer_id === customer.customer_id)
      
      customerBilling.forEach(billing => {
        const serviceMonth = new Date(billing.service_date).toISOString().substring(0, 7)
        const key = `${customer.customer_id}-${serviceMonth}`

        if (!monthlyStats.has(key)) {
          monthlyStats.set(key, {
            customer_id: customer.customer_id,
            customer_name: customer.customer_name,
            introducer: customer.introducer,
            service_month: serviceMonth,
            monthly_hours: 0,
            monthly_fee: 0,
            first_service_date: billing.service_date
          })
        }

        const existing = monthlyStats.get(key)
        existing.monthly_hours += Number(billing.service_hours) || 0
        existing.monthly_fee += Number(billing.service_fee) || 0
        
        if (billing.service_date < existing.first_service_date) {
          existing.first_service_date = billing.service_date
        }
      })
    })
    
    console.log('月度統計數據:', monthlyStats.size, '條')
    
    // 計算符合條件的記錄
    const qualifiedMonths = Array.from(monthlyStats.values()).filter(month => 
      month.monthly_hours >= 25 || month.monthly_fee >= 6200
    )
    
    console.log('符合佣金條件的月份:', qualifiedMonths.length)
    
    // 顯示前 5 個符合條件的記錄
    qualifiedMonths.slice(0, 5).forEach(month => {
      const qualified = month.monthly_hours >= 25 ? `時數達標(${month.monthly_hours}h)` : `費用達標($${month.monthly_fee})`
      console.log(`   - ${month.customer_name} (${month.service_month}): ${qualified}`)
    })
    
    // 按介紹人統計
    const introducerStats = new Map()
    qualifiedMonths.forEach(month => {
      if (!introducerStats.has(month.introducer)) {
        introducerStats.set(month.introducer, {
          introducer: month.introducer,
          qualified_months: 0,
          customers: new Set()
        })
      }
      
      const stats = introducerStats.get(month.introducer)
      stats.qualified_months++
      stats.customers.add(month.customer_id)
    })
    
    console.log('\n5. 介紹人統計:')
    Array.from(introducerStats.values()).forEach(stats => {
      console.log(`   - ${stats.introducer}: ${stats.qualified_months} 個符合條件的月份, ${stats.customers.size} 個客戶`)
    })

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error)
  }
}

// 執行測試
testCommissionCalculation()
