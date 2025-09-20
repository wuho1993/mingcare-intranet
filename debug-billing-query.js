// Debug script for billing_salary_data query
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldkgchugpihwqclahqld.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2djaHVncGlod3FjbGFocWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxNzUxNjUsImV4cCI6MjA0Nzc1MTE2NX0.n6mh6_HKLyeHRgKzlBhXbWBs0EWj6gLNLJKkOgNLMfU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugBillingQuery() {
  console.log('=== Debug Billing Query ===')
  
  // Get current date info
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
  
  console.log('Current date info:')
  console.log('- Current date:', now.toISOString().split('T')[0])
  console.log('- Current year:', currentYear)
  console.log('- Current month:', currentMonth + 1) // JS months are 0-indexed
  console.log('- Start of month:', startOfMonth)
  console.log('- End of month:', endOfMonth)
  
  // Check what project_category values exist
  console.log('\n=== Checking project_category values ===')
  const { data: categoryData, error: categoryError } = await supabase
    .from('billing_salary_data')
    .select('project_category')
    .limit(100)
  
  if (categoryError) {
    console.error('Error getting categories:', categoryError)
  } else {
    const uniqueCategories = [...new Set(categoryData.map(d => d.project_category))]
    console.log('Unique project_category values:', uniqueCategories)
  }
  
  // Check if there are any records this month
  console.log('\n=== Checking records for this month ===')
  const { data: monthData, error: monthError } = await supabase
    .from('billing_salary_data')
    .select('service_date, project_category, customer_id, customer_name')
    .gte('service_date', startOfMonth)
    .lte('service_date', endOfMonth)
    .limit(50)
  
  if (monthError) {
    console.error('Error getting month data:', monthError)
  } else {
    console.log(`Found ${monthData.length} records for this month`)
    if (monthData.length > 0) {
      console.log('Sample records:')
      monthData.slice(0, 5).forEach((record, i) => {
        console.log(`  ${i+1}. Date: ${record.service_date}, Category: ${record.project_category}, Customer: ${record.customer_name || record.customer_id}`)
      })
    }
  }
  
  // Check specifically for MC社區券 records
  console.log('\n=== Checking MC社區券(醫點）records ===')
  const { data: voucherData, error: voucherError } = await supabase
    .from('billing_salary_data')
    .select('service_date, customer_id, customer_name')
    .eq('project_category', 'MC社區券(醫點）')
    .limit(10)
  
  if (voucherError) {
    console.error('Error getting voucher data:', voucherError)
  } else {
    console.log(`Found ${voucherData.length} MC社區券(醫點）records total`)
    if (voucherData.length > 0) {
      console.log('Sample voucher records:')
      voucherData.slice(0, 5).forEach((record, i) => {
        console.log(`  ${i+1}. Date: ${record.service_date}, Customer: ${record.customer_name || record.customer_id}`)
      })
    }
  }
  
  // Check for this month specifically
  console.log('\n=== Checking MC社區券(醫點）records for this month ===')
  const { data: monthVoucherData, error: monthVoucherError } = await supabase
    .from('billing_salary_data')
    .select('service_date, customer_id, customer_name')
    .gte('service_date', startOfMonth)
    .lte('service_date', endOfMonth)
    .eq('project_category', 'MC社區券(醫點）')
  
  if (monthVoucherError) {
    console.error('Error getting month voucher data:', monthVoucherError)
  } else {
    console.log(`Found ${monthVoucherData.length} MC社區券(醫點）records for this month`)
    if (monthVoucherData.length > 0) {
      console.log('This month voucher records:')
      monthVoucherData.forEach((record, i) => {
        console.log(`  ${i+1}. Date: ${record.service_date}, Customer: ${record.customer_name || record.customer_id}`)
      })
    }
  }
}

debugBillingQuery().catch(console.error)