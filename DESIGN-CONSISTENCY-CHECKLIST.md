# 設計一致性檢查清單 🎨

## 統一的設計規範

### 1. 背景色系
- ✅ **主背景**: `bg-bg-primary` - 所有頁面主背景
- ✅ **卡片背景**: `card-apple` - 白色卡片背景
- ✅ **次要背景**: `bg-bg-secondary` - 輔助背景色

### 2. 卡片樣式
```tsx
// 標準卡片
<div className="card-apple fade-in-apple">
  <div className="card-apple-content">
    內容
  </div>
</div>

// 帶標題的卡片
<div className="card-apple fade-in-apple">
  <div className="card-apple-header">
    標題
  </div>
  <div className="card-apple-content">
    內容
  </div>
</div>
```

### 3. Header 樣式
```tsx
<header className="card-apple border-b border-border-light fade-in-apple">
  <div className="w-full px-4 sm:px-6">
    <div className="flex justify-between items-center py-4 sm:py-6">
      {/* Header 內容 */}
    </div>
  </div>
</header>
```

### 4. 頁面容器
```tsx
<div className="min-h-screen bg-bg-primary">
  {/* 頁面內容 */}
</div>
```

### 5. 動畫效果
- ✅ 淡入動畫: `fade-in-apple`
- ✅ 延遲動畫: `style={{ animationDelay: '0.1s' }}`
- ✅ 卡片懸停: `hover:shadow-apple-card`

### 6. 間距系統
- **卡片間距**: `mb-4 sm:mb-6`
- **內容間距**: `p-4 sm:p-6`
- **區塊間距**: `space-y-4` 或 `gap-4`

### 7. 按鈕樣式
- **主要按鈕**: `btn-apple-primary`
- **次要按鈕**: `btn-apple-secondary`
- **危險按鈕**: `btn-apple-danger`

### 8. 表單輸入
```tsx
className="form-input-apple"
```

### 9. 邊框
- **標準邊框**: `border border-border-light`
- **危險邊框**: `border-danger`

---

## 頁面檢查清單

### ✅ 客戶管理中心 (`app/clients/page.tsx`)
- [x] Header 使用 `card-apple border-b border-border-light fade-in-apple`
- [x] 主背景使用 `min-h-screen bg-bg-primary`
- [x] 卡片使用統一樣式
- [x] 動畫延遲設置正確
- [x] 按鈕使用 Apple 樣式類

### ✅ 新增客戶頁面 (`app/clients/new/page.tsx`)
- [x] Header 樣式一致
- [x] 表單使用 `form-input-apple`
- [x] 卡片樣式統一
- [x] 錯誤提示使用 `card-apple border-danger bg-danger-light`

### ✅ 編輯客戶頁面 (`app/clients/edit-client/edit/page.tsx`)
- [x] Header 樣式一致
- [x] 表單樣式一致
- [x] 卡片樣式統一
- [x] 按鈕樣式統一

### ✅ 護理服務管理 (`app/services/page.tsx`)
- [x] Header 樣式一致
- [x] 卡片樣式統一
- [x] 表單輸入使用標準樣式
- [x] Sticky header: `sticky top-0 z-10`

### ✅ 護理人員管理 (`app/care-staff/page.tsx`)
- [x] Header 樣式一致
- [x] 卡片樣式統一
- [x] 使用 `card-apple-content p-3 sm:p-4 lg:p-6`
- [x] Sticky header

### ⚠️ 需要檢查的頁面

#### Dashboard (`app/dashboard/page.tsx`)
- [ ] 檢查 Header 樣式
- [ ] 統一卡片樣式
- [ ] 確認動畫效果

#### 薪資計算器 (`app/salary-calculator/page.tsx`)
- [x] 使用標準卡片樣式
- [x] Header 和內容分離正確

#### 佣金計算 (`app/commissions/page.tsx`)
- [x] Header 使用 sticky
- [x] 卡片樣式統一

#### 薪資報表 (`app/payroll/page.tsx`)
- [x] Header 使用 sticky
- [x] 背景色一致

---

## 響應式設計規範

### 斷點
- **手機**: `默認`
- **平板**: `sm:` (640px)
- **桌面**: `lg:` (1024px)

### 常用響應式模式
```tsx
// 間距
"p-3 sm:p-4 lg:p-6"
"mb-3 sm:mb-4 lg:mb-6"

// 文字大小
"text-sm sm:text-base"
"text-base sm:text-lg"

// Flex 方向
"flex flex-col sm:flex-row"

// 網格
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```

---

## 顏色系統

### 文字顏色
- **主要文字**: `text-text-primary`
- **次要文字**: `text-text-secondary`
- **禁用文字**: `text-text-tertiary`

### 背景顏色
- **主背景**: `bg-bg-primary` (#FFFFFF)
- **次背景**: `bg-bg-secondary` (#F5F5F7)
- **第三背景**: `bg-bg-tertiary` (#F9FAFB)

### 邊框顏色
- **淺邊框**: `border-border-light` (#E5E5EA)
- **標準邊框**: `border-border-primary`

### 品牌顏色
- **主色調**: `text-mingcare-blue` / `bg-mingcare-blue`
- **成功色**: `text-green-600` / `bg-green-50`
- **警告色**: `text-yellow-600` / `bg-yellow-50`
- **錯誤色**: `text-red-600` / `bg-red-50`

---

## 陰影系統

### 卡片陰影
- **標準**: `shadow-apple-card`
- **懸停**: `hover:shadow-apple-card-hover`
- **大陰影**: `shadow-2xl`

---

## 圓角系統
- **小圓角**: `rounded-lg` (8px)
- **中圓角**: `rounded-xl` (12px)
- **大圓角**: `rounded-2xl` (16px)
- **超大圓角**: `rounded-3xl` (24px)

---

## 需要改進的地方

### 1. 統一 Header 高度
- 所有頁面 Header 應該有一致的 padding
- 建議: `py-4 sm:py-6`

### 2. 統一卡片間距
- 頁面內容區域統一使用: `px-4 sm:px-6`
- 卡片間距統一使用: `mb-4 sm:mb-6`

### 3. 統一載入狀態
```tsx
<div className="min-h-screen flex items-center justify-center bg-bg-primary">
  <div className="text-center">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
    <p className="text-apple-body text-text-secondary mt-4">載入中...</p>
  </div>
</div>
```

### 4. 統一錯誤提示
```tsx
<div className="card-apple border-danger bg-danger-light fade-in-apple">
  <div className="card-apple-content">
    <div className="flex items-start">
      <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium text-red-800">錯誤標題</h4>
        <p className="text-sm text-red-700 mt-1">錯誤訊息</p>
      </div>
    </div>
  </div>
</div>
```

---

## 檢查工具

### 快速檢查命令
```bash
# 檢查是否使用舊的背景色
grep -r "bg-white" app/

# 檢查是否使用舊的卡片樣式
grep -r "border rounded" app/

# 檢查是否有不一致的間距
grep -r "p-6\|p-8" app/
```

---

生成時間：2025-10-17
最後更新：2025-10-17
