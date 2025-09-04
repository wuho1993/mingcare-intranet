-- 修復客戶管理中心 RLS 問題
-- 問題：客戶管理中心無法顯示客戶，因為 RLS 阻止了匿名訪問

-- 解決方案：為 customer_personal_data 表添加允許匿名讀取的 RLS 政策

-- 1. 檢查當前 RLS 狀態
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    hasrls
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE tablename = 'customer_personal_data';

-- 2. 檢查現有政策
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'customer_personal_data';

-- 3. 添加允許匿名讀取的政策
CREATE POLICY "Allow anonymous read access" ON public.customer_personal_data
    FOR SELECT 
    TO anon 
    USING (true);

-- 4. 驗證政策已創建
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'customer_personal_data';
