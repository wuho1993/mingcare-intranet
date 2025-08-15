# 📌 客戶編號生成 & 編輯邏輯完整開發規格

## 目標
建立一套並發安全的客戶編號生成系統，支援新增和編輯客戶時的編號管理。

---

## 1️⃣ 客戶編號生成策略（新增客戶）

### 結論（必做）：
- **前端不生成編號**，只呼叫後端 RPC：`generate_next_customer_id(customer_type, introducer)`
- **後端保證並發安全**：使用 Per-prefix 鎖（pg_advisory_xact_lock）避免多人同時新增時撞號
- **唯一約束**：在 `customer_personal_data` 上設置 `UNIQUE(customer_id)` 作最後防線

### Prefix 規則：

| 條件 | 前綴 |
|------|------|
| 社區券客戶 | `CCSV-MC` |
| 明家街客 | `MC` |
| introducer = Steven Kwok + 社區券 | `S-CCSV` |
| introducer = Steven Kwok + 明家街客 | `MC`（與普通明家街客共用流水號） |

### 生成步驟：
1. 後端根據前綴搜尋現有最大 `customer_id`
2. 取數字部分 +1
3. 補足 4 位數字（例：0001 → 0002）
4. 返回完整編號

---

## 2️⃣ 編輯客戶流程

### 共用邏輯：
- 表單規格與新增相同
- 除 `customer_id` 外，其他欄位可修改
- 兩種選擇：
  1. **保留原有編號**（預設）
  2. **生成新編號**（呼叫與新增相同的 RPC）

### 編輯表單規則：
- 頁面進入時先載入原有 `customer_id`
- 若用戶選擇「生成新編號」，前端需：
  - 呼叫 `generate_next_customer_id(customer_type, introducer)`
  - 用返回值覆蓋 `customer_id` 欄位
- 保存時後端再檢查 `customer_id` 是否唯一

---

## 3️⃣ 後端 RPC 核心要求

### 函數簽名：
```sql
generate_next_customer_id(
  customer_type customer_type_enum,
  introducer introducer_enum
) RETURNS TEXT
```

### 邏輯流程：
1. 根據 `customer_type` + `introducer` 判斷前綴
2. 用 `pg_advisory_xact_lock(hashtext(prefix))` 鎖定
3. 查詢 `MAX(customer_id)`（該前綴下）
4. 自動遞增並補零
5. 返回新 `customer_id`

---

## 4️⃣ SQL RPC 完整範本

### 建立 RPC 函數：

```sql
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
  ELSIF p_customer_type = '社區券客戶' THEN
    prefix := 'CCSV-MC';
  ELSIF p_customer_type = '明家街客' THEN
    prefix := 'MC';
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
```

### 設置權限：
```sql
-- 允許認證用戶呼叫此函數
GRANT EXECUTE ON FUNCTION generate_next_customer_id TO authenticated;
```

### 設置唯一約束（如未設置）：
```sql
-- 確保客戶編號唯一性
ALTER TABLE customer_personal_data 
ADD CONSTRAINT customer_id_unique UNIQUE (customer_id);
```

---

## 5️⃣ 前端開發要求

### 新增客戶流程：
1. 用戶填寫表單
2. 提交時前端呼叫：
   ```typescript
   const { data: customerId } = await supabase.rpc('generate_next_customer_id', {
     p_customer_type: formData.customer_type,
     p_introducer: formData.introducer
   });
   ```
3. 將返回的 `customerId` 加入表單數據
4. 執行客戶新增操作

### 編輯客戶流程：
1. 載入現有客戶數據，顯示原 `customer_id`
2. 提供「生成新編號」按鈕
3. 點擊時呼叫相同的 RPC 函數
4. 覆蓋表單中的 `customer_id` 欄位
5. 提交時正常更新

### TypeScript 類型：
```typescript
// API 呼叫
interface GenerateCustomerIdParams {
  p_customer_type: CustomerType;
  p_introducer?: Introducer;
}

// 使用範例
const generateNewCustomerId = async (
  customerType: CustomerType, 
  introducer?: Introducer
): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_next_customer_id', {
    p_customer_type: customerType,
    p_introducer: introducer
  });
  
  if (error) throw error;
  return data;
};
```

---

## 6️⃣ 開發注意事項

### 必須遵守：
- ✅ **前端不可硬編號**
- ✅ **後端必須鎖定前綴**
- ✅ **新增 & 編輯都用同一套生成邏輯**
- ✅ **UI：在編輯頁面新增「生成新編號」按鈕**

### 錯誤處理：
- 捕捉 RPC 呼叫錯誤
- 顯示用戶友好的錯誤訊息
- 重複編號時提示重新生成

### 測試案例：
1. **並發測試**：多個用戶同時新增相同類型客戶
2. **前綴測試**：驗證各種條件組合的前綴正確性
3. **編號連續性**：確保編號按順序遞增
4. **編輯保留**：驗證編輯時可選擇保留或生成新編號

---

## 7️⃣ 範例編號生成結果

| 客戶類型 | 介紹人 | 前綴 | 範例編號 |
|----------|--------|------|----------|
| 社區券客戶 | - | `CCSV-MC` | `CCSV-MC-0001` |
| 明家街客 | - | `MC` | `MC-0001` |
| 社區券客戶 | Steven Kwok | `S-CCSV` | `S-CCSV-0001` |
| 明家街客 | Steven Kwok | `MC` | `MC-0002` |

---

## 8️⃣ 部署步驟

1. **執行 SQL RPC 建立腳本**
2. **設置權限和約束**
3. **前端更新 API 呼叫邏輯**
4. **測試並發安全性**
5. **部署到生產環境**

---

**這份規格完整涵蓋後端 RPC、前端邏輯、錯誤處理、測試要求。開發人員可以直接按此實施，無需額外猜測或設計。**
