-- ============================================================
-- 新增介紹人獎金服務類型到 service_type_enum
-- 執行日期: 2026-01-05
-- ============================================================

-- 在 Supabase SQL Editor 中執行以下語句

-- 新增 4 個介紹人獎金類型到 service_type_enum
ALTER TYPE service_type_enum ADD VALUE IF NOT EXISTS '介紹人獎金(一)';
ALTER TYPE service_type_enum ADD VALUE IF NOT EXISTS '介紹人獎金(二)';
ALTER TYPE service_type_enum ADD VALUE IF NOT EXISTS '介紹人獎金(三)';
ALTER TYPE service_type_enum ADD VALUE IF NOT EXISTS '介紹人獎金(四)';

-- 驗證新增成功 - 查看所有 service_type_enum 值
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_type_enum')
ORDER BY enumsortorder;

-- ============================================================
-- 注意事項:
-- 1. ALTER TYPE ADD VALUE 無法在事務中執行，每個語句會立即生效
-- 2. IF NOT EXISTS 確保如果值已存在不會報錯
-- 3. 執行後新的服務類型將可用於 billing_salary_data 和 voucher_rate 表
-- ============================================================
