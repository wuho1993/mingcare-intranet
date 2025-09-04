const { createClient } = require('@supabase/supabase-js');

// 載入環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvkxlvdicympakfecgvv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

console.log('🔍 Supabase 電話認證相關問題診斷');
console.log('=====================================');
console.log('時間:', new Date().toLocaleString());

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuthConfig() {
  console.log('\n📱 檢查認證配置...');
  
  try {
    // 檢查認證設定端點
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (response.ok) {
      const settings = await response.json();
      console.log('✅ 認證設定:', JSON.stringify(settings, null, 2));
      
      // 檢查是否啟用了電話認證
      if (settings.phone_enabled) {
        console.log('📱 電話認證已啟用');
      } else {
        console.log('❌ 電話認證未啟用');
      }
      
      // 檢查其他認證提供者
      if (settings.external_providers) {
        console.log('🔐 外部認證提供者:', settings.external_providers);
      }
      
    } else {
      console.log('❌ 無法獲取認證設定，狀態碼:', response.status);
      const errorText = await response.text();
      console.log('錯誤詳情:', errorText);
    }
  } catch (error) {
    console.log('❌ 檢查認證配置時發生錯誤:', error.message);
  }
}

async function checkAuthStatus() {
  console.log('\n🔍 檢查當前認證狀態...');
  
  try {
    const { data: session, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ 獲取 session 錯誤:', error.message);
      
      // 特別檢查是否是電話認證相關錯誤
      if (error.message.includes('phone') || error.message.includes('sms')) {
        console.log('📱 這可能與電話認證配置有關');
      }
    } else {
      console.log('✅ Session 狀態:', session ? '已登入' : '未登入');
      if (session) {
        console.log('用戶資料:', {
          id: session.user?.id,
          email: session.user?.email,
          phone: session.user?.phone,
          created_at: session.user?.created_at
        });
      }
    }
  } catch (error) {
    console.log('❌ 檢查認證狀態錯誤:', error.message);
  }
}

async function checkAuthProviders() {
  console.log('\n🔐 檢查可用的認證提供者...');
  
  try {
    // 嘗試獲取認證提供者列表
    const response = await fetch(`${supabaseUrl}/auth/v1/providers`, {
      headers: {
        'apikey': supabaseAnonKey
      }
    });
    
    if (response.ok) {
      const providers = await response.json();
      console.log('✅ 可用的認證提供者:', providers);
    } else {
      console.log('⚠️  無法獲取認證提供者列表');
    }
  } catch (error) {
    console.log('❌ 檢查認證提供者錯誤:', error.message);
  }
}

async function testEmailAuth() {
  console.log('\n📧 測試電子郵件認證...');
  
  try {
    // 嘗試使用無效憑證來測試認證端點是否正常
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'invalid'
    });
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        console.log('✅ 電子郵件認證端點正常（預期的無效憑證錯誤）');
      } else if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
        console.log('❌ 認證服務不可用 (503 錯誤)');
        console.log('📱 這可能與電話認證配置更改有關');
      } else {
        console.log('⚠️  認證錯誤:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ 測試電子郵件認證錯誤:', error.message);
  }
}

async function checkPhoneAuthConfig() {
  console.log('\n📱 檢查電話認證配置...');
  
  try {
    // 嘗試發送測試 SMS（會失敗，但可以檢查端點是否可用）
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: '+1234567890'
    });
    
    if (error) {
      if (error.message.includes('Phone number not valid')) {
        console.log('✅ 電話認證端點正常（預期的無效號碼錯誤）');
      } else if (error.message.includes('SMS')) {
        console.log('📱 電話認證可能需要 SMS 提供者配置');
      } else if (error.message.includes('503')) {
        console.log('❌ 電話認證服務不可用');
      } else {
        console.log('⚠️  電話認證錯誤:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ 檢查電話認證錯誤:', error.message);
  }
}

// 執行所有檢查
async function runPhoneAuthDiagnostics() {
  await checkAuthConfig();
  await checkAuthStatus();
  await checkAuthProviders();
  await testEmailAuth();
  await checkPhoneAuthConfig();
  
  console.log('\n💡 電話認證相關問題解決建議:');
  console.log('1. 檢查 Supabase 儀表板 > Authentication > Settings');
  console.log('2. 確認電話認證提供者（如 Twilio）配置正確');
  console.log('3. 檢查是否意外停用了電子郵件認證');
  console.log('4. 確認 Auth 設定沒有衝突');
  console.log('5. 嘗試暫時停用電話認證來排除問題');
}

runPhoneAuthDiagnostics().catch(console.error);
