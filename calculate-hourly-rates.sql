-- =============================================================================
-- 自動計算每小時收費和每小時工資的觸發器
-- Calculate hourly rates trigger for billing_salary_data table
-- =============================================================================

-- 創建觸發器函數
CREATE OR REPLACE FUNCTION calculate_hourly_rates()
RETURNS TRIGGER AS $$
BEGIN
    -- 計算每小時收費：服務費用 ÷ 服務時數
    IF NEW.service_hours > 0 THEN
        NEW.hourly_rate = NEW.service_fee / NEW.service_hours;
    ELSE
        NEW.hourly_rate = 0;
    END IF;

    -- 計算每小時工資：護理人員工資 ÷ 服務時數
    IF NEW.service_hours > 0 THEN
        NEW.hourly_salary = NEW.staff_salary / NEW.service_hours;
    ELSE
        NEW.hourly_salary = 0;
    END IF;

    -- 確保計算結果保留2位小數
    NEW.hourly_rate = ROUND(NEW.hourly_rate::numeric, 2);
    NEW.hourly_salary = ROUND(NEW.hourly_salary::numeric, 2);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器（INSERT 和 UPDATE 時都執行）
DROP TRIGGER IF EXISTS trg_calculate_hourly_rates ON public.billing_salary_data;
CREATE TRIGGER trg_calculate_hourly_rates
    BEFORE INSERT OR UPDATE ON public.billing_salary_data
    FOR EACH ROW
    EXECUTE FUNCTION calculate_hourly_rates();

-- 驗證觸發器已創建
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trg_calculate_hourly_rates';