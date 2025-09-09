// 在瀏覽器控制台中運行此腳本來測試編輯/刪除功能
console.log('🔍 開始測試編輯/刪除功能...')

// 測試更新功能
async function testUpdate() {
  try {
    console.log('🔄 測試更新功能...')
    
    // 使用你自己的 updateBillingSalaryRecord 函數
    const testFormData = {
      customer_name: "測試客戶名稱",
      service_date: "2024-09-09",
      start_time: "09:00",
      end_time: "10:00",
      service_hours: 1,
      service_type: "護理服務",
      service_address: "測試地址",
      care_staff_name: "測試護理員",
      project_category: "長期護理",
      project_manager: "測試經理",
      service_fee: 100,
      staff_salary: 80
    }
    
    // 這裡需要一個真實的記錄 ID
    // 請在詳細報表頁面找到一筆記錄，複製其 ID
    const testRecordId = "請替換為真實的記錄ID"
    
    if (testRecordId === "請替換為真實的記錄ID") {
      console.log('⚠️ 請先設置一個真實的記錄 ID 來測試')
      return
    }
    
    // 如果你的頁面已載入 updateBillingSalaryRecord 函數
    if (typeof updateBillingSalaryRecord !== 'undefined') {
      const result = await updateBillingSalaryRecord(testRecordId, testFormData)
      console.log('✅ 更新測試結果:', result)
    } else {
      console.log('❌ updateBillingSalaryRecord 函數未找到')
    }
    
  } catch (error) {
    console.error('❌ 更新測試失敗:', error)
  }
}

// 測試刪除功能
async function testDelete() {
  try {
    console.log('🗑️ 測試刪除功能...')
    
    // 使用一個不存在的 ID 來測試權限
    const testRecordId = "test-non-existent-id"
    
    // 如果你的頁面已載入 deleteBillingSalaryRecord 函數
    if (typeof deleteBillingSalaryRecord !== 'undefined') {
      const result = await deleteBillingSalaryRecord(testRecordId)
      console.log('✅ 刪除測試結果:', result)
    } else {
      console.log('❌ deleteBillingSalaryRecord 函數未找到')
    }
    
  } catch (error) {
    console.error('❌ 刪除測試失敗:', error)
  }
}

console.log('📋 使用說明:')
console.log('1. 在詳細報表頁面打開此控制台')
console.log('2. 運行 testUpdate() 來測試更新功能')
console.log('3. 運行 testDelete() 來測試刪除功能')
console.log('4. 檢查編輯/刪除按鈕是否正常工作')

// 讓函數在全局可用
window.testUpdate = testUpdate
window.testDelete = testDelete
