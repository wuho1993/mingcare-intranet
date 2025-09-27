-- 🧪 測試管理員權限設定
-- 執行這個腳本來驗證 admin 用戶設定是否正確

-- 1. 檢查 user_roles 表是否正確建立
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 2. 檢查管理員用戶是否正確設定
SELECT 
    '管理員列表' as info,
    u.email,
    u.id as user_id,
    ur.role,
    ur.created_at,
    ur.updated_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.email;

-- 3. 檢查特定用戶的角色
SELECT 
    '指定用戶角色' as info,
    u.email,
    COALESCE(ur.role, 'no_role') as role,
    CASE 
        WHEN ur.role = 'admin' THEN '✅ 管理員權限'
        WHEN ur.role = 'manager' THEN '👔 經理權限'  
        WHEN ur.role = 'user' THEN '👤 一般用戶'
        ELSE '❌ 無角色設定'
    END as permission_level
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('kanasleung@mingcarehome.com', 'joecheung@mingcarehome.com')
ORDER BY u.email;

-- 4. 檢查 RLS 政策是否正確設定
SELECT 
    'RLS 政策檢查' as info,
    tablename,
    policyname,
    cmd,
    roles,
    CASE 
        WHEN cmd = 'SELECT' AND roles = '{public}' THEN '✅ 讀取：公開'
        WHEN cmd IN ('INSERT', 'UPDATE') AND qual LIKE '%admin%manager%' THEN '✅ 寫入：管理員/經理'
        WHEN cmd = 'DELETE' AND qual LIKE '%admin%' THEN '✅ 刪除：僅管理員'
        ELSE '⚠️ 需檢查'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'customer_personal_data'
ORDER BY cmd, policyname;

-- 5. 總計統計
SELECT 
    '用戶統計' as info,
    COUNT(*) FILTER (WHERE ur.role = 'admin') as admin_count,
    COUNT(*) FILTER (WHERE ur.role = 'manager') as manager_count,
    COUNT(*) FILTER (WHERE ur.role = 'user') as user_count,
    COUNT(*) FILTER (WHERE ur.role IS NULL) as no_role_count,
    COUNT(*) as total_users
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id;