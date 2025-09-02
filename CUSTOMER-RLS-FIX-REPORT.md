# 客戶管理中心問題診斷報告

## 🔍 問題確認
- **症狀**: 客戶管理中心顯示 0 個客戶
- **實際狀況**: 資料庫中有 122 個客戶
- **根本原因**: Row Level Security (RLS) 阻止匿名用戶訪問

## 📊 測試結果
- ✅ 使用 Service Role Key: 可見 122 個客戶
- ❌ 使用 Anon Key: 可見 0 個客戶
- ✅ 表結構正常存在: `customer_personal_data`
- ❌ RLS 政策缺失: 沒有允許匿名讀取的政策

## 🛠️ 解決方案

### 方法 1: Supabase Dashboard (推薦)
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇專案: `cvkxlvdicympakfecgvv`
3. 前往 **Authentication** > **Policies**
4. 找到 `customer_personal_data` 表
5. 點擊 **"New Policy"**
6. 設定如下:
   - **Policy name**: `Allow anonymous read access`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `anon`
   - **USING expression**: `true`
7. 點擊 **"Save Policy"**

### 方法 2: SQL Editor
在 Supabase Dashboard 的 SQL Editor 中執行:
```sql
CREATE POLICY "Allow anonymous read access" 
ON public.customer_personal_data
FOR SELECT 
TO anon 
USING (true);
```

### 方法 3: 臨時禁用 RLS (不推薦)
```sql
ALTER TABLE public.customer_personal_data DISABLE ROW LEVEL SECURITY;
```

## 🧪 驗證步驟
執行以下命令確認修復:
```bash
node simple-debug.js
```

應該看到: `Found 122 customers total`

## 📋 相關文件
- `fix-customer-rls.sql` - 手動 SQL 修復腳本
- `fix-rls.js` - 自動化修復腳本
- `simple-debug.js` - 驗證腳本

## 🔐 安全注意事項
此修復允許匿名用戶讀取所有客戶資料。如需更細緻的權限控制，請調整 USING 條件。
