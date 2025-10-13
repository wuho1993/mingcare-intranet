# 明家護理 設計系統規範

## 🎨 顏色系統

### 主色調
- **主藍色**: `bg-mingcare-blue` (#3B82F6) - 主要按鈕、強調元素
- **主藍色 Hover**: `hover:bg-blue-700` (#2563EB)
- **淺藍色**: `bg-blue-50` - 週末日期背景

### 背景顏色
- **主背景**: `bg-bg-primary` (白色) - 主要內容區
- **次背景**: `bg-bg-secondary` (#F5F5F7) - hover 狀態
- **第三背景**: `bg-bg-tertiary` (#F9FAFB) - 卡片標題區

### 文字顏色
- **主文字**: `text-text-primary` (#111827) - 標題、重要內容
- **次文字**: `text-text-secondary` (#6B7280) - 說明文字
- **第三文字**: `text-text-tertiary` (#9CA3AF) - 輔助資訊

### 邊框顏色
- **淺邊框**: `border-border-light` (#E5E7EB) - 主要邊框
- **中邊框**: `border-border-medium` (#D1D5DB) - 強調邊框
- **焦點邊框**: `focus:border-blue-500` - 輸入框焦點狀態

### 狀態顏色
- **成功**: `bg-green-500/600`, `text-green-600`
- **警告**: `bg-orange-500/600`, `text-orange-600`
- **錯誤**: `bg-red-500/600`, `text-red-600`
- **資訊**: `bg-blue-500/600`, `text-blue-600`

---

## 📏 間距系統

### 統一間距值
- **xs**: `gap-1, space-x-1, p-1` = 4px
- **sm**: `gap-2, space-x-2, p-2` = 8px
- **md**: `gap-4, space-x-4, p-4` = 16px
- **lg**: `gap-6, space-x-6, p-6` = 24px
- **xl**: `gap-8, space-x-8, p-8` = 32px

### 區域間距
- **卡片間**: `space-y-6` (24px) 桌面端，`space-y-4` (16px) 移動端
- **表單元素間**: `space-y-4` (16px)
- **按鈕組間**: `space-x-3` (12px)

---

## 🔲 卡片樣式

### 標準卡片 (Apple 風格)
```jsx
<div className="card-apple border border-border-light fade-in-apple">
  <div className="card-apple-content">
    {/* 內容 */}
  </div>
</div>
```

### 卡片規範
- **背景**: `bg-white`
- **圓角**: `rounded-lg` (0.75rem)
- **邊框**: `border border-border-light` (1px #E5E7EB)
- **陰影**: `shadow-apple` (0 2px 8px rgba(0, 0, 0, 0.08))
- **內邊距**: `p-6` (24px) 桌面端，`p-4` (16px) 移動端
- **Hover**: `hover:shadow-apple-hover` (0 4px 16px rgba(0, 0, 0, 0.12))

---

## 🔘 按鈕樣式

### 主按鈕 (Primary)
```jsx
<button className="btn-apple-primary">
  確認
</button>
```
- **背景**: 漸層藍色 `bg-mingcare-blue`
- **文字**: 白色 `text-white`
- **圓角**: `rounded-lg` (0.5rem)
- **內邊距**: `py-2 px-4` (桌面) / `py-1.5 px-3` (移動端)
- **字重**: `font-medium` 或 `font-semibold`
- **Hover**: `hover:bg-blue-700 hover:shadow-md`
- **過渡**: `transition-all duration-200`

### 次要按鈕 (Secondary)
```jsx
<button className="btn-apple-secondary">
  取消
</button>
```
- **背景**: 白色 `bg-white`
- **文字**: `text-text-primary`
- **邊框**: `border border-border-light`
- **圓角**: `rounded-lg`
- **Hover**: `hover:bg-bg-tertiary hover:border-border-medium`

### 危險按鈕 (Danger)
```jsx
<button className="btn-apple-danger">
  刪除
</button>
```
- **背景**: `bg-red-500`
- **文字**: 白色 `text-white`
- **Hover**: `hover:bg-red-600`

### 圖標按鈕
- **尺寸**: `w-9 h-9` 或 `w-10 h-10`
- **內邊距**: `p-2`
- **圓角**: `rounded-lg`
- **圖標**: `w-5 h-5`

---

## 📝 輸入框樣式

### 標準輸入框
```jsx
<input className="w-full px-4 py-3 border border-border-light rounded-lg 
                  focus:ring-2 focus:ring-mingcare-blue focus:border-transparent
                  text-sm transition-all duration-200" />
```

### 規範
- **背景**: `bg-white`
- **邊框**: `border border-border-light`
- **圓角**: `rounded-lg` (0.75rem)
- **內邊距**: `px-4 py-3` (桌面) / `px-3 py-2` (移動端)
- **字體**: `text-sm` (14px)
- **焦點**: `focus:ring-2 focus:ring-mingcare-blue focus:border-transparent`
- **Placeholder**: `placeholder:text-text-tertiary`

### Select / Dropdown
- 與輸入框相同樣式
- 右側添加下拉箭頭圖標

---

## 📱 響應式設計

### 斷點系統
- **sm**: `@media (min-width: 640px)` - 手機橫向
- **md**: `@media (min-width: 768px)` - 平板
- **lg**: `@media (min-width: 1024px)` - 桌面
- **xl**: `@media (min-width: 1280px)` - 大螢幕

### 移動端優化
```jsx
// 文字大小
className="text-xs sm:text-sm lg:text-base"

// 間距
className="p-3 sm:p-4 lg:p-6"

// 按鈕
className="py-1.5 px-3 sm:py-2 sm:px-4"

// 卡片間距
className="space-y-4 sm:space-y-6"
```

---

## 🎭 動畫與過渡

### 標準過渡
```jsx
className="transition-all duration-200 ease-in-out"
```

### 淡入動畫 (Apple 風格)
```jsx
className="fade-in-apple"
```

### Hover 效果
- **卡片**: `hover:shadow-md hover:border-mingcare-blue`
- **按鈕**: `hover:bg-opacity-90 hover:-translate-y-0.5`
- **輸入框**: `hover:border-border-medium`

---

## 📋 表格樣式

### 表格標題
- **背景**: `bg-bg-secondary`
- **文字**: `text-text-primary font-medium`
- **內邊距**: `px-4 py-3`

### 表格單元格
- **內邊距**: `px-4 py-3`
- **邊框**: `border-b border-border-light`
- **Hover**: `hover:bg-bg-tertiary`

---

## 🏷️ 標籤 (Tags/Chips)

### 標準標籤
```jsx
<span className="inline-flex items-center px-3 py-1 
               bg-mingcare-blue text-white text-sm rounded-full">
  標籤內容
</span>
```

- **圓角**: `rounded-full`
- **內邊距**: `px-3 py-1`
- **字體**: `text-sm font-medium`

---

## ⚠️ 注意事項

### 避免使用
❌ 不要混用顏色類別：
- 避免 `border-gray-200` 改用 `border-border-light`
- 避免 `text-gray-600` 改用 `text-text-secondary`
- 避免 `bg-gray-50` 改用 `bg-bg-secondary`

❌ 不要混用圓角大小：
- 統一使用 `rounded-lg` 除非特殊需求

❌ 不要混用陰影：
- 統一使用 `shadow-sm`, `shadow-md`, `shadow-lg`

### 最佳實踐
✅ 使用語義化類別名稱
✅ 保持一致的間距比例
✅ 移動端優先設計
✅ 使用過渡動畫提升體驗
✅ 保持顏色對比度（無障礙設計）

---

## 📊 常用組合範例

### 篩選器區域
```jsx
<div className="card-apple border border-border-light mb-6">
  <div className="card-apple-header">
    <h3 className="text-lg font-semibold text-text-primary">
      搜尋與篩選
    </h3>
  </div>
  <div className="card-apple-content">
    {/* 篩選內容 */}
  </div>
</div>
```

### 表單組
```jsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-text-primary mb-2">
      標籤
    </label>
    <input className="w-full px-4 py-3 border border-border-light rounded-lg
                    focus:ring-2 focus:ring-mingcare-blue focus:border-transparent" />
  </div>
</div>
```

### 按鈕組
```jsx
<div className="flex space-x-3">
  <button className="btn-apple-primary flex-1">確認</button>
  <button className="btn-apple-secondary flex-1">取消</button>
</div>
```

---

## 🔄 更新日誌

- 2025-01-10: 初始版本建立
- 統一所有頁面使用相同的設計系統規範
