// 護理服務管理 API 服務層
// 基於 public.billing_salary_data 表

import { supabase } from '../lib/supabase'
import type {
  BillingSalaryRecord,
  BillingSalaryRecordWithCalculated,
  BillingSalaryFormData,
  MultipleDayFormData,
  BillingSalaryFilters,
  BusinessKPI,
  ProjectCategorySummary,
  ProjectCategory,
  ApiResponse,
  PaginatedResponse,
  BatchOperationResult,
  SearchSuggestion
} from '../types/billing-salary'

// =============================================================================
// 基礎 CRUD 操作
// =============================================================================

export async function fetchBillingSalaryRecords(
  filters: BillingSalaryFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<ApiResponse<PaginatedResponse<BillingSalaryRecordWithCalculated>>> {
  try {
    let query = supabase
      .from('billing_salary_data')
      .select('*', { count: 'exact' })

    // 應用篩選條件
    if (filters.dateRange.start && filters.dateRange.end) {
      query = query
        .gte('service_date', filters.dateRange.start)
        .lte('service_date', filters.dateRange.end)
    }

    if (filters.serviceType) {
      query = query.eq('service_type', filters.serviceType)
    }

    if (filters.projectCategory) {
      query = query.eq('project_category', filters.projectCategory)
    }

    if (filters.projectManager) {
      query = query.eq('project_manager', filters.projectManager)
    }

    if (filters.careStaffName) {
      query = query.ilike('care_staff_name', `%${filters.careStaffName}%`)
    }

    // 優先處理多選客戶
    if (filters.selectedCustomerIds && filters.selectedCustomerIds.length > 0) {
      query = query.in('customer_id', filters.selectedCustomerIds)
    } else if (filters.searchTerm && filters.searchTerm.length >= 2) {
      // 只有在沒有選中特定客戶時才使用模糊搜尋
      query = query.or(`customer_name.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,customer_id.ilike.%${filters.searchTerm}%`)
    }

    // 分頁和排序
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('service_date', { ascending: false })
      .order('start_time', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Error fetching billing salary records:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // 添加計算欄位
    const dataWithCalculated: BillingSalaryRecordWithCalculated[] = (data || []).map(record => ({
      ...record,
      profit: (record.service_fee || 0) - (record.staff_salary || 0)
    }))

    return {
      success: true,
      data: {
        data: dataWithCalculated,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error) {
    console.error('Error in fetchBillingSalaryRecords:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取記錄時發生錯誤'
    }
  }
}

export async function createBillingSalaryRecord(
  formData: Omit<BillingSalaryFormData, 'hourly_rate' | 'hourly_salary'> | BillingSalaryFormData
): Promise<ApiResponse<BillingSalaryRecord>> {
  try {
    // 移除 hourly_rate 和 hourly_salary，讓資料庫觸發器自動計算
    const { hourly_rate, hourly_salary, ...dataToInsert } = formData as BillingSalaryFormData
    
    const { data, error } = await supabase
      .from('billing_salary_data')
      .insert([dataToInsert])
      .select()
      .single()

    if (error) {
      console.error('Error creating billing salary record:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data,
      message: '記錄新增成功'
    }
  } catch (error) {
    console.error('Error in createBillingSalaryRecord:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '新增記錄時發生錯誤'
    }
  }
}

export async function updateBillingSalaryRecord(
  id: string,
  formData: Partial<BillingSalaryFormData>
): Promise<ApiResponse<BillingSalaryRecord>> {
  try {
    const { data, error } = await supabase
      .from('billing_salary_data')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating billing salary record:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data,
      message: '記錄更新成功'
    }
  } catch (error) {
    console.error('Error in updateBillingSalaryRecord:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新記錄時發生錯誤'
    }
  }
}

export async function deleteBillingSalaryRecord(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('billing_salary_data')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting billing salary record:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      message: '記錄刪除成功'
    }
  } catch (error) {
    console.error('Error in deleteBillingSalaryRecord:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '刪除記錄時發生錯誤'
    }
  }
}

// =============================================================================
// 搜尋建議
// =============================================================================

export async function getSearchSuggestions(
  query: string,
  limit: number = 20
): Promise<ApiResponse<SearchSuggestion[]>> {
  try {
    if (query.length < 2) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('billing_salary_data')
      .select('id, customer_name, phone, customer_id')
      .or(`customer_name.ilike.%${query}%,phone.ilike.%${query}%,customer_id.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error('Error getting search suggestions:', error)
      return {
        success: false,
        error: error.message
      }
    }

    const suggestions: SearchSuggestion[] = []
    
    data?.forEach(record => {
      if (record.customer_name?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          id: record.id,
          type: 'customer_name',
          value: record.customer_name,
          display_text: `客戶：${record.customer_name}`
        })
      }
      if (record.phone?.includes(query)) {
        suggestions.push({
          id: record.id,
          type: 'phone',
          value: record.phone,
          display_text: `電話：${record.phone}`
        })
      }
      if (record.customer_id?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          id: record.id,
          type: 'customer_id',
          value: record.customer_id,
          display_text: `編號：${record.customer_id}`
        })
      }
    })

    // 去重並限制數量
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.value === suggestion.value && s.type === suggestion.type)
      )
      .slice(0, limit)

    return {
      success: true,
      data: uniqueSuggestions
    }
  } catch (error) {
    console.error('Error in getSearchSuggestions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取搜尋建議時發生錯誤'
    }
  }
}

// =============================================================================
// KPI 和統計
// =============================================================================

export async function getBusinessKPI(
  dateRange: { start: string; end: string }
): Promise<ApiResponse<BusinessKPI>> {
  try {
    // 當前期間統計
    const { data: currentData, error: currentError } = await supabase
      .from('billing_salary_data')
      .select('service_fee, staff_salary, service_hours')
      .gte('service_date', dateRange.start)
      .lte('service_date', dateRange.end)

    if (currentError) {
      console.error('Error getting current KPI:', currentError)
      return {
        success: false,
        error: currentError.message
      }
    }

    // 計算上月同期（用於增長率比較）
    const currentStart = new Date(dateRange.start)
    const currentEnd = new Date(dateRange.end)
    
    // 計算上個月的同期日期範圍
    const lastMonthStart = new Date(currentStart)
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
    const lastMonthEnd = new Date(currentEnd)
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1)

    const { data: lastMonthData, error: lastMonthError } = await supabase
      .from('billing_salary_data')
      .select('service_fee, staff_salary, service_hours')
      .gte('service_date', lastMonthStart.toISOString().split('T')[0])
      .lte('service_date', lastMonthEnd.toISOString().split('T')[0])

    if (lastMonthError) {
      console.warn('Error getting last month KPI for comparison:', lastMonthError)
    }

    // 計算當前期間 KPI
    const totalRevenue = currentData?.reduce((sum, record) => sum + (record.service_fee || 0), 0) || 0
    const totalStaffSalary = currentData?.reduce((sum, record) => sum + (record.staff_salary || 0), 0) || 0
    const totalProfit = totalRevenue - totalStaffSalary
    const totalServiceHours = currentData?.reduce((sum, record) => sum + (record.service_hours || 0), 0) || 0
    const avgProfitPerHour = totalServiceHours > 0 ? totalProfit / totalServiceHours : 0

    // 計算增長率
    const lastMonthRevenue = lastMonthData?.reduce((sum, record) => sum + (record.service_fee || 0), 0) || 0
    const revenueGrowthRate = lastMonthRevenue > 0 
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0 // 如果上月無數據但本月有，則顯示 100% 增長

    console.log('KPI Debug:', {
      currentPeriod: `${dateRange.start} to ${dateRange.end}`,
      lastMonthPeriod: `${lastMonthStart.toISOString().split('T')[0]} to ${lastMonthEnd.toISOString().split('T')[0]}`,
      currentRecords: currentData?.length || 0,
      lastMonthRecords: lastMonthData?.length || 0,
      totalRevenue,
      lastMonthRevenue,
      revenueGrowthRate
    })

    return {
      success: true,
      data: {
        totalRevenue,
        totalProfit,
        totalServiceHours,
        avgProfitPerHour,
        revenueGrowthRate
      }
    }
  } catch (error) {
    console.error('Error in getBusinessKPI:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取 KPI 時發生錯誤'
    }
  }
}

export async function getProjectCategorySummary(
  dateRange: { start: string; end: string }
): Promise<ApiResponse<ProjectCategorySummary[]>> {
  try {
    const { data, error } = await supabase
      .from('billing_salary_data')
      .select('project_category, service_fee, staff_salary, service_hours, customer_name')
      .gte('service_date', dateRange.start)
      .lte('service_date', dateRange.end)

    if (error) {
      console.error('Error getting project category summary:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // 按項目分類統計
    const summaryMap = new Map<ProjectCategory, ProjectCategorySummary>()
    const customerSetMap = new Map<ProjectCategory, Set<string>>() // 追蹤每個項目的唯一客戶

    data.forEach((record) => {
      const category = record.project_category
      if (!category) return

      const existing = summaryMap.get(category) || {
        category,
        totalFee: 0,
        totalHours: 0,
        totalProfit: 0,
        recordCount: 0,
        uniqueCustomers: 0
      }

      existing.totalFee += record.service_fee || 0
      existing.totalHours += record.service_hours || 0
      existing.totalProfit += (record.service_fee || 0) - (record.staff_salary || 0)
      existing.recordCount += 1

      summaryMap.set(category, existing)

      // 追蹤唯一客戶
      if (!customerSetMap.has(category)) {
        customerSetMap.set(category, new Set())
      }
      if (record.customer_name) {
        customerSetMap.get(category)?.add(record.customer_name)
      }
    })

    // 更新唯一客戶數
    summaryMap.forEach((summary, category) => {
      summary.uniqueCustomers = customerSetMap.get(category)?.size || 0
    })

    const summaries = Array.from(summaryMap.values())
      .sort((a, b) => b.totalFee - a.totalFee) // 按收入降序排列

    return {
      success: true,
      data: summaries
    }
  } catch (error) {
    console.error('Error in getProjectCategorySummary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取項目分類統計時發生錯誤'
    }
  }
}

// =============================================================================
// 多天新增功能
// =============================================================================

export async function createMultipleDayRecords(
  formData: MultipleDayFormData
): Promise<ApiResponse<BatchOperationResult>> {
  try {
    // 生成日期列表
    const dates = generateDateList(formData)
    
    // 檢查衝突
    const conflicts = await checkTimeConflicts(dates, formData.care_staff_name, formData.start_time, formData.end_time)
    
    const results: BatchOperationResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      details: []
    }

    // 逐日建立記錄
    for (const date of dates) {
      if (conflicts.some(conflict => conflict.date === date)) {
        results.skipped++
        results.details.push({
          date,
          status: 'skipped',
          error: '時間衝突'
        })
        continue
      }

      const recordData: BillingSalaryFormData = {
        ...formData,
        service_date: date
      }

      const result = await createBillingSalaryRecord(recordData)
      
      if (result.success) {
        results.success++
        results.details.push({ date, status: 'success' })
      } else {
        results.failed++
        results.errors.push(`${date}: ${result.error}`)
        results.details.push({
          date,
          status: 'failed',
          error: result.error
        })
      }
    }

    return {
      success: true,
      data: results,
      message: `批量新增完成：成功 ${results.success} 筆，失敗 ${results.failed} 筆，跳過 ${results.skipped} 筆`
    }
  } catch (error) {
    console.error('Error in createMultipleDayRecords:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量新增時發生錯誤'
    }
  }
}

// =============================================================================
// CSV 導出功能
// =============================================================================

export async function exportToCSV(
  filters: BillingSalaryFilters
): Promise<ApiResponse<string>> {
  try {
    // 獲取所有符合條件的記錄（不分頁）
    let query = supabase
      .from('billing_salary_data')
      .select('*')

    // 應用篩選條件
    if (filters.dateRange.start && filters.dateRange.end) {
      query = query
        .gte('service_date', filters.dateRange.start)
        .lte('service_date', filters.dateRange.end)
    }

    if (filters.serviceType) {
      query = query.eq('service_type', filters.serviceType)
    }

    if (filters.projectCategory) {
      query = query.eq('project_category', filters.projectCategory)
    }

    if (filters.projectManager) {
      query = query.eq('project_manager', filters.projectManager)
    }

    if (filters.careStaffName) {
      query = query.ilike('care_staff_name', `%${filters.careStaffName}%`)
    }

    // 優先處理多選客戶
    if (filters.selectedCustomerIds && filters.selectedCustomerIds.length > 0) {
      query = query.in('customer_id', filters.selectedCustomerIds)
    } else if (filters.searchTerm && filters.searchTerm.length >= 2) {
      // 只有在沒有選中特定客戶時才使用模糊搜尋
      query = query.or(`customer_name.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,customer_id.ilike.%${filters.searchTerm}%`)
    }

    const { data, error } = await query
      .order('service_date', { ascending: false })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error exporting CSV:', error)
      return {
        success: false,
        error: error.message
      }
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: '沒有符合條件的數據可導出'
      }
    }

    // 定義 CSV 標題
    const headers = [
      '服務日期',
      '項目編號', 
      '客戶姓名',
      '客戶電話',
      '服務地址',
      '開始時間',
      '結束時間', 
      '服務時數',
      '護理人員',
      '服務費用',
      '護理人員工資',
      '每小時收費',
      '每小時工資',
      '服務類型',
      '所屬項目',
      '項目經理',
      '毛利',
      '建立時間'
    ]

    // 轉換數據為 CSV 格式
    const csvRows = [
      headers.join(','), // 標題行
      ...data.map(record => {
        const profit = (record.service_fee || 0) - (record.staff_salary || 0)
        
        return [
          record.service_date || '',
          `"${(record.customer_id || '').replace(/"/g, '""')}"`,
          `"${(record.customer_name || '').replace(/"/g, '""')}"`,
          record.phone || '',
          `"${(record.service_address || '').replace(/"/g, '""')}"`,
          record.start_time || '',
          record.end_time || '',
          record.service_hours || 0,
          `"${(record.care_staff_name || '').replace(/"/g, '""')}"`,
          record.service_fee || 0,
          record.staff_salary || 0,
          record.hourly_rate || 0,
          record.hourly_salary || 0,
          `"${(record.service_type || '').replace(/"/g, '""')}"`,
          `"${(record.project_category || '').replace(/"/g, '""')}"`,
          `"${(record.project_manager || '').replace(/"/g, '""')}"`,
          profit,
          record.created_at || ''
        ].join(',')
      })
    ]

    const csvContent = csvRows.join('\n')

    return {
      success: true,
      data: csvContent,
      message: `成功導出 ${data.length} 筆記錄`
    }
  } catch (error) {
    console.error('Error in exportToCSV:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '導出 CSV 時發生錯誤'
    }
  }
}

// =============================================================================
// 輔助函數
// =============================================================================

function generateDateList(formData: MultipleDayFormData): string[] {
  const dates: string[] = []
  const start = new Date(formData.dateRange.start)
  const end = new Date(formData.dateRange.end)
  const current = new Date(start)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    
    // 檢查是否在排除列表中
    if (formData.excludeDates?.includes(dateStr)) {
      current.setDate(current.getDate() + 1)
      continue
    }

    // 檢查重複模式
    if (formData.repeatPattern === 'daily') {
      dates.push(dateStr)
    } else if (formData.repeatPattern === 'weekly' && formData.weeklyDays) {
      const dayOfWeek = current.getDay()
      if (formData.weeklyDays.includes(dayOfWeek)) {
        dates.push(dateStr)
      }
    }

    current.setDate(current.getDate() + 1)
  }

  return dates
}

async function checkTimeConflicts(
  dates: string[],
  careStaffName: string,
  startTime: string,
  endTime: string
): Promise<{ date: string; conflicts: BillingSalaryRecord[] }[]> {
  try {
    const conflicts: { date: string; conflicts: BillingSalaryRecord[] }[] = []

    for (const date of dates) {
      const { data, error } = await supabase
        .from('billing_salary_data')
        .select('*')
        .eq('service_date', date)
        .eq('care_staff_name', careStaffName)

      if (error) {
        console.warn(`Error checking conflicts for ${date}:`, error)
        continue
      }

      const dateConflicts = data?.filter(record => {
        return isTimeOverlapping(
          startTime,
          endTime,
          record.start_time,
          record.end_time
        )
      }) || []

      if (dateConflicts.length > 0) {
        conflicts.push({ date, conflicts: dateConflicts })
      }
    }

    return conflicts
  } catch (error) {
    console.error('Error checking time conflicts:', error)
    return []
  }
}

function isTimeOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const start1Min = toMinutes(start1)
  const end1Min = toMinutes(end1)
  const start2Min = toMinutes(start2)
  const end2Min = toMinutes(end2)

  return start1Min < end2Min && start2Min < end1Min
}

// =============================================================================
// 搜尋功能
// =============================================================================

// 客戶搜尋功能
export interface CustomerSearchResult {
  customer_name: string
  customer_id: string
  phone: string
  service_address?: string // 新增服務地址欄位
  display_text: string // 格式："王大明 (MC0001) - 98765432"
}

export async function searchCustomers(searchTerm: string): Promise<ApiResponse<CustomerSearchResult[]>> {
  try {
    if (!searchTerm.trim() || searchTerm.length < 1) {
      return { success: true, data: [] }
    }

    // 從 billing_salary_data 和 customer_personal_data 兩個表搜尋
    const [billingResults, customerResults] = await Promise.all([
      // 從計費記錄表搜尋
      supabase
        .from('billing_salary_data')
        .select('customer_name, customer_id, phone, service_address')
        .or(`customer_name.ilike.%${searchTerm}%,customer_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .not('customer_name', 'is', null)
        .not('customer_id', 'is', null)
        .limit(20),

      // 從客戶資料表搜尋
      supabase
        .from('customer_personal_data')
        .select('customer_name, customer_id, phone, service_address')
        .or(`customer_name.ilike.%${searchTerm}%,customer_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .not('customer_name', 'is', null)
        .not('customer_id', 'is', null)
        .limit(20)
    ])

    if (billingResults.error) {
      console.error('計費記錄搜尋錯誤:', billingResults.error)
    }
    if (customerResults.error) {
      console.error('客戶資料搜尋錯誤:', customerResults.error)
    }

    // 合併結果並去重
    const allResults = [
      ...(billingResults.data || []),
      ...(customerResults.data || [])
    ]

    // 使用 Map 去重，以 customer_id 為鍵
    const uniqueResults = new Map<string, CustomerSearchResult>()

    allResults.forEach(item => {
      if (item.customer_name && item.customer_id) {
        const key = item.customer_id
        if (!uniqueResults.has(key)) {
          uniqueResults.set(key, {
            customer_name: item.customer_name,
            customer_id: item.customer_id,
            phone: item.phone || '',
            service_address: item.service_address || '', // 新增服務地址
            display_text: `${item.customer_name} (${item.customer_id})${item.phone ? ' - ' + item.phone : ''}`
          })
        } else {
          // 如果已存在，但當前項目有服務地址而現有項目沒有，則更新服務地址
          const existing = uniqueResults.get(key)!
          if (!existing.service_address && item.service_address) {
            existing.service_address = item.service_address
          }
        }
      }
    })

    // 轉換為陣列並排序，限制前8個結果
    const sortedResults = Array.from(uniqueResults.values())
      .sort((a, b) => a.customer_name.localeCompare(b.customer_name))
      .slice(0, 8)

    return { success: true, data: sortedResults }
  } catch (error) {
    console.error('客戶搜尋失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '客戶搜尋失敗'
    }
  }
}

// 獲取所有護理人員列表（用於下拉選單）
export async function getAllCareStaff(): Promise<ApiResponse<{ name_chinese: string }[]>> {
  try {
    const { data, error } = await supabase
      .from('care_staff_profiles')
      .select('name_chinese')
      .not('name_chinese', 'is', null)
      .order('name_chinese')

    if (error) throw error

    // 去重並過濾
    const uniqueNames = Array.from(new Set(
      (data || [])
        .map(item => item.name_chinese)
        .filter(name => name && name.trim().length > 0)
    )).map(name => ({ name_chinese: name }))

    return { success: true, data: uniqueNames }
  } catch (error) {
    console.error('獲取護理人員列表失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取護理人員列表失敗'
    }
  }
}

// 護理人員搜尋功能 - Step 2: 增強版，返回完整資料
export async function searchCareStaff(searchTerm: string): Promise<ApiResponse<any[]>> {
  try {
    if (!searchTerm.trim()) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('care_staff_profiles')
      .select(`
        staff_id, 
        name_chinese, 
        name_english,
        phone, 
        email,
        job_position,
        preferred_area,
        language
      `)
      .or(`name_chinese.ilike.%${searchTerm}%,name_english.ilike.%${searchTerm}%,staff_id.ilike.%${searchTerm}%`)
      .limit(8)

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('護理人員搜尋失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '護理人員搜尋失敗'
    }
  }
}
