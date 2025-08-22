// 建立 commission_rate_introducer 表格和初始數據
const { createBrowserClient } = require('@supabase/ssr')

const supabase = createBrowserClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
)

async function setupCommissionRates() {
  console.log('=== 建立佣金率表格 ===')
  
  try {
    // 檢查表格是否已存在
    const { data: existingData, error: checkError } = await supabase
      .from('commission_rate_introducer')
      .select('*')
      .limit(1)
    
    if (checkError && checkError.code === '42P01') {
      console.log('❌ 表格不存在，需要在 Supabase 控制台建立')
      console.log('\n請在 Supabase SQL Editor 執行以下 SQL：')
      console.log(`
-- 建立 commission_rate_introducer 表格
CREATE TABLE IF NOT EXISTS public.commission_rate_introducer (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    introducer introducer_enum NOT NULL,
    first_month_commission numeric,
    subsequent_month_commission numeric,
    created_at timestamptz DEFAULT now()
);

-- 建立 RLS 政策
ALTER TABLE public.commission_rate_introducer ENABLE ROW LEVEL SECURITY;

-- 插入初始數據
INSERT INTO public.commission_rate_introducer (introducer, first_month_commission, subsequent_month_commission) VALUES
('Kanas Leung', 500, 300),
('Joe Cheung', 500, 300),
('Candy Ho', 500, 300),
('Steven Kwok', 500, 300),
('Dr.Lee', 500, 300),
('Annie', 500, 300),
('Janet', 500, 300),
('陸sir', 500, 300),
('吳翹政', 500, 300),
('余翠英', 500, 300),
('陳小姐MC01', 500, 300),
('曾先生', 500, 300),
('梁曉峰', 500, 300);
      `)
      return
    }
    
    if (checkError) {
      console.error('❌ 檢查表格時發生錯誤:', checkError.message)
      return
    }
    
    console.log('✅ 表格已存在')
    
    // 檢查是否有數據
    const { data: allData, error: dataError } = await supabase
      .from('commission_rate_introducer')
      .select('*')
    
    if (dataError) {
      console.error('❌ 讀取數據錯誤:', dataError.message)
      return
    }
    
    console.log(`📊 目前有 ${allData.length} 條佣金率記錄`)
    
    if (allData.length === 0) {
      console.log('🔄 插入初始佣金率數據...')
      
      const initialRates = [
        { introducer: 'Kanas Leung', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: 'Joe Cheung', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: 'Candy Ho', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: 'Steven Kwok', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: 'Dr.Lee', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: 'Annie', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: 'Janet', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: '陸sir', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: '吳翹政', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: '余翠英', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: '陳小姐MC01', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: '曾先生', first_month_commission: 500, subsequent_month_commission: 300 },
        { introducer: '梁曉峰', first_month_commission: 500, subsequent_month_commission: 300 }
      ]
      
      const { data: insertData, error: insertError } = await supabase
        .from('commission_rate_introducer')
        .insert(initialRates)
        .select()
      
      if (insertError) {
        console.error('❌ 插入數據錯誤:', insertError.message)
        return
      }
      
      console.log('✅ 成功插入', insertData.length, '條佣金率記錄')
    }
    
    // 顯示所有佣金率
    console.log('\n📋 佣金率設定：')
    allData.forEach(rate => {
      console.log(`   ${rate.introducer}: 首月 $${rate.first_month_commission}, 後續 $${rate.subsequent_month_commission}`)
    })
    
  } catch (error) {
    console.error('❌ 執行錯誤:', error.message)
  }
}

setupCommissionRates()
