# 🔧 SMS 模板修復腳本
# 修復 {{code}} 為 {{ .Code }}

echo "🔧 修復 SMS 模板中的 {{code}} 錯誤"
echo "=================================="
echo ""

echo "📊 問題確認："
echo "============"
echo "CLI diff 顯示 SMS 模板中有錯誤的變數語法："
echo "❌ template = \"【明家居家護理服務】驗證碼：{{code}}。\""
echo "✅ 應該是: \"【明家居家護理服務】驗證碼：{{ .Code }}。\""
echo ""

echo "🎯 這就是導致 'function \"code\" not defined' 的根源！"
echo ""

echo "🚨 立即修復步驟："
echo "================"
echo ""

echo "方法 1: Dashboard 修復 (推薦)"
echo "前往: https://supabase.com/dashboard/project/cvkxlvdicympakfecgvv"
echo "1. Authentication → Settings"
echo "2. 找到 SMS Provider 設定"
echo "3. 修改 SMS 模板文字："
echo "   從: 【明家居家護理服務】驗證碼：{{code}}。"
echo "   改為: 【明家居家護理服務】驗證碼：{{ .Code }}。"
echo "4. 或者直接點 'Reset to default'"
echo "5. 保存設定"
echo ""

echo "方法 2: 臨時停用 SMS (更快)"
echo "1. Authentication → Settings"
echo "2. 取消勾選 'Enable phone confirmations'"
echo "3. 取消勾選 'Enable phone sign-ups'"
echo "4. 保存設定"
echo ""

echo "⏰ 預期結果："
echo "============"
echo "修復後 5-10 分鐘內："
echo "✅ fatal 'function code not defined' 錯誤停止"
echo "✅ /auth/v1/settings 從 503 變為 200"
echo "✅ Auth 服務正常啟動"
echo ""

echo "🧪 測試指令:"
echo "============"
echo "修復後執行："
echo "curl -X GET \"https://cvkxlvdicympakfecgvv.supabase.co/auth/v1/settings\""
echo ""
echo "應該看到 JSON 回應而不是 503 錯誤"
echo ""

echo "🎯 立即行動:"
echo "==========="
echo "1. 前往 Dashboard"
echo "2. 修復 SMS 模板或停用 SMS"
echo "3. 等待 10 分鐘"
echo "4. 重新測試"
echo ""

echo "如果修復成功，你的 Auth 服務將完全恢復！"
