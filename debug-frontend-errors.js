// 前端錯誤捕獲和調試工具
window.originalConsoleError = console.error;
window.debugErrors = [];

// 重寫 console.error 來捕獲所有錯誤
console.error = function(...args) {
  // 記錄錯誤
  window.debugErrors.push({
    timestamp: new Date().toISOString(),
    args: args,
    stack: new Error().stack
  });
  
  // 檢查是否是我們關心的錯誤
  const errorStr = args.join(' ');
  if (errorStr.includes('Cannot read properties of null') && errorStr.includes('length')) {
    console.log('🚨 捕獲到 NULL LENGTH 錯誤:', args);
    console.log('錯誤堆疊:', new Error().stack);
    
    // 記錄當前狀態
    console.log('當前 React 組件狀態檢查:');
    
    // 檢查可能的問題變數
    if (typeof window !== 'undefined') {
      // 嘗試訪問 React DevTools 或全局狀態
      console.log('window 對象存在，進行狀態檢查...');
    }
  }
  
  // 呼叫原始的 console.error
  window.originalConsoleError.apply(console, args);
};

// 全局未處理錯誤捕獲
window.addEventListener('error', function(event) {
  console.log('🚨 全局錯誤捕獲:', event.error);
  if (event.error && event.error.message && event.error.message.includes('Cannot read properties of null')) {
    console.log('錯誤詳細信息:', {
      message: event.error.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error.stack
    });
  }
});

// Promise 未處理拒絕捕獲
window.addEventListener('unhandledrejection', function(event) {
  console.log('🚨 未處理的 Promise 拒絕:', event.reason);
});

// 添加一個全局函數來檢查當前錯誤
window.checkDebugErrors = function() {
  console.log('累積的錯誤數量:', window.debugErrors.length);
  return window.debugErrors;
};

// 每5秒檢查一次是否有新錯誤
setInterval(() => {
  const recentErrors = window.debugErrors.filter(error => {
    const errorTime = new Date(error.timestamp);
    const now = new Date();
    return (now - errorTime) < 5000; // 5秒內的錯誤
  });
  
  if (recentErrors.length > 0) {
    console.log('⚠️ 最近5秒內的錯誤:', recentErrors);
  }
}, 5000);

console.log('🔧 前端錯誤調試工具已啟動');
console.log('使用 window.checkDebugErrors() 查看所有錯誤');
