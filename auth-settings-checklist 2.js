// 🔧 Supabase 認證設定檢查清單
// 請在 Supabase 儀表板逐一確認以下設定

console.log('🔧 Supabase 認證設定檢查清單');
console.log('================================');
console.log('項目 ID: cvkxlvdicympakfecgvv');
console.log('儀表板: https://supabase.com/dashboard/project/cvkxlvdicympakfecgvv\n');

console.log('📍 前往 Authentication > Settings');
console.log('==================================\n');

console.log('✅ 第1部分: 基本認證設定');
console.log('-------------------------');
console.log('□ Enable email sign-ups: ✅ 勾選');
console.log('□ Enable email confirmations: ❌ 取消勾選 (暫時)');
console.log('□ Enable secure email change: ❌ 取消勾選 (暫時)');
console.log('□ Enable manual linking: ❌ 取消勾選\n');

console.log('✅ 第2部分: 電話認證設定');
console.log('-------------------------');
console.log('🔴 所有電話相關選項都必須取消勾選:');
console.log('□ Enable phone sign-ups: ❌ 取消勾選');
console.log('□ Enable phone confirmations: ❌ 取消勾選');
console.log('□ Enable phone change: ❌ 取消勾選\n');

console.log('✅ 第3部分: 第三方認證提供者');
console.log('-----------------------------');
console.log('🔴 所有第三方提供者都必須停用:');
console.log('□ Google: ❌ 停用');
console.log('□ GitHub: ❌ 停用');
console.log('□ Apple: ❌ 停用');
console.log('□ Discord: ❌ 停用');
console.log('□ Facebook: ❌ 停用');
console.log('□ Twitter: ❌ 停用');
console.log('□ 其他所有提供者: ❌ 停用\n');

console.log('✅ 第4部分: SMS Provider 設定');
console.log('-----------------------------');
console.log('🔴 清空所有 SMS 相關欄位:');
console.log('□ Twilio Account SID: [空白]');
console.log('□ Twilio Auth Token: [空白]');
console.log('□ Twilio Phone Number: [空白]');
console.log('□ 其他 SMS 提供者: [全部清空]\n');

console.log('✅ 第5部分: Site URL 設定');
console.log('-------------------------');
console.log('確保包含以下 URL:');
console.log('□ http://localhost:3000');
console.log('□ https://your-domain.com (如果有)');
console.log('注意: 用逗號分隔多個 URL\n');

console.log('✅ 第6部分: JWT 設定');
console.log('--------------------');
console.log('□ JWT expiry: 3600 (預設值)');
console.log('□ 不要設置過短的過期時間\n');

console.log('💾 第7部分: 保存設定');
console.log('--------------------');
console.log('🔴 重要步驟:');
console.log('1. 點擊 "Save" 按鈕');
console.log('2. 等待保存確認訊息');
console.log('3. 等待 15-20 分鐘讓服務重啟\n');

console.log('🔍 第8部分: 額外檢查');
console.log('--------------------');
console.log('如果上述設定都正確，請檢查:');
console.log('');
console.log('□ Project Settings > General');
console.log('  確認項目狀態為 "Active"');
console.log('');
console.log('□ Project Settings > Billing');
console.log('  確認沒有付款問題或服務暫停');
console.log('');
console.log('□ Project Settings > API');
console.log('  確認 API keys 可見且正確\n');

console.log('🆘 故障排除選項');
console.log('================');
console.log('');
console.log('選項 A: 暫時性故障');
console.log('- 檢查 Supabase 狀態: https://status.supabase.com');
console.log('- 等待更長時間 (最多1小時)');
console.log('');
console.log('選項 B: 重新創建認證配置');
console.log('- 在 Authentication > Settings 最下方');
console.log('- 尋找 "Reset to default" 或類似選項');
console.log('');
console.log('選項 C: 聯繫 Supabase 支援');
console.log('- 在儀表板右下角點擊 "Support"');
console.log('- 或前往 Discord: https://discord.supabase.com');
console.log('- 提供項目 ID: cvkxlvdicympakfecgvv');
console.log('- 說明: "電話認證配置後認證服務完全故障"\n');

console.log('📞 支援資訊');
console.log('===========');
console.log('項目 ID: cvkxlvdicympakfecgvv');
console.log('錯誤: 所有 /auth/v1/* 端點返回 503');
console.log('狀態: 資料庫正常，僅認證服務故障');
console.log('原因: 電話認證配置導致認證服務無法啟動\n');

console.log('請逐一檢查上述設定，然後告訴我結果！');
