-- Create voucher_rate table
-- This table stores service rates for different service types

CREATE TABLE public.voucher_rate (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type service_type_enum NOT NULL UNIQUE,
    service_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.voucher_rate IS '社區券服務收費標準表';
COMMENT ON COLUMN public.voucher_rate.id IS '系統 ID';
COMMENT ON COLUMN public.voucher_rate.service_type IS '服務類型';
COMMENT ON COLUMN public.voucher_rate.service_rate IS '服務收費標準';
COMMENT ON COLUMN public.voucher_rate.created_at IS '建立時間';
COMMENT ON COLUMN public.voucher_rate.updated_at IS '更新時間';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_voucher_rate_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voucher_rate_updated_at_trigger
    BEFORE UPDATE ON public.voucher_rate
    FOR EACH ROW
    EXECUTE FUNCTION update_voucher_rate_updated_at();

-- Insert initial data for all service types from the enum
INSERT INTO public.voucher_rate (service_type, service_rate) VALUES
    ('ES-護送服務(陪診)', 0),
    ('HC-家居服務', 0),
    ('NC-護理服務(專業⼈員)', 0),
    ('PC-到⼾看顧(輔助⼈員)', 0),
    ('RA-復康運動(輔助⼈員)', 0),
    ('RT-復康運動(OTA輔助⼈員)', 0),
    ('RT-復康運動(專業⼈員)', 0),
    ('上門評估服務', 0),
    ('傷口護理', 0),
    ('免費服務體驗', 0)
ON CONFLICT (service_type) DO NOTHING;

-- Enable Row Level Security (optional - based on your security requirements)
ALTER TABLE public.voucher_rate ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your authentication requirements)
CREATE POLICY "voucher_rate_select_policy" ON public.voucher_rate
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "voucher_rate_insert_policy" ON public.voucher_rate
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "voucher_rate_update_policy" ON public.voucher_rate
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "voucher_rate_delete_policy" ON public.voucher_rate
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
