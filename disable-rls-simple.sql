-- 最簡單的解決方案 - 完全禁用 RLS
-- 執行位置: Supabase Dashboard > SQL Editor

ALTER TABLE public.customer_personal_data DISABLE ROW LEVEL SECURITY;

-- 驗證 RLS 已禁用
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'customer_personal_data';

-- 測試客戶數據訪問
SELECT COUNT(*) as total_customers 
FROM public.customer_personal_data;
