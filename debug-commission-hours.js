const { createClient } = require('@supabase/supabase-js')

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvkxlvdicympakfecgvv.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0NjI3NzEsImV4cCI6MjA0NzAzODc3MX0.aZRyflnvx5FdwlU5_ixQRQRSyMQPP7Fo4aZx2cQOqZE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCommissionHours() {
  console.log('🔍 調試佣金計算時數問題...\n')

  try {
    // 1. 檢查原始 billing_salary_data
    console.log('📊 1. 檢查 billing_salary_data 原始數據...')
    const { data: allBillingData, error: billingError } = await supabase
      .from('billing_salary_data')
      .select('customer_id, customer_name, service_date, service_hours, service_fee, project_category')
      .order('customer_id', { ascending: true })
      .order('service_date', { ascending: true })

    if (billingError) {
      console.error('❌ 獲取 billing 數據失敗:', billingError)
      return
    }

    console.log(`📈 總共找到 ${allBillingData?.length} 筆服務記錄`)

    // 2. 按客戶分組顯示原始時數
    const customerHoursMap = new Map()
    
    allBillingData?.forEach(record => {
      const key = record.customer_id
      if (!customerHoursMap.has(key)) {
        customerHoursMap.set(key, {
          customer_name: record.customer_name,
          total_hours: 0,
          records: []
        })
      }
      
      const hours = Number(record.service_hours) || 0
      customerHoursMap.get(key).total_hours += hours
      customerHoursMap.get(key).records.push({
        date: record.service_date,
        hours: hours,
        fee: record.service_fee,
        category: record.project_category
      })
    })

    console.log('\n📋 各客戶原始服務時數統計:')
    for (const [customerId, data] of customerHoursMap.entries()) {
      console.log(`\n👤 客戶: ${data.customer_name} (ID: ${customerId})`)
      console.log(`⏰ 總時數: ${data.total_hours} 小時`)
      console.log(`📝 服務記錄數: ${data.records.length} 筆`)
      
      // 顯示前5筆記錄作為樣本
      data.records.slice(0, 5).forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.date}: ${record.hours}小時, $${record.fee}, ${record.category}`)
      })
      if (data.records.length > 5) {
        console.log(`   ... 還有 ${data.records.length - 5} 筆記錄`)
      }
    }

    // 3. 檢查篩選後的數據 (排除 MC街客 和 Steven140)
    console.log('\n📊 3. 檢查篩選後的數據 (排除 MC街客 和 Steven140)...')
    const filteredBilling = allBillingData?.filter(record => 
      record.project_category !== 'MC街客' && record.project_category !== 'Steven140'
    )

    console.log(`📈 篩選後剩餘 ${filteredBilling?.length} 筆服務記錄`)

    // 重新計算篩選後的時數
    const filteredCustomerHours = new Map()
    
    filteredBilling?.forEach(record => {
      const key = record.customer_id
      if (!filteredCustomerHours.has(key)) {
        filteredCustomerHours.set(key, {
          customer_name: record.customer_name,
          total_hours: 0,
          records: []
        })
      }
      
      const hours = Number(record.service_hours) || 0
      filteredCustomerHours.get(key).total_hours += hours
      filteredCustomerHours.get(key).records.push({
        date: record.service_date,
        hours: hours,
        fee: record.service_fee,
        category: record.project_category
      })
    })

    console.log('\n📋 篩選後各客戶服務時數統計:')
    for (const [customerId, data] of filteredCustomerHours.entries()) {
      const originalData = customerHoursMap.get(customerId)
      const hoursDifference = originalData.total_hours - data.total_hours
      
      console.log(`\n👤 客戶: ${data.customer_name} (ID: ${customerId})`)
      console.log(`⏰ 原始總時數: ${originalData.total_hours} 小時`)
      console.log(`⏰ 篩選後時數: ${data.total_hours} 小時`)
      if (hoursDifference > 0) {
        console.log(`❗ 被篩選掉的時數: ${hoursDifference} 小時`)
      }
    }

    // 4. 檢查社區券客戶資料
    console.log('\n📊 4. 檢查社區券客戶資料...')
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('customer_id, customer_name, introducer, customer_type')
      .eq('customer_type', '社區券客戶')

    if (customerError) {
      console.error('❌ 獲取客戶數據失敗:', customerError)
      return
    }

    console.log(`👥 社區券客戶總數: ${customerData?.length}`)

    // 5. 檢查佣金率設定
    console.log('\n📊 5. 檢查佣金率設定...')
    const { data: commissionData, error: commissionError } = await supabase
      .from('commissions')
      .select('*')

    if (commissionError) {
      console.error('❌ 獲取佣金率數據失敗:', commissionError)
      return
    }

    console.log(`💰 佣金率設定數: ${commissionData?.length}`)
    commissionData?.forEach(rate => {
      console.log(`   ${rate.introducer}: 首月 ${rate.first_month_commission}%, 後續 ${rate.subsequent_month_commission}%`)
    })

    // 6. 檢查特定客戶的月度統計
    console.log('\n📊 6. 模擬佣金計算的月度統計...')
    
    // 合併客戶和服務數據
    const qualifiedCustomers = customerData?.filter(customer => {
      const hasCommissionRate = commissionData?.some(rate => rate.introducer === customer.introducer)
      const hasBillingData = filteredBilling?.some(billing => billing.customer_id === customer.customer_id)
      return hasCommissionRate && hasBillingData
    })

    console.log(`✅ 符合條件的客戶數: ${qualifiedCustomers?.length}`)

    const monthlyStats = new Map()

    qualifiedCustomers?.forEach(customer => {
      const customerBilling = filteredBilling?.filter(b => b.customer_id === customer.customer_id)
      
      customerBilling?.forEach(billing => {
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
            record_count: 0
          })
        }

        const existing = monthlyStats.get(key)
        existing.monthly_hours += Number(billing.service_hours) || 0
        existing.monthly_fee += Number(billing.service_fee) || 0
        existing.record_count += 1
      })
    })

    console.log('\n📋 月度統計結果:')
    const sortedStats = Array.from(monthlyStats.values())
      .sort((a, b) => `${a.customer_name}-${a.service_month}`.localeCompare(`${b.customer_name}-${b.service_month}`))

    sortedStats.forEach(stat => {
      console.log(`\n👤 ${stat.customer_name} (${stat.service_month})`)
      console.log(`   🔢 介紹人: ${stat.introducer}`)
      console.log(`   ⏰ 月度時數: ${stat.monthly_hours} 小時`)
      console.log(`   💰 月度費用: $${stat.monthly_fee}`)
      console.log(`   📝 記錄數量: ${stat.record_count} 筆`)
      console.log(`   ✅ 達標狀態: ${stat.monthly_fee >= 6000 ? '達標' : '不達標'}`)
    })

  } catch (error) {
    console.error('❌ 調試過程中發生錯誤:', error)
  }
}

// 執行調試
debugCommissionHours()
