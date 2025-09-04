// 模擬前端查詢以調試問題
const { createClient } = require('@supabase/supabase-js')
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function simulateFrontendQuery() {
  console.log('🧪 模擬前端查詢邏輯...\n')
  
  // 1. 測試空篩選條件（應該返回所有客戶）
  console.log('📋 測試1: 空篩選條件')
  try {
    const filters = {} // 模擬前端初始狀態
    const page = 1
    const pageSize = 20
    
    let query = supabase
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
    
    // 應用篩選條件（模擬 CustomerManagementService.getCustomers）
    if (filters?.customer_type) {
      console.log('  ❌ 不應該有 customer_type 篩選!')
      query = query.eq('customer_type', filters.customer_type)
    }
    if (filters?.district) {
      query = query.eq('district', filters.district)
    }
    if (filters?.introducer) {
      query = query.eq('introducer', filters.introducer)
    }
    if (filters?.project_manager) {
      query = query.eq('project_manager', filters.project_manager)
    }
    if (filters?.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,customer_id.ilike.%${filters.search}%`)
    }
    
    // 分頁
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    // 排序
    query = query.order('created_at', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('  ❌ 查詢失敗:', error)
      return
    }
    
    console.log('  ✅ 查詢成功')
    console.log(`  📊 返回記錄數: ${data.length}`)
    console.log(`  📊 總記錄數: ${count}`)
    console.log(`  📋 前3筆客戶:`)
    data.slice(0, 3).forEach((customer, i) => {
      console.log(`    ${i+1}. ${customer.customer_name} (${customer.customer_type}) - ID: ${customer.id.slice(-8)}`)
    })
    
    // 檢查是否有重複的 ID
    const ids = data.map(c => c.id)
    const uniqueIds = [...new Set(ids)]
    if (ids.length !== uniqueIds.length) {
      console.log('  ⚠️  發現重複的 ID!')
    }
    
  } catch (error) {
    console.error('❌ 測試1失敗:', error)
  }
  
  // 2. 測試有 customer_type 篩選的查詢
  console.log('\n📋 測試2: 社區券客戶篩選')
  try {
    const filters = { customer_type: '社區券客戶' }
    const page = 1
    const pageSize = 20
    
    let query = supabase
      .from('customer_personal_data')
      .select(`
        id,
        customer_id,
        customer_name,
        customer_type
      `, { count: 'exact' })
    
    if (filters?.customer_type) {
      query = query.eq('customer_type', filters.customer_type)
    }
    
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    query = query.order('created_at', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('  ❌ 查詢失敗:', error)
      return
    }
    
    console.log('  ✅ 查詢成功')
    console.log(`  📊 返回記錄數: ${data.length}`)
    console.log(`  📊 總記錄數: ${count}`)
    console.log(`  📋 前3筆客戶:`)
    data.slice(0, 3).forEach((customer, i) => {
      console.log(`    ${i+1}. ${customer.customer_name} (${customer.customer_type})`)
    })
    
  } catch (error) {
    console.error('❌ 測試2失敗:', error)
  }
  
  // 3. 檢查各種客戶類型的分布
  console.log('\n📋 測試3: 客戶類型分布')
  try {
    const { data, error } = await supabase
      .from('customer_personal_data')
      .select('customer_type')
    
    if (error) {
      console.error('  ❌ 查詢失敗:', error)
      return
    }
    
    const typeCounts = {}
    data.forEach(customer => {
      const type = customer.customer_type || 'NULL'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    
    console.log('  📊 客戶類型分布:')
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`)
    })
    
  } catch (error) {
    console.error('❌ 測試3失敗:', error)
  }
}

simulateFrontendQuery()
