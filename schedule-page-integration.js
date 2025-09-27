// 🗓️ 排班頁面整合範例
// Integration Example for Scheduling Page

import { initSweetMessages, celebrateTaskCompletion, sweetMessageController } from './sweet-message-controller.js';

// 在排班頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
  // 獲取當前用戶 email（從你的認證系統）
  const currentUser = getCurrentUser(); // 你的用戶獲取函數
  
  if (currentUser && currentUser.email === 'kanasleung@mingcarehome.com') {
    // 初始化甜蜜訊息系統
    initSweetMessages(currentUser.email);
    
    console.log('💕 Kanas 專屬甜蜜訊息系統已啟動');
  }
});

// 在排班保存成功時觸發慶祝訊息
function handleScheduleSave() {
  // 你的排班保存邏輯
  saveScheduleToDatabase()
    .then(() => {
      // 保存成功後觸發慶祝訊息
      if (getCurrentUser().email === 'kanasleung@mingcarehome.com') {
        celebrateTaskCompletion();
      }
    })
    .catch(error => {
      console.error('排班保存失敗:', error);
    });
}

// 頁面卸載時清理定時器
window.addEventListener('beforeunload', function() {
  sweetMessageController.stop();
});

// 模擬的用戶獲取函數（替換為你的實際函數）
function getCurrentUser() {
  // 這裡應該是你的實際用戶獲取邏輯
  return {
    email: 'kanasleung@mingcarehome.com',
    name: 'Kanas Leung'
  };
}

// 模擬的排班保存函數（替換為你的實際函數）
function saveScheduleToDatabase() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('排班保存成功');
    }, 1000);
  });
}

console.log('🗓️ 排班頁面甜蜜訊息整合完成！');