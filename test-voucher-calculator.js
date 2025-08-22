const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testVoucherCalculator() {
  console.log('🔍 測試社區券計數機數據載入...')
  
  try {
    // 1. 測試社區券客戶數據
    console.log('\n1. 測試社區券客戶數據載入:')
    const { data: customers, error: customerError } = await supabase
      .from('customer_personal_data')
      .select('*')
      .eq('customer_type', '社區券客戶')
      .order('customer_name')
      .limit(5)

    if (customerError) {
      console.error('❌ 客戶數據錯誤:', customerError)
    } else {
      console.log(`✅ 找到 ${customers?.length || 0} 個社區券客戶`)
      if (customers && customers.length > 0) {
        console.log('示例客戶:', {
          customer_name: customers[0].customer_name,
          customer_id: customers[0].customer_id,
          copay_level: customers[0].copay_level,
          voucher_number: customers[0].voucher_number
        })
      }
    }

    // 2. 測試voucher_rate表
    console.log('\n2. 測試voucher_rate數據:')
    const { data: rates, error: rateError } = await supabase
      .from('voucher_rate')
      .select('*')

    if (rateError) {
      console.error('❌ voucher_rate錯誤:', rateError)
    } else {
      console.log(`✅ 找到 ${rates?.length || 0} 個收費標準`)
      if (rates && rates.length > 0) {
        rates.forEach(rate => {
          console.log(`- ${rate.service_type}: $${rate.service_rate}`)
        })
      }
    }

    // 3. 測試billing_salary_data連接
    console.log('\n3. 測試billing_salary_data (最近10筆):')
    const { data: billing, error: billingError } = await supabase
      .from('billing_salary_data')
      .select('customer_id, customer_name, service_date, service_type, service_hours, project_category')
      .order('service_date', { ascending: false })
      .limit(10)

    if (billingError) {
      console.error('❌ billing_salary_data錯誤:', billingError)
    } else {
      console.log(`✅ 找到 ${billing?.length || 0} 筆服務記錄`)
      if (billing && billing.length > 0) {
        console.log('最近的記錄:')
        billing.slice(0, 3).forEach(record => {
          console.log(`- ${record.customer_name} (${record.customer_id}): ${record.service_type}, ${record.service_hours}小時, ${record.service_date}`)
        })
      }
    }

    // 4. 測試具體的社區券客戶服務記錄
    if (customers && customers.length > 0) {
      const testCustomer = customers[0]
      console.log(`\n4. 測試客戶 ${testCustomer.customer_name} 的服務記錄:`)
      
      const { data: customerBilling, error: customerBillingError } = await supabase
        .from('billing_salary_data')
        .select('*')
        .eq('customer_id', testCustomer.customer_id)
        .order('service_date', { ascending: false })
        .limit(5)

      if (customerBillingError) {
        console.error('❌ 客戶服務記錄錯誤:', customerBillingError)
      } else {
        console.log(`✅ 客戶 ${testCustomer.customer_name} 有 ${customerBilling?.length || 0} 筆服務記錄`)
        if (customerBilling && customerBilling.length > 0) {
          customerBilling.forEach(record => {
            console.log(`- ${record.service_date}: ${record.service_type}, ${record.service_hours}小時, ${record.project_category}`)
          })
        }
      }
    }

  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error)
  }
}

testVoucherCalculator()
