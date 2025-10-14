-- 添加 'raymond' 到 introducer_enum
-- 如果 enum 值已存在，這個命令會被忽略

DO $$ 
BEGIN
    -- 檢查 enum 類型是否存在 'raymond' 值
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'raymond' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'introducer_enum'
        )
    ) THEN
        -- 添加新的 enum 值
        ALTER TYPE introducer_enum ADD VALUE 'raymond';
        RAISE NOTICE 'Added raymond to introducer_enum';
    ELSE
        RAISE NOTICE 'raymond already exists in introducer_enum';
    END IF;
END $$;
