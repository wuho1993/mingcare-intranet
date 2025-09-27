-- 查看 voucher_rate 的 RLS 政策詳情
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'voucher_rate'
ORDER BY policyname;