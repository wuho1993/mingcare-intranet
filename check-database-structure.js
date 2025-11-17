// 檢查 Supabase 數據庫結構的腳本
// 執行: node check-database-structure.js

import { createClient } from '@supabase/supabase-js'

const DATA_PROJECT_URL = 'https://cvkxlvdicympakfecgvv.supabase.co'
const DATA_PROJECT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'

const supabase = createClient(DATA_PROJECT_URL, DATA_PROJECT_ANON_KEY)

async function checkDatabaseStructure() {
  console.log('========================================')
  console.log('檢查 Supabase 數據庫結構')
  console.log('日期:', new Date().toISOString().split('T')[0])
  console.log('========================================\n')

  const tables = [
    'auth_user_bridge',
    'billing_salary_data',
    'care_staff_profiles',
    'clock_records',
    'commission_rate_introducer',
    'customer_personal_data',
    'service_signatures',
    'signature_files',
    'voucher_rate',
    'notifications',
    'job_position_options',
    'language_options'
  ]

  for (const table of tables) {
    console.log(`\n[${table}]`)
    console.log('=' .repeat(60))
    
    try {
      // 獲取記錄數
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.log(`❌ 錯誤: ${countError.message}`)
        continue
      }
      
      console.log(`記錄數: ${count} 筆`)
      
      // 獲取一筆樣本數據來查看欄位結構
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ 錯誤: ${error.message}`)
        continue
      }
      
      if (data && data.length > 0) {
        console.log('\n欄位結構:')
        const sample = data[0]
        Object.keys(sample).forEach(key => {
          const value = sample[key]
          const type = value === null ? 'null' : typeof value
          const displayValue = value === null ? 'NULL' : 
                             type === 'object' ? JSON.stringify(value).substring(0, 50) : 
                             String(value).substring(0, 50)
          console.log(`  - ${key}: ${type} (範例: ${displayValue})`)
        })
      } else {
        console.log('表格為空，無法顯示欄位結構')
      }
      
    } catch (err) {
      console.log(`❌ 異常錯誤: ${err.message}`)
    }
  }

  console.log('\n========================================')
  console.log('檢查完成')
  console.log('========================================')
}

// 檢查枚舉類型
async function checkEnumTypes() {
  console.log('\n\n========================================')
  console.log('檢查枚舉類型 (Enum Types)')
  console.log('========================================\n')

  // 我們無法直接通過 Supabase 客戶端查詢枚舉類型
  // 但可以從表格數據中推斷
  
  const enumFields = {
    'billing_salary_data': ['service_type', 'project_category', 'project_manager'],
    'care_staff_profiles': ['gender', 'preferred_area', 'covid_vaccine', 'contract_status'],
    'customer_personal_data': ['customer_type', 'district', 'health_status', 'introducer', 'voucher_application_status', 'lds_status', 'home_visit_status', 'project_manager', 'copay_level'],
    'clock_records': ['location_exception_type', 'customer_emotion', 'customer_cooperation', 'customer_health'],
    'notifications': ['type', 'priority', 'category']
  }

  for (const [table, fields] of Object.entries(enumFields)) {
    console.log(`\n[${table}]`)
    console.log('-'.repeat(60))
    
    for (const field of fields) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select(field)
          .not(field, 'is', null)
        
        if (error) {
          console.log(`  ${field}: ❌ ${error.message}`)
          continue
        }
        
        // 獲取唯一值
        const uniqueValues = [...new Set(data.map(item => item[field]))].sort()
        console.log(`  ${field}: ${uniqueValues.join(', ')}`)
        
      } catch (err) {
        console.log(`  ${field}: ❌ ${err.message}`)
      }
    }
  }
}

// 執行
async function main() {
  await checkDatabaseStructure()
  await checkEnumTypes()
}

main().catch(console.error)
