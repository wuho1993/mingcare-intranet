-- 方法 2: 修改 RLS 政策使用 user_roles 表查詢
-- 這樣更靈活，不依賴 JWT 中的 role 欄位

-- 先刪除現有政策
DROP POLICY IF EXISTS "customer_personal_data_insert_policy" ON "public"."customer_personal_data";
DROP POLICY IF EXISTS "customer_personal_data_update_policy" ON "public"."customer_personal_data";
DROP POLICY IF EXISTS "customer_personal_data_delete_policy" ON "public"."customer_personal_data";

-- 重新建立使用 user_roles 表的政策

-- INSERT 政策：檢查 user_roles 表中的角色
CREATE POLICY "customer_personal_data_insert_policy" ON "public"."customer_personal_data"
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- UPDATE 政策：檢查 user_roles 表中的角色
CREATE POLICY "customer_personal_data_update_policy" ON "public"."customer_personal_data"
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- DELETE 政策：僅限 admin 角色
CREATE POLICY "customer_personal_data_delete_policy" ON "public"."customer_personal_data"
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 驗證新政策
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