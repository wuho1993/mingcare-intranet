# 明家居家護理服務 Intranet 系統

## 項目概述

這是一個為明家居家護理服務設計的內部管理系統，使用 Next.js 和 Supabase 構建。

## 功能模組

### 🏠 主儀表板 (`/dashboard`)
- 系統總覽
- 5 項主要功能導航
- 用戶登出功能

### 👥 客戶管理中心 (`/clients`)
- 管理所有客戶資料
- 聯絡信息管理
- 服務記錄追蹤

### 🏥 護理服務管理 (`/services`)
- 安排護理服務
- 管理服務排程
- 服務記錄管理

### 👩‍⚕️ 護理人員管理 (`/care-staff`)
- 管理護理人員資料
- 排班管理
- 績效追蹤
- **注意**：新增功能跳轉至 `/care-staff-apply`
- **注意**：編輯功能跳轉至 `/care-staff-edit/:staff_id`

### 💰 護理人員工資計算 (`/payroll`)
- 計算護理人員薪資
- 津貼計算
- 加班費計算

### 📊 佣金計算 (`/commissions`)
- 計算業務佣金
- 獎金計算
- 績效獎勵

## 技術架構

### 前端框架
- **Next.js 14** - React 框架，支援 App Router
- **TypeScript** - 類型安全
- **Tailwind CSS** - 樣式框架

### 後端服務
- **Supabase** - 後端即服務
  - 身份驗證 (Authentication)
  - 數據庫 (PostgreSQL)
  - 即時數據同步

### 身份驗證
- 使用 Supabase Auth 進行用戶登入
- 受保護的路由
- 自動登出功能

## 項目結構

```
mingcare-intranet/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 登入頁面 (/)
│   ├── globals.css        # 全局樣式
│   ├── dashboard/         # 主儀表板
│   ├── clients/           # 客戶管理
│   ├── services/          # 護理服務管理
│   ├── care-staff/        # 護理人員管理
│   ├── payroll/           # 工資計算
│   └── commissions/       # 佣金計算
├── lib/
│   └── supabase.ts        # Supabase 客戶端配置
├── .env.local             # 環境變數
├── package.json           # 依賴管理
├── tailwind.config.js     # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
└── supabase-config.txt    # Supabase 配置參考
```

## 環境配置

### Supabase 配置
- **Project URL**: `https://cvkxlvdicympakfecgvv.supabase.co`
- **Anon Key**: 已配置在 `.env.local`
- **Service Role Key**: 已配置在 `.env.local`

### 數據庫配置
- **Host**: `db.cvkxlvdicympakfecgvv.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `Stw1856aSSS`

## 安裝與運行

### 1. 安裝依賴
```bash
npm install
```

### 2. 配置環境變數
確認 `.env.local` 文件包含正確的 Supabase 配置。

### 3. 啟動開發伺服器
```bash
npm run dev
```

應用程式將在 `http://localhost:3000` 啟動。

## 下一步開發

### ⚠️ 等待數據庫結構
目前所有功能頁面都是佔位頁面，等待您提供 Supabase 數據庫結構信息以完成：

1. **數據模型定義**
   - 客戶表結構
   - 護理服務表結構
   - 護理人員表結構
   - 工資計算相關表
   - 佣金計算相關表

2. **API 端點開發**
   - CRUD 操作
   - 數據查詢
   - 報表生成

3. **UI 組件完善**
   - 數據表格
   - 表單組件
   - 圖表展示

### 🔐 身份驗證設置
在 Supabase 控制台中：
1. 設置身份驗證提供者
2. 配置用戶註冊/登入規則
3. 設置行級安全 (RLS) 策略

### 📝 護理人員模組規範
- 新增頁面：`/care-staff-apply`
- 編輯頁面：`/care-staff-edit/:staff_id`
- 主頁只提供導航入口

## 開發規範

- ❌ **嚴禁硬編碼** - 所有數據必須來自 Supabase
- ✅ **類型安全** - 使用 TypeScript 定義所有數據類型
- ✅ **響應式設計** - 支援桌面和移動端
- ✅ **用戶體驗** - 載入狀態、錯誤處理、成功提示

## 聯絡信息

如有問題或需要協助，請聯絡開發團隊。

---

**狀態**: 🟡 等待數據庫結構信息以繼續開發
