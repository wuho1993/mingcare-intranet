// Supabase 數據庫服務 - 基於明家護理數據結構
// Generated: 2025-08-13

import { supabase } from '../lib/supabase'
import type {
  BillingSalaryData,
  CareStaffProfile,
  CustomerPersonalData,
  JobPositionOption,
  LanguageOption,
  CustomerFormData,
  CareStaffFormData,
  ServiceFormData,
  CustomerFilters,
  StaffFilters,
  ServiceFilters,
  ApiResponse,
  PaginatedResponse
} from '../types/database'

// ========================================================================
// 客戶管理服務 (Customer Management)
// ========================================================================

export class CustomerService {
  // 獲取所有客戶
  static async getCustomers(
    filters?: CustomerFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<CustomerPersonalData>> {
    let query = supabase
      .from('customer_personal_data')
      .select('*', { count: 'exact' })

    // 應用篩選條件
    if (filters?.customer_type) {
      query = query.eq('customer_type', filters.customer_type)
    }
    if (filters?.district) {
      query = query.eq('district', filters.district)
    }
    if (filters?.health_status) {
      query = query.eq('health_status', filters.health_status)
    }
    if (filters?.project_manager) {
      query = query.eq('project_manager', filters.project_manager)
    }
    if (filters?.introducer) {
      query = query.eq('introducer', filters.introducer)
    }
    if (filters?.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,customer_id.ilike.%${filters.search}%`)
    }

    // 分頁
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // 排序
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  // 根據 ID 獲取客戶
  static async getCustomerById(id: string): Promise<ApiResponse<CustomerPersonalData>> {
    const { data, error } = await supabase
      .from('customer_personal_data')
      .select('*')
      .eq('id', id)
      .single()

    return { data: data || undefined, error: error?.message }
  }

  // 新增客戶
  static async createCustomer(customerData: CustomerFormData): Promise<ApiResponse<CustomerPersonalData>> {
    const { data, error } = await supabase
      .from('customer_personal_data')
      .insert([customerData])
      .select()
      .single()

    return { data: data || undefined, error: error?.message }
  }

  // 更新客戶
  static async updateCustomer(id: string, customerData: Partial<CustomerFormData>): Promise<ApiResponse<CustomerPersonalData>> {
    const { data, error } = await supabase
      .from('customer_personal_data')
      .update(customerData)
      .eq('id', id)
      .select()
      .single()

    return { data: data || undefined, error: error?.message }
  }

  // 刪除客戶
  static async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('customer_personal_data')
      .delete()
      .eq('id', id)

    return { error: error?.message }
  }
}

// ========================================================================
// 護理人員管理服務 (Care Staff Management)
// ========================================================================

export class CareStaffService {
  // 獲取所有護理人員
  static async getStaff(
    filters?: StaffFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<CareStaffProfile>> {
    let query = supabase
      .from('care_staff_profiles')
      .select('*', { count: 'exact' })

    // 應用篩選條件
    if (filters?.gender) {
      query = query.eq('gender', filters.gender)
    }
    if (filters?.preferred_area) {
      query = query.eq('preferred_area', filters.preferred_area)
    }
    if (filters?.contract_status) {
      query = query.eq('contract_status', filters.contract_status)
    }
    if (filters?.job_position) {
      query = query.contains('job_position', [filters.job_position])
    }
    if (filters?.search) {
      query = query.or(`name_chinese.ilike.%${filters.search}%,name_english.ilike.%${filters.search}%,staff_id.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    // 分頁
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // 排序
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  // 根據 ID 獲取護理人員
  static async getStaffById(id: string): Promise<ApiResponse<CareStaffProfile>> {
    const { data, error } = await supabase
      .from('care_staff_profiles')
      .select('*')
      .eq('id', id)
      .single()

    return { data: data || undefined, error: error?.message }
  }

  // 新增護理人員
  static async createStaff(staffData: CareStaffFormData): Promise<ApiResponse<CareStaffProfile>> {
    const { data, error } = await supabase
      .from('care_staff_profiles')
      .insert([staffData])
      .select()
      .single()

    return { data: data || undefined, error: error?.message }
  }

  // 更新護理人員
  static async updateStaff(id: string, staffData: Partial<CareStaffFormData>): Promise<ApiResponse<CareStaffProfile>> {
    const { data, error } = await supabase
      .from('care_staff_profiles')
      .update(staffData)
      .eq('id', id)
      .select()
      .single()

    return { data: data || undefined, error: error?.message }
  }

  // 刪除護理人員
  static async deleteStaff(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('care_staff_profiles')
      .delete()
      .eq('id', id)

    return { error: error?.message }
  }
}

// ========================================================================
// 服務管理服務 (Service Management)
// ========================================================================

export class ServiceManagementService {
  // 獲取所有服務記錄
  static async getServices(
    filters?: ServiceFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<BillingSalaryData>> {
    let query = supabase
      .from('billing_salary_data')
      .select('*', { count: 'exact' })

    // 應用篩選條件
    if (filters?.service_type) {
      query = query.eq('service_type', filters.service_type)
    }
    if (filters?.project_category) {
      query = query.eq('project_category', filters.project_category)
    }
    if (filters?.project_manager) {
      query = query.eq('project_manager', filters.project_manager)
    }
    if (filters?.date_from) {
      query = query.gte('service_date', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('service_date', filters.date_to)
    }
    if (filters?.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,care_staff_name.ilike.%${filters.search}%,customer_id.ilike.%${filters.search}%`)
    }

    // 分頁
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // 排序
    query = query.order('service_date', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  // 根據 ID 獲取服務記錄
  static async getServiceById(id: string): Promise<ApiResponse<BillingSalaryData>> {
    const { data, error } = await supabase
      .from('billing_salary_data')
      .select('*')
      .eq('id', id)
      .single()

    return { data: data || undefined, error: error?.message }
  }

  // 新增服務記錄
  static async createService(serviceData: ServiceFormData): Promise<ApiResponse<BillingSalaryData>> {
    const { data, error } = await supabase
      .from('billing_salary_data')
      .insert([serviceData])
      .select()
      .single()

    return { data: data || undefined, error: error?.message }
  }

  // 更新服務記錄
  static async updateService(id: string, serviceData: Partial<ServiceFormData>): Promise<ApiResponse<BillingSalaryData>> {
    const { data, error } = await supabase
      .from('billing_salary_data')
      .update(serviceData)
      .eq('id', id)
      .select()
      .single()

    return { data: data || undefined, error: error?.message }
  }

  // 刪除服務記錄
  static async deleteService(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('billing_salary_data')
      .delete()
      .eq('id', id)

    return { error: error?.message }
  }
}

// ========================================================================
// 選項服務 (Options Service)
// ========================================================================

export class OptionsService {
  // 獲取職位選項
  static async getJobPositionOptions(): Promise<ApiResponse<JobPositionOption[]>> {
    const { data, error } = await supabase
      .from('job_position_options')
      .select('*')
      .order('id')

    return { data: data || [], error: error?.message }
  }

  // 獲取語言選項
  static async getLanguageOptions(): Promise<ApiResponse<LanguageOption[]>> {
    const { data, error } = await supabase
      .from('language_options')
      .select('*')
      .order('id')

    return { data: data || [], error: error?.message }
  }
}

// ========================================================================
// 統計服務 (Statistics Service)
// ========================================================================

export class StatisticsService {
  // 獲取儀表板統計
  static async getDashboardStats() {
    try {
      // 使用本地日期格式避免時區問題
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      
      const [customersCount, staffCount, servicesCount, monthlyRevenue] = await Promise.all([
        supabase.from('customer_personal_data').select('*', { count: 'exact', head: true }),
        supabase.from('care_staff_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('billing_salary_data').select('*', { count: 'exact', head: true }),
        supabase
          .from('billing_salary_data')
          .select('service_fee')
          .gte('service_date', startOfMonth)
      ])

      const totalRevenue = monthlyRevenue.data?.reduce((sum: number, record: any) => sum + (record.service_fee || 0), 0) || 0

      return {
        totalCustomers: customersCount.count || 0,
        totalStaff: staffCount.count || 0,
        totalServices: servicesCount.count || 0,
        monthlyRevenue: totalRevenue,
        activeServices: 0 // 可以根據需要計算活躍服務數
      }
    } catch (error) {
      console.error('獲取統計數據失敗:', error)
      return {
        totalCustomers: 0,
        totalStaff: 0,
        totalServices: 0,
        monthlyRevenue: 0,
        activeServices: 0
      }
    }
  }

  // 獲取工資統計
  static async getPayrollStats(month?: string) {
    try {
      let query = supabase
        .from('billing_salary_data')
        .select('staff_salary, service_hours, hourly_salary, care_staff_name')

      if (month) {
        const [year, monthNum] = month.split('-')
        const startDate = `${year}-${monthNum}-01`
        const endDate = `${year}-${monthNum}-31`
        query = query.gte('service_date', startDate).lte('service_date', endDate)
      }

      const { data, error } = await query

      if (error) throw error

      const totalSalary = data?.reduce((sum: number, record: any) => sum + (record.staff_salary || 0), 0) || 0
      const totalHours = data?.reduce((sum: number, record: any) => sum + (record.service_hours || 0), 0) || 0
      const uniqueStaff = new Set(data?.map((record: any) => record.care_staff_name).filter(Boolean)).size

      return {
        totalSalary,
        staffCount: uniqueStaff,
        averageHourlyRate: totalHours > 0 ? totalSalary / totalHours : 0,
        totalHours
      }
    } catch (error) {
      console.error('獲取工資統計失敗:', error)
      return {
        totalSalary: 0,
        staffCount: 0,
        averageHourlyRate: 0,
        totalHours: 0
      }
    }
  }
}
