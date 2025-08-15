# 編輯客戶流程 v1 — 開發需求規格

## 目標
- 提供與「新增客戶」一致的單頁動態表單體驗
- 允許在編輯時保留原 customer_id，或按規則產生新 customer_id

## 入口
- **來源**: 列表/卡片點「編輯」→ 導向 Edit Customer 頁
- **初始**: 以 customer_id 載入 `public.customer_personal_data` 現有資料填入表單

## 表單（與新增一致）
- 同新增表單規格（欄位、條件顯示、驗證完全一致）
- **唯一區別**: 頁面頂部加入「客戶編號處理」區塊（見下）

## 客戶編號處理（編輯專屬）

### 顯示目前編號
```
customer_id: XXXXX
```

### 單選選項
1. **保留原編號（預設）**
   - customer_id 不變
   - 其他欄位按驗證規則更新

2. **產生新編號**
   - 選擇後出現提示：將按新增邏輯以「前綴 + 4 位流水」產生新 customer_id
   - **前綴規則與新增一致**:
     - 社區券客戶 → `CCSV-MC`
     - 明家街客 → `MC`
     - introducer='Steven Kwok' 且社區券 → `S-CCSV`
     - introducer='Steven Kwok' 且明家街客 → `MC`（與普通明家街客共用）
   - **生成時機**: 用戶設定/變更 customer_type 與 introducer 後，按前綴查最大尾碼 → +1 → 預覽新編號
   - **提交前確認**: 二次確認彈窗「將以新編號儲存；原編號不再使用」

### 備註
如 customer_type／introducer 在編輯過程中被改動，而使用者選了「保留原編號」，仍以原編號為準，不受前綴規則影響。

## 搜尋最大尾碼（前端生成版的配套）
- 使用前綴查詢「同前綴的最大尾碼」（後端提供一個精簡 API 即可）
- 前端將尾碼 +1 並補足 4 位（0001→0002）
- 編輯時如選「產生新編號」，沿用同一查詢流程

## 驗證規則（與新增相同）
- **必填不可空**: dob 必為過去日期
- **條件欄位**:
  - `voucher_number` 僅當 `voucher_application_status='已經持有'` 必填
  - `copay_level` 僅當 已經持有 必選，且值 ∈ {5%,8%,12%,16%,25%,40%}
  - `charity_support` 僅當 `copay_level='5%'` 必選
- **下拉欄位**必須是 enum 的有效值
- **customer_id 唯一性**: 提交前先檢查新/舊 customer_id 與資料庫不衝突（有衝突即阻止提交並提示）

## 寫入邏輯
### 保留原編號
```sql
UPDATE customer_personal_data SET ... WHERE customer_id = <原>
```

### 產生新編號
- 以新 customer_id 更新該筆（或視需要採「另存為新客戶」：新增一筆並標記 replaced_by / replaces 關係，按你團隊資料策略決定）
- 若採更新原筆：寫入前二次確認；提交後在活動日誌（audit）記錄「編號變更：舊 → 新」

## UI/UX
- **單頁動態表單**: 依條件平滑顯示/隱藏相關欄位
- **customer_id 區塊**: 提供預覽新編號與回復原編號按鈕
- **提交按鈕**: 提交中禁用；錯誤訊息逐欄顯示
- **無硬刷新**: 成功後顯示 Toast「已更新」，並在列表/卡片即時反映

## 權限/安全（建議）
- 僅內部已登入用戶可編輯；行級安全（RLS）限制寫入權限
- 編號變更必須具備更高權限或二次確認（防止誤操作）

## 測試案例（編輯專屬 + 基礎）
1. **保留原編號**: 更新資料不改 customer_id
2. **改為新編號**: 前綴規則正確；最大尾碼 +1；寫入成功且唯一
3. **編輯中切換 customer_type/introducer**:
   - 保留原編號 → 編號不變
   - 產生新編號 → 新前綴即時更新並正確生成
4. **社區券**: 申請中 與 已經持有 兩條路徑（含 copay_level=5% 需要 charity_support）
5. **Enum 非法值**被前端攔截、後端拒絕
6. **舊→新編號**: 活動日誌（或欄位）能追溯變更
7. **customer_id 衝突**（人手造數或同時提交）：提示並阻止提交

## 開發順序（建議）
1. **頁面與資料讀取**（以 customer_id 載入舊資料）
2. **客戶編號處理區塊**（保留/產生新編號 + 預覽）
3. **條件顯示 + 驗證**（與新增對齊）
4. **提交與提示**（活動日誌 / 成功回饋）

## 後端 API 需求

### 獲取最大尾碼 API
```
GET /api/customers/max-suffix?prefix={prefix}
Response: { max_suffix: number }
```

### 客戶資料更新 API
```
PUT /api/customers/{customer_id}
Body: {
  keep_original_id: boolean,
  new_customer_id?: string,
  customer_data: CustomerFormData
}
```
