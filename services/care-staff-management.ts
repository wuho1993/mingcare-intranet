// 護理人員管理 API 服務層
// 基於實際 Supabase care_staff_profiles 表結構

import { supabase } from '../lib/supabase'
import type { 
  CareStaff,
  CareStaffListItem,
  CareStaffFilters,
  CareStaffFormData,
  CareStaffSearchSuggestion,
  CareStaffListResponse,
  CareStaffDetailResponse,
  CareStaffSuggestionsResponse,
  CareStaffOptionsResponse,
  CareStaffSort,
  CareStaffFileUpload,
  CareStaffFormErrors
} from '../types/care-staff'

export class CareStaffManagementService {
  // ========================================================================
  // 列表查詢（支援搜尋、篩選、排序、分頁）
  // ========================================================================
  
  static async getCareStaff(
    filters: CareStaffFilters = {},
    page = 1,
    pageSize = 20,
    sort?: CareStaffSort
  ): Promise<CareStaffListResponse> {
    try {
      let query = supabase
        .from('care_staff_profiles')
        .select(`
          id,
          staff_id,
          name_chinese,
          phone,
          preferred_area,
          contract_status,
          created_at,
          job_position
        `, { count: 'exact' })

      // 搜尋功能（護理人員姓名、電話、員工編號）
      if (filters.search) {
        const searchTerm = `%${filters.search.trim()}%`
        query = query.or(`name_chinese.ilike.${searchTerm},phone.ilike.${searchTerm},staff_id.ilike.${searchTerm}`)
      }

      // 性別篩選
      if (filters.gender) {
        query = query.eq('gender', filters.gender)
      }

      // 偏好地區篩選
      if (filters.preferred_area) {
        query = query.eq('preferred_area', filters.preferred_area)
      }

      // 合約狀態篩選
      if (filters.contract_status) {
        query = query.eq('contract_status', filters.contract_status)
      }

      // 職位篩選（包含特定職位）
      if (filters.job_position) {
        query = query.contains('job_position', [filters.job_position])
      }

      // 疫苗狀態篩選
      if (filters.covid_vaccine) {
        query = query.eq('covid_vaccine', filters.covid_vaccine)
      }

      // 是否有證書篩選
      if (filters.has_certificate !== undefined) {
        if (filters.has_certificate) {
          query = query.or(`
            certificate_1.not.is.null,
            certificate_2.not.is.null,
            certificate_3.not.is.null,
            certificate_4.not.is.null,
            certificate_5.not.is.null
          `)
        } else {
          // 查詢所有證書欄位都為 null 的記錄
          query = query
            .is('certificate_1', null)
            .is('certificate_2', null)
            .is('certificate_3', null)
            .is('certificate_4', null)
            .is('certificate_5', null)
        }
      }

      // 語言篩選（包含特定語言）
      if (filters.language) {
        query = query.contains('language', [filters.language])
      }

      // 排序
      if (sort) {
        const ascending = sort.direction === 'asc'
        query = query.order(sort.field, { ascending })
      } else {
        // 預設按建立時間倒序
        query = query.order('created_at', { ascending: false })
      }

      // 分頁
      const startIndex = (page - 1) * pageSize
      query = query.range(startIndex, startIndex + pageSize - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('獲取護理人員列表失敗:', error)
        throw new Error(`獲取護理人員列表失敗: ${error.message}`)
      }

      const totalPages = Math.ceil((count || 0) / pageSize)

      return {
        data: data as CareStaffListItem[],
        count: count || 0,
        total_pages: totalPages,
        current_page: page,
        page_size: pageSize
      }
    } catch (error) {
      console.error('獲取護理人員列表失敗:', error)
      throw error
    }
  }

  // ========================================================================
  // 搜尋建議（智能推薦）
  // ========================================================================
  
  static async getCareStaffSuggestions(
    filters: { query: string }
  ): Promise<CareStaffSuggestionsResponse> {
    try {
      const queryTerm = filters.query?.trim()
      
      if (!queryTerm) {
        return { data: [], count: 0 }
      }

      // 根據查詢長度決定搜尋策略
      const queryLength = queryTerm.length
      let shouldSearch = false
      let searchConditions: string[] = []

      // 姓名搜尋：1個字就可以搜尋
      if (queryLength >= 1) {
        const nameSearchTerm = `%${queryTerm}%`
        searchConditions.push(`name_chinese.ilike.${nameSearchTerm}`)
        shouldSearch = true
      }

      // 員工編號搜尋：3個字符才搜尋
      if (queryLength >= 3) {
        const staffIdSearchTerm = `%${queryTerm}%`
        searchConditions.push(`staff_id.ilike.${staffIdSearchTerm}`)
      }

      // 電話搜尋：4個字符才搜尋
      if (queryLength >= 4) {
        const phoneSearchTerm = `%${queryTerm}%`
        searchConditions.push(`phone.ilike.${phoneSearchTerm}`)
      }

      if (!shouldSearch || searchConditions.length === 0) {
        return { data: [], count: 0 }
      }

      const { data, error } = await supabase
        .from('care_staff_profiles')
        .select('id, name_chinese, staff_id, phone')
        .or(searchConditions.join(','))
        .limit(20)
        .order('name_chinese', { ascending: true })

      if (error) {
        console.error('獲取搜尋建議失敗:', error)
        throw new Error(`獲取搜尋建議失敗: ${error.message}`)
      }

      // 判斷匹配類型
      const suggestions: CareStaffSearchSuggestion[] = (data || []).map(item => {
        let match_type: 'name' | 'phone' | 'staff_id' | 'mixed' = 'name'
        
        const query = queryTerm.toLowerCase()
        const nameMatch = item.name_chinese?.toLowerCase().includes(query)
        const phoneMatch = item.phone?.toLowerCase().includes(query)
        const staffIdMatch = item.staff_id?.toLowerCase().includes(query)
        
        const matchCount = [nameMatch, phoneMatch, staffIdMatch].filter(Boolean).length
        
        if (matchCount > 1) {
          match_type = 'mixed'
        } else if (nameMatch) {
          match_type = 'name'
        } else if (phoneMatch) {
          match_type = 'phone'
        } else if (staffIdMatch) {
          match_type = 'staff_id'
        }

        return {
          id: item.id,
          name_chinese: item.name_chinese || '',
          staff_id: item.staff_id,
          phone: item.phone,
          match_type
        }
      })

      return {
        data: suggestions,
        count: suggestions.length
      }
    } catch (error) {
      console.error('獲取搜尋建議失敗:', error)
      throw error
    }
  }

  // ========================================================================
  // 單筆護理人員查詢
  // ========================================================================
  
  static async getCareStaffById(id: string): Promise<CareStaffDetailResponse> {
    try {
      const { data, error } = await supabase
        .from('care_staff_profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: '找不到指定的護理人員' }
        }
        console.error('獲取護理人員詳細資料失敗:', error)
        throw new Error(`獲取護理人員詳細資料失敗: ${error.message}`)
      }

      return { data: data as CareStaff }
    } catch (error) {
      console.error('獲取護理人員詳細資料失敗:', error)
      throw error
    }
  }

  // ========================================================================
  // 新增護理人員
  // ========================================================================
  
  static async createCareStaff(formData: CareStaffFormData): Promise<CareStaffDetailResponse> {
    try {
      // 驗證必填欄位
      const errors = this.validateFormData(formData)
      if (Object.keys(errors).length > 0) {
        throw new Error(`表單驗證失敗: ${Object.values(errors).join(', ')}`)
      }

      const { data, error } = await supabase
        .from('care_staff_profiles')
        .insert([formData])
        .select()
        .single()

      if (error) {
        console.error('新增護理人員失敗:', error)
        throw new Error(`新增護理人員失敗: ${error.message}`)
      }

      return { data: data as CareStaff }
    } catch (error) {
      console.error('新增護理人員失敗:', error)
      throw error
    }
  }

  // ========================================================================
  // 更新護理人員資料
  // ========================================================================
  
  static async updateCareStaff(
    id: string, 
    formData: Partial<CareStaffFormData>
  ): Promise<CareStaffDetailResponse> {
    try {
      // 基本驗證
      if (formData.name_chinese !== undefined && !formData.name_chinese.trim()) {
        throw new Error('護理人員姓名不能為空')
      }
      if (formData.phone !== undefined && !formData.phone.trim()) {
        throw new Error('聯絡電話不能為空')
      }

      const { data, error } = await supabase
        .from('care_staff_profiles')
        .update(formData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('更新護理人員資料失敗:', error)
        throw new Error(`更新護理人員資料失敗: ${error.message}`)
      }

      return { data: data as CareStaff }
    } catch (error) {
      console.error('更新護理人員資料失敗:', error)
      throw error
    }
  }

  // ========================================================================
  // 取得下拉選項（從 options 表）
  // ========================================================================
  
  static async getCareStaffOptions(): Promise<CareStaffOptionsResponse> {
    try {
      // 平行查詢語言和職位選項
      const [languagesResult, jobPositionsResult] = await Promise.all([
        supabase.from('language_options').select('*').order('id'),
        supabase.from('job_position_options').select('*').order('id')
      ])

      if (languagesResult.error) {
        console.error('獲取語言選項失敗:', languagesResult.error)
        throw new Error(`獲取語言選項失敗: ${languagesResult.error.message}`)
      }

      if (jobPositionsResult.error) {
        console.error('獲取職位選項失敗:', jobPositionsResult.error)
        throw new Error(`獲取職位選項失敗: ${jobPositionsResult.error.message}`)
      }

      return {
        languages: languagesResult.data || [],
        job_positions: jobPositionsResult.data || []
      }
    } catch (error) {
      console.error('獲取選項資料失敗:', error)
      throw error
    }
  }

  // ========================================================================
  // 檔案上載（基於員工編號目錄結構）
  // ========================================================================
  
  static async uploadCareStaffFile(
    staffId: string,
    fileUpload: CareStaffFileUpload
  ): Promise<string> {
    try {
      const { field_name, file } = fileUpload
      
      // 建立檔案路徑：care-staff/{staff_id}/{field_name}/{timestamp}_{filename}
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `care-staff/${staffId}/${field_name}/${fileName}`

      // 上載檔案到 Storage
      const { data, error } = await supabase.storage
        .from('care-staff-files')
        .upload(filePath, file)

      if (error) {
        console.error('檔案上載失敗:', error)
        throw new Error(`檔案上載失敗: ${error.message}`)
      }

      // 獲取公開 URL
      const { data: urlData } = supabase.storage
        .from('care-staff-files')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('檔案上載失敗:', error)
      throw error
    }
  }

  // ========================================================================
  // 移除檔案
  // ========================================================================
  
  static async removeCareStaffFile(fileUrl: string): Promise<void> {
    try {
      // 從 URL 提取檔案路徑
      const url = new URL(fileUrl)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === 'care-staff-files')
      if (bucketIndex === -1) {
        throw new Error('無效的檔案 URL')
      }
      
      const filePath = pathParts.slice(bucketIndex + 1).join('/')

      const { error } = await supabase.storage
        .from('care-staff-files')
        .remove([filePath])

      if (error) {
        console.error('刪除檔案失敗:', error)
        throw new Error(`刪除檔案失敗: ${error.message}`)
      }
    } catch (error) {
      console.error('刪除檔案失敗:', error)
      throw error
    }
  }

  // ========================================================================
  // 表單驗證
  // ========================================================================
  
  static validateFormData(formData: CareStaffFormData): CareStaffFormErrors {
    const errors: CareStaffFormErrors = {}

    // 必填欄位驗證
    if (!formData.name_chinese?.trim()) {
      errors.name_chinese = '護理人員姓名為必填欄位'
    } else if (formData.name_chinese.trim().length < 2) {
      errors.name_chinese = '護理人員姓名至少需要2個字元'
    } else if (formData.name_chinese.trim().length > 50) {
      errors.name_chinese = '護理人員姓名不能超過50個字元'
    }

    if (!formData.phone?.trim()) {
      errors.phone = '聯絡電話為必填欄位'
    } else {
      // 香港電話號碼格式驗證
      const phoneRegex = /^[2-9]\d{7}$|^[569]\d{7}$/
      if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
        errors.phone = '請輸入有效的香港電話號碼'
      }
    }

    // 電郵格式驗證
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = '請輸入有效的電郵地址'
      }
    }

    // 香港身份證格式驗證
    if (formData.hkid && formData.hkid.trim()) {
      const hkidRegex = /^[A-Z]{1,2}[0-9]{6}\([0-9A]\)$/
      if (!hkidRegex.test(formData.hkid.trim().toUpperCase())) {
        errors.hkid = '請輸入有效的香港身份證號碼格式 (例：A123456(7))'
      }
    }

    // 年資格式驗證
    if (formData.experience_years && formData.experience_years.trim()) {
      const experienceRegex = /^\d+(\.\d+)?$/
      if (!experienceRegex.test(formData.experience_years.trim())) {
        errors.experience_years = '年資請輸入數字格式 (例：2 或 2.5)'
      }
    }

    return errors
  }

  // ========================================================================
  // 刪除護理人員
  // ========================================================================
  
  static async deleteCareStaff(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('care_staff_profiles')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('刪除護理人員失敗:', error)
        return { 
          success: false, 
          error: `刪除護理人員失敗: ${error.message}` 
        }
      }

      return { success: true }
    } catch (error) {
      console.error('刪除護理人員失敗:', error)
      return { 
        success: false, 
        error: '刪除護理人員時發生錯誤，請稍後再試' 
      }
    }
  }
}
