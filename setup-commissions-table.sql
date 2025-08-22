-- 創建佣金表格和插入測試數據
-- 執行這個 SQL 腳本來設置佣金計算所需的數據庫結構

-- 1. 創建佣金表格
CREATE TABLE IF NOT EXISTS public.commissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    introducer introducer_enum NOT NULL,
    first_month_commission numeric,
    subsequent_month_commission numeric,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT commissions_pkey PRIMARY KEY (id),
    CONSTRAINT commissions_introducer_unique UNIQUE (introducer)
);

-- 2. 設置 RLS (Row Level Security)
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- 3. 創建 RLS 政策 (暫時允許所有操作，生產環境需要調整)
CREATE POLICY "Enable read access for all users" ON public.commissions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.commissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.commissions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.commissions FOR DELETE USING (true);

-- 4. 插入測試佣金數據
INSERT INTO public.commissions (introducer, first_month_commission, subsequent_month_commission) VALUES
('Kanas Leung', 800, 400),
('Joe Cheung', 800, 400),
('Candy Ho', 800, 400),
('Steven Kwok', 600, 300),
('Dr.Lee', 1000, 500),
('Annie', 600, 300),
('Janet', 600, 300),
('陸sir', 600, 300),
('吳翹政', 600, 300),
('余翠英', 600, 300),
('陳小姐MC01', 600, 300),
('曾先生', 600, 300),
('梁曉峰', 600, 300)
ON CONFLICT (introducer) DO UPDATE SET
    first_month_commission = EXCLUDED.first_month_commission,
    subsequent_month_commission = EXCLUDED.subsequent_month_commission;

-- 5. 驗證數據
SELECT 
    introducer,
    first_month_commission,
    subsequent_month_commission
FROM public.commissions
ORDER BY introducer;
