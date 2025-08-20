const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugStats() {
  try {
    // 使用環境變量
    const url = 'https://cvkxlvdicympakfecgvv.supabase.co';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I';

    console.log('Supabase URL:', url);
    console.log('Key length:', key.length);

    const supabase = createClient(url, key);

    console.log('\n=== 檢查客戶數據表 ===');
    
    // 檢查表是否存在
    const { data: customerData, error: customerError, count: customerCount } = await supabase
      .from('customer_data')
      .select('*', { count: 'exact' });
      
    console.log('客戶查詢結果:');
    console.log('- 錯誤:', customerError);
    console.log('- 數據量:', customerCount);
    console.log('- 前3筆數據:', customerData?.slice(0, 3));

    console.log('\n=== 檢查護理人員數據表 ===');
    const { data: staffData, error: staffError, count: staffCount } = await supabase
      .from('care_staff_profiles')
      .select('*', { count: 'exact' });
      
    console.log('護理人員查詢結果:');
    console.log('- 錯誤:', staffError);
    console.log('- 數據量:', staffCount);

    console.log('\n=== 檢查服務數據表 ===');
    const { data: serviceData, error: serviceError, count: serviceCount } = await supabase
      .from('billing_salary_data')
      .select('*', { count: 'exact' });
      
    console.log('服務數據查詢結果:');
    console.log('- 錯誤:', serviceError);
    console.log('- 數據量:', serviceCount);
    console.log('- 前3筆數據:', serviceData?.slice(0, 3));

    // 檢查今日服務
    console.log('\n=== 檢查今日服務 ===');
    const today = new Date().toISOString().split('T')[0];
    console.log('今日日期:', today);
    
    const { data: todayData, error: todayError, count: todayCount } = await supabase
      .from('billing_salary_data')
      .select('*', { count: 'exact' })
      .eq('service_date', today);
      
    console.log('今日服務查詢結果:');
    console.log('- 錯誤:', todayError);
    console.log('- 數據量:', todayCount);

    // 檢查本月收入
    console.log('\n=== 檢查本月收入 ===');
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    console.log('月初日期:', startOfMonth);
    
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('billing_salary_data')
      .select('service_fee')
      .gte('service_date', startOfMonth);
      
    console.log('本月數據查詢結果:');
    console.log('- 錯誤:', monthlyError);
    console.log('- 數據量:', monthlyData?.length);
    
    if (monthlyData && monthlyData.length > 0) {
      const monthlyRevenue = monthlyData.reduce((sum, record) => sum + (record.service_fee || 0), 0);
      console.log('- 本月收入:', monthlyRevenue);
    }

  } catch (error) {
    console.error('調試過程中出現錯誤:', error);
  }
}

debugStats();
