# 明家居家護理服務 Intranet - Apple Minimal 設計風格指南

## 🎯 設計目標
實現 2025 年最現代化的 Apple 風格，簡潔、優雅、易用，提供最佳的用戶體驗。

---

## 🎨 色彩系統 (Color System)

### 主色彩 (Primary Colors)
```css
/* 背景色 */
--bg-primary: #FFFFFF;           /* 主背景白色 */
--bg-secondary: #F5F5F7;         /* 淡灰背景（分隔區/卡片背景） */
--bg-tertiary: #F9FAFB;          /* 最淡背景（表格條紋） */

/* 品牌色 */
--brand-primary: #3B82F6;        /* 極淺藍（重點按鈕/強調色） */
--brand-hover: #2563EB;          /* 品牌色 Hover 狀態 */
--brand-light: #EBF5FF;          /* 品牌色淡化背景 */
```

### 輔助色彩 (Semantic Colors)
```css
/* 狀態色 */
--success: #22C55E;              /* 成功色 */
--success-light: #DCFCE7;        /* 成功色淡化背景 */
--warning: #F59E0B;              /* 警告色 */
--warning-light: #FEF3C7;        /* 警告色淡化背景 */
--error: #EF4444;                /* 錯誤色 */
--error-light: #FEE2E2;          /* 錯誤色淡化背景 */
```

### 文字色彩 (Text Colors)
```css
--text-primary: #111827;         /* 主文字（標題、重要內容） */
--text-secondary: #6B7280;       /* 次文字（說明、標籤、輔助信息） */
--text-tertiary: #9CA3AF;        /* 三級文字（placeholder、禁用） */
--text-inverse: #FFFFFF;         /* 反色文字（深色背景上使用） */
```

### 邊框與分隔線 (Borders)
```css
--border-light: #E5E7EB;         /* 淡邊框 */
--border-medium: #D1D5DB;        /* 中邊框 */
--border-focus: #3B82F6;         /* 焦點邊框 */
```

---

## 🖋 字體排版 (Typography)

### 字體設定
```css
/* 主字體 */
font-family: 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* 字重設定 */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 字體尺寸與行高
```css
/* 標題 */
--text-4xl: 36px;  /* H1, line-height: 1.1 */
--text-3xl: 30px;  /* H2, line-height: 1.2 */
--text-2xl: 24px;  /* H3, line-height: 1.2 */
--text-xl: 20px;   /* H4, line-height: 1.3 */
--text-lg: 18px;   /* H5, line-height: 1.4 */

/* 內文 */
--text-base: 16px; /* 正文, line-height: 1.5 */
--text-sm: 14px;   /* 小字, line-height: 1.5 */
--text-xs: 12px;   /* 極小字, line-height: 1.4 */
```

### 字距設定
```css
/* 標題緊湊字距 */
letter-spacing: -0.015em;

/* 內文自然字距 */
letter-spacing: 0;
```

---

## 📦 卡片與容器設計 (Cards & Containers)

### 基礎卡片樣式
```css
.card {
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 
              0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #E5E7EB;
  overflow: hidden;
}

/* 卡片內距 */
.card-padding {
  padding: 16px 24px;
}

/* 大卡片內距 */
.card-padding-lg {
  padding: 24px 32px;
}
```

### 分隔線樣式
```css
.divider {
  border-top: 1px solid #E5E7EB;
  margin: 16px 0;
}

.divider-light {
  border-top: 1px solid #F3F4F6;
}
```

---

## 🔘 按鈕樣式 (Button Styles)

### 主按鈕 (Primary Button)
```css
.btn-primary {
  background-color: #3B82F6;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
}

.btn-primary:hover {
  background-color: #2563EB;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

### 次按鈕 (Secondary Button)
```css
.btn-secondary {
  background-color: #FFFFFF;
  color: #111827;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
}

.btn-secondary:hover {
  background-color: #F3F4F6;
  border-color: #D1D5DB;
}
```

### 圖標按鈕 (Icon Button)
```css
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
}

.btn-icon:hover {
  background-color: #F3F4F6;
}
```

---

## 🔍 表單元素設計 (Form Elements)

### 搜尋框樣式
```css
.search-input {
  background-color: #F5F5F7;
  border: 1px solid transparent;
  border-radius: 8px;
  height: 40px;
  padding: 0 12px 0 40px;
  font-size: 14px;
  color: #111827;
  transition: all 0.2s ease-in-out;
}

.search-input:focus {
  background-color: #FFFFFF;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.search-input::placeholder {
  color: #9CA3AF;
}
```

### 一般輸入框
```css
.form-input {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  color: #111827;
  transition: all 0.2s ease-in-out;
}

.form-input:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}
```

### 下拉選單
```css
.form-select {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  height: 40px;
  padding: 0 32px 0 12px;
  font-size: 14px;
  color: #111827;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg...%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  appearance: none;
}
```

---

## 📱 響應式設計 (Responsive Design)

### 斷點設定
```css
/* 手機 */
@media (max-width: 767px) {
  .container {
    padding: 0 16px;
  }
  
  .card-padding {
    padding: 12px 16px;
  }
}

/* 平板 */
@media (min-width: 768px) and (max-width: 1023px) {
  .container {
    padding: 0 24px;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
  }
}
```

---

## ✨ 互動動效 (Animations & Transitions)

### 基礎過渡動畫
```css
/* 標準過渡 */
.transition-default {
  transition: all 0.2s ease-in-out;
}

/* 慢速過渡（頁面切換） */
.transition-slow {
  transition: all 0.3s ease-in-out;
}

/* 快速過渡（微互動） */
.transition-fast {
  transition: all 0.15s ease-in-out;
}
```

### 常用動效
```css
/* 淡入效果 */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 向上滑入效果 */
.slide-up {
  animation: slideUp 0.3s ease-in-out;
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
```

---

## 🎛 實際應用範例 (Implementation Examples)

### Tailwind CSS 類別對應
```html
<!-- 主按鈕 -->
<button class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-98">
  新增客戶
</button>

<!-- 搜尋框 -->
<div class="relative">
  <input type="text" 
         class="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg h-10 px-4 pl-10 text-sm transition-all duration-200"
         placeholder="搜尋客戶姓名、電話或項目編號...">
  <svg class="absolute left-3 top-3 h-4 w-4 text-gray-400">...</svg>
</div>

<!-- 卡片容器 -->
<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <!-- 卡片內容 -->
</div>
```

### 自定義 CSS 變量整合
```css
:root {
  /* 應用所有上述 CSS 變量 */
  --mingcare-blue: #3B82F6;
  --mingcare-blue-hover: #2563EB;
}

/* 品牌特色類別 */
.btn-mingcare {
  background-color: var(--mingcare-blue);
  color: white;
}

.text-mingcare {
  color: var(--mingcare-blue);
}
```

---

## 📋 開發檢查清單 (Development Checklist)

### ✅ 基礎設定
- [ ] 引入 Inter 字體或 Apple System 字體
- [ ] 設定 CSS 變量
- [ ] 配置 Tailwind CSS（如使用）
- [ ] 測試所有斷點響應式

### ✅ 組件檢查
- [ ] 按鈕 hover/active 狀態正確
- [ ] 表單元素 focus 狀態美觀
- [ ] 卡片陰影和圓角一致
- [ ] 色彩對比度符合無障礙標準

### ✅ 互動體驗
- [ ] 所有過渡動畫流暢（200ms）
- [ ] 按鈕點擊反饋良好
- [ ] 載入狀態清晰
- [ ] 錯誤提示友善

---

## 💡 最佳實踐建議

1. **保持一致性**：所有組件使用相同的色彩變量和字體設定
2. **重視細節**：圓角、陰影、間距都要精確
3. **性能優化**：使用 CSS 變量而非重複寫死數值
4. **無障礙支援**：確保色彩對比度和鍵盤導航
5. **測試驗證**：在不同設備和瀏覽器測試視覺效果

---

**此設計風格指南確保明家居家護理服務 Intranet 擁有現代、專業、易用的 Apple 風格界面。**
