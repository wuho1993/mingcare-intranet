# 🎯 開發需求 — 護理人員管理頁面（Care Staff Management, Edit-only）

## 產品目標
- 從表 `public.care_staff_profiles` 顯示及編輯護理人員資料
- 只提供「編輯」功能（不含新增）
- 文件欄位如為 NULL → 允許「上載」，上載成功後回寫 URL；如已有值 → 改為「替換」流程（需二次確認）

## 數據來源（Postgres / Supabase）

### 主表：public.care_staff_profiles
- **主鍵**：id (uuid)
- **識別**：staff_id (text)（用來命名 Storage 目錄）

### 主要欄位（節錄，對齊命名）
- **基本**：name_chinese, name_english, phone, email, hkid, dob, gender, nationality, preferred_area
- **聯絡**：emergency_contact, emergency_contact_phone
- **多選**：language (text[]), job_position (text[])
- **經驗**：experience_years, company_name, company_position, employment_period, main_duties
- **狀態**：covid_vaccine, contract_status
- **檔案（URL 欄位）**：hkid_copy_url, certificate_1..certificate_5, scrc_status
- **時戳**：created_at

### 選項來源（Option Tables）
- **語言**：public.language_options（label）
- **職位**：public.job_position_options（label）

---

## 🧭 導航與檢視

### 1) 頁面結構
- **左側**：搜尋列（姓名 / 電話 / 員工編號 staff_id）、篩選（gender, preferred_area, job_position）
- **主區**：列表（預設） / 卡片（可切換）
- **詳情編輯**：右側 Drawer / Modal（不跳頁）

### 2) 列表欄位（最少）
- name_chinese, phone, staff_id, preferred_area, contract_status, created_at
- **行動**：編輯（打開 Drawer）

### 3) 搜尋與篩選
- **搜尋**：支持 `name_chinese` OR `phone` OR `staff_id` 模糊匹配（≥2 字元時觸發）
- **篩選**：gender（enum）、preferred_area（enum）、job_position（包含即可）
- **排序**：created_at desc

---

## 📝 編輯規格（與現有欄位一致）

### 表單規則
- 表單為單頁動態；欄位對齊資料庫型別；多選欄位使用 Option Tables 值（只能提交有效值）
- **驗證**：name_chinese, phone（8位數）, contract_status（必選）；其他按實際需要
- **送出**：UPDATE public.care_staff_profiles WHERE id = <uuid>

### ⚠️ 不可編輯
- id（uuid）、created_at
- staff_id（僅顯示；用於 Storage 目錄命名）

---

## 📁 檔案上載（核心需求）

### 對象欄位
- hkid_copy_url（香港身份證副本）
- certificate_1..certificate_5（證書一至五）
- scrc_status（SCRC（文件連結））

### UI 規則
- 若欄位值為 NULL → 顯示「上載」按鈕
- 若欄位已有 URL → 顯示「預覽 / 下載」+「替換」按鈕（替換需二次確認）
- **上載格式**：JPG / PNG / PDF；大小上限 10MB
- **成功上載後**：即時把檔案的「公開 URL」寫回相應欄位

### Storage 規範（Supabase Storage）
- **Bucket**：care-staff-files
- **目錄**：care-staff/{staff_id}/
- **檔名**：{staff_id}_{欄位名}_{yyyyMMddHHmmss}.{ext}
  - 例：MC-2024001_cert1_20250813T225530.png
- **URL 規則**：使用公開 URL 或簽名 URL（按安全策略；預設公開 URL 便於前台預覽）

### 資料表回寫（上載成功後）
- hkid_copy → 回寫至欄位 `hkid_copy_url`
- certificate_1 → `certificate_1`
- certificate_2 → `certificate_2`
- certificate_3 → `certificate_3`
- certificate_4 → `certificate_4`
- certificate_5 → `certificate_5`
- scrc_status → `scrc_status`

（其餘欄位名稱 ↔ 檔案欄位名需一一對應；保持與上方一致）

### 空值處理
- **初次上載**：欄位為 NULL，允許上載 → 回寫 URL
- **替換上載**：欄位非 NULL → 二次確認（「會覆蓋原連結」），成功後覆蓋 URL
- **允許「清空」**：提供「移除連結」動作（需二次確認），把欄位設為 NULL

### 可用性（UX）
- **檔案卡片顯示**：當前狀態（未上載 / 已上載）、操作（上載/替換/移除）、預覽縮圖（圖片）或檔名（PDF）
- **上載中**：顯示進度與禁用按鈕
- **成功／失敗**：Toast + 欄位內訊息

### 錯誤處理（訊息示例）
- 「檔案太大，請選擇小於 10MB」
- 「不支援的格式（僅限 JPG/PNG/PDF）」
- 「上載失敗，請稍後再試」
- 「更新資料庫失敗，已還原檔案狀態」

---

## 🔐 權限與安全（建議）
- 僅內部已登入帳號可讀寫 `care_staff_profiles`
- Storage bucket 僅允許已認證用戶上載；公開讀取（或改用簽名 URL）
- RLS：限制 UPDATE 欄位；寫入僅允許特定角色

---

## ⚙️ 效能與索引（建議）
- 啟用 pg_trgm，建立 GIN 索引以支援 ILIKE 搜尋：
  - lower(name_chinese), phone, staff_id
- 列表分頁：預設 20 筆，支援無限滾動或分頁

---

## 🧪 驗收測試（必測）

1. **NULL → 上載**：每個文件欄位（hkid_copy_url / cert1..5 / scrc_status）首次上載能成功，URL 正確寫回
2. **非 NULL → 替換**：二次確認，替換成功；URL 更新
3. **移除**：二次確認，欄位設為 NULL
4. **檔案驗證**：>10MB / 非 JPG/PNG/PDF 會被阻擋
5. **搜尋**：姓名 / 電話 / staff_id 模糊匹配（≥2 字元）
6. **多選欄位**（language / job_position）：來自 Option Tables，提交值需完全匹配
7. **欄位驗證**：name_chinese, phone（8 位數字）, contract_status 必填
8. **權限**：未授權帳號不可上載／更新
9. **Storage 路徑**：實際檔案寫入 `care-staff/{staff_id}/...`；檔名含欄位名與時間戳
10. **預覽**：圖片可縮圖、PDF 以檔名連結展示

---

## 🎨 介面風格
- 採用「Apple Minimal（白色為主）」主題
- 卡片圓角 12px、細陰影、分隔線 #E5E7EB、品牌色 #3B82F6
- 搜尋框 pill 形、focus 邊框變藍
- Drawer/Modal 動效：200ms ease-in-out

---

## 📋 開發階段規劃

### 第一步：基礎架構搭建
- [ ] 創建護理人員管理頁面路由結構
- [ ] 設定 TypeScript 類型定義
- [ ] 建立 API 服務層
- [ ] 基礎頁面框架（Apple Minimal 樣式）

### 第二步：資料顯示與搜尋
- [ ] 列表檢視實作（表格/卡片切換）
- [ ] 搜尋功能（姓名/電話/員工編號）
- [ ] 篩選器（性別/偏好地區/職位）
- [ ] 分頁與排序

### 第三步：編輯表單系統
- [ ] Drawer/Modal 編輯介面
- [ ] 表單欄位（基本資料、聯絡資料、經驗等）
- [ ] 多選欄位（語言、職位）
- [ ] 表單驗證

### 第四步：文件上載系統
- [ ] Storage bucket 設定
- [ ] 文件上載 UI 組件
- [ ] 上載邏輯（NULL→上載，非NULL→替換）
- [ ] 預覽與下載功能

### 第五步：進階功能
- [ ] 二次確認機制
- [ ] 錯誤處理與使用者回饋
- [ ] 權限控制
- [ ] 效能優化

### 第六步：測試與優化
- [ ] 功能測試
- [ ] 使用者體驗優化
- [ ] 效能調優

---

**文件建立日期**：2025年8月14日  
**項目**：明家居家護理服務 Intranet  
**開發者**：GitHub Copilot
