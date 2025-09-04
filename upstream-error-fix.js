// Supabase 設定檢查和重置建議
// 針對 "upstream connect error" 問題的診斷

console.log('🚨 Supabase 上游連接錯誤診斷');
console.log('==============================');
console.log('錯誤: upstream connect error or disconnect/reset before headers');
console.log('這通常表示 Supabase 認證服務的配置問題\n');

console.log('🔍 問題分析:');
console.log('1. "upstream connect error" = 後端服務無法連接');
console.log('2. "transport failure reason: delayed connect error: 111" = 連接被拒絕');
console.log('3. 密碼重置失敗 = 認證服務整體故障\n');

console.log('💡 可能的根本原因:');
console.log('1. 電話認證配置破壞了認證服務');
console.log('2. SMS 提供者配置錯誤導致整個認證系統故障');
console.log('3. 認證服務重啟但配置不一致');
console.log('4. Supabase 項目可能需要重新啟動\n');

console.log('🔧 立即解決步驟:');
console.log('================\n');

console.log('步驟 1: 完全重置認證設定');
console.log('前往 Supabase 儀表板 → Authentication → Settings');
console.log('- 停用所有非必要的認證提供者');
console.log('- 僅保留 Email/Password');
console.log('- 確保 Site URL 正確\n');

console.log('步驟 2: 檢查項目狀態');
console.log('在 Supabase 儀表板 → Project Settings → General');
console.log('- 檢查項目是否處於 "Active" 狀態');
console.log('- 檢查是否有任何警告或錯誤訊息');
console.log('- 查看項目使用量是否超限\n');

console.log('步驟 3: 重新啟動項目 (如果可能)');
console.log('在某些情況下，Supabase 允許重新啟動項目:');
console.log('- 前往 Project Settings → General');
console.log('- 尋找 "Restart project" 或類似選項');
console.log('- 如果沒有此選項，請聯繫 Supabase 支援\n');

console.log('步驟 4: 檢查 Supabase 狀態頁面');
console.log('前往: https://status.supabase.com');
console.log('- 檢查是否有當前的服務中斷');
console.log('- 查看您的區域是否受影響\n');

console.log('步驟 5: 使用 Supabase CLI 診斷');
console.log('如果安裝了 Supabase CLI:');
console.log('$ supabase status');
console.log('$ supabase projects list');
console.log('$ supabase projects api-keys\n');

console.log('🆘 緊急恢復方案:');
console.log('================\n');

console.log('方案 A: 創建最小化認證設定');
console.log('1. 前往 Authentication → Settings');
console.log('2. 停用所有提供者除了:');
console.log('   ✅ Email/Password (必須)');
console.log('   ❌ Phone (停用)');
console.log('   ❌ Google (暫時停用)');
console.log('   ❌ GitHub (暫時停用)');
console.log('3. Site URL 設為: http://localhost:3000');
console.log('4. 保存並等待 5-10 分鐘\n');

console.log('方案 B: 檢查 API 金鑰');
console.log('1. 前往 Project Settings → API');
console.log('2. 檢查 anon/public key 是否正確');
console.log('3. 如果懷疑金鑰問題，可以重新生成');
console.log('4. 更新 .env.local 檔案中的金鑰\n');

console.log('方案 C: 聯繫 Supabase 支援');
console.log('如果上述方法都無效:');
console.log('1. 前往 Supabase 儀表板 → Help & Support');
console.log('2. 提供項目 ID: cvkxlvdicympakfecgvv');
console.log('3. 描述問題: 認證服務 503/upstream connect error');
console.log('4. 提及今天配置了電話認證後出現問題\n');

console.log('🔍 檢查清單:');
console.log('□ Supabase 項目狀態正常');
console.log('□ 僅啟用 Email/Password 認證');
console.log('□ Site URL 設定正確');
console.log('□ API 金鑰有效');
console.log('□ 沒有使用量超限');
console.log('□ 等待足夠的時間讓設定生效 (5-10分鐘)');
console.log('□ 清除本地認證快取\n');

console.log('⏰ 時間線建議:');
console.log('1. 立即執行設定更改 (0-5分鐘)');
console.log('2. 等待設定生效 (5-10分鐘)');
console.log('3. 測試認證功能 (10-15分鐘)');
console.log('4. 如果仍有問題，聯繫支援 (15分鐘後)\n');

console.log('完成上述步驟後，請告訴我結果！');
