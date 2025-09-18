-- 護理人員管理系統 - SQL 設置
-- 需要在 Supabase SQL Editor 中執行

-- 1. 創建護理人員資料表
CREATE TABLE IF NOT EXISTS public.care_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT NOT NULL,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    qualifications TEXT,
    experience_years INTEGER,
    specialties TEXT,
    availability TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. 創建護理人員服務記錄表
CREATE TABLE IF NOT EXISTS public.care_staff_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.care_staff(id) ON DELETE CASCADE,
    customer_id TEXT,
    service_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    service_type TEXT,
    service_notes TEXT,
    hours_worked DECIMAL(4,2),
    hourly_rate DECIMAL(8,2),
    total_amount DECIMAL(10,2),
    status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 創建護理人員工資記錄表
CREATE TABLE IF NOT EXISTS public.care_staff_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.care_staff(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    total_hours DECIMAL(6,2),
    base_hourly_rate DECIMAL(8,2),
    overtime_hours DECIMAL(6,2),
    overtime_rate DECIMAL(8,2),
    gross_pay DECIMAL(10,2),
    deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2),
    bonus DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. 創建委託金管理表
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.care_staff(id) ON DELETE CASCADE,
    customer_id TEXT,
    service_id UUID REFERENCES public.care_staff_services(id) ON DELETE CASCADE,
    commission_type TEXT CHECK (commission_type IN ('service', 'referral', 'performance', 'bonus')),
    commission_rate DECIMAL(5,2), -- 百分比，如 10.50 代表 10.5%
    base_amount DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    commission_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 創建索引以提升查詢性能
CREATE INDEX IF NOT EXISTS idx_care_staff_status ON public.care_staff(status);
CREATE INDEX IF NOT EXISTS idx_care_staff_name ON public.care_staff(name);
CREATE INDEX IF NOT EXISTS idx_care_staff_email ON public.care_staff(email);
CREATE INDEX IF NOT EXISTS idx_care_staff_phone ON public.care_staff(phone);

CREATE INDEX IF NOT EXISTS idx_care_staff_services_staff_id ON public.care_staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_care_staff_services_date ON public.care_staff_services(service_date);
CREATE INDEX IF NOT EXISTS idx_care_staff_services_status ON public.care_staff_services(status);

CREATE INDEX IF NOT EXISTS idx_care_staff_payroll_staff_id ON public.care_staff_payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_care_staff_payroll_period ON public.care_staff_payroll(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_care_staff_payroll_status ON public.care_staff_payroll(status);

CREATE INDEX IF NOT EXISTS idx_commissions_staff_id ON public.commissions(staff_id);
CREATE INDEX IF NOT EXISTS idx_commissions_customer_id ON public.commissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_date ON public.commissions(commission_date);

-- 6. 設置 RLS (Row Level Security) 政策
ALTER TABLE public.care_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_staff_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- 允許已認證用戶查看和管理護理人員資料
CREATE POLICY "Allow authenticated users to view care staff" ON public.care_staff
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert care staff" ON public.care_staff
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update care staff" ON public.care_staff
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 允許已認證用戶管理服務記錄
CREATE POLICY "Allow authenticated users to manage care staff services" ON public.care_staff_services
    FOR ALL USING (auth.role() = 'authenticated');

-- 允許已認證用戶管理工資記錄
CREATE POLICY "Allow authenticated users to manage payroll" ON public.care_staff_payroll
    FOR ALL USING (auth.role() = 'authenticated');

-- 允許已認證用戶管理委託金
CREATE POLICY "Allow authenticated users to manage commissions" ON public.commissions
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. 創建觸發器以自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_care_staff_updated_at 
    BEFORE UPDATE ON public.care_staff 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_staff_services_updated_at 
    BEFORE UPDATE ON public.care_staff_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_staff_payroll_updated_at 
    BEFORE UPDATE ON public.care_staff_payroll 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at 
    BEFORE UPDATE ON public.commissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 插入一些示範資料 (可選)
INSERT INTO public.care_staff (name, email, phone, address, qualifications, experience_years, specialties, status) VALUES
('陳美華', 'chen.meihua@example.com', '0912-345-678', '台北市信義區', '護理師執照、CPR證照', 5, '老人照護、復健護理', 'active'),
('林志強', 'lin.zhiqiang@example.com', '0923-456-789', '新北市板橋區', '護理師執照、急救證照', 3, '居家護理、傷口照護', 'active'),
('王小美', 'wang.xiaomei@example.com', '0934-567-890', '台中市北區', '照護服務員證照', 2, '生活照護、陪伴服務', 'active')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE public.care_staff IS '護理人員基本資料表';
COMMENT ON TABLE public.care_staff_services IS '護理人員服務記錄表';
COMMENT ON TABLE public.care_staff_payroll IS '護理人員工資計算表';
COMMENT ON TABLE public.commissions IS '委託金管理表';