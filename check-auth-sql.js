const { createClient } = require('@supabase/supabase-js');

// 載入環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';

console.log('🔍 Supabase 認證系統 SQL 診斷');
console.log('============================');
console.log('使用 Service Role Key 執行系統級查詢\n');

// 使用 service role key 創建客戶端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeQuery(name, query) {
  console.log(`\n📊 執行查詢: ${name}`);
  console.log('=' .repeat(50));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: query });
    
    if (error) {
      console.log(`❌ 錯誤: ${error.message}`);
      return;
    }
    
    if (data && data.length > 0) {
      console.table(data);
    } else {
      console.log('ℹ️  查詢成功，但沒有返回數據');
    }
  } catch (err) {
    console.log(`❌ 執行錯誤: ${err.message}`);
  }
}

async function runAuthDiagnostics() {
  // 1. 檢查用戶統計
  await executeQuery('用戶統計', `
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
      COUNT(CASE WHEN phone_confirmed_at IS NOT NULL THEN 1 END) as phone_confirmed_users,
      COUNT(CASE WHEN banned_until IS NOT NULL THEN 1 END) as banned_users
    FROM auth.users;
  `);

  // 2. 檢查最近的用戶活動
  await executeQuery('最近用戶活動', `
    SELECT 
      id,
      email,
      phone,
      last_sign_in_at,
      created_at,
      updated_at
    FROM auth.users 
    ORDER BY updated_at DESC 
    LIMIT 5;
  `);

  // 3. 檢查會話統計
  await executeQuery('會話統計', `
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as sessions_24h
    FROM auth.sessions;
  `);

  // 4. 檢查刷新令牌
  await executeQuery('刷新令牌統計', `
    SELECT 
      COUNT(*) as total_tokens,
      COUNT(CASE WHEN revoked = true THEN 1 END) as revoked_tokens
    FROM auth.refresh_tokens;
  `);

  // 5. 檢查審計日誌
  await executeQuery('最近認證事件', `
    SELECT 
      level,
      msg,
      created_at
    FROM auth.audit_log_entries 
    WHERE created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC 
    LIMIT 10;
  `);

  // 6. 檢查電話認證相關
  await executeQuery('電話認證統計', `
    SELECT 
      COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as users_with_phone,
      COUNT(CASE WHEN phone_confirmed_at IS NOT NULL THEN 1 END) as phone_confirmed
    FROM auth.users;
  `);

  // 7. 檢查系統健康
  await executeQuery('系統健康檢查', `
    SELECT 
      NOW() as current_time,
      current_database() as database_name,
      current_user as current_user;
  `);
}

// 由於可能沒有 exec_sql 函數，讓我們使用直接查詢
async function runDirectQueries() {
  console.log('\n🔍 直接查詢認證系統狀態');
  console.log('============================\n');

  try {
    // 檢查用戶表
    console.log('📊 檢查 auth.users 表...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, phone, email_confirmed_at, phone_confirmed_at, last_sign_in_at')
      .limit(5);
    
    if (usersError) {
      console.log('❌ 無法直接查詢 auth.users:', usersError.message);
    } else {
      console.log('✅ 最近用戶:', users?.length || 0, '筆記錄');
      if (users?.length > 0) {
        console.table(users);
      }
    }
  } catch (err) {
    console.log('❌ 直接查詢錯誤:', err.message);
  }

  // 測試基本連接
  try {
    console.log('\n🔗 測試基本資料庫連接...');
    const { data, error } = await supabase
      .from('customer_personal_data')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ 資料庫連接問題:', error.message);
    } else {
      console.log('✅ 資料庫連接正常');
    }
  } catch (err) {
    console.log('❌ 連接測試錯誤:', err.message);
  }

  // 測試認證功能
  try {
    console.log('\n🔐 測試認證功能...');
    const { data: session } = await supabase.auth.getSession();
    console.log('當前會話狀態:', session ? '有會話' : '無會話');
    
    if (session?.session) {
      console.log('會話詳情:', {
        user_id: session.session.user?.id,
        expires_at: session.session.expires_at,
        token_type: session.session.token_type
      });
    }
  } catch (err) {
    console.log('❌ 會話檢查錯誤:', err.message);
  }
}

console.log('⚠️  注意: 某些系統表可能需要特殊權限才能查詢');
console.log('如果遇到權限錯誤，這是正常的安全限制\n');

runDirectQueries().catch(console.error);
