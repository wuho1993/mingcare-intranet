-- 添加 'raymond' 和 '梁曉峰' 到 introducer_enum
-- 如果 enum 值已存在，這個命令會被忽略

DO $$ 
BEGIN
    -- 檢查並添加 '梁曉峰'
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = '梁曉峰' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'introducer_enum'
        )
    ) THEN
        ALTER TYPE introducer_enum ADD VALUE '梁曉峰';
        RAISE NOTICE 'Added 梁曉峰 to introducer_enum';
    ELSE
        RAISE NOTICE '梁曉峰 already exists in introducer_enum';
    END IF;

    -- 檢查並添加 'raymond'
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'raymond' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'introducer_enum'
        )
    ) THEN
        ALTER TYPE introducer_enum ADD VALUE 'raymond';
        RAISE NOTICE 'Added raymond to introducer_enum';
    ELSE
        RAISE NOTICE 'raymond already exists in introducer_enum';
    END IF;
END $$;
