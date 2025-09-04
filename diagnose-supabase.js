const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// 從環境變數載入配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase 服務診斷');
console.log('==================');
console.log('Supabase URL:', supabaseUrl);
console.log('時間:', new Date().toLocaleString());

// 1. 檢查 Supabase 服務狀態
async function checkSupabaseStatus() {
  console.log('\n📡 檢查 Supabase 服務狀態...');
  
  try {
    // 檢查官方狀態頁面
    const statusResponse = await fetch('https://status.supabase.com/api/v2/status.json');
    const statusData = await statusResponse.json();
    console.log('📊 Supabase 官方狀態:', statusData.status?.description || '未知');
  } catch (error) {
    console.log('⚠️  無法獲取官方狀態');
  }

  // 檢查你的 Supabase 實例
  try {
    const healthUrl = supabaseUrl.replace('/auth/v1', '') + '/health';
    console.log('🏥 檢查實例健康狀態:', healthUrl);
    
    const response = await fetch(healthUrl);
    console.log('實例狀態碼:', response.status);
    
    if (response.ok) {
      console.log('✅ Supabase 實例運行正常');
    } else {
      console.log('❌ Supabase 實例可能有問題');
    }
  } catch (error) {
    console.log('❌ 無法連接到 Supabase 實例:', error.message);
  }
}

// 2. 檢查認證端點
async function checkAuthEndpoint() {
  console.log('\n🔐 檢查認證端點...');
  
  const authUrl = supabaseUrl + '/auth/v1/token?grant_type=refresh_token';
  console.log('認證端點:', authUrl);
  
  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey || 'test'
      },
      body: JSON.stringify({})
    });
    
    console.log('認證端點狀態碼:', response.status);
    console.log('認證端點狀態文字:', response.statusText);
    
    if (response.status === 503) {
      console.log('❌ 服務不可用 (503) - Supabase 可能正在維護或過載');
    } else if (response.status === 400) {
      console.log('✅ 端點可達（400 是預期的，因為沒有有效的 refresh token）');
    }
  } catch (error) {
    console.log('❌ 認證端點錯誤:', error.message);
  }
}

// 3. 檢查網路連接
async function checkNetworkConnectivity() {
  console.log('\n🌐 檢查網路連接...');
  
  try {
    const response = await fetch('https://www.google.com', { method: 'HEAD' });
    console.log('✅ 網路連接正常');
  } catch (error) {
    console.log('❌ 網路連接問題:', error.message);
  }
}

// 4. 測試基本 Supabase 客戶端
async function testSupabaseClient() {
  console.log('\n🧪 測試 Supabase 客戶端...');
  
  if (!supabaseAnonKey) {
    console.log('❌ 缺少 SUPABASE_ANON_KEY');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 嘗試簡單的查詢
    const { data, error } = await supabase
      .from('customer_personal_data')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Supabase 查詢錯誤:', error.message);
    } else {
      console.log('✅ Supabase 客戶端工作正常');
    }
  } catch (error) {
    console.log('❌ Supabase 客戶端錯誤:', error.message);
  }
}

// 執行所有檢查
async function runDiagnostics() {
  await checkSupabaseStatus();
  await checkAuthEndpoint();
  await checkNetworkConnectivity();
  await testSupabaseClient();
  
  console.log('\n💡 建議解決方案:');
  console.log('1. 檢查 Supabase 狀態頁面: https://status.supabase.com');
  console.log('2. 等待幾分鐘後重試（服務可能正在重啟）');
  console.log('3. 檢查您的 Supabase 項目儀表板');
  console.log('4. 確認您的 API 金鑰沒有過期');
  console.log('5. 如果問題持續，聯繫 Supabase 支援');
}

runDiagnostics().catch(console.error);
