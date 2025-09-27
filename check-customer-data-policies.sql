-- 檢查 customer_personal_data 的當前 RLS 狀態和政策
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'customer_personal_data';

-- 檢查所有政策
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'customer_personal_data'
ORDER BY cmd, policyname;