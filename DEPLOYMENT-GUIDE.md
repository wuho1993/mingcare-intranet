# 🚀 客戶編號生成系統部署指引

## 部署步驟

### 1️⃣ 執行 Supabase SQL 腳本

在 Supabase Dashboard 的 SQL Editor 中執行以下腳本：

```sql
-- 複製 /supabase/migrations/create_customer_id_generator.sql 的內容並執行
```

或者使用 Supabase CLI：
```bash
supabase db push
```

### 2️⃣ 驗證 RPC 函數

在 Supabase Dashboard → Database → Functions 中確認：
- `generate_next_customer_id` 函數已建立
- 權限設置正確 (authenticated 用戶可執行)

### 3️⃣ 測試客戶編號生成

可以在 SQL Editor 中測試：

```sql
-- 測試社區券客戶
SELECT generate_next_customer_id('社區券客戶', NULL);
-- 應該返回: CCSV-MC-0001

-- 測試明家街客
SELECT generate_next_customer_id('明家街客', NULL);
-- 應該返回: MC-0001

-- 測試 Steven Kwok + 社區券
SELECT generate_next_customer_id('社區券客戶', 'Steven Kwok');
-- 應該返回: S-CCSV-0001

-- 測試 Steven Kwok + 明家街客
SELECT generate_next_customer_id('明家街客', 'Steven Kwok');
-- 應該返回: MC-0002 (與普通明家街客共用流水號)
```

### 4️⃣ 前端功能驗證

1. **新增客戶**：
   - 訪問 `/clients/new`
   - 選擇不同的客戶類型和介紹人
   - 確認編號生成正確
   - 提交表單成功

2. **編輯客戶**：
   - 訪問現有客戶的編輯頁面 `/clients/[id]/edit`
   - 確認可以保留原編號或生成新編號
   - 測試「生成新編號」按鈕
   - 提交更新成功

### 5️⃣ 並發測試

可以開啟多個瀏覽器窗口同時新增相同類型的客戶，確認：
- 不會生成重複編號
- 編號按順序遞增
- 無資料庫錯誤

## 功能總結

### ✅ 已實施功能

1. **RPC 函數**：
   - `generate_next_customer_id(customer_type, introducer)` 
   - 並發安全（使用 PostgreSQL 鎖定）
   - 支援四種前綴規則

2. **新增客戶**：
   - 自動生成客戶編號
   - 完整表單驗證
   - Apple Minimal 設計風格

3. **編輯客戶**：
   - 保留原編號或生成新編號選項
   - 完整表單預填充
   - 同步資料庫更新

4. **客戶管理中心**：
   - 編輯按鈕已加入卡片和列表視圖
   - 點擊導航至編輯頁面

### 🎯 編號生成規則

| 客戶類型 | 介紹人 | 前綴 | 範例 |
|----------|--------|------|------|
| 社區券客戶 | 一般 | `CCSV-MC` | `CCSV-MC-0001` |
| 明家街客 | 一般 | `MC` | `MC-0001` |
| 社區券客戶 | Steven Kwok | `S-CCSV` | `S-CCSV-0001` |
| 明家街客 | Steven Kwok | `MC` | `MC-0002` |

### 🔧 技術實施

- **後端**：Supabase RPC 函數，PostgreSQL 鎖定機制
- **前端**：Next.js 14, TypeScript, Tailwind CSS
- **設計**：Apple Minimal 風格
- **驗證**：完整表單驗證和錯誤處理

## 下一步開發

1. **客戶詳情頁面** (`/clients/[id]`)
2. **批量操作功能**
3. **客戶搜尋和篩選優化**
4. **報表和統計功能**

---

**所有功能已按照 CUSTOMER-ID-GENERATION-SPEC.md 規格完整實施** ✨
