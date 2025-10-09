# 跨夜更顯示問題修復報告

## 問題描述
用戶反映：「overnight 更因為涉及了兩天，在排更和編輯更期那裏顯示不到。」

### 問題分析
1. **原有系統限制**：
   - 每條服務記錄只有一個 `service_date` 欄位
   - 記錄按 `service_date` 分組顯示在月曆上
   - 時間驗證邏輯：`if (start_time >= end_time)` 會**拒絕**跨夜更（例如：23:00-07:00）
   - 時數計算不支援跨夜：當結束時間 < 開始時間會計算錯誤
   - 跨夜更只會顯示在開始日期，結束日期（隔天）看不到

2. **實際場景**：
   - 夜更：23:00 開始，次日 07:00 結束
   - 這種更應該同時顯示在兩天的月曆上
   - 用戶需要知道哪些員工在隔天早上仍在工作

---

## 解決方案

### 1. 支援跨夜更輸入
**位置**：`app/services/page.tsx` 第 5899-5903 行

**修改前**：
```typescript
// 檢查時間邏輯
if (data.start_time >= data.end_time) {
  errors.end_time = '結束時間必須晚於開始時間'
}
```

**修改後**：
```typescript
// 時間邏輯檢查已移除 - 現在支援跨夜更（例如：23:00-07:00）
```

✅ **效果**：允許輸入結束時間早於開始時間的記錄

---

### 2. 修正時數計算
**位置**：`app/services/page.tsx` 第 5906-5918 行

**修改前**：
```typescript
const calculateServiceHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return Math.max(0, (endMinutes - startMinutes) / 60)
}
```

**修改後**：
```typescript
// 計算服務時數（支援跨夜更）
const calculateServiceHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  let startMinutes = startHour * 60 + startMin
  let endMinutes = endHour * 60 + endMin

  // 跨夜更：結束時間小於開始時間，加24小時（1440分鐘）
  if (endMinutes < startMinutes) {
    endMinutes += 1440
  }

  return Math.max(0, (endMinutes - startMinutes) / 60)
}
```

✅ **效果**：
- 23:00-07:00 = 8小時（正確）
- 之前會計算成 -16 小時或 0 小時（錯誤）

---

### 3. 雙日顯示跨夜更
**位置**：`app/services/page.tsx` 第 146-187 行

**修改前**：
```typescript
// 將記錄按日期分組
const groupedByDate: Record<string, BillingSalaryRecord[]> = {}
records.forEach((record: BillingSalaryRecord) => {
  const dateKey = record.service_date
  if (!groupedByDate[dateKey]) {
    groupedByDate[dateKey] = []
  }
  groupedByDate[dateKey].push(record)
})
```

**修改後**：
```typescript
// 將記錄按日期分組（支援跨夜更）
const groupedByDate: Record<string, BillingSalaryRecordWithOvernight[]> = {}
records.forEach((record: BillingSalaryRecord) => {
  const startDate = record.service_date
  
  // 添加到開始日期
  if (!groupedByDate[startDate]) {
    groupedByDate[startDate] = []
  }
  groupedByDate[startDate].push(record)
  
  // 檢測跨夜更：結束時間小於開始時間
  if (record.start_time && record.end_time && record.start_time > record.end_time) {
    // 計算結束日期（隔天）
    const startDateObj = new Date(startDate + 'T00:00:00')
    startDateObj.setDate(startDateObj.getDate() + 1)
    const endDate = formatDateSafely(startDateObj)
    
    // 也添加到結束日期（隔天），標記為跨夜顯示
    if (!groupedByDate[endDate]) {
      groupedByDate[endDate] = []
    }
    // 添加標記以便在顯示時區分
    const overnightRecord = { ...record, _isOvernightEndDay: true }
    groupedByDate[endDate].push(overnightRecord)
  }
})
```

✅ **效果**：
- 跨夜更會同時出現在兩天的月曆格子中
- 隔天顯示的記錄有 `_isOvernightEndDay: true` 標記

---

### 4. 視覺標記跨夜更

#### 4.1 月曆視圖標記
**位置**：`app/services/page.tsx` 第 370-380 行

**添加的代碼**：
```typescript
<div className="text-gray-600 text-xs flex items-center gap-1">
  {/* 跨夜更標記 */}
  {record.start_time && record.end_time && record.start_time > record.end_time && (
    <span title="跨夜更" className="text-orange-500">🌙</span>
  )}
  {/* 隔天顯示標記 */}
  {(record as any)._isOvernightEndDay && (
    <span className="text-xs text-orange-600 font-semibold">(隔天)</span>
  )}
  {record.start_time}-{record.end_time}
</div>
```

#### 4.2 卡片視圖標記
**位置**：`app/services/page.tsx` 第 550-555 行

**添加的代碼**：
```typescript
<div className="flex items-center text-sm text-gray-600">
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  {/* 跨夜更標記 */}
  {record.start_time && record.end_time && record.start_time > record.end_time && (
    <span title="跨夜更" className="text-orange-500 mr-1">🌙</span>
  )}
  {record.start_time} - {record.end_time}
</div>
```

✅ **效果**：
- 🌙 月亮圖標標記跨夜更
- 「(隔天)」文字標記這是隔天的顯示副本
- 用戶一眼就能識別跨夜更

---

### 5. TypeScript 類型支援
**位置**：`types/billing-salary.ts` 第 31-38 行

**添加的類型**：
```typescript
// 跨夜更記錄（用於月曆顯示）
export interface BillingSalaryRecordWithOvernight extends BillingSalaryRecord {
  _isOvernightEndDay?: boolean // 標記此記錄是否為跨夜更的結束日顯示
}
```

✅ **效果**：類型安全，避免 TypeScript 編譯錯誤

---

## 實際使用示例

### 場景1：新增跨夜更
1. **輸入**：
   - 服務日期：2024-01-15
   - 開始時間：23:00
   - 結束時間：07:00
   - 服務時數：自動計算為 8 小時

2. **月曆顯示**：
   - **2024-01-15**：顯示 🌙 23:00-07:00
   - **2024-01-16**：顯示 🌙 (隔天) 23:00-07:00

3. **卡片視圖顯示**：
   - 顯示 🌙 圖標標記跨夜更

### 場景2：編輯跨夜更
- 可以修改開始/結束時間
- 時數會自動重新計算（支援跨夜）
- 兩天的月曆顯示會同步更新

### 場景3：刪除跨夜更
- 刪除後，兩天的月曆顯示都會移除

---

## 技術細節

### 跨夜檢測邏輯
```typescript
// 當結束時間的字符串比開始時間小，表示跨夜
record.start_time > record.end_time
// 例如："23:00" > "07:00" === true
```

### 隔天日期計算
```typescript
const startDateObj = new Date(startDate + 'T00:00:00')
startDateObj.setDate(startDateObj.getDate() + 1)
const endDate = formatDateSafely(startDateObj)
```

### 時數計算邏輯
```typescript
// 開始：23:00 = 1380 分鐘
// 結束：07:00 = 420 分鐘
// 檢測到跨夜：420 < 1380
// 加 24 小時：420 + 1440 = 1860 分鐘
// 計算時數：(1860 - 1380) / 60 = 8 小時
```

---

## 向後兼容性

✅ **完全兼容**：
- 不跨夜的記錄完全不受影響（例如：09:00-17:00）
- 資料庫結構無需修改
- 現有記錄仍可正常顯示和編輯

---

## 用戶指南

### 如何輸入跨夜更？
1. 打開「護理服務管理」頁面
2. 點擊「新增記錄」
3. 正常填寫所有資料
4. **開始時間**：輸入較大的時間（例如：23:00）
5. **結束時間**：輸入較小的時間（例如：07:00）
6. 系統會自動識別為跨夜更
7. 服務時數會自動計算為 8 小時
8. 保存後，會在兩天的月曆上都看到這筆記錄

### 如何識別跨夜更？
- 🌙 月亮圖標 = 這是跨夜更
- 「(隔天)」標記 = 這是隔天的顯示副本
- 橙色文字 = 跨夜更標記色

### 注意事項
- 跨夜更只支援**單日跨夜**（例如：23:00-07:00）
- 不支援超過24小時的更期（例如：08:00-09:00 隔天不算跨夜）
- 編輯或刪除任一天的顯示，會同步影響兩天的記錄

---

## 測試檢查清單

### 功能測試
- [x] 可以輸入跨夜更（例如：23:00-07:00）
- [x] 時數計算正確（8 小時）
- [x] 月曆視圖兩天都顯示
- [x] 卡片視圖顯示 🌙 圖標
- [x] 隔天顯示有「(隔天)」標記
- [x] 編輯跨夜更正常工作
- [x] 刪除跨夜更兩天都移除
- [x] 不跨夜的記錄不受影響

### 類型安全
- [x] TypeScript 編譯無錯誤
- [x] BillingSalaryRecordWithOvernight 類型正確

### 向後兼容
- [x] 現有記錄正常顯示
- [x] 不跨夜記錄不受影響
- [x] 資料庫結構無需修改

---

## 總結

✅ **問題已解決**：
1. 跨夜更現在可以正常輸入（不再報錯）
2. 時數計算正確（支援跨夜計算）
3. 跨夜更會顯示在兩天的月曆上
4. 清晰的視覺標記（🌙 圖標 + 「隔天」標記）

✅ **用戶體驗改進**：
- 一眼識別跨夜更
- 兩天的月曆都能看到相關記錄
- 編輯和刪除邏輯清晰

✅ **技術實現**：
- 無需修改資料庫結構
- 完全向後兼容
- 類型安全（TypeScript）
- 代碼清晰易維護

---

## 相關文件
- 修改的主文件：`app/services/page.tsx`
- 類型定義文件：`types/billing-salary.ts`
- 資料庫結構：`supabase-database-structure.txt`
