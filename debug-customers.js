// 調試客戶資料問題
const { createClient } = require('@supabase/supabase-js')

// 檢查是否有 .env.local 檔案
const fs = require('fs')
const path = require('path')

// 讀取環境變數
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8')
  const lines = envConfig.split('\n')
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 調試客戶資料問題')
console.log('Supabase URL:', supabaseUrl ? '已設置' : '未設置')
console.log('Supabase Key:', supabaseKey ? `已設置 (${supabaseKey.length} 字符)` : '未設置')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 環境變數未正確設置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCustomers() {
  try {
    console.log('\n📊 檢查客戶資料...')
    
    // 1. 檢查總客戶數量
    const { count: totalCount, error: countError } = await supabase
      .from('customer_personal_data')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ 無法獲取客戶總數:', countError)
      return
    }
    
    console.log(`📈 資料庫總客戶數: ${totalCount}`)
    
    // 2. 檢查是否有重複的 customer_id
    const { data: duplicateCheck, error: dupError } = await supabase
      .from('customer_personal_data')
      .select('customer_id')
    
    if (dupError) {
      console.error('❌ 無法檢查重複:', dupError)
      return
    }
    
    // 統計 customer_id 出現次數
    const idCounts = {}
    const nullIds = []
    
    duplicateCheck.forEach((record, index) => {
      if (record.customer_id === null || record.customer_id === '') {
        nullIds.push(index)
      } else {
        idCounts[record.customer_id] = (idCounts[record.customer_id] || 0) + 1
      }
    })
    
    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1)
    
    console.log(`🔄 重複的 customer_id 數量: ${duplicates.length}`)
    if (duplicates.length > 0) {
      console.log('重複的 customer_id:', duplicates.slice(0, 5)) // 只顯示前5個
    }
    
    console.log(`❓ 空的 customer_id 數量: ${nullIds.length}`)
    
    // 3. 檢查實際查詢結果（模擬前端查詢）
    console.log('\n🔍 模擬前端查詢...')
    
    const { data: queryResult, error: queryError, count: queryCount } = await supabase
      .from('customer_personal_data')
      .select(`
        id,
        customer_id,
        customer_name,
        phone,
        district,
        service_address,
        project_manager,
        created_at,
        customer_type,
        voucher_application_status,
        lds_status,
        home_visit_status,
        copay_level
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 19) // 前20筆記錄
    
    if (queryError) {
      console.error('❌ 查詢失敗:', queryError)
      return
    }
    
    console.log(`📊 查詢返回記錄數: ${queryResult.length}`)
    console.log(`📊 查詢總記錄數: ${queryCount}`)
    
    // 檢查查詢結果中是否有重複的 id
    const queryIds = queryResult.map(r => r.id)
    const uniqueQueryIds = [...new Set(queryIds)]
    
    if (queryIds.length !== uniqueQueryIds.length) {
      console.log('⚠️  查詢結果中有重複的 ID!')
      console.log('總記錄:', queryIds.length)
      console.log('唯一記錄:', uniqueQueryIds.length)
    } else {
      console.log('✅ 查詢結果中沒有重複的 ID')
    }
    
    // 4. 顯示前幾筆記錄的資訊
    console.log('\n📋 前5筆記錄:')
    queryResult.slice(0, 5).forEach((customer, index) => {
      console.log(`${index + 1}. ID: ${customer.id.slice(-8)}... | Customer ID: ${customer.customer_id || 'NULL'} | 姓名: ${customer.customer_name}`)
    })
    
  } catch (error) {
    console.error('❌ 調試過程中發生錯誤:', error)
  }
}

debugCustomers()
