// 調試護理服務管理業務概覽的總數計算問題
// 測試 4-9月 的數據範圍計算

const { createClient } = require('@supabase/supabase-js')

// 直接使用環境變數
const supabaseUrl = 'https://qscgexnhevfaedmbwxyx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzY2dleG5oZXZmYWVkbWJ3eHl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk2ODE0NCwiZXhwIjoyMDUxNTQ0MTQ0fQ.LJXEpNjKmCHBhHVh4w0xhxP9y8nZpgjRcvJFdV2sDgw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugBusinessOverview() {
  console.log('🔍 調試護理服務管理業務概覽總數計算...\n')

  try {
    // 1. 設定測試日期範圍（2024年4月-9月）
    const dateRanges = [
      {
        name: '4月份',
        start: '2024-04-01',
        end: '2024-04-30'
      },
      {
        name: '5月份',
        start: '2024-05-01',
        end: '2024-05-31'
      },
      {
        name: '6月份',
        start: '2024-06-01',
        end: '2024-06-30'
      },
      {
        name: '7月份',
        start: '2024-07-01',
        end: '2024-07-31'
      },
      {
        name: '8月份',
        start: '2024-08-01',
        end: '2024-08-31'
      },
      {
        name: '9月份',
        start: '2024-09-01',
        end: '2024-09-30'
      },
      {
        name: '4-9月合計',
        start: '2024-04-01',
        end: '2024-09-30'
      }
    ]

    // 2. 檢查每個月份和合計的數據
    const results = []
    
    for (const range of dateRanges) {
      console.log(`📊 檢查 ${range.name} (${range.start} ~ ${range.end})`)
      
      const { data, error, count } = await supabase
        .from('billing_salary_data')
        .select('service_fee, staff_salary, service_hours, service_date, customer_name', { count: 'exact' })
        .gte('service_date', range.start)
        .lte('service_date', range.end)

      if (error) {
        console.error(`❌ ${range.name} 查詢錯誤:`, error)
        continue
      }

      // 計算統計數據
      const totalRevenue = data?.reduce((sum, record) => sum + (record.service_fee || 0), 0) || 0
      const totalStaffSalary = data?.reduce((sum, record) => sum + (record.staff_salary || 0), 0) || 0
      const totalProfit = totalRevenue - totalStaffSalary
      const totalServiceHours = data?.reduce((sum, record) => sum + (record.service_hours || 0), 0) || 0
      const recordCount = count || 0

      const result = {
        period: range.name,
        recordCount,
        totalRevenue,
        totalProfit,
        totalServiceHours,
        avgProfitPerHour: totalServiceHours > 0 ? totalProfit / totalServiceHours : 0
      }

      results.push(result)

      console.log(`   📈 記錄數: ${recordCount}`)
      console.log(`   💰 總收入: $${totalRevenue.toLocaleString()}`)
      console.log(`   💵 總利潤: $${totalProfit.toLocaleString()}`)
      console.log(`   ⏰ 總時數: ${totalServiceHours.toFixed(1)}h`)
      console.log(`   📊 每小時利潤: $${result.avgProfitPerHour.toFixed(2)}`)
      console.log('')
    }

    // 3. 驗證合計數據
    console.log('🔍 驗證合計計算...')
    const individualMonths = results.slice(0, 6) // 4-9月的各月數據
    const combinedPeriod = results[6] // 4-9月合計

    const expectedTotalRevenue = individualMonths.reduce((sum, month) => sum + month.totalRevenue, 0)
    const expectedTotalProfit = individualMonths.reduce((sum, month) => sum + month.totalProfit, 0)
    const expectedTotalHours = individualMonths.reduce((sum, month) => sum + month.totalServiceHours, 0)
    const expectedRecordCount = individualMonths.reduce((sum, month) => sum + month.recordCount, 0)

    console.log('📊 各月加總 vs 4-9月合計:')
    console.log(`記錄數: ${expectedRecordCount} vs ${combinedPeriod.recordCount} ${expectedRecordCount === combinedPeriod.recordCount ? '✅' : '❌'}`)
    console.log(`收入: $${expectedTotalRevenue.toLocaleString()} vs $${combinedPeriod.totalRevenue.toLocaleString()} ${Math.abs(expectedTotalRevenue - combinedPeriod.totalRevenue) < 0.01 ? '✅' : '❌'}`)
    console.log(`利潤: $${expectedTotalProfit.toLocaleString()} vs $${combinedPeriod.totalProfit.toLocaleString()} ${Math.abs(expectedTotalProfit - combinedPeriod.totalProfit) < 0.01 ? '✅' : '❌'}`)
    console.log(`時數: ${expectedTotalHours.toFixed(1)}h vs ${combinedPeriod.totalServiceHours.toFixed(1)}h ${Math.abs(expectedTotalHours - combinedPeriod.totalServiceHours) < 0.01 ? '✅' : '❌'}`)

    // 4. 檢查是否有重複記錄
    console.log('\n🔍 檢查重複記錄...')
    const { data: allData } = await supabase
      .from('billing_salary_data')
      .select('id, service_date, customer_name, service_fee, service_hours')
      .gte('service_date', '2024-04-01')
      .lte('service_date', '2024-09-30')
      .order('service_date')

    if (allData) {
      // 檢查重複記錄（相同日期、客戶、費用、時數）
      const duplicateGroups = new Map()
      allData.forEach(record => {
        const key = `${record.service_date}-${record.customer_name}-${record.service_fee}-${record.service_hours}`
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, [])
        }
        duplicateGroups.get(key).push(record)
      })

      const duplicates = Array.from(duplicateGroups.values()).filter(group => group.length > 1)
      if (duplicates.length > 0) {
        console.log(`❌ 發現 ${duplicates.length} 組重複記錄:`)
        duplicates.slice(0, 5).forEach((group, index) => {
          console.log(`   ${index + 1}. ${group[0].service_date} - ${group[0].customer_name} (${group.length} 筆重複)`)
        })
      } else {
        console.log('✅ 未發現重複記錄')
      }
    }

    // 5. 按月份分組檢查數據分佈
    console.log('\n📅 按月份數據分佈:')
    if (allData) {
      const monthlyStats = new Map()
      allData.forEach(record => {
        const month = record.service_date.substring(0, 7) // YYYY-MM
        if (!monthlyStats.has(month)) {
          monthlyStats.set(month, 0)
        }
        monthlyStats.set(month, monthlyStats.get(month) + 1)
      })

      Array.from(monthlyStats.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([month, count]) => {
          console.log(`   ${month}: ${count} 筆記錄`)
        })
    }

  } catch (error) {
    console.error('❌ 調試過程中出現錯誤:', error)
  }
}

debugBusinessOverview()
