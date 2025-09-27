-- 方法 1: 在 auth.users 表中添加 role 自定義欄位
-- 這是最標準的做法

-- 1. 檢查當前 auth.users 的結構
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. 添加 role 欄位到 auth.users 表 (如果還沒有)
-- 注意：這需要在 Supabase Dashboard > Authentication > Users 中手動添加

-- 3. 或者建立一個自定義的角色映射表
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. 插入一些測試角色
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@mingcare.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'manager' FROM auth.users WHERE email IN ('manager1@mingcare.com', 'manager2@mingcare.com')
ON CONFLICT (user_id) DO UPDATE SET role = 'manager';