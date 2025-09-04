// 本地認證資料清除腳本 - 在更改 Supabase 設定後使用

console.log('🧹 本地認證資料清除腳本');
console.log('========================');
console.log('請在完成 Supabase 儀表板設定更改後執行此腳本\n');

console.log('📱 請先在瀏覽器中執行以下步驟:');
console.log('1. 按 F12 開啟開發者工具');
console.log('2. 前往 Console 標籤');
console.log('3. 複製並貼上以下代碼:\n');

console.log('// 清除所有 Supabase 認證相關的 localStorage');
console.log('Object.keys(localStorage).forEach(key => {');
console.log('  if (key.includes("supabase") || key.includes("sb-cvkxlvdicympakfecgvv")) {');
console.log('    console.log("清除:", key);');
console.log('    localStorage.removeItem(key);');
console.log('  }');
console.log('});');
console.log('');
console.log('// 也清除 sessionStorage');
console.log('Object.keys(sessionStorage).forEach(key => {');
console.log('  if (key.includes("supabase") || key.includes("sb-cvkxlvdicympakfecgvv")) {');
console.log('    console.log("清除 session:", key);');
console.log('    sessionStorage.removeItem(key);');
console.log('  }');
console.log('});');
console.log('');
console.log('console.log("✅ 本地認證資料已清除");');
console.log('location.reload(); // 重新載入頁面\n');

console.log('🔄 或者，如果您想要硬重置:');
console.log('localStorage.clear();');
console.log('sessionStorage.clear();');
console.log('location.reload();\n');

console.log('⚠️  重要：執行上述腳本後:');
console.log('1. 關閉所有瀏覽器標籤');
console.log('2. 重新開啟瀏覽器');
console.log('3. 前往 http://localhost:3000');
console.log('4. 嘗試重新登入\n');

console.log('🎯 如果問題仍然存在:');
console.log('1. 確認 Supabase 設定已保存');
console.log('2. 等待 5-10 分鐘讓服務重新啟動');
console.log('3. 檢查瀏覽器網路標籤是否仍有 503 錯誤');
console.log('4. 嘗試無痕模式登入\n');

console.log('完成後請告訴我結果！');
