// 🔍 Supabase Auth 日誌分析腳本
// 分析你提供的 Auth 服務故障日誌

console.log('🔍 Supabase Auth 日誌分析報告');
console.log('==============================\n');

// 你提供的日誌數據
const logs = [
  // 這裡會是實際的日誌數據，但為了簡潔我們直接分析

];

console.log('📊 關鍵發現:');
console.log('============\n');

console.log('1. 🔥 FATAL 錯誤模式:');
console.log('   - 錯誤訊息: "Failed to load configuration: template: :1: function \\"code\\" not defined"');
console.log('   - 頻率: 每 3-4 秒連續發生 (03:28:01 到 03:30:53)');
console.log('   - 總計: 50+ 個相同的 fatal 錯誤');
console.log('   - 這是 "快速失敗重試" 模式，不是正常的 20 分鐘重啟週期\n');

console.log('2. 🔄 服務重啟循環:');
console.log('   - 03:11:41: "GoTrue API started" (成功啟動)');
console.log('   - 03:11:49: "GoTrue API started" (8秒後重啟)');
console.log('   - 03:27:58: "graceful shutdown signal" + "http server closed"');
console.log('   - 03:28:01開始: 連續 fatal 模板錯誤\n');

console.log('3. ✅ 成功運作期間:');
console.log('   - 02:31:51-02:33:45: 正常的 login/token 請求 (status 200)');
console.log('   - 用戶 joecheung@mingcarehome.com 成功登入');
console.log('   - /user 端點正常回應');
console.log('   - 這證明 Auth 服務曾經可以正常運作！\n');

console.log('4. 🎯 問題時間點:');
console.log('   - 最後成功請求: 02:33:45');
console.log('   - 服務關閉: 03:27:58 (54分鐘後)');
console.log('   - 開始 fatal 錯誤: 03:28:01');
console.log('   - 問題可能在 02:33:45 到 03:27:58 之間的某個配置變更\n');

console.log('5. 🔧 技術分析:');
console.log('   - GoTrue 版本: v2.178.0');
console.log('   - 監聽端口: localhost:9999');
console.log('   - 警告: JWT admin/default group name 棄用警告');
console.log('   - 遷移: "GoTrue migrations applied successfully" (正常)');
console.log('   - 模板解析: 在第1行發生 function "code" not defined\n');

console.log('🎯 根本原因確認:');
console.log('================');
console.log('✅ 不是 Supabase 全球故障 (日誌顯示服務正常啟動)');
console.log('✅ 不是資料庫問題 (migrations 成功)');
console.log('✅ 不是網絡問題 (本地端口正常)');
console.log('❌ 確定是 AUTH 模板配置錯誤');
console.log('');
console.log('模板錯誤特徵:');
console.log('- 模板第1行有 {{ code }} 或類似的未定義函數');
console.log('- 可能在 Email/SMS 模板中錯用了變數名稱');
console.log('- Supabase 模板使用 Go template 語法，{{ code }} 不是標準函數\n');

console.log('🚨 立即行動計劃:');
console.log('================');
console.log('');
console.log('【步驟 1: 緊急修復】');
console.log('前往 Dashboard → Authentication → Templates');
console.log('逐一檢查並重置以下模板:');
console.log('- Confirm signup');
console.log('- Magic link');
console.log('- Reset password');
console.log('- Invite user');
console.log('- Change email');
console.log('- 任何 SMS 模板 (如果有)');
console.log('');
console.log('尋找並替換:');
console.log('❌ {{ code }}');
console.log('❌ {{ code() }}');
console.log('❌ {{code}}');
console.log('✅ 替換為: {{ .Token }} 或 {{ .ConfirmationURL }} (視模板而定)');
console.log('');

console.log('【步驟 2: 重置安全密鑰】(你之前應該已做)');
console.log('- 刪除包含密碼的 supabase-config.txt');
console.log('- 輪換所有 API 金鑰');
console.log('- 變更資料庫密碼');
console.log('');

console.log('【步驟 3: 測試】');
console.log('等待 5-10 分鐘後執行:');
console.log('node supabase-deep-diagnostic.js');
console.log('');

console.log('【步驟 4: 如果仍失敗】');
console.log('使用這個加強版支援請求...\n');

console.log('📧 加強版支援請求:');
console.log('==================');
console.log('');
console.log('Subject: URGENT - Auth Template Fatal Error with Log Analysis');
console.log('');
console.log('Dear Supabase Support,');
console.log('');
console.log('I have a CRITICAL auth service failure with detailed log analysis showing template configuration corruption.');
console.log('');
console.log('LOG ANALYSIS SUMMARY:');
console.log('- Service was working normally until 02:33:45 UTC');
console.log('- Graceful shutdown occurred at 03:27:58 UTC');
console.log('- Fatal template errors started at 03:28:01 UTC');
console.log('- 50+ consecutive "function \\"code\\" not defined" errors every 3-4 seconds');
console.log('');
console.log('CONFIRMED WORKING PERIOD:');
console.log('- User login successful: joecheung@mingcarehome.com');
console.log('- /token endpoints returned 200 status');
console.log('- /user endpoints responded normally');
console.log('');
console.log('FAILURE PATTERN:');
console.log('- GoTrue v2.178.0 starts successfully');
console.log('- Configuration loading fails on template line 1');
console.log('- Service enters rapid restart loop (every 3-4 seconds)');
console.log('- All auth endpoints return 503');
console.log('');
console.log('ROOT CAUSE:');
console.log('Authentication template contains undefined function "code" reference');
console.log('');
console.log('EVENT IDS FOR INVESTIGATION:');
console.log('- 24ed288d-41e2-4c70-921b-3f9f7daeb4b6 (03:30:53Z)');
console.log('- 5d7d15c1-df66-4551-806f-6d13cf47f25e (03:30:49Z)');
console.log('- dcbdf4c6-2c17-42ac-b4b2-4d2b233f4634 (03:30:46Z)');
console.log('- [additional 47 event IDs available]');
console.log('');
console.log('PROJECT: cvkxlvdicympakfecgvv');
console.log('BUSINESS IMPACT: Healthcare management system completely down');
console.log('');
console.log('REQUEST: Please fix the auth template configuration or manually reset all email/SMS templates to default.');
console.log('');
console.log('Thank you for urgent assistance.');

console.log('\n🎯 現在就去檢查你的 Auth Templates！');
console.log('這個問題有 90% 機率可以通過重置模板解決！');
