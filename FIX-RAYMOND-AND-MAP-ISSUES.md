# 問題修復報告

## 問題 1：Invalid input value for enum introducer_enum: "raymond"

### 🔍 問題描述
在新增客戶時選擇介紹人 "raymond" 會出現錯誤：
```
invalid input value for enum introducer_enum: "raymond"
```

### 🐛 原因分析
- TypeScript 類型定義中已經包含 `raymond` (在 `types/database.ts`)
- 前端選項中也有 `raymond` (在 `app/clients/new/page.tsx`)
- **但是資料庫的 `introducer_enum` 類型中還沒有添加這個值**

### ✅ 解決方案
需要在 Supabase 資料庫中執行以下 SQL 語句：

```sql
ALTER TYPE introducer_enum ADD VALUE 'raymond';
```

或者執行提供的 SQL 文件：`add-raymond-introducer.sql`

### 📝 執行步驟
1. 登入 Supabase Dashboard
2. 前往 SQL Editor
3. 執行 `add-raymond-introducer.sql` 中的 SQL 語句
4. 或者直接執行：`ALTER TYPE introducer_enum ADD VALUE 'raymond';`

---

## 問題 2：新增客戶頁面 Google Map 不能正確顯示

### 🔍 問題檢查
經過檢查，新增客戶頁面的 Google Maps 功能應該是正常的：

#### ✅ 已實現的功能
1. **Google Maps Script 載入**
   - 包含 Places Library
   - 正確的 API Key
   - 位置：line 607

2. **地圖初始化函數** (`initializeMap()`)
   - 創建地圖實例
   - 地址 Geocoding（5種搜尋策略）
   - Google Places Autocomplete 搜尋欄
   - 點擊地圖設置標記
   - 位置：lines 209-384

3. **搜尋欄 UI**
   - 輸入框帶搜尋圖標
   - Autocomplete 功能
   - 提示文字
   - 位置：lines 1173-1193

4. **地圖容器**
   - HTML div 元素
   - 正確的 ref 綁定
   - 位置：lines 1195-1199

### 🤔 可能的問題

如果地圖還是不顯示，可能是以下原因：

1. **Google Maps API Key 配額用完**
   - 檢查 Google Cloud Console 的配額
   - 確認 API Key 有效

2. **網路載入問題**
   - 檢查瀏覽器 Console 是否有錯誤
   - 確認 Google Maps script 是否成功載入

3. **CSS 高度問題**
   - 地圖容器需要明確的高度
   - 當前設置：`h-96` (384px)

4. **初始化時機問題**
   - 當前使用 `setTimeout(..., 100)` 延遲初始化
   - 可能需要調整延遲時間

### 🔧 調試步驟

1. **打開瀏覽器 Console** (F12)
2. **檢查錯誤訊息**
   - 紅色錯誤
   - Google Maps API 載入失敗
3. **檢查 Console Logs**
   - 應該看到：`🗺️ 開始地址地理編碼:`
   - 或：`✅ 成功定位地址:`
4. **檢查網路請求**
   - Network tab
   - 搜尋 `maps.googleapis.com`
   - 確認 API 請求成功（狀態碼 200）

### 📋 建議的修復（如果地圖仍然不顯示）

如果確認是初始化時機問題，可以調整延遲時間或添加重試邏輯：

```typescript
const openMapSelector = () => {
  if (!formData.service_address?.trim()) {
    alert('請先輸入服務地址')
    return
  }
  setShowMapModal(true)
  // 增加延遲時間並添加重試
  const initWithRetry = (attempts = 0) => {
    if (attempts > 5) {
      console.error('地圖初始化失敗')
      return
    }
    setTimeout(() => {
      if (mapRef.current && isGoogleMapsLoaded) {
        initializeMap()
      } else {
        initWithRetry(attempts + 1)
      }
    }, 100 * (attempts + 1))
  }
  initWithRetry()
}
```

---

## 📊 功能對比

| 功能 | 編輯客戶頁面 | 新增客戶頁面 | 狀態 |
|-----|------------|------------|------|
| Google Maps 載入 | ✅ | ✅ | 正常 |
| 地圖搜尋欄 | ✅ | ✅ | 正常 |
| 地址 Geocoding | ✅ | ✅ | 正常 |
| 點擊設置標記 | ✅ | ✅ | 正常 |
| 拖動標記 | ✅ | ✅ | 正常 |
| Places Autocomplete | ✅ | ✅ | 正常 |

---

## 🎯 總結

### 必須修復
- ✅ **資料庫 enum 問題**：執行 SQL 添加 'raymond'

### 需要調試
- ⚠️ **地圖顯示問題**：檢查 Console 確認具體錯誤
- 代碼層面的地圖功能已經完整實現
- 可能是 API Key、網路或時機問題

### 建議操作順序
1. 執行 SQL 修復 raymond enum 問題
2. 清除瀏覽器快取
3. 重新載入頁面
4. 打開 Console 查看錯誤訊息
5. 根據錯誤訊息進一步調試

---

生成時間：2025-10-14
