# GitHub Pages 部署修復

## 問題說明

GitHub Pages 上的網站顯示樣式問題是因為靜態部署時的路徑配置不正確。

## 解決方案

### 1. 雙配置文件系統

- `next.config.js` - 用於本地開發和 Vercel 部署（支援 API 路由）
- `next.config.github.js` - 專門用於 GitHub Pages 靜態部署

### 2. 更新的 GitHub Actions 工作流程

新的 `.github/workflows/deploy.yml` 會：
1. 在建置前複製 GitHub Pages 配置 (`next.config.github.js` → `next.config.js`)
2. 使用正確的 basePath 和 assetPrefix 設定
3. 使用新的 GitHub Pages Actions API

### 3. 功能限制說明

**GitHub Pages 版本（靜態）**：
- ✅ 界面正常顯示
- ❌ 搜尋功能無法使用（API 路由被禁用）
- ✅ 其他前端功能正常

**Vercel 版本（完整功能）**：
- ✅ 界面正常顯示  
- ✅ 搜尋功能正常
- ✅ 所有 API 路由正常

## 部署後檢查

推送到 GitHub 後：
1. 檢查 Actions 頁面確認部署成功
2. 訪問 `https://wuho1993.github.io/mingcare-intranet/` 確認樣式正常
3. 注意搜尋功能在 GitHub Pages 版本中無法使用

## 推薦方案

建議使用 **Vercel 部署** 來獲得完整功能，包括搜尋功能。
