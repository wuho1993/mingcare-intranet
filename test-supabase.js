// 測試 Supabase 連接和查詢
const { createBrowserClient } = require('@supabase/ssr')

const supabase = createBrowserClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
)

async function testQuery() {
  try {
    console.log('測試基本查詢...')
    const { data, error, count } = await supabase
      .from('care_staff_profiles')
      .select('id, name_chinese, staff_id, phone', { count: 'exact' })
      .limit(5)

    if (error) {
      console.error('查詢錯誤:', error)
      return
    }

    console.log('查詢成功！')
    console.log('總記錄數:', count)
    console.log('返回數據:', data)

    // 測試搜尋查詢
    console.log('\n測試搜尋查詢...')
    const searchTerm = '%李%'
    const { data: searchData, error: searchError } = await supabase
      .from('care_staff_profiles')
      .select('id, name_chinese, staff_id, phone')
      .or(`name_chinese.ilike.${searchTerm},phone.ilike.${searchTerm},staff_id.ilike.${searchTerm}`)
      .limit(10)

    if (searchError) {
      console.error('搜尋錯誤:', searchError)
      return
    }

    console.log('搜尋成功！')
    console.log('搜尋結果:', searchData)

  } catch (err) {
    console.error('執行錯誤:', err)
  }
}

testQuery()
