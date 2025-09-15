// 清除瀏覽器中的認證資料和測試登入
console.log('🔧 Supabase 認證修復工具');
console.log('====================');

// 清除 localStorage 中的 Supabase 認證資料
function clearSupabaseAuth() {
  console.log('🗑️  清除 localStorage 中的認證資料...');
  
  const keys = Object.keys(localStorage);
  const supabaseKeys = keys.filter(key => key.includes('supabase'));
  
  console.log('找到的 Supabase 金鑰:', supabaseKeys);
  
  supabaseKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ 已清除: ${key}`);
  });
  
  console.log('🔄 請重新整理頁面並嘗試登入');
}

// 檢查當前認證狀態
function checkAuthStatus() {
  console.log('🔍 檢查認證狀態...');
  
  const keys = Object.keys(localStorage);
  const supabaseKeys = keys.filter(key => key.includes('supabase'));
  
  if (supabaseKeys.length === 0) {
    console.log('✅ 沒有存儲的認證資料');
  } else {
    console.log('⚠️  找到認證資料:');
    supabaseKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value);
        console.log(`  ${key}:`, {
          expires_at: parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString() : 'N/A',
          expires_in: parsed.expires_in || 'N/A',
          token_type: parsed.token_type || 'N/A'
        });
      } catch (e) {
        console.log(`  ${key}: ${value.substring(0, 50)}...`);
      }
    });
  }
}

// 提供修復選項
console.log('選擇操作:');
console.log('1. 在瀏覽器控制台中執行: checkAuthStatus()');
console.log('2. 在瀏覽器控制台中執行: clearSupabaseAuth()');
console.log('3. 然後重新整理頁面嘗試登入');

// 讓這些函數在全域可用
if (typeof window !== 'undefined') {
  window.checkAuthStatus = checkAuthStatus;
  window.clearSupabaseAuth = clearSupabaseAuth;
}
