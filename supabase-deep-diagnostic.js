const { createClient } = require('@supabase/supabase-js');

// 使用您的 Supabase 憑證
const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

console.log('🔍 深度 Supabase 連接診斷');
console.log('========================');
console.log('正在連接到您的 Supabase 實例...\n');

// 創建不同權限的客戶端
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabaseConnectivity() {
  console.log('📊 檢查資料庫連接...');
  console.log('=' .repeat(40));
  
  try {
    // 測試基本資料庫查詢
    const { data, error, count } = await supabaseAnon
      .from('customer_personal_data')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ 資料庫查詢失敗:', error.message);
      return false;
    } else {
      console.log('✅ 資料庫連接正常');
      console.log(`📋 customer_personal_data 表有 ${count} 筆記錄`);
      return true;
    }
  } catch (err) {
    console.log('❌ 資料庫連接異常:', err.message);
    return false;
  }
}

async function checkAuthService() {
  console.log('\n🔐 檢查認證服務狀態...');
  console.log('=' .repeat(40));
  
  // 檢查各個認證端點
  const endpoints = [
    { path: '/auth/v1/settings', name: '認證設定' },
    { path: '/auth/v1/signup', name: '用戶註冊' },
    { path: '/auth/v1/token', name: '令牌管理' },
    { path: '/auth/v1/user', name: '用戶管理' },
    { path: '/auth/v1/recover', name: '密碼重置' }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const url = supabaseUrl + endpoint.path;
      const response = await fetch(url, {
        method: endpoint.path === '/auth/v1/settings' ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: endpoint.path !== '/auth/v1/settings' ? JSON.stringify({}) : undefined
      });
      
      results[endpoint.name] = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      };
      
      console.log(`${endpoint.name}: ${response.status} (${response.statusText})`);
      
      // 嘗試獲取回應內容
      if (endpoint.path === '/auth/v1/settings' && response.ok) {
        try {
          const settings = await response.json();
          console.log('  認證設定:', JSON.stringify(settings, null, 2));
        } catch (e) {
          console.log('  無法解析設定回應');
        }
      }
      
    } catch (err) {
      results[endpoint.name] = { error: err.message };
      console.log(`${endpoint.name}: ❌ ${err.message}`);
    }
  }
  
  return results;
}

async function checkAuthFunctions() {
  console.log('\n🧪 測試認證功能...');
  console.log('=' .repeat(40));
  
  try {
    // 檢查當前會話
    console.log('檢查當前會話...');
    const { data: session, error: sessionError } = await supabaseAnon.auth.getSession();
    
    if (sessionError) {
      console.log('❌ 會話檢查失敗:', sessionError.message);
    } else {
      console.log('✅ 會話檢查成功');
      console.log('會話狀態:', session?.session ? '有效' : '無效');
    }
    
    // 測試用戶創建 (使用假資料)
    console.log('\n測試用戶創建功能...');
    const testEmail = `test_${Date.now()}@example.com`;
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    if (signUpError) {
      console.log('❌ 用戶創建失敗:', signUpError.message);
      console.log('錯誤詳情:', signUpError);
    } else {
      console.log('✅ 用戶創建成功:', signUpData.user?.email);
      
      // 如果成功創建，嘗試刪除測試用戶
      if (signUpData.user?.id) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
          console.log('✅ 測試用戶已清理');
        } catch (deleteErr) {
          console.log('⚠️ 無法清理測試用戶:', deleteErr.message);
        }
      }
    }
    
  } catch (err) {
    console.log('❌ 認證功能測試異常:', err.message);
  }
}

async function checkProjectHealth() {
  console.log('\n🏥 檢查項目健康狀態...');
  console.log('=' .repeat(40));
  
  try {
    // 檢查是否可以執行基本的管理員操作
    console.log('測試管理員權限...');
    
    // 嘗試使用 service role 查詢一些系統資訊
    const { data, error } = await supabaseAdmin
      .from('customer_personal_data')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ 管理員查詢失敗:', error.message);
    } else {
      console.log('✅ 管理員權限正常');
    }
    
    // 檢查 RLS 狀態
    console.log('\n檢查 RLS (Row Level Security) 狀態...');
    // 這個查詢可能需要特殊權限
    
  } catch (err) {
    console.log('❌ 項目健康檢查異常:', err.message);
  }
}

async function checkSpecificTables() {
  console.log('\n📋 檢查特定資料表...');
  console.log('=' .repeat(40));
  
  const tables = [
    'customer_personal_data',
    'billing_salary_data',
    'care_staff_profiles'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabaseAnon
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} 筆記錄`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

async function runComprehensiveDiagnostics() {
  console.log('開始時間:', new Date().toLocaleString());
  console.log('Supabase URL:', supabaseUrl);
  console.log('項目 ID: cvkxlvdicympakfecgvv\n');
  
  // 執行所有檢查
  const dbOk = await checkDatabaseConnectivity();
  const authResults = await checkAuthService();
  await checkAuthFunctions();
  await checkProjectHealth();
  await checkSpecificTables();
  
  // 總結報告
  console.log('\n📊 診斷總結報告');
  console.log('=' .repeat(40));
  
  if (dbOk) {
    console.log('✅ 資料庫服務：正常');
  } else {
    console.log('❌ 資料庫服務：故障');
  }
  
  // 分析認證服務狀態
  const authIssues = Object.entries(authResults).filter(([name, result]) => 
    result.status === 503 || result.error
  );
  
  if (authIssues.length === 0) {
    console.log('✅ 認證服務：正常');
  } else {
    console.log('❌ 認證服務：故障');
    console.log('故障端點:', authIssues.map(([name]) => name).join(', '));
  }
  
  console.log('\n💡 問題分析:');
  if (dbOk && authIssues.length > 0) {
    console.log('🔍 資料庫正常但認證服務故障');
    console.log('   → 這表明是認證配置問題，而非整體服務問題');
    console.log('   → 很可能是電話認證或其他認證提供者配置導致');
  } else if (!dbOk) {
    console.log('🔍 整體服務問題');
    console.log('   → 可能是 Supabase 項目層面的問題');
  }
  
  console.log('\n🔧 建議下一步:');
  if (authIssues.length > 0) {
    console.log('1. 立即重置所有認證提供者設定');
    console.log('2. 僅保留 Email/Password 認證');
    console.log('3. 清除所有第三方認證配置');
    console.log('4. 如果仍有問題，聯繫 Supabase 支援');
  }
}

// 執行診斷
runComprehensiveDiagnostics().catch(console.error);
