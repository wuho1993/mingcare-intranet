// 調試腳本：查詢麥美玲的服務記錄
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugMaiMeiLing() {
  console.log('=== 調試麥美玲的服務記錄 ===\n')

  // 1. 查詢所有名字包含「麥美玲」的服務記錄
  const { data: allRecords, error: allError } = await supabase
    .from('billing_salary_data')
    .select('id, service_date, customer_id, customer_name, service_hours, service_fee, start_time, end_time, created_at')
    .ilike('customer_name', '%麥美玲%')
    .order('service_date', { ascending: false })

  if (allError) {
    console.error('查詢錯誤:', allError)
    return
  }

  console.log(`找到 ${allRecords?.length || 0} 條「麥美玲」的服務記錄:\n`)
  
  allRecords?.forEach((record, index) => {
    console.log(`記錄 ${index + 1}:`)
    console.log(`  ID: ${record.id}`)
    console.log(`  客戶編號: ${record.customer_id}`)
    console.log(`  客戶姓名: ${record.customer_name}`)
    console.log(`  服務日期: ${record.service_date}`)
    console.log(`  時間: ${record.start_time} - ${record.end_time}`)
    console.log(`  時數: ${record.service_hours}`)
    console.log(`  費用: $${record.service_fee}`)
    console.log(`  建立時間: ${record.created_at}`)
    console.log('')
  })

  // 2. 查詢 10 月份的記錄
  console.log('\n=== 10月份（2024-10-01 到 2024-10-31）的記錄 ===\n')
  
  const { data: octRecords, error: octError } = await supabase
    .from('billing_salary_data')
    .select('id, service_date, customer_id, customer_name, service_hours, service_fee, start_time, end_time')
    .ilike('customer_name', '%麥美玲%')
    .gte('service_date', '2024-10-01')
    .lte('service_date', '2024-10-31')
    .order('service_date', { ascending: true })

  if (octError) {
    console.error('查詢錯誤:', octError)
    return
  }

  console.log(`10月份找到 ${octRecords?.length || 0} 條記錄:\n`)
  
  octRecords?.forEach((record, index) => {
    console.log(`記錄 ${index + 1}:`)
    console.log(`  ID: ${record.id}`)
    console.log(`  客戶編號: ${record.customer_id}`)
    console.log(`  客戶姓名: ${record.customer_name}`)
    console.log(`  服務日期: ${record.service_date}`)
    console.log(`  時間: ${record.start_time} - ${record.end_time}`)
    console.log(`  時數: ${record.service_hours}`)
    console.log(`  費用: $${record.service_fee}`)
    console.log('')
  })

  // 3. 檢查客戶資料表中的「麥美玲」
  console.log('\n=== 客戶資料表中的「麥美玲」 ===\n')
  
  const { data: customers, error: custError } = await supabase
    .from('customer_personal_data')
    .select('customer_id, customer_name, introducer')
    .ilike('customer_name', '%麥美玲%')

  if (custError) {
    console.error('查詢錯誤:', custError)
    return
  }

  console.log(`找到 ${customers?.length || 0} 個「麥美玲」客戶:\n`)
  
  customers?.forEach((customer, index) => {
    console.log(`客戶 ${index + 1}:`)
    console.log(`  客戶編號: ${customer.customer_id}`)
    console.log(`  客戶姓名: ${customer.customer_name}`)
    console.log(`  介紹人: ${customer.introducer}`)
    console.log('')
  })
}

debugMaiMeiLing().catch(console.error)
