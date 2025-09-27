-- 🚨 緊急修復 customer_personal_data RLS 政策
-- 當前政策允許匿名用戶進行所有操作，這是嚴重的安全漏洞

-- 1. 刪除所有現有的不安全政策
DROP POLICY IF EXISTS "Allow anonymous delete access" ON "public"."customer_personal_data";
DROP POLICY IF EXISTS "Allow anonymous insert access" ON "public"."customer_personal_data";
DROP POLICY IF EXISTS "Allow anonymous read access" ON "public"."customer_personal_data";
DROP POLICY IF EXISTS "Allow anonymous update access" ON "public"."customer_personal_data";

-- 2. 建立安全的新政策

-- SELECT 政策：允許匿名讀取（內聯網需要）
CREATE POLICY "customer_personal_data_select_policy" ON "public"."customer_personal_data"
  AS PERMISSIVE FOR SELECT
  TO public
  USING (true);  -- 允許讀取客戶資料用於內聯網功能

-- INSERT 政策：僅限管理員和經理
CREATE POLICY "customer_personal_data_insert_policy" ON "public"."customer_personal_data"
  AS PERMISSIVE FOR INSERT
  TO public
  WITH CHECK ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- UPDATE 政策：僅限管理員和經理  
CREATE POLICY "customer_personal_data_update_policy" ON "public"."customer_personal_data"
  AS PERMISSIVE FOR UPDATE
  TO public
  USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- DELETE 政策：僅限管理員
CREATE POLICY "customer_personal_data_delete_policy" ON "public"."customer_personal_data"
  AS PERMISSIVE FOR DELETE
  TO public
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- 3. 確認 RLS 已啟用
ALTER TABLE "public"."customer_personal_data" ENABLE ROW LEVEL SECURITY;

-- 4. 驗證新政策
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