-- 快速測試角色系統
-- 執行這個來驗證角色設定是否正確

-- 1. 檢查 user_roles 表
SELECT * FROM public.user_roles;

-- 2. 檢查當前用戶（如果已登入）
SELECT auth.uid() as current_user_id;

-- 3. 檢查當前用戶的角色
SELECT ur.role 
FROM public.user_roles ur 
WHERE ur.user_id = auth.uid();

-- 4. 模擬權限檢查
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    ) THEN '✅ 可以修改客戶資料'
    ELSE '❌ 無權限修改客戶資料'
  END as permission_check;