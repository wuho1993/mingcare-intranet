const { createClient } = require('@supabase/supabase-js')

// 從環境變量加載配置
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCustomerPersonalData() {
  console.log('開始測試...')
  
  try {
    console.log('測試 customer_personal_data 表...')
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Key (前10字):', supabaseKey?.substring(0, 10))
    
    // 獲取總數
    const { count, error: countError } = await supabase
      .from('customer_personal_data')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('獲取客戶總數錯誤:', countError)
      return
    }
    
    console.log(`客戶總數: ${count}`)
    
    // 獲取前5個客戶資料
    const { data, error: dataError } = await supabase
      .from('customer_personal_data')
      .select('*')
      .limit(5)
    
    if (dataError) {
      console.error('獲取客戶資料錯誤:', dataError)
      return
    }
    
    console.log('前5個客戶資料:')
    console.log(JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('連接錯誤:', error)
  }
  
  console.log('測試完成')
}

testCustomerPersonalData()
