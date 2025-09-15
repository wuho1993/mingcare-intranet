# 更新日誌 / Changelog

## [1.1.0] - 2025-09-16

### 🎉 重要新功能 / Major New Features

#### 📷 身份證相機掃描功能 / HKID Camera Scanner
- **完整的相機掃描系統**：使用 Tesseract.js OCR 自動識別身份證
- **智能文字識別**：支援繁體中文和英文，自動提取姓名、身份證號碼、出生日期
- **雙重輸入模式**：相機掃描 + 手動輸入備用方案
- **即時進度顯示**：OCR 識別過程可視化
- **格式驗證**：自動驗證香港身份證號碼格式

#### 🏠 家訪客戶專用流程 / Home Visit Customer Workflow
- **引導式流程設計**：簡化家訪客戶的資料輸入過程
- **VISE 系統整合**：一鍵複製身份證號碼並開啟外部系統
- **使用指南**：詳細的操作步驟說明
- **條件式顯示**：基於輸入狀態動態顯示相關功能

#### 📊 客戶統計摘要 / Customer Statistics Summary
- **統計儀表板**：客戶類型分佈和總數統計
- **視覺化圖表**：使用 Recharts 提供直觀的數據展示
- **篩選功能**：按客戶類型篩選和搜尋

### ✨ 功能改進 / Improvements

#### 🎨 用戶介面優化 / UI/UX Enhancements
- **Apple 風格設計**：統一的視覺語言和互動體驗
- **響應式設計**：完全適配手機、平板、桌面設備
- **狀態反饋**：載入、成功、錯誤狀態的即時提示
- **便捷操作**：一鍵切換不同功能模式

#### 📱 移動端適配 / Mobile Optimization
- **觸控友好**：大按鈕和清晰的操作區域
- **相機優化**：自動選擇最佳相機設置（後置相機優先）
- **掃描框指引**：視覺化引導正確放置身份證

### 🔧 技術更新 / Technical Updates

#### 📦 新增依賴 / New Dependencies
- **Tesseract.js**: OCR 文字識別引擎
- **Canvas API**: 圖像處理和拍照功能
- **Media API**: 相機存取和視頻流處理

#### 🏗️ 架構改進 / Architecture Improvements
- **HKIDScanner 組件**：可重用的身份證掃描組件
- **錯誤處理增強**：完善的錯誤捕捉和用戶提示
- **資源管理**：自動清理相機資源，防止記憶體洩漏

#### 📚 文檔更新 / Documentation Updates
- **資料庫結構文檔**：更新 `customer_type_enum` 說明
- **API 規格文檔**：完善客戶管理相關接口
- **部署指南**：GitHub Pages 和 Hostinger 部署說明

### 🚀 性能優化 / Performance Optimization
- **圖像處理**：優化 OCR 識別速度和準確度
- **按需載入**：組件和功能的懶加載
- **資料快取**：改善用戶體驗和響應速度

### 🔐 安全性增強 / Security Enhancements
- **權限管理**：相機和剪貼簿存取權限檢查
- **資料驗證**：增強的輸入驗證和格式檢查
- **隱私保護**：本地處理 OCR，不上傳敏感資料

---

## [1.0.5] - 2025-08-13

### 🎯 基礎功能實現
- **客戶管理系統**：新增、編輯、列表功能
- **員工檔案管理**：完整的員工資料系統
- **薪資帳單管理**：服務記錄和薪資計算
- **資料庫整合**：Supabase 後端服務整合

### 🎨 基礎 UI/UX
- **Apple 風格主題**：清潔簡約的設計語言
- **響應式佈局**：適配各種螢幕尺寸
- **導航系統**：直觀的頁面導航和麵包屑

---

## 技術棧 / Technology Stack

- **前端框架**: Next.js 14.x
- **語言**: TypeScript
- **後端服務**: Supabase
- **樣式**: Tailwind CSS
- **圖表**: Recharts
- **OCR**: Tesseract.js
- **部署**: GitHub Pages + Hostinger

---

## 貢獻指南 / Contributing

歡迎提交問題報告和功能請求到 [GitHub Issues](https://github.com/wuho1993/mingcare-intranet/issues)

## 授權 / License

此項目為 MingCare 家居護理服務內部使用系統。
