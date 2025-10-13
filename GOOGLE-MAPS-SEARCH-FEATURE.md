# Google Maps 搜尋功能新增報告

## 更新日期
2025年10月13日

## 功能描述

在客戶管理的地圖選擇器中新增了 **Google Places Autocomplete 搜尋欄**，讓用戶可以更輕鬆地找到並選擇服務地址。

## 新增功能

### 🔍 地圖搜尋欄

在地圖模態框頂部新增搜尋欄，具備以下特性：

1. **智能地址建議**
   - 使用 Google Places Autocomplete API
   - 自動提供香港地址建議
   - 支援中英文地址搜尋

2. **快速定位**
   - 選擇搜尋結果後自動移動地圖到該位置
   - 自動放置標記在選定位置
   - 自動縮放到適當級別（Zoom 17）

3. **多種搜尋方式**
   - 完整地址（例如：九龍旺角彌敦道123號）
   - 地點名稱（例如：銅鑼灣時代廣場）
   - 區域或街道名稱（例如：旺角彌敦道）

## 技術實現

### 1. 狀態管理

新增以下狀態和引用：

```typescript
const [mapSearchQuery, setMapSearchQuery] = useState('')
const mapSearchInputRef = useRef<HTMLInputElement>(null)
const autocompleteRef = useRef<any>(null)
```

### 2. Google Places Autocomplete 初始化

在 `initializeMap()` 函數中添加：

```typescript
// 初始化 Google Places Autocomplete
if (mapSearchInputRef.current && (window as any).google?.maps?.places) {
  autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
    mapSearchInputRef.current,
    {
      componentRestrictions: { country: 'hk' }, // 限制在香港
      fields: ['geometry', 'formatted_address', 'name']
    }
  )

  // 監聽地點選擇事件
  autocompleteRef.current.addListener('place_changed', () => {
    const place = autocompleteRef.current.getPlace()
    
    if (place.geometry && place.geometry.location) {
      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      }
      
      // 移動地圖到選擇的位置
      googleMapRef.current.setCenter(position)
      googleMapRef.current.setZoom(17)
      
      // 放置標記
      placeMarker(position)
      setTempMarkerPosition(position)
      
      // 更新搜尋欄文字
      setMapSearchQuery(place.formatted_address || place.name || '')
      
      console.log('✅ 搜尋地點成功:', place.formatted_address || place.name)
    }
  })
}
```

### 3. UI 介面更新

在地圖模態框中添加搜尋欄：

```tsx
{/* 地圖搜尋欄 */}
<div className="mb-3">
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <input
      ref={mapSearchInputRef}
      type="text"
      value={mapSearchQuery}
      onChange={(e) => setMapSearchQuery(e.target.value)}
      placeholder="搜尋地址或地點（例如：旺角彌敦道、銅鑼灣時代廣場）"
      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
    />
  </div>
  <p className="text-xs text-gray-500 mt-1.5 ml-1">
    💡 在搜尋欄輸入地址或地點名稱，選擇建議項目後地圖會自動移動到該位置
  </p>
</div>
```

## 修改的檔案

1. **`app/clients/new/page.tsx`** - 新增客戶頁面
   - 新增 `mapSearchQuery` 狀態
   - 新增 `mapSearchInputRef` 和 `autocompleteRef` 引用
   - 在 `initializeMap()` 中初始化 Autocomplete
   - 更新 UI 加入搜尋欄

2. **`app/clients/edit-client/edit/page.tsx`** - 編輯客戶頁面
   - 新增 `mapSearchQuery` 狀態
   - 新增 `mapSearchInputRef` 和 `autocompleteRef` 引用
   - 在 `initializeMap()` 中初始化 Autocomplete
   - 更新 UI 加入搜尋欄

## 使用流程

### 使用者操作步驟：

1. 點擊「選擇服務位置」按鈕打開地圖模態框
2. 在頂部搜尋欄輸入地址或地點名稱
3. 從下拉選單中選擇正確的地址建議
4. 地圖自動移動並放置標記在該位置
5. 可以拖動標記微調位置
6. 點擊「確認選擇」儲存座標

### 示例搜尋詞：

- ✅ **完整地址**：「九龍旺角彌敦道123號」
- ✅ **地點名稱**：「銅鑼灣時代廣場」
- ✅ **街道名稱**：「旺角彌敦道」
- ✅ **建築物名稱**：「香港文化中心」
- ✅ **地標**：「尖沙咀鐘樓」
- ✅ **商場**：「海港城」

## 優點與改進

### ✨ 主要優點：

1. **更快速的地址定位**
   - 不需要手動縮放和平移地圖
   - 直接搜尋即可定位

2. **更準確的地址選擇**
   - Google Places 提供官方認證的地址
   - 減少輸入錯誤的可能性

3. **更好的用戶體驗**
   - 自動完成功能節省時間
   - 視覺化的地址建議更直觀

4. **多種搜尋方式**
   - 支援完整地址、地點名稱、街道等
   - 適應不同用戶的搜尋習慣

### 🔄 與現有功能的整合：

新增的搜尋功能與現有功能完美整合：

- ✅ 保留原有的地圖點擊功能
- ✅ 保留原有的標記拖動功能
- ✅ 保留原有的手動輸入座標功能
- ✅ 保留原有的地址地理編碼功能
- ✅ 新增搜尋功能作為補充選項

## API 要求

此功能需要 Google Maps JavaScript API 包含 **Places Library**。

當前 API 腳本已經包含：
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

API Key: `AIzaSyBFBLFI1GhfRuSwyZXO4-kS9YYg2eJ694I`

## 測試建議

### 測試案例：

1. **基本搜尋測試**
   - [ ] 搜尋完整地址
   - [ ] 搜尋地點名稱
   - [ ] 搜尋街道名稱
   - [ ] 搜尋建築物名稱

2. **功能整合測試**
   - [ ] 搜尋後可以拖動標記
   - [ ] 搜尋後可以點擊地圖更改位置
   - [ ] 搜尋後可以手動修改座標
   - [ ] 確認按鈕正確儲存搜尋選擇的位置

3. **邊界條件測試**
   - [ ] 輸入不存在的地址
   - [ ] 輸入英文地址
   - [ ] 輸入簡體中文地址
   - [ ] 搜尋香港以外的地點（應該被過濾）

4. **UI/UX 測試**
   - [ ] 搜尋欄位樣式正確
   - [ ] 下拉建議正確顯示
   - [ ] 選擇建議後地圖正確移動
   - [ ] 使用說明清晰易懂

## 已知限制

1. **地區限制**：目前限制在香港地區（`componentRestrictions: { country: 'hk' }`）
2. **API 配額**：受 Google Maps API 配額限制
3. **網路依賴**：需要網路連線才能使用搜尋功能

## 未來改進建議

1. **搜尋歷史**：儲存最近搜尋的地址
2. **常用地址**：提供常用服務地址的快速選項
3. **附近搜尋**：搜尋附近的特定類型地點（醫院、公園等）
4. **地址驗證**：進一步驗證選擇的地址是否適合提供服務
5. **離線支援**：緩存常用地址以支援離線使用

## 更新總結

這次更新大幅提升了地址選擇的便利性和準確性，讓用戶可以更快速地找到正確的服務位置，減少手動搜尋和定位的時間。同時保留了所有原有功能，確保不同使用習慣的用戶都能順暢操作。

---

**版本**: v1.12.0  
**功能**: Google Maps 地址搜尋  
**影響範圍**: 客戶管理模組  
**向後兼容**: ✅ 是
