-- 更新客戶編號生成函數以支援家訪客戶
-- 新增 HV（Home Visit）前綴用於家訪客戶

CREATE OR REPLACE FUNCTION generate_next_customer_id(
  p_customer_type customer_type_enum,
  p_introducer introducer_enum DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prefix TEXT;
  max_id TEXT;
  next_number INTEGER;
  new_customer_id TEXT;
BEGIN
  -- 1. 根據條件決定前綴
  IF p_introducer = 'Steven Kwok' AND p_customer_type = '社區券客戶' THEN
    prefix := 'S-CCSV';
  ELSIF p_introducer = 'Steven Kwok' AND p_customer_type = '明家街客' THEN
    prefix := 'MC';
  ELSIF p_introducer = 'Steven Kwok' AND p_customer_type = '家訪客戶' THEN
    prefix := 'S-HV';
  ELSIF p_customer_type = '社區券客戶' THEN
    prefix := 'CCSV-MC';
  ELSIF p_customer_type = '明家街客' THEN
    prefix := 'MC';
  ELSIF p_customer_type = '家訪客戶' THEN
    prefix := 'HV';
  ELSE
    RAISE EXCEPTION 'Invalid customer_type: %', p_customer_type;
  END IF;

  -- 2. 使用前綴鎖定，避免並發衝突
  PERFORM pg_advisory_xact_lock(hashtext(prefix));

  -- 3. 查詢該前綴下最大的客戶編號
  SELECT customer_id INTO max_id
  FROM customer_personal_data
  WHERE customer_id LIKE prefix || '-%'
  ORDER BY 
    CASE 
      WHEN customer_id ~ ('^' || prefix || '-[0-9]+$') THEN
        CAST(SUBSTRING(customer_id FROM LENGTH(prefix) + 2) AS INTEGER)
      ELSE 0
    END DESC
  LIMIT 1;

  -- 4. 計算下一個編號
  IF max_id IS NULL THEN
    next_number := 1;
  ELSE
    -- 提取數字部分並加1
    next_number := CAST(SUBSTRING(max_id FROM LENGTH(prefix) + 2) AS INTEGER) + 1;
  END IF;

  -- 5. 生成新的客戶編號（補零至4位）
  new_customer_id := prefix || '-' || LPAD(next_number::TEXT, 4, '0');

  -- 6. 檢查是否已存在（雙重保險）
  IF EXISTS (SELECT 1 FROM customer_personal_data WHERE customer_id = new_customer_id) THEN
    RAISE EXCEPTION 'Generated customer_id already exists: %', new_customer_id;
  END IF;

  RETURN new_customer_id;
END;
$$;

-- 更新索引以支援新的 HV 和 S-HV 前綴
DROP INDEX IF EXISTS idx_customer_id_prefix;
CREATE INDEX idx_customer_id_prefix 
ON customer_personal_data(customer_id) 
WHERE customer_id ~ '^(MC|CCSV-MC|S-CCSV|HV|S-HV)-[0-9]+$';

COMMENT ON FUNCTION generate_next_customer_id IS '生成下一個客戶編號，並發安全，支援 MC, CCSV-MC, S-CCSV, HV, S-HV 前綴';
