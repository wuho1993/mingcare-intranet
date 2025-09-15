# API 搜尋功能部署問題解決方案

## 問題說明

在本地開發環境中，客戶名稱和護理人員的搜尋功能正常工作，但在 GitHub Pages 部署後無法使用。

## 根本原因

1. **靜態導出限制**：原本的 `next.config.js` 配置了 `output: 'export'`，這會將 Next.js 應用程式導出為靜態文件
2. **API 路由失效**：靜態導出會**完全禁用所有 API 路由**，包括 `/api/search-customers` 和 `/api/search-care-staff`
3. **GitHub Pages 限制**：GitHub Pages 只能託管靜態文件，無法運行伺服器端代碼

## 解決方案

### 方案一：部署到 Vercel（推薦）

1. **前往 [Vercel](https://vercel.com/)**
2. **連接 GitHub 儲存庫**
3. **設定環境變數**：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **部署**：Vercel 會自動檢測 Next.js 專案並正確部署

**優點**：
- 完全支援 Next.js API 路由
- 自動 HTTPS
- 全球 CDN
- 免費方案已足夠

### 方案二：部署到 Netlify

1. **前往 [Netlify](https://netlify.com/)**
2. **連接 GitHub 儲存庫**
3. **設定建構命令**：`npm run build`
4. **設定環境變數**

### 方案三：部署到 Railway

1. **前往 [Railway](https://railway.app/)**
2. **連接 GitHub 儲存庫**
3. **設定環境變數**

## 已完成的修改

1. **更新 `next.config.js`**：
   - 註釋掉 `output: 'export'`
   - 註釋掉 `trailingSlash: true`
   - 註釋掉 GitHub Pages 相關配置

2. **新增 `vercel.json`**：
   - Vercel 部署配置
   - API 函數超時設定

3. **新增 `.env.example`**：
   - 環境變數範例

## 測試 API 功能

在本地測試搜尋 API：

```bash
# 測試客戶搜尋
curl -X POST "http://localhost:3000/api/search-customers" \
  -H "Content-Type: application/json" \
  -d '{"searchTerm":"李"}'

# 測試護理人員搜尋
curl -X POST "http://localhost:3000/api/search-care-staff" \
  -H "Content-Type: application/json" \
  -d '{"searchTerm":"王"}'
```

## 檢查清單

- [ ] 選擇部署平台（推薦 Vercel）
- [ ] 設定 Supabase 環境變數
- [ ] 部署應用程式
- [ ] 測試搜尋功能是否正常
- [ ] 確認所有 API 端點都可用

## 注意事項

- GitHub Pages 無法支援 API 路由
- 如果要繼續使用 GitHub Pages，需要將搜尋功能改為前端實現（直接在瀏覽器中查詢 Supabase）
- 推薦使用 Vercel，因為它專為 Next.js 優化
