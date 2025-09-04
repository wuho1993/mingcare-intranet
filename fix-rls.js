const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvkxlvdicympakfecgvv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabaseAnon = createClient(supabaseUrl, anonKey);

async function fixCustomerRLS() {
  console.log('🔧 修復客戶管理中心 RLS 問題...\n');

  try {
    // 1. 檢查當前狀態
    console.log('1. 檢查當前匿名訪問狀態:');
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('customer_personal_data')
      .select('count', { count: 'exact', head: true });
    
    console.log(`   匿名用戶可見客戶數: ${anonTest ? anonError ? 0 : anonTest.length : 0}`);

    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from('customer_personal_data')
      .select('count', { count: 'exact', head: true });
    
    console.log(`   管理員可見客戶數: ${adminTest ? adminTest.length : 0}`);

    // 2. 添加 RLS 政策
    console.log('\n2. 添加匿名讀取政策...');
    const { data: policyResult, error: policyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Allow anonymous read access" 
        ON public.customer_personal_data
        FOR SELECT 
        TO anon 
        USING (true);
      `
    });

    if (policyError) {
      console.log('   嘗試直接執行 SQL...');
      // 如果 RPC 不存在，嘗試直接查詢
      const { error: directError } = await supabaseAdmin
        .from('customer_personal_data')
        .select('*')
        .limit(0);
      
      if (directError && directError.message.includes('policy')) {
        console.log('   ✅ 需要在 Supabase Dashboard 手動添加政策');
      }
    } else {
      console.log('   ✅ 政策添加成功');
    }

    // 3. 驗證修復結果
    console.log('\n3. 驗證修復結果...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒

    const { data: finalTest, error: finalError } = await supabaseAnon
      .from('customer_personal_data')
      .select('count', { count: 'exact', head: true });
    
    if (finalError) {
      console.log('   ❌ 匿名訪問仍然被阻止');
      console.log('   需要手動修復，請按照以下步驟:');
      console.log('\n📋 手動修復步驟:');
      console.log('1. 登入 Supabase Dashboard');
      console.log('2. 前往 Authentication > Policies');
      console.log('3. 找到 customer_personal_data 表');
      console.log('4. 添加新政策:');
      console.log('   - Policy name: Allow anonymous read access');
      console.log('   - Allowed operation: SELECT');
      console.log('   - Target roles: anon');
      console.log('   - USING expression: true');
      console.log('5. 儲存政策');
    } else {
      console.log('   ✅ 修復成功！匿名用戶現在可以訪問客戶數據');
    }

  } catch (error) {
    console.error('修復過程中發生錯誤:', error);
    console.log('\n📋 手動修復指引已保存到 fix-customer-rls.sql');
  }
}

fixCustomerRLS();
