const { createClient } = require('@supabase/supabase-js');

// 直接設置環境變數 (從 .env.local 複製)
const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

console.log('🔍 檢查 Supabase 認證配置...\n');

console.log('環境變數檢查:');
console.log('Supabase URL:', supabaseUrl ? '✅ 已設置' : '❌ 未設置');
console.log('Supabase Anon Key:', supabaseAnonKey ? `✅ 已設置 (${supabaseAnonKey.substring(0, 20)}...)` : '❌ 未設置');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 環境變數未正確設置');
  process.exit(1);
}

// 創建 Supabase 客戶端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseAuth() {
  try {
    console.log('\n🔗 測試 Supabase 連接...');
    
    // 測試基本連接
    const { data, error } = await supabase.from('customer_personal_data').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ 資料庫連接失敗:', error.message);
      return false;
    }
    
    console.log('✅ Supabase 資料庫連接正常');
    
    // 檢查認證配置
    console.log('\n🔐 檢查 Supabase 認證配置...');
    
    try {
      // 檢查當前用戶狀態
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.log('⚠️  當前沒有登入用戶:', userError.message);
      } else if (user) {
        console.log('✅ 發現已登入用戶:', user.email);
      } else {
        console.log('ℹ️  目前沒有用戶登入');
      }
      
      // 檢查 auth.users 表 (需要 service role key)
      console.log('\n👥 檢查用戶表...');
      
      // 使用 service role key 來檢查用戶
      if (serviceRoleKey) {
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        
        const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();
        
        if (usersError) {
          console.error('❌ 無法檢查用戶列表:', usersError.message);
        } else {
          console.log(`✅ 系統中共有 ${users.users.length} 個用戶`);
          users.users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.email_confirmed_at ? '已驗證' : '未驗證'})`);
          });
        }
      } else {
        console.log('⚠️  沒有 service role key，無法檢查用戶列表');
      }
      
      return true;
      
    } catch (authError) {
      console.error('❌ 認證檢查失敗:', authError.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🧪 測試登入功能...');
  
  // 這裡可以測試一個已知的測試帳號
  const testEmail = 'test@example.com';  // 請更換為實際的測試帳號
  const testPassword = 'testpassword';   // 請更換為實際的密碼
  
  console.log('注意: 請確保有有效的測試帳號來測試登入功能');
  console.log('如需測試登入，請在 Supabase Dashboard 中創建測試用戶');
}

// 執行測試
testSupabaseAuth().then(() => {
  testLogin();
});
