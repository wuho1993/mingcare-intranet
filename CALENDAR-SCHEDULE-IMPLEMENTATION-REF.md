# MingCare 月曆排更介面實作參考文件

## 🎯 總體目標
- 月曆日格點擊 → 開啟排更彈窗
- 支援單日 / 多日排更
- 兩段式提交：預覽草稿 → 確認提交到 Supabase

## 📋 Step-by-Step 實作順序

### Step 1: 三卡式表單佈局實作
**目標**: 實作完整的 ScheduleFormModal 內容，替換掉目前的佔位符

#### 卡片 1: 客戶基本資料
- ✅ 客戶搜尋功能（≥2字元觸發）
  - 搜尋：customer_id OR customer_name
  - 顯示：「customer_name（customer_id）」
  - 選中自動回填：customer_name, customer_id, phone, service_address
- ✅ 欄位：customer_name*、customer_phone、service_address

#### 卡片 2: 服務詳情  
- ✅ service_type*（enum下拉）
- ✅ project_category*（enum下拉）
- ✅ project_manager*（enum下拉）
- ✅ care_staff_name 搜尋功能
  - 搜尋：name_chinese OR staff_id
  - 顯示：「name_chinese（staff_id）」
  - 選中回填：只寫入 name_chinese
- ✅ start_time / end_time（限制 00/30 分鐘）
- ✅ service_hours*（手動 + 計算按鈕）

#### 卡片 3: 收費與工資
- ✅ service_fee*（≥0）
- ✅ staff_salary*（≥0, ≤service_fee）
- ✅ hourly_rate（自動計算，唯讀）
- ✅ hourly_salary（自動計算，唯讀）
- ✅ 利潤顯示（自動計算，唯讀）

### Step 2: 搜尋建議系統
- ✅ 0.3s 防抖
- ✅ 最多 20 項建議
- ✅ 高亮匹配字
- ✅ 鍵盤導航

### Step 3: 時間選擇器與計算
- ✅ 時間輸入限制（分鐘只能 00/30）
- ✅ 【計算】按鈕自動計算 service_hours
- ✅ 四捨五入到 0.5 小時

### Step 4: 兩段式提交流程
- ✅ 【加入日曆（預覽）】→ 生成草稿，不落庫
- ✅ 【確認提交】→ 批量寫入 Supabase
- ✅ 草稿標籤顯示：「customer_name · care_staff_name · HH:mm–HH:mm · service_type」

### Step 5: 衝突檢查
- ✅ 時間重疊檢查：同員工、同日期、時間衝突
- ✅ 提示不阻擋：顯示衝突清單，可選繼續/跳過/調整

### Step 6: Supabase 整合與刷新
- ✅ 即時刷新日格統計
- ✅ 更新 KPI 和分類小計
- ✅ 列表檢視同步

## 🔍 當前狀態檢查
### ✅ 已完成
- 基本月曆結構
- 多選模式切換
- Modal 開關邏輯
- API 端點（search-customers, search-care-staff）
- 基本表單驗證架構

### ❌ 待實作
- **ScheduleFormModal 的實際表單內容（目前只有佔位符）**
- 三卡式佈局
- 搜尋建議 UI
- 時間輸入限制
- 兩段式提交邏輯
- 草稿預覽系統

## 🚦 實作方針
**一次只做一個功能，每步驟完成後 Demo 給用戶確認**

---
**下一步**: 實作 Step 1 - 三卡式表單佈局
**檔案**: `/app/services/page.tsx` 的 `ScheduleFormModal` 組件
**目標**: 替換佔位符，實作完整表單內容
