// Supabase 護理人員資料測試腳本
// 在瀏覽器控制台或 Node.js 環境中運行

const testSupabaseConnection = async () => {
  try {
    console.log('🔍 測試 Supabase 連接...')
    
    // 測試基本連接
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('❌ 認證測試失敗:', authError)
      return false
    }
    console.log('✅ Supabase 認證連接成功')
    
    // 測試護理人員資料表查詢
    console.log('🔍 測試護理人員資料表...')
    const { data: staffData, error: staffError } = await supabase
      .from('care_staff')
      .select('*')
      .limit(5)
    
    if (staffError) {
      console.error('❌ 護理人員資料表查詢失敗:', staffError)
      console.log('💡 請確保已執行 setup-care-staff-tables.sql')
      return false
    }
    
    console.log('✅ 護理人員資料表連接成功')
    console.log('📊 現有護理人員數量:', staffData?.length || 0)
    if (staffData?.length > 0) {
      console.log('👥 護理人員列表:', staffData.map(staff => ({
        name: staff.name,
        email: staff.email,
        status: staff.status
      })))
    }
    
    // 測試新增護理人員 (測試資料)
    console.log('🔍 測試新增護理人員...')
    const testStaffData = {
      name: '測試護理師',
      email: `test.nurse.${Date.now()}@example.com`,
      phone: '0912-000-000',
      address: '測試地址',
      qualifications: '測試證照',
      experience_years: 1,
      specialties: '測試專長',
      status: 'pending'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('care_staff')
      .insert([testStaffData])
      .select()
    
    if (insertError) {
      console.error('❌ 新增護理人員失敗:', insertError)
      return false
    }
    
    console.log('✅ 新增護理人員成功:', insertData[0]?.name)
    
    // 測試更新護理人員
    if (insertData?.[0]?.id) {
      const { error: updateError } = await supabase
        .from('care_staff')
        .update({ status: 'active', notes: '測試更新' })
        .eq('id', insertData[0].id)
      
      if (updateError) {
        console.error('❌ 更新護理人員失敗:', updateError)
      } else {
        console.log('✅ 更新護理人員成功')
      }
    }
    
    // 測試服務記錄表
    console.log('🔍 測試服務記錄表...')
    const { data: servicesData, error: servicesError } = await supabase
      .from('care_staff_services')
      .select('*')
      .limit(5)
    
    if (servicesError) {
      console.error('❌ 服務記錄表查詢失敗:', servicesError)
    } else {
      console.log('✅ 服務記錄表連接成功')
      console.log('📊 服務記錄數量:', servicesData?.length || 0)
    }
    
    // 測試工資記錄表
    console.log('🔍 測試工資記錄表...')
    const { data: payrollData, error: payrollError } = await supabase
      .from('care_staff_payroll')
      .select('*')
      .limit(5)
    
    if (payrollError) {
      console.error('❌ 工資記錄表查詢失敗:', payrollError)
    } else {
      console.log('✅ 工資記錄表連接成功')
      console.log('📊 工資記錄數量:', payrollData?.length || 0)
    }
    
    // 測試委託金表
    console.log('🔍 測試委託金表...')
    const { data: commissionsData, error: commissionsError } = await supabase
      .from('commissions')
      .select('*')
      .limit(5)
    
    if (commissionsError) {
      console.error('❌ 委託金表查詢失敗:', commissionsError)
    } else {
      console.log('✅ 委託金表連接成功')
      console.log('📊 委託金記錄數量:', commissionsData?.length || 0)
    }
    
    console.log('🎉 所有 Supabase 測試完成！')
    return true
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error)
    return false
  }
}

// 導出測試函數
if (typeof window !== 'undefined') {
  // 瀏覽器環境
  window.testSupabaseConnection = testSupabaseConnection
  console.log('💡 在瀏覽器控制台中運行: testSupabaseConnection()')
} else if (typeof module !== 'undefined') {
  // Node.js 環境
  module.exports = { testSupabaseConnection }
}

// 客戶資料測試
const testCustomerData = async () => {
  try {
    console.log('🔍 測試客戶資料表連接...')
    
    const { data: customerData, error: customerError } = await supabase
      .from('customer_personal_data')
      .select('*')
      .limit(5)
    
    if (customerError) {
      console.error('❌ 客戶資料表查詢失敗:', customerError)
      return false
    }
    
    console.log('✅ 客戶資料表連接成功')
    console.log('📊 客戶資料數量:', customerData?.length || 0)
    
    if (customerData?.length > 0) {
      console.log('👥 客戶列表:', customerData.map(customer => ({
        id: customer.customer_id,
        name: customer.customer_name,
        phone: customer.phone
      })))
    }
    
    return true
  } catch (error) {
    console.error('❌ 客戶資料測試失敗:', error)
    return false
  }
}

if (typeof window !== 'undefined') {
  window.testCustomerData = testCustomerData
}