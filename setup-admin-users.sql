-- 🔑 設定指定用戶為管理員
-- 為 kanasleung@mingcarehome.com 和 joecheung@mingcarehome.com 設定 admin 角色

-- 1. 先建立 user_roles 表（如果還沒有）
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. 為指定的兩個用戶設定 admin 角色
-- Kanas Leung
INSERT INTO public.user_roles (user_id, role, created_at, updated_at) 
SELECT 
    id, 
    'admin',
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'kanasleung@mingcarehome.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin', 
    updated_at = NOW();

-- Joe Cheung  
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT 
    id, 
    'admin',
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'joecheung@mingcarehome.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin', 
    updated_at = NOW();

-- 3. 驗證設定結果
SELECT 
    u.email,
    u.id as user_id,
    ur.role,
    ur.created_at,
    ur.updated_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('kanasleung@mingcarehome.com', 'joecheung@mingcarehome.com')
ORDER BY u.email;

-- 4. 檢查所有管理員
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY ur.created_at;