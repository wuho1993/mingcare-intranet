-- Supabase 認證系統診斷查詢
-- 在 Supabase 儀表板的 SQL 編輯器中執行
-- 位置: Supabase Dashboard → SQL Editor

-- ==========================================
-- 重要說明: 
-- 這些查詢可能需要在 Supabase SQL 編輯器中執行
-- 某些 auth.* 表可能受到 RLS 保護
-- ==========================================

-- 1. 檢查當前資料庫資訊
SELECT 
  current_database() as database_name,
  current_user as current_user,
  NOW() as current_time,
  version() as postgres_version;

-- 2. 檢查可用的 schema
SELECT schema_name 
FROM information_schema.schemata 
ORDER BY schema_name;

-- 3. 檢查 auth schema 中的表 (如果可訪問)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
ORDER BY table_name;

-- 4. 嘗試檢查認證相關的統計 (需要適當權限)
-- 注意: 這些查詢可能會失敗，這是正常的安全限制

-- 檢查是否可以訪問 auth.users
SELECT 
  'auth_users_access_test' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
    THEN 'auth.users 表存在'
    ELSE 'auth.users 表不存在或無權限'
  END as result;

-- 5. 檢查您的應用表以確認資料庫連接正常
SELECT 
  'app_tables_check' as test_name,
  COUNT(*) as customer_count
FROM customer_personal_data
LIMIT 1;

-- 6. 檢查是否有其他認證相關的自定義表
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%auth%' 
       OR table_name ILIKE '%user%' 
       OR table_name ILIKE '%session%'
       OR table_name ILIKE '%token%')
ORDER BY table_name;

-- 7. 檢查是否有認證相關的函數
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (routine_name ILIKE '%auth%' 
       OR routine_name ILIKE '%user%' 
       OR routine_name ILIKE '%login%')
ORDER BY routine_name;

-- ==========================================
-- 如果您有 RLS 繞過權限，可以嘗試以下查詢
-- ==========================================

-- 嘗試檢查認證統計 (可能需要 service_role)
/*
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as users_with_phone,
  COUNT(CASE WHEN phone_confirmed_at IS NOT NULL THEN 1 END) as phone_confirmed_users
FROM auth.users;
*/

-- 嘗試檢查最近的用戶活動 (可能需要 service_role)
/*
SELECT 
  id,
  email,
  phone,
  email_confirmed_at,
  phone_confirmed_at,
  last_sign_in_at,
  created_at,
  updated_at
FROM auth.users 
ORDER BY updated_at DESC 
LIMIT 10;
*/

-- ==========================================
-- 執行指南:
-- ==========================================
-- 1. 複製此 SQL 文件的內容
-- 2. 前往 Supabase 儀表板
-- 3. 進入 SQL Editor
-- 4. 貼上並執行這些查詢
-- 5. 某些查詢可能會因權限限制而失敗，這是正常的
-- ==========================================
