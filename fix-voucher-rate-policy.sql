-- 修復 voucher_rate SELECT 政策，允許匿名用戶讀取
-- 因為費率資料不是敏感的個人資料，可以允許讀取

-- 1. 刪除現有的 SELECT 政策
DROP POLICY IF EXISTS "voucher_rate_select_policy" ON "public"."voucher_rate";

-- 2. 建立新的更寬鬆的 SELECT 政策
CREATE POLICY "voucher_rate_select_policy" ON "public"."voucher_rate"
  AS PERMISSIVE FOR SELECT
  TO public
  USING (true);  -- 允許所有用戶讀取費率資料

-- 3. 確認政策設定
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'voucher_rate'
ORDER BY policyname;