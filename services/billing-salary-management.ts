import { supabase } from '../lib/supabase'

export interface BillingSalaryData {
  id?: string
  service_date: string
  customer_id: string
  customer_name: string
  phone?: string
  service_address: string
  start_time: string
  end_time: string
  service_hours: number
  care_staff_name: string
  service_fee: number
  staff_salary: number
  hourly_rate?: number | null  // 自動計算
  hourly_salary?: number | null  // 自動計算
  service_type: string
  project_category: string
  project_manager: string
}

export class BillingSalaryService {
  /**
   * 新增薪資資料
   * hourly_rate 和 hourly_salary 會自動計算
   */
  static async createBillingSalaryRecord(data: Omit<BillingSalaryData, 'id' | 'hourly_rate' | 'hourly_salary'>) {
    try {
      // 計算 hourly_rate 和 hourly_salary
      const calculatedData = {
        ...data,
        hourly_rate: data.service_hours > 0 ? data.service_fee / data.service_hours : null,
        hourly_salary: data.service_hours > 0 ? data.staff_salary / data.service_hours : null,
      }

      const { data: result, error } = await supabase
        .from('billing_salary_data')
        .insert([calculatedData])
        .select()
        .single()

      if (error) throw error

      return { success: true, data: result }
    } catch (error) {
      console.error('建立薪資記錄失敗:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知錯誤' }
    }
  }

  /**
   * 更新薪資資料
   * hourly_rate 和 hourly_salary 會自動重新計算
   */
  static async updateBillingSalaryRecord(id: string, data: Partial<BillingSalaryData>) {
    try {
      // 如果更新了相關欄位，重新計算 hourly_rate 和 hourly_salary
      if (data.service_fee !== undefined || data.staff_salary !== undefined || data.service_hours !== undefined) {
        // 獲取當前資料
        const { data: currentData, error: fetchError } = await supabase
          .from('billing_salary_data')
          .select('service_fee, staff_salary, service_hours')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        // 合併新舊資料
        const mergedData = {
          service_fee: data.service_fee ?? currentData.service_fee,
          staff_salary: data.staff_salary ?? currentData.staff_salary,
          service_hours: data.service_hours ?? currentData.service_hours,
        }

        // 重新計算
        if (mergedData.service_hours > 0) {
          data.hourly_rate = mergedData.service_fee / mergedData.service_hours
          data.hourly_salary = mergedData.staff_salary / mergedData.service_hours
        } else {
          data.hourly_rate = null
          data.hourly_salary = null
        }
      }

      const { data: result, error } = await supabase
        .from('billing_salary_data')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data: result }
    } catch (error) {
      console.error('更新薪資記錄失敗:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知錯誤' }
    }
  }

  /**
   * 獲取薪資資料列表
   */
  static async getBillingSalaryRecords(options: {
    page?: number
    limit?: number
    search?: string
    staffName?: string
    dateFrom?: string
    dateTo?: string
  } = {}) {
    try {
      const { page = 1, limit = 50, search, staffName, dateFrom, dateTo } = options

      let query = supabase
        .from('billing_salary_data')
        .select('*', { count: 'exact' })

      // 搜尋條件
      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_id.ilike.%${search}%,care_staff_name.ilike.%${search}%`)
      }

      if (staffName) {
        query = query.eq('care_staff_name', staffName)
      }

      if (dateFrom) {
        query = query.gte('service_date', dateFrom)
      }

      if (dateTo) {
        query = query.lte('service_date', dateTo)
      }

      // 分頁和排序
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query
        .order('service_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    } catch (error) {
      console.error('獲取薪資記錄失敗:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知錯誤', data: [], pagination: null }
    }
  }

  /**
   * 刪除薪資記錄
   */
  static async deleteBillingSalaryRecord(id: string) {
    try {
      const { error } = await supabase
        .from('billing_salary_data')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('刪除薪資記錄失敗:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知錯誤' }
    }
  }

  /**
   * 重新計算所有記錄的 hourly_rate 和 hourly_salary
   * 適用於修正資料或批量更新
   */
  static async recalculateAllHourlyRates() {
    try {
      console.log('開始重新計算所有記錄的每小時費率...')

      // 獲取所有記錄
      const { data: allRecords, error: fetchError } = await supabase
        .from('billing_salary_data')
        .select('id, service_fee, staff_salary, service_hours')

      if (fetchError) throw fetchError

      let updatedCount = 0
      
      for (const record of allRecords) {
        const updates = {
          hourly_rate: record.service_hours > 0 ? record.service_fee / record.service_hours : null,
          hourly_salary: record.service_hours > 0 ? record.staff_salary / record.service_hours : null,
        }

        const { error: updateError } = await supabase
          .from('billing_salary_data')
          .update(updates)
          .eq('id', record.id)

        if (!updateError) {
          updatedCount++
        }
      }

      console.log(`重新計算完成，共更新 ${updatedCount} 筆記錄`)
      return { success: true, updatedCount }
    } catch (error) {
      console.error('重新計算失敗:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知錯誤' }
    }
  }
}