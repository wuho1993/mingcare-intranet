// 測試30分鐘提示功能
// 在瀏覽器控制台運行以下代碼來測試

// 測試客戶更新提示
function testCustomerUpdate(customerId) {
  const updateTime = new Date().toISOString()
  localStorage.setItem(`customer_update_${customerId}`, updateTime)
  window.dispatchEvent(new CustomEvent('customerUpdated', {
    detail: { customerId }
  }))
  console.log(`已觸發客戶 ${customerId} 的更新提示`)
}

// 測試護理人員更新提示
function testStaffUpdate(staffId) {
  const updateTime = new Date().toISOString()
  localStorage.setItem(`staff_update_${staffId}`, updateTime)
  window.dispatchEvent(new CustomEvent('staffUpdated', {
    detail: { staffId }
  }))
  console.log(`已觸發護理人員 ${staffId} 的更新提示`)
}

// 測試服務記錄更新提示
function testRecordUpdate(recordId) {
  const updateTime = new Date().toISOString()
  localStorage.setItem(`record_update_${recordId}`, updateTime)
  window.dispatchEvent(new CustomEvent('recordUpdated', {
    detail: { recordId }
  }))
  console.log(`已觸發服務記錄 ${recordId} 的更新提示`)
}

// 使用範例：
// testCustomerUpdate('C001') // 替換為實際的客戶ID
// testStaffUpdate('S001')   // 替換為實際的護理人員ID
// testRecordUpdate('R001')  // 替換為實際的服務記錄ID

console.log('30分鐘提示測試函數已載入！')
console.log('使用方法：')
console.log('testCustomerUpdate("客戶ID")')
console.log('testStaffUpdate("護理人員ID")')
console.log('testRecordUpdate("服務記錄ID")')