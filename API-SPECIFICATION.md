# 客戶管理中心 - 後端 API 規格
# 完整版本 (前後端對接指南)

## 🎯 概述
此文檔定義客戶管理中心所需的後端 API 規格，包含客戶編號生成、搜尋建議、CRUD 操作等功能。

---

## 📋 API 端點列表

### 1. 客戶編號生成 API

**端點**: `POST /api/customers/generate-id`

**用途**: 根據客戶類型和介紹人生成下一個客戶編號

**請求格式**:
```json
{
  "customer_type": "社區券客戶" | "明家街客",
  "introducer": "Steven Kwok" | "Joe Cheung" | "Candy Ho" | ...
}
```

**回應格式**:
```json
{
  "success": true,
  "data": {
    "customer_id": "CCSV-MC0001",
    "prefix": "CCSV-MC",
    "sequence": 1
  }
}
```

**編號生成規則**:
1. 社區券客戶 → `CCSV-MC0001`
2. 明家街客 → `MC0001`
3. Steven Kwok + 社區券 → `S-CCSV0001`
4. Steven Kwok + 明家街客 → `MC0001` (與普通明家街客共用)

**後端實現邏輯**:
```sql
-- 查詢相同前綴的最大編號
SELECT customer_id 
FROM customer_personal_data 
WHERE customer_id LIKE '${prefix}%' 
ORDER BY customer_id DESC 
LIMIT 1;

-- 提取數字部分，+1，補零至 4 位
-- 例如: CCSV-MC0005 → 提取 5 → +1 = 6 → 補零 = 0006 → CCSV-MC0006
```

---

### 2. 搜尋建議 API

**端點**: `GET /api/customers/search-suggestions?q={query}&limit={limit}`

**用途**: 提供客戶搜尋的自動完成建議

**參數**:
- `q`: 搜尋關鍵字 (最少 2 個字元)
- `limit`: 回傳數量限制 (預設 10，最大 20)

**回應格式**:
```json
{
  "success": true,
  "data": [
    {
      "customer_id": "CCSV-MC0001",
      "customer_name": "陳大文",
      "phone": "12345678",
      "display_text": "陳大文 - 12345678 - CCSV-MC0001"
    }
  ]
}
```

**後端查詢邏輯**:
```sql
SELECT customer_id, customer_name, phone
FROM customer_personal_data 
WHERE customer_name ILIKE '%${query}%' 
   OR phone ILIKE '%${query}%' 
   OR customer_id ILIKE '%${query}%'
ORDER BY created_at DESC
LIMIT ${limit};
```

---

### 3. 客戶列表 API

**端點**: `GET /api/customers?page={page}&limit={limit}&filters={filters}`

**用途**: 獲取客戶列表，支援篩選、分頁、排序

**參數**:
- `page`: 頁碼 (從 1 開始)
- `limit`: 每頁數量 (預設 20)
- `filters`: 篩選條件 (JSON 格式)

**篩選條件格式**:
```json
{
  "search": "搜尋關鍵字",
  "customer_type": "社區券客戶",
  "district": "中西區",
  "introducer": "Joe Cheung",
  "project_manager": "Candy Ho"
}
```

**回應格式**:
```json
{
  "success": true,
  "data": [
    {
      "customer_id": "CCSV-MC0001",
      "customer_name": "陳大文",
      "phone": "12345678",
      "district": "中西區",
      "project_manager": "Joe Cheung",
      "created_at": "2025-08-13T10:00:00Z",
      "customer_type": "社區券客戶"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 100,
    "page_size": 20
  }
}
```

---

### 4. 客戶詳情 API

**端點**: `GET /api/customers/{customer_id}`

**用途**: 獲取特定客戶的完整資料

**回應格式**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customer_id": "CCSV-MC0001",
    "customer_type": "社區券客戶",
    "customer_name": "陳大文",
    "phone": "12345678",
    "district": "中西區",
    "service_address": "香港中環...",
    "hkid": "A1234567",
    "dob": "1980-01-01",
    "age": 45,
    "health_status": "良好",
    "introducer": "Joe Cheung",
    "project_manager": "Candy Ho",
    
    // 社區券相關欄位 (條件性)
    "voucher_application_status": "已經持有",
    "voucher_number": "V123456",
    "copay_level": "5%",
    "charity_support": true,
    "lds_status": "已完成評估",
    "home_visit_status": "已完成",
    
    "created_at": "2025-08-13T10:00:00Z"
  }
}
```

---

### 5. 新增客戶 API

**端點**: `POST /api/customers`

**用途**: 新增客戶資料

**請求格式**:
```json
{
  "customer_id": "CCSV-MC0001",  // 必須先調用生成 API
  "customer_type": "社區券客戶",
  "customer_name": "陳大文",
  "phone": "12345678",
  "district": "中西區",
  "service_address": "香港中環...",
  "hkid": "A1234567",
  "dob": "1980-01-01",
  "health_status": "良好",
  "introducer": "Joe Cheung",
  "project_manager": "Candy Ho",
  
  // 條件性欄位 (根據 customer_type 和其他選擇)
  "voucher_application_status": "已經持有",
  "voucher_number": "V123456",
  "copay_level": "5%",
  "charity_support": true,
  "lds_status": "已完成評估",
  "home_visit_status": "已完成"
}
```

**回應格式**:
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "customer_id": "CCSV-MC0001",
    // ... 完整客戶資料
  }
}
```

---

### 6. 更新客戶 API

**端點**: `PUT /api/customers/{customer_id}`

**用途**: 更新客戶資料

**請求格式**: 同新增客戶 API (部分欄位更新)

---

### 7. 刪除客戶 API

**端點**: `DELETE /api/customers/{customer_id}`

**用途**: 刪除客戶資料

**回應格式**:
```json
{
  "success": true,
  "message": "客戶資料已刪除"
}
```

---

## 🔒 驗證規則

### 後端驗證檢查項目:

1. **必填欄位檢查**:
   - customer_name, phone, district, service_address, hkid, dob, health_status, introducer, project_manager

2. **格式驗證**:
   - phone: 8 位數字 `^[0-9]{8}$`
   - hkid: 香港身份證格式 `^[A-Z]{1,2}[0-9]{6}([0-9A])$`
   - dob: 過去日期，不能是未來

3. **Enum 值檢查**:
   - 所有下拉選項必須是資料庫 enum 的有效值

4. **條件性欄位檢查**:
   - voucher_number: 只有 voucher_application_status='已經持有' 時必填
   - copay_level: 只有 voucher_application_status='已經持有' 時必選
   - charity_support: 只有 copay_level='5%' 時必選

5. **客戶編號唯一性**:
   - 檢查 customer_id 不重複

---

## ⚡ 效能優化建議

### 資料庫索引:
```sql
-- 搜尋效能優化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_customer_name_trgm 
ON customer_personal_data USING gin (lower(customer_name) gin_trgm_ops);

CREATE INDEX idx_customer_phone_trgm 
ON customer_personal_data USING gin (phone gin_trgm_ops);

CREATE INDEX idx_customer_id_trgm 
ON customer_personal_data USING gin (customer_id gin_trgm_ops);

-- 篩選效能優化
CREATE INDEX idx_customer_type ON customer_personal_data (customer_type);
CREATE INDEX idx_district ON customer_personal_data (district);
CREATE INDEX idx_introducer ON customer_personal_data (introducer);
CREATE INDEX idx_project_manager ON customer_personal_data (project_manager);
CREATE INDEX idx_created_at ON customer_personal_data (created_at);
```

---

## 🚨 錯誤處理

### 標準錯誤回應格式:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "電話格式錯誤，請輸入 8 位數字",
    "field": "phone"
  }
}
```

### 常見錯誤碼:
- `VALIDATION_ERROR`: 輸入驗證失敗
- `DUPLICATE_CUSTOMER_ID`: 客戶編號重複
- `CUSTOMER_NOT_FOUND`: 客戶不存在
- `INVALID_ENUM_VALUE`: Enum 值無效
- `MISSING_REQUIRED_FIELD`: 必填欄位遺漏

---

## 📝 開發檢查清單

### 後端實現檢查:
- [ ] 客戶編號生成邏輯 (4 種前綴規則)
- [ ] 搜尋建議 API (支援 3 欄位模糊匹配)
- [ ] 客戶列表 API (篩選、分頁、排序)
- [ ] 完整 CRUD 操作
- [ ] 表單驗證規則
- [ ] 資料庫索引優化
- [ ] 錯誤處理機制

### 前端對接檢查:
- [ ] API 調用服務層
- [ ] 錯誤訊息顯示
- [ ] 載入狀態處理
- [ ] 表單驗證提示
- [ ] 搜尋建議 UI
- [ ] 客戶列表顯示

---

**此規格確保前後端完美對接，開發團隊可以並行開發！** 🚀
