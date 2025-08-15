# 客戶管理中心開發工作流程
# 基於您的 Developer Brief 規格

## 🎯 開發順序計劃

### Phase 1: 基礎架構
- [ ] 1.1 建立客戶相關的 TypeScript 類型定義
- [ ] 1.2 建立客戶數據服務層 (API 調用)
- [ ] 1.3 建立通用 UI 組件 (搜尋框、篩選器、卡片等)

### Phase 2: 客戶編號生成邏輯 (前端)
- [ ] 2.1 實現客戶編號生成規則函數
  - 社區券客戶 → `CCSV-MC0001`
  - 明家街客 → `MC0001`
  - Steven Kwok + 社區券 → `S-CCSV0001`
  - Steven Kwok + 明家街客 → `MC0001` (共用)
- [ ] 2.2 實現查詢現有最大編號的邏輯
- [ ] 2.3 實現生成下一個編號的函數

### Phase 3: 搜尋與篩選功能
- [ ] 3.1 實現搜尋建議 (typeahead) 功能
  - debounce 200ms
  - 支援姓名/電話/編號搜尋
  - 最多顯示 8 個建議
- [ ] 3.2 實現篩選功能 (customer_type, district, introducer, project_manager)
- [ ] 3.3 實現卡片/列表視圖切換

### Phase 4: 客戶表單 (新增/編輯)
- [ ] 4.1 實現 Step 1 邏輯 (customer_type 選擇)
- [ ] 4.2 實現條件式欄位顯示邏輯
  - 社區券客戶 → voucher_application_status
  - 申請中 → lds_status, home_visit_status
  - 已經持有 → + voucher_number, copay_level
  - copay_level=5% → + charity_support
- [ ] 4.3 實現表單驗證規則
- [ ] 4.4 實現表單提交邏輯

### Phase 5: 整合與測試
- [ ] 5.1 整合所有功能到客戶管理頁面
- [ ] 5.2 測試驗收清單中的 8 項測試案例
- [ ] 5.3 錯誤處理與用戶體驗優化

---

## 🤔 需要您指導的關鍵問題

### 問題 1: 客戶編號生成邏輯
我需要在前端查詢現有的最大客戶編號，然後生成下一個編號。具體應該：

**選項 A**: 每次新增客戶時，先查詢 `customer_personal_data` 表中所有相關前綴的 `customer_id`，找出最大數字，然後 +1
```js
// 例如查詢所有 CCSV-MC 開頭的 customer_id
const { data } = await supabase
  .from('customer_personal_data')
  .select('customer_id')
  .like('customer_id', 'CCSV-MC%')
  .order('customer_id', { ascending: false })
  .limit(1)
```

**選項 B**: 其他方式？

### 問題 2: 搜尋建議 API 策略
搜尋建議需要查詢 3 個欄位 (姓名/電話/編號)，您希望：

**選項 A**: 分別查詢 3 次，然後在前端合併和去重
**選項 B**: 使用單一查詢的 `or` 條件
**選項 C**: 其他方式？

### 問題 3: 表單條件式欄位
客戶類型選擇會影響顯示的欄位，您希望：

**選項 A**: 所有欄位都在同一個表單中，根據選擇動態顯示/隱藏
**選項 B**: 分步驟表單 (Step 1 選類型，Step 2 填詳細資料)
**選項 C**: 其他方式？

---

## 📋 當前狀態
- ✅ 基礎項目架構已完成
- ✅ Supabase 連接已配置
- ✅ 空的客戶管理頁面已建立
- ⏳ 等待您的指導開始具體實現

請告訴我：
1. 您希望從哪個 Phase 開始？
2. 對於上述 3 個關鍵問題，您的偏好是什麼？
3. 有沒有其他特殊要求或注意事項？
