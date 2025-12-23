// 刪除 CCSV-MC0030 的服務記錄
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteOldRecords() {
  console.log('=== 刪除 CCSV-MC0030 的服務記錄 ===\n')

  // 先查詢要刪除的記錄
  const { data: recordsToDelete, error: queryError } = await supabase
    .from('billing_salary_data')
    .select('id, service_date, customer_id, customer_name')
    .eq('customer_id', 'CCSV-MC0030')

  if (queryError) {
    console.error('查詢錯誤:', queryError)
    return
  }

  console.log(`找到 ${recordsToDelete?.length || 0} 條需要刪除的記錄:\n`)
  recordsToDelete?.forEach((record, index) => {
    console.log(`${index + 1}. ID: ${record.id}`)
    console.log(`   客戶編號: ${record.customer_id}`)
    console.log(`   客戶姓名: ${record.customer_name}`)
    console.log(`   服務日期: ${record.service_date}`)
    console.log('')
  })

  if (!recordsToDelete || recordsToDelete.length === 0) {
    console.log('沒有需要刪除的記錄')
    return
  }

  // 執行刪除
  const { error: deleteError } = await supabase
    .from('billing_salary_data')
    .delete()
    .eq('customer_id', 'CCSV-MC0030')

  if (deleteError) {
    console.error('刪除錯誤:', deleteError)
    return
  }

  console.log(`✅ 成功刪除 ${recordsToDelete.length} 條記錄！`)

  // 確認刪除結果
  const { data: remaining, error: checkError } = await supabase
    .from('billing_salary_data')
    .select('id, service_date, customer_id, customer_name')
    .ilike('customer_name', '%麥美玲%')

  if (checkError) {
    console.error('確認查詢錯誤:', checkError)
    return
  }

  console.log(`\n=== 刪除後剩餘的「麥美玲」記錄 ===\n`)
  console.log(`剩餘 ${remaining?.length || 0} 條記錄:`)
  remaining?.forEach((record, index) => {
    console.log(`${index + 1}. ${record.customer_id} | ${record.service_date} | ${record.customer_name}`)
  })
}

deleteOldRecords().catch(console.error)
