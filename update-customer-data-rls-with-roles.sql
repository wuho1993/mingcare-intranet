-- 🛡️ 更新 customer_personal_data RLS 政策以使用角色系統
-- 這將啟用基於 user_roles 表的權限控制

-- 先刪除現有的 INSERT/UPDATE/DELETE 政策（保留 SELECT）
DROP POLICY IF EXISTS "customer_personal_data_insert_policy" ON "public"."customer_personal_data";
DROP POLICY IF EXISTS "customer_personal_data_update_policy" ON "public"."customer_personal_data";  
DROP POLICY IF EXISTS "customer_personal_data_delete_policy" ON "public"."customer_personal_data";

-- 重新建立基於角色的政策

-- INSERT：僅限 admin 和 manager 角色
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

-- UPDATE：僅限 admin 和 manager 角色  
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

-- DELETE：僅限 admin 角色
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

-- 驗證所有政策
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