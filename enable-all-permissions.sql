-- 客戶管理中心 - 完整權限啟用 SQL
-- 執行位置: Supabase Dashboard > SQL Editor

-- =============================================================================
-- 1. 啟用匿名讀取權限 (解決客戶管理中心無法顯示客戶的問題)
-- =============================================================================

-- 先刪除可能存在的舊政策，然後創建新政策
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.customer_personal_data;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.customer_personal_data;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.customer_personal_data;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.customer_personal_data;

-- 為 customer_personal_data 表添加匿名讀取政策
CREATE POLICY "Allow anonymous read access" 
ON public.customer_personal_data
FOR SELECT 
TO anon 
USING (true);

-- =============================================================================
-- 2. 啟用匿名插入權限 (用於新增客戶)
-- =============================================================================

CREATE POLICY "Allow anonymous insert access" 
ON public.customer_personal_data
FOR INSERT 
TO anon 
WITH CHECK (true);

-- =============================================================================
-- 3. 啟用匿名更新權限 (用於編輯客戶)
-- =============================================================================

CREATE POLICY "Allow anonymous update access" 
ON public.customer_personal_data
FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 4. 啟用匿名刪除權限 (用於刪除客戶)
-- =============================================================================

CREATE POLICY "Allow anonymous delete access" 
ON public.customer_personal_data
FOR DELETE 
TO anon 
USING (true);

-- =============================================================================
-- 5. 或者，如果你想要完全禁用 RLS (最簡單但安全性較低)
-- =============================================================================

-- 取消註解下面這行來完全禁用 RLS:
-- ALTER TABLE public.customer_personal_data DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. 驗證政策已創建
-- =============================================================================

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
WHERE tablename = 'customer_personal_data'
ORDER BY policyname;

-- =============================================================================
-- 7. 檢查 RLS 狀態
-- =============================================================================

SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'customer_personal_data';

-- =============================================================================
-- 8. 測試權限 (執行後應該看到客戶數量)
-- =============================================================================

SELECT COUNT(*) as total_customers 
FROM public.customer_personal_data;

-- =============================================================================
-- 注意事項:
-- 1. 這些政策允許匿名用戶對客戶數據進行完整的 CRUD 操作
-- 2. 如果你的應用需要用戶認證，請調整政策條件
-- 3. 生產環境建議使用更嚴格的權限控制
-- =============================================================================
