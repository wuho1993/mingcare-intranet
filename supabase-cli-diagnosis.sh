#!/bin/bash
# 🔧 Supabase CLI 診斷與修復腳本
# 你需要自己執行這些命令

echo "🔧 Supabase CLI 診斷與修復指南"
echo "================================"
echo ""

echo "📋 前置需求："
echo "============"
echo "1. 安裝 Supabase CLI:"
echo "   npm install -g supabase"
echo "   或"
echo "   brew install supabase/tap/supabase"
echo ""

echo "2. 登入你的 Supabase 帳號:"
echo "   supabase login"
echo "   (會開啟瀏覽器要求授權)"
echo ""

echo "🔍 診斷命令："
echo "============"
echo ""

echo "1. 檢查專案狀態:"
echo "   supabase projects list"
echo "   確認 cvkxlvdicympakfecgvv 出現在列表中"
echo ""

echo "2. 連接到你的專案:"
echo "   supabase link --project-ref cvkxlvdicympakfecgvv"
echo ""

echo "3. 檢查專案配置:"
echo "   supabase status"
echo ""

echo "4. 查看 Auth 配置:"
echo "   supabase gen types typescript --local > /dev/null 2>&1 || echo 'Auth service down'"
echo ""

echo "🔧 可能的修復命令："
echo "=================="
echo ""

echo "1. 重置 Auth 設定 (小心使用!):"
echo "   # 備份現有設定"
echo "   supabase db dump --schema auth > auth_backup.sql"
echo ""

echo "2. 檢查 Auth 模板 (如果有 supabase/config.toml):"
echo "   cat supabase/config.toml | grep -A 20 '[auth]'"
echo ""

echo "3. 嘗試推送本地 Auth 配置:"
echo "   supabase db push"
echo ""

echo "⚠️  警告："
echo "========="
echo "- CLI 修復可能影響生產環境"
echo "- 建議先在 Dashboard 嘗試模板重置"
echo "- 如果不確定，不要執行 push 或 reset 命令"
echo ""

echo "🎯 建議執行順序："
echo "================"
echo "1. supabase login"
echo "2. supabase projects list"
echo "3. supabase link --project-ref cvkxlvdicympakfecgvv"
echo "4. supabase status"
echo ""
echo "然後回報結果給我！"
echo ""

echo "📞 如果 CLI 也無法連接："
echo "========================"
echo "這進一步確認是後端問題，需要立即聯繫 Supabase 支援"
echo ""

echo "執行完後請告訴我："
echo "- supabase status 的輸出"
echo "- 是否能成功 link 到專案"
echo "- 有無錯誤訊息"
