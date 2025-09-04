// Supabase 認證設定恢復指南 - 移除電話認證，恢復到原始設定

console.log('🔧 Supabase 認證設定恢復指南');
console.log('===========================');
console.log('目標: 移除電話認證，恢復到僅 Email/Password 認證\n');

console.log('📋 步驟 1: 前往 Supabase 儀表板');
console.log('1. 打開瀏覽器，前往: https://supabase.com/dashboard');
console.log('2. 選擇您的項目: cvkxlvdicympakfecgvv');
console.log('3. 在左側選單點擊 "Authentication"\n');

console.log('📋 步驟 2: 停用電話認證');
console.log('1. 在 Authentication 頁面，點擊 "Settings" 標籤');
console.log('2. 向下滾動找到 "Phone Auth" 區段');
console.log('3. 關閉以下開關:');
console.log('   ❌ "Enable phone sign-ups"');
console.log('   ❌ "Enable phone confirmations"');
console.log('4. 如果有 SMS Provider 設定，暫時清除或停用\n');

console.log('📋 步驟 3: 確認 Email 認證設定');
console.log('在同一個 Settings 頁面:');
console.log('1. 找到 "Email Auth" 區段');
console.log('2. 確保以下設定正確:');
console.log('   ✅ "Enable email confirmations" (根據需要)');
console.log('   ✅ "Enable email sign-ups" (應該開啟)');
console.log('   ✅ "Secure email change" (根據需要)\n');

console.log('📋 步驟 4: 檢查 Site URL 設定');
console.log('1. 在 Settings 頁面最上方找到 "Site URL"');
console.log('2. 確保包含以下 URL (用逗號分隔):');
console.log('   - http://localhost:3000');
console.log('   - 您的生產環境 URL (如果有)\n');

console.log('📋 步驟 5: 移除 SMS 提供者設定 (如果有)');
console.log('1. 在 Settings 頁面找到 "SMS Provider"');
console.log('2. 如果有設定 Twilio 或其他提供者:');
console.log('   - 清空 Account SID');
console.log('   - 清空 Auth Token');
console.log('   - 清空 Phone Number');
console.log('3. 保存設定\n');

console.log('📋 步驟 6: 重置認證流程 (如有需要)');
console.log('1. 檢查 "Email Templates" 標籤');
console.log('2. 確保模板沒有包含電話相關內容');
console.log('3. 如果有自定義模板，確保指向正確的 URL\n');

console.log('📋 步驟 7: 保存並等待');
console.log('1. 點擊 "Save" 按鈕保存所有更改');
console.log('2. 等待 2-3 分鐘讓設定生效');
console.log('3. Supabase 需要時間重新配置認證服務\n');

console.log('🧪 步驟 8: 測試恢復');
console.log('完成上述步驟後:');
console.log('1. 清除瀏覽器 localStorage');
console.log('2. 重新啟動您的開發服務器');
console.log('3. 嘗試登入測試\n');

console.log('⚠️  重要提醒:');
console.log('- 更改認證設定後，現有用戶的 session 可能會失效');
console.log('- 確保有備用的管理員帳戶可以重新登入');
console.log('- 如果問題仍然存在，可能需要聯繫 Supabase 支援\n');

console.log('🎯 最小化認證設定建議:');
console.log('為了確保穩定性，建議僅保留:');
console.log('✅ Email/Password 認證');
console.log('❌ 暫時移除所有第三方認證 (Google, GitHub 等)');
console.log('❌ 暫時移除電話認證');
console.log('❌ 暫時移除 Magic Link (如果有問題)\n');

console.log('完成這些步驟後，請回來讓我知道結果！');
