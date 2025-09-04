// 測試二月和四月的前端數據處理
console.log('=== 測試二月和四月的日期處理 ===')

// 模擬月份處理邏輯
function testMonthProcessing(month, year = 2024) {
  console.log(`\n🔍 測試 ${year}年${month}月...`)
  
  // 測試 Array.from 生成
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `${i + 1}月`
  }))
  
  console.log(`月份選項 (${month-1}):`, monthOptions[month-1])
  
  // 測試日期範圍生成
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  console.log('開始日期:', startDate)
  console.log('結束日期:', endDate)
  
  // 測試日期字符串格式化
  const start = year + '-' + 
               String(month).padStart(2, '0') + '-01'
  const end = endDate.getFullYear() + '-' + 
             String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
             String(endDate.getDate()).padStart(2, '0')
             
  console.log('格式化開始:', start)
  console.log('格式化結束:', end)
  
  // 測試月曆日期生成
  const calendarDays = []
  const firstDay = new Date(year, month - 1, 1)
  const startCalendar = new Date(firstDay)
  startCalendar.setDate(startCalendar.getDate() - firstDay.getDay())
  
  const current = new Date(startCalendar)
  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  console.log('月曆天數:', calendarDays.length)
  console.log('第一天:', calendarDays[0])
  console.log('最後一天:', calendarDays[calendarDays.length - 1])
  
  // 檢查 map 操作
  try {
    const mappedDays = calendarDays.map((date, index) => ({
      date: date,
      dateStr: date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0'),
      isCurrentMonth: date.getMonth() === (month - 1)
    }))
    console.log('map 操作成功，生成了', mappedDays.length, '個項目')
    console.log('樣本:', mappedDays[0])
  } catch (error) {
    console.error('❌ map 操作失敗:', error)
  }
  
  return calendarDays
}

// 測試所有月份
console.log('測試所有月份的 Array.from 生成...')
try {
  const allMonths = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `${i + 1}月`,
    monthNumber: i + 1
  }))
  
  console.log('所有月份生成成功:', allMonths.length)
  console.log('二月 (index 1):', allMonths[1])
  console.log('四月 (index 3):', allMonths[3])
  
  // 測試 map 操作
  const monthsLabels = allMonths.map((month, index) => month.label)
  console.log('月份標籤 map 成功:', monthsLabels.length)
  
} catch (error) {
  console.error('❌ 月份生成失敗:', error)
}

// 專門測試二月和四月
testMonthProcessing(2)  // 二月
testMonthProcessing(4)  // 四月
testMonthProcessing(3)  // 三月作為對比

// 測試特殊情況
console.log('\n🔍 測試特殊情況...')

// 測試 null/undefined 對象
try {
  const nullArray = null
  console.log('null array length:', nullArray?.length || 'undefined')
  
  const undefinedArray = undefined
  console.log('undefined array length:', undefinedArray?.length || 'undefined')
  
  // 測試空對象的 map
  const emptyObj = {}
  const emptyArray = []
  
  console.log('空陣列 map:', emptyArray.map(x => x).length)
  
} catch (error) {
  console.error('❌ 特殊情況測試失敗:', error)
}

console.log('\n✅ 測試完成')
