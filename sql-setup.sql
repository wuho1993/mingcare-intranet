-- 客戶管理中心 - SQL 設置指南
-- 需要在 Supabase SQL Editor 中執行的 SQL 命令

-- 1. 啟用 pg_trgm 擴展（用於全文搜索）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. 創建搜索索引（提升搜索效能）
CREATE INDEX IF NOT EXISTS idx_cpd_name_trgm
  ON public.customer_personal_data USING gin (lower(customer_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cpd_phone_trgm
  ON public.customer_personal_data USING gin (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cpd_id_trgm
  ON public.customer_personal_data USING gin (customer_id gin_trgm_ops);

-- 3. 等待 generate_next_customer_id RPC 函數
-- (將由用戶提供)
