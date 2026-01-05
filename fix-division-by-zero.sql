-- =============================================================================
-- 修復 division by zero 錯誤
-- 更新 calculate_hourly_rates 觸發器函數
-- 執行日期: 2026-01-05
-- =============================================================================

-- 重新創建觸發器函數，確保正確處理 service_hours = 0 的情況
CREATE OR REPLACE FUNCTION calculate_hourly_rates()
RETURNS TRIGGER AS $$
BEGIN
    -- 計算每小時收費：服務費用 ÷ 服務時數
    -- 確保 service_hours 不為 NULL 且大於 0
    IF NEW.service_hours IS NOT NULL AND NEW.service_hours > 0 THEN
        NEW.hourly_rate = ROUND((COALESCE(NEW.service_fee, 0) / NEW.service_hours)::numeric, 2);
    ELSE
        NEW.hourly_rate = 0;
    END IF;

    -- 計算每小時工資：護理人員工資 ÷ 服務時數
    IF NEW.service_hours IS NOT NULL AND NEW.service_hours > 0 THEN
        NEW.hourly_salary = ROUND((COALESCE(NEW.staff_salary, 0) / NEW.service_hours)::numeric, 2);
    ELSE
        NEW.hourly_salary = 0;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 驗證觸發器函數已更新
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'calculate_hourly_rates';
