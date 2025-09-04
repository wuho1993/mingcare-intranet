// Supabase 用戶管理功能診斷
// 專門檢查用戶創建/刪除功能

const { createClient } = require('@supabase/supabase-js');

// 載入環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

console.log('🚨 Supabase 用戶管理功能診斷');
console.log('==============================');
console.log('檢查用戶創建/刪除功能是否正常\n');

// 使用匿名金鑰的客戶端
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// 使用服務金鑰的客戶端（用於管理操作）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUserCreation() {
  console.log('📝 測試用戶創建功能...');
  console.log('=' .repeat(40));
  
  try {
    // 測試用假資料創建用戶
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`嘗試創建測試用戶: ${testEmail}`);
    
    const { data, error } = await supabaseAnon.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log('❌ 用戶創建失敗:');
      console.log('  錯誤類型:', error.name);
      console.log('  錯誤訊息:', error.message);
      console.log('  錯誤狀態:', error.status || 'N/A');
      
      // 分析錯誤類型
      if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
        console.log('🔍 診斷: 認證服務不可用 (503錯誤)');
      } else if (error.message.includes('signup')) {
        console.log('🔍 診斷: 用戶註冊功能被停用');
      } else if (error.message.includes('upstream')) {
        console.log('🔍 診斷: 上游連接錯誤 - 認證服務故障');
      } else if (error.message.includes('disabled')) {
        console.log('🔍 診斷: 認證功能被停用');
      }
    } else {
      console.log('✅ 用戶創建成功:');
      console.log('  用戶ID:', data.user?.id);
      console.log('  Email:', data.user?.email);
      console.log('  需要確認:', !data.user?.email_confirmed_at);
      
      return data.user?.id; // 返回用戶ID用於後續測試
    }
  } catch (err) {
    console.log('❌ 用戶創建發生異常:', err.message);
  }
  
  return null;
}

async function testUserDeletion(userId) {
  console.log('\n🗑️  測試用戶刪除功能...');
  console.log('=' .repeat(40));
  
  if (!userId) {
    console.log('⚠️  沒有可刪除的測試用戶');
    return;
  }
  
  try {
    console.log(`嘗試刪除測試用戶: ${userId}`);
    
    // 使用管理員權限刪除用戶
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      console.log('❌ 用戶刪除失敗:');
      console.log('  錯誤類型:', error.name);
      console.log('  錯誤訊息:', error.message);
      console.log('  錯誤狀態:', error.status || 'N/A');
    } else {
      console.log('✅ 用戶刪除成功');
    }
  } catch (err) {
    console.log('❌ 用戶刪除發生異常:', err.message);
  }
}

async function testPasswordReset() {
  console.log('\n🔑 測試密碼重置功能...');
  console.log('=' .repeat(40));
  
  try {
    const { data, error } = await supabaseAnon.auth.resetPasswordForEmail(
      'test@example.com',
      { redirectTo: 'http://localhost:3000/reset-password' }
    );
    
    if (error) {
      console.log('❌ 密碼重置失敗:');
      console.log('  錯誤訊息:', error.message);
      
      if (error.message.includes('upstream')) {
        console.log('🔍 診斷: 這確認了上游連接問題');
      }
    } else {
      console.log('✅ 密碼重置請求成功發送');
    }
  } catch (err) {
    console.log('❌ 密碼重置發生異常:', err.message);
  }
}

async function testAuthEndpoints() {
  console.log('\n🔗 測試認證端點可用性...');
  console.log('=' .repeat(40));
  
  const endpoints = [
    '/auth/v1/signup',
    '/auth/v1/token',
    '/auth/v1/user',
    '/auth/v1/recover'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = supabaseUrl + endpoint;
      console.log(`檢查端點: ${endpoint}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({})
      });
      
      console.log(`  狀態碼: ${response.status} (${response.statusText})`);
      
      if (response.status === 503) {
        console.log('  🚨 服務不可用');
      } else if (response.status === 400) {
        console.log('  ✅ 端點可用 (400是預期的，因為請求無效)');
      } else if (response.status === 200) {
        console.log('  ✅ 端點正常回應');
      }
    } catch (err) {
      console.log(`  ❌ 連接失敗: ${err.message}`);
    }
  }
}

async function checkAuthSettings() {
  console.log('\n⚙️  檢查認證設定...');
  console.log('=' .repeat(40));
  
  try {
    // 嘗試獲取當前會話
    const { data: session, error } = await supabaseAnon.auth.getSession();
    
    if (error) {
      console.log('❌ 獲取會話失敗:', error.message);
    } else {
      console.log('✅ 會話檢查成功');
      console.log('  當前狀態:', session?.session ? '已登入' : '未登入');
    }
    
    // 檢查用戶資料
    const { data: user } = await supabaseAnon.auth.getUser();
    console.log('  用戶資料:', user?.user ? '有效' : '無效');
    
  } catch (err) {
    console.log('❌ 檢查認證設定失敗:', err.message);
  }
}

async function runUserManagementDiagnostics() {
  console.log('開始時間:', new Date().toLocaleString());
  console.log('Supabase URL:', supabaseUrl);
  console.log('使用匿名金鑰測試用戶操作\n');
  
  await checkAuthSettings();
  await testAuthEndpoints();
  
  const userId = await testUserCreation();
  await testUserDeletion(userId);
  await testPasswordReset();
  
  console.log('\n💡 診斷總結:');
  console.log('=============');
  console.log('如果看到大量 503 錯誤或上游連接錯誤，這表示:');
  console.log('1. Supabase 認證服務完全故障');
  console.log('2. 可能是電話認證配置破壞了整個認證系統');
  console.log('3. 需要在 Supabase 儀表板中重置所有認證設定');
  console.log('4. 或者聯繫 Supabase 支援尋求協助');
  
  console.log('\n🔧 建議的修復步驟:');
  console.log('1. 前往 Supabase 儀表板');
  console.log('2. Authentication → Settings');
  console.log('3. 停用所有非必要的認證提供者');
  console.log('4. 僅保留 Email/Password');
  console.log('5. 保存設定並等待 10-15 分鐘');
  console.log('6. 如果仍無效，聯繫 Supabase 支援');
}

runUserManagementDiagnostics().catch(console.error);
