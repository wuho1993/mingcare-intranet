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
// 日期處理輔助函數（避免時區問題）
// =============================================================================

/**
 * 安全地从 YYYY-MM-DD 格式字符串解析日期，避免时区问题
 */
function parseDateStringLocal(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * 将 Date 对象格式化为 YYYY-MM-DD 字符串，使用本地时间
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// =============================================================================
// Helper Functions
// =============================================================================

// Helper to normalize project category filters to an array
function normalizeProjectCategories(
  projectCategory: BillingSalaryFilters['projectCategory']
): ProjectCategory[] {
  if (!projectCategory) return []
  return Array.isArray(projectCategory) ? projectCategory : [projectCategory]
}

// =============================================================================
// 基礎 CRUD 操作
// =============================================================================

export async function fetchBillingSalaryRecords(
  filters: BillingSalaryFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<ApiResponse<PaginatedResponse<BillingSalaryRecordWithCalculated>>> {
  try {
    // 如果有介紹人篩選，先從 customer_personal_data 獲取符合條件的 customer_id 列表
    let introducerCustomerIds: string[] | null = null
    if (filters.introducer) {
      const { data: customerData, error: customerError } = await supabase
        .from('customer_personal_data')
        .select('customer_id')
        .eq('introducer', filters.introducer)

      if (customerError) {
        console.error('Error fetching customers by introducer:', customerError)
        return {
          success: false,
          error: customerError.message
        }
      }

      introducerCustomerIds = (customerData || [])
        .map((c: { customer_id: string | null }) => c.customer_id)
        .filter((id: string | null): id is string => id !== null && id !== undefined)

      // 如果該介紹人沒有任何客戶，直接返回空結果
      if (introducerCustomerIds && introducerCustomerIds.length === 0) {
        return {
          success: true,
          data: {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0
          }
        }
      }
    }

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

    const projectCategories = normalizeProjectCategories(filters.projectCategory)
    if (projectCategories.length > 0) {
      query = query.in('project_category', projectCategories)
    }

    if (filters.projectManager) {
      query = query.eq('project_manager', filters.projectManager)
    }

    if (filters.careStaffName) {
      query = query.ilike('care_staff_name', `%${filters.careStaffName}%`)
    }

    // 介紹人篩選 - 使用預先查詢的 customer_id 列表
    if (introducerCustomerIds && introducerCustomerIds.length > 0) {
      // 如果同時有選中的客戶，取交集
      if (filters.selectedCustomerIds && filters.selectedCustomerIds.length > 0) {
        const intersection = filters.selectedCustomerIds.filter(id => introducerCustomerIds!.includes(id))
        if (intersection.length === 0) {
          // 沒有交集，返回空結果
          return {
            success: true,
            data: {
              data: [],
              total: 0,
              page,
              pageSize,
              totalPages: 0
            }
          }
        }
        query = query.in('customer_id', intersection)
      } else {
        query = query.in('customer_id', introducerCustomerIds)
      }
    } else if (filters.selectedCustomerIds && filters.selectedCustomerIds.length > 0) {
      // 優先處理多選客戶
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
    const dataWithCalculated: BillingSalaryRecordWithCalculated[] = (data || []).map((record: BillingSalaryRecord) => ({
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

// 獲取所有記錄（分批獲取，無上限）
export async function fetchAllBillingSalaryRecords(
  filters: BillingSalaryFilters
): Promise<ApiResponse<BillingSalaryRecordWithCalculated[]>> {
  try {
    // 如果有介紹人篩選，先從 customer_personal_data 獲取符合條件的 customer_id 列表
    let introducerCustomerIds: string[] | null = null
    if (filters.introducer) {
      const { data: customerData, error: customerError } = await supabase
        .from('customer_personal_data')
        .select('customer_id')
        .eq('introducer', filters.introducer)

      if (customerError) {
        console.error('Error fetching customers by introducer:', customerError)
        return {
          success: false,
          error: customerError.message
        }
      }

      introducerCustomerIds = (customerData || [])
        .map((c: { customer_id: string | null }) => c.customer_id)
        .filter((id: string | null): id is string => id !== null && id !== undefined)

      // 如果該介紹人沒有任何客戶，直接返回空結果
      if (introducerCustomerIds && introducerCustomerIds.length === 0) {
        return {
          success: true,
          data: [],
          message: '該介紹人沒有相關客戶記錄'
        }
      }
    }

    let allRecords: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const from = page * pageSize
      const to = from + pageSize - 1

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

      const projectCategories = normalizeProjectCategories(filters.projectCategory)
      if (projectCategories.length > 0) {
        query = query.in('project_category', projectCategories)
      }

      if (filters.projectManager) {
        query = query.eq('project_manager', filters.projectManager)
      }

      if (filters.careStaffName) {
        query = query.ilike('care_staff_name', `%${filters.careStaffName}%`)
      }

      // 介紹人篩選 - 使用預先查詢的 customer_id 列表
      if (introducerCustomerIds && introducerCustomerIds.length > 0) {
        // 如果同時有選中的客戶，取交集
        if (filters.selectedCustomerIds && filters.selectedCustomerIds.length > 0) {
          const intersection = filters.selectedCustomerIds.filter(id => introducerCustomerIds!.includes(id))
          if (intersection.length === 0) {
            // 沒有交集，返回空結果
            return {
              success: true,
              data: [],
              message: '沒有符合條件的記錄'
            }
          }
          query = query.in('customer_id', intersection)
        } else {
          query = query.in('customer_id', introducerCustomerIds)
        }
      } else if (filters.selectedCustomerIds && filters.selectedCustomerIds.length > 0) {
        // 優先處理多選客戶
        query = query.in('customer_id', filters.selectedCustomerIds)
      } else if (filters.searchTerm && filters.searchTerm.length >= 2) {
        query = query.or(`customer_name.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,customer_id.ilike.%${filters.searchTerm}%`)
      }

      const { data, error } = await query
        .order('service_date', { ascending: false })
        .order('start_time', { ascending: true })
        .range(from, to)

      if (error) {
        console.error('Error fetching records:', error)
        throw error
      }

      if (data && data.length > 0) {
        allRecords = allRecords.concat(data)
        hasMore = data.length === pageSize
        page++
        console.log(`已獲取 ${allRecords.length} 條記錄...`)
      } else {
        hasMore = false
      }
    }

    // 添加計算欄位
    const dataWithCalculated: BillingSalaryRecordWithCalculated[] = allRecords.map((record: BillingSalaryRecord) => ({
      ...record,
      profit: (record.service_fee || 0) - (record.staff_salary || 0)
    }))

    return {
      success: true,
      data: dataWithCalculated,
      message: `成功獲取 ${dataWithCalculated.length} 條記錄`
    }
  } catch (error) {
    console.error('Error in fetchAllBillingSalaryRecords:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取所有記錄時發生錯誤'
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
  formData: BillingSalaryFormData
): Promise<ApiResponse<BillingSalaryRecord>> {
  try {
    console.log('🔄 updateBillingSalaryRecord 開始:', {
      id,
      formData
    })
    
    const { data, error } = await supabase
      .from('billing_salary_data')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    console.log('🔄 updateBillingSalaryRecord 查詢結果:', {
      data,
      error
    })

    if (error) {
      console.error('❌ 更新記錄錯誤:', error)
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
    console.error('❌ updateBillingSalaryRecord 異常:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新記錄時發生錯誤'
    }
  }
}

export async function deleteBillingSalaryRecord(id: string): Promise<ApiResponse<void>> {
  try {
    console.log('🗑️ deleteBillingSalaryRecord 開始:', id)
    
    const { error } = await supabase
      .from('billing_salary_data')
      .delete()
      .eq('id', id)

    console.log('🗑️ deleteBillingSalaryRecord 查詢結果:', {
      error
    })

    if (error) {
      console.error('❌ 刪除記錄錯誤:', error)
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
    console.error('❌ deleteBillingSalaryRecord 異常:', error)
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
    
    data?.forEach((record: BillingSalaryRecord) => {
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
    console.log('🔍 業務概覽 KPI 計算開始:', {
      dateRange,
      startDate: dateRange.start,
      endDate: dateRange.end
    })
    
    // 分批獲取所有記錄以避免 Supabase 限制
    const getAllRecords = async () => {
      let allData: any[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true
      
      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1
        
        const { data, error } = await supabase
          .from('billing_salary_data')
          .select('service_fee, staff_salary, service_hours')
          .gte('service_date', dateRange.start)
          .lte('service_date', dateRange.end)
          .range(from, to)
        
        if (error) {
          throw new Error(error.message)
        }
        
        if (data && data.length > 0) {
          allData = allData.concat(data)
          hasMore = data.length === pageSize
          page++
        } else {
          hasMore = false
        }
      }
      
      return allData
    }
    
    // 獲取總記錄數用於驗證
    const { count: totalCount, error: countError } = await supabase
      .from('billing_salary_data')
      .select('*', { count: 'exact', head: true })
      .gte('service_date', dateRange.start)
      .lte('service_date', dateRange.end)
    
    if (countError) {
      console.error('❌ 查詢總記錄數錯誤:', countError)
      return {
        success: false,
        error: countError.message
      }
    }
    
    // 獲取所有當前期間數據
    const currentData = await getAllRecords()

    console.log('📊 查詢結果:', {
      recordCount: currentData?.length || 0,
      totalCount: totalCount || 0,
      isComplete: (currentData?.length || 0) === (totalCount || 0),
      dateRange: `${dateRange.start} ~ ${dateRange.end}`,
      sampleRecords: currentData?.slice(0, 3) || []
    })
    
    // 更清楚的調試信息
    console.log(`✅ 數據完整性檢查: 獲取 ${currentData?.length || 0} / ${totalCount || 0} 筆記錄 ${(currentData?.length || 0) === (totalCount || 0) ? '✅ 完整' : '❌ 不完整'}`)

    // 計算上月同期（用於增長率比較）- 使用安全的日期解析
    const currentStart = parseDateStringLocal(dateRange.start)
    const currentEnd = parseDateStringLocal(dateRange.end)
    
    // 計算上個月的同期日期範圍
    const lastMonthStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, currentStart.getDate())
    const lastMonthEnd = new Date(currentEnd.getFullYear(), currentEnd.getMonth() - 1, currentEnd.getDate())

    // 分批獲取上月數據
    const getLastMonthRecords = async () => {
      let allData: any[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true
      
      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1
        
        const { data, error } = await supabase
          .from('billing_salary_data')
          .select('service_fee, staff_salary, service_hours')
          .gte('service_date', formatDateLocal(lastMonthStart))
          .lte('service_date', formatDateLocal(lastMonthEnd))
          .range(from, to)
        
        if (error) {
          console.warn('Error getting last month data:', error)
          return []
        }
        
        if (data && data.length > 0) {
          allData = allData.concat(data)
          hasMore = data.length === pageSize
          page++
        } else {
          hasMore = false
        }
      }
      
      return allData
    }
    
    const lastMonthData = await getLastMonthRecords()

    // 計算當前期間 KPI
    const totalRevenue = currentData?.reduce((sum, record) => sum + (record.service_fee || 0), 0) || 0
    const totalStaffSalary = currentData?.reduce((sum, record) => sum + (record.staff_salary || 0), 0) || 0
    const totalProfit = totalRevenue - totalStaffSalary
    const totalServiceHours = currentData?.reduce((sum, record) => sum + (record.service_hours || 0), 0) || 0
    const avgProfitPerHour = totalServiceHours > 0 ? totalProfit / totalServiceHours : 0

    console.log('💰 KPI 計算結果:', {
      recordCount: currentData?.length || 0,
      totalRevenue: totalRevenue.toLocaleString(),
      totalStaffSalary: totalStaffSalary.toLocaleString(),
      totalProfit: totalProfit.toLocaleString(),
      totalServiceHours: totalServiceHours.toFixed(1),
      avgProfitPerHour: avgProfitPerHour.toFixed(2)
    })

    // 計算增長率
    const lastMonthRevenue = lastMonthData?.reduce((sum, record) => sum + (record.service_fee || 0), 0) || 0
    const revenueGrowthRate = lastMonthRevenue > 0
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0 // 如果上月無數據但本月有，則顯示 100% 增長

    console.log('KPI Debug:', {
      currentPeriod: `${dateRange.start} to ${dateRange.end}`,
      lastMonthPeriod: `${formatDateLocal(lastMonthStart)} to ${formatDateLocal(lastMonthEnd)}`,
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
    console.log('📊 項目分類統計開始:', {
      dateRange,
      startDate: dateRange.start,
      endDate: dateRange.end
    })

    // 先獲取總記錄數進行驗證
    const { count: totalCount, error: countError } = await supabase
      .from('billing_salary_data')
      .select('*', { count: 'exact', head: true })
      .gte('service_date', dateRange.start)
      .lte('service_date', dateRange.end)

    if (countError) {
      console.error('❌ 查詢總記錄數錯誤:', countError)
    } else {
      console.log(`📈 日期範圍內總記錄數: ${totalCount}`)
    }

    // 分批獲取所有記錄以避免 Supabase 限制
    const getAllRecords = async () => {
      let allData: any[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true
      
      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1
        
        const { data, error } = await supabase
          .from('billing_salary_data')
          .select('project_category, service_fee, staff_salary, service_hours, customer_name, service_date')
          .gte('service_date', dateRange.start)
          .lte('service_date', dateRange.end)
          .range(from, to)
        
        if (error) {
          throw new Error(error.message)
        }
        
        if (data && data.length > 0) {
          allData = allData.concat(data)
          console.log(`📦 第 ${page + 1} 批: 獲取 ${data.length} 筆記錄，累計 ${allData.length} 筆`)
          hasMore = data.length === pageSize
          page++
        } else {
          hasMore = false
        }
      }
      
      return allData
    }
    
    const data = await getAllRecords()

    console.log(`✅ 數據完整性檢查: 獲取 ${data.length} / ${totalCount || 'unknown'} 筆記錄`)

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

    // 輸出每個項目分類的詳細統計
    console.log('📊 項目分類統計結果:')
    summaries.forEach(s => {
      console.log(`  - ${s.category}: ${s.recordCount} 筆, $${s.totalFee.toLocaleString()}, ${s.totalHours.toFixed(1)}h, ${s.uniqueCustomers} 位客戶`)
    })

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

    const projectCategories = normalizeProjectCategories(filters.projectCategory)
    if (projectCategories.length === 1) {
      query = query.eq('project_category', projectCategories[0])
    } else if (projectCategories.length > 1) {
      query = query.in('project_category', projectCategories)
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
      ...data.map((record: BillingSalaryRecord) => {
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

  // 使用本地日期格式避免時區問題
  const formatDateLocal = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  while (current <= end) {
    const dateStr = formatDateLocal(current)
    
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

      const dateConflicts = data?.filter((record: BillingSalaryRecord) => {
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

    allResults.forEach((item: any) => {
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
    const filteredNames = (data || [])
      .map((item: any) => item.name_chinese)
      .filter((name: any): name is string => name && typeof name === 'string' && name.trim().length > 0)
    
    const uniqueNames = Array.from(new Set(filteredNames) as Set<string>)
      .map((name: string) => ({ name_chinese: name }))

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

// =============================================================================
// 社區券費率管理
// =============================================================================

export interface VoucherRate {
  id: string
  service_type: string
  service_rate: number
  created_at: string
  updated_at: string
}

// 獲取所有社區券費率
export async function fetchVoucherRates(): Promise<ApiResponse<VoucherRate[]>> {
  try {
    const { data, error } = await supabase
      .from('voucher_rate')
      .select('*')
      .order('service_type', { ascending: true })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('獲取社區券費率失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取社區券費率失敗'
    }
  }
}

// 根據服務類型統計總數和總費用
export async function calculateVoucherSummary(
  filters: BillingSalaryFilters
): Promise<ApiResponse<{
  serviceTypeSummary: {
    service_type: string
    count: number
    total_hours: number
    total_rate: number
    total_amount: number
  }[]
  grandTotal: {
    total_count: number
    total_hours: number
    total_amount: number
  }
}>> {
  try {
    // 獲取費率表
    const voucherRatesResponse = await fetchVoucherRates()
    if (!voucherRatesResponse.success || !voucherRatesResponse.data) {
      throw new Error('無法獲取社區券費率')
    }

    const voucherRates = voucherRatesResponse.data
    const rateMap = new Map(voucherRates.map(rate => [rate.service_type, rate.service_rate]))

    // 獲取符合篩選條件的記錄 - 使用足夠大的 pageSize 以獲取所有記錄
    const recordsResponse = await fetchBillingSalaryRecords(filters, 1, 50000)
    if (!recordsResponse.success || !recordsResponse.data) {
      throw new Error('無法獲取服務記錄')
    }

    const records = recordsResponse.data.data

    // 按服務類型分組統計
    const serviceTypeMap = new Map<string, {
      count: number
      total_hours: number
    }>()

    records.forEach((record: BillingSalaryRecord) => {
      const serviceType = record.service_type
      const hours = record.service_hours || 0

      if (!serviceTypeMap.has(serviceType)) {
        serviceTypeMap.set(serviceType, {
          count: 0,
          total_hours: 0
        })
      }

      const current = serviceTypeMap.get(serviceType)!
      current.count += 1
      current.total_hours += hours
    })

    // 計算費用 - 使用 Math.round 修復浮點數精度問題
    const serviceTypeSummary = Array.from(serviceTypeMap.entries()).map(([serviceType, stats]) => {
      const rate = rateMap.get(serviceType) || 0
      return {
        service_type: serviceType,
        count: stats.count,
        total_hours: stats.total_hours,
        total_rate: rate,
        total_amount: Math.round(stats.total_hours * rate * 100) / 100
      }
    }).sort((a, b) => a.service_type.localeCompare(b.service_type))

    // 計算總計 - 使用 Math.round 確保精度
    const grandTotal = {
      total_count: serviceTypeSummary.reduce((sum, item) => sum + item.count, 0),
      total_hours: Math.round(serviceTypeSummary.reduce((sum, item) => sum + item.total_hours, 0) * 100) / 100,
      total_amount: Math.round(serviceTypeSummary.reduce((sum, item) => sum + item.total_amount, 0) * 100) / 100
    }

    return {
      success: true,
      data: {
        serviceTypeSummary,
        grandTotal
      }
    }
  } catch (error) {
    console.error('計算社區券統計失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '計算社區券統計失敗'
    }
  }
}
