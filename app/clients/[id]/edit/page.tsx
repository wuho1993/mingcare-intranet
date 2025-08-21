'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { CustomerManagementService } from '../../../../services/customer-management'
import type { 
  CustomerFormData,
  CustomerType,
  District,
  HealthStatus,
  Introducer,
  VoucherApplicationStatus,
  LdsStatus,
  HomeVisitStatus,
  StaffOwner,
  CopayLevel
} from '../../../../types/database'

interface User {
  id: string
  email?: string
}

export default function EditCustomerPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [originalCustomerId, setOriginalCustomerId] = useState<string>('')
  const [generatedCustomerId, setGeneratedCustomerId] = useState<string>('')
  const [useNewId, setUseNewId] = useState(false)
  const [formData, setFormData] = useState<CustomerFormData>({
    customer_type: '社區券客戶',
    customer_name: '',
    service_address: '',
    charity_support: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const initializePage = async () => {
      // 檢查用戶認證
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)

      // 載入客戶數據
      if (params.id) {
        await loadCustomerData(params.id as string)
      }
      
      setLoading(false)
    }

    initializePage()
  }, [router, params.id])

  // 載入現有客戶數據
  const loadCustomerData = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_personal_data')
        .select('*')
        .eq('customer_id', customerId)
        .single()

      if (error) {
        console.error('載入客戶數據失敗:', error)
        setErrors({ general: '載入客戶數據失敗' })
        return
      }

      if (data) {
        setOriginalCustomerId(data.customer_id)
        setFormData({
          customer_type: data.customer_type || '社區券客戶',
          customer_name: data.customer_name || '',
          service_address: data.service_address || '',
          charity_support: data.charity_support || false,
          phone: data.phone || '',
          hkid: data.hkid || '',
          dob: data.dob || '',
          age: data.age || undefined,
          district: data.district || undefined,
          health_status: data.health_status || undefined,
          introducer: data.introducer || undefined,
          voucher_number: data.voucher_number || '',
          voucher_application_status: data.voucher_application_status || undefined,
          lds_status: data.lds_status || undefined,
          home_visit_status: data.home_visit_status || undefined,
          staff_owner: data.project_manager || undefined,
          copay_level: data.copay_level || undefined
        })
      }
    } catch (error) {
      console.error('載入客戶數據失敗:', error)
      setErrors({ general: '載入客戶數據失敗' })
    }
  }

  // 生成新客戶編號
  const generateNewCustomerId = async () => {
    try {
      const customerId = await CustomerManagementService.generateNextCustomerId(
        formData.customer_type,
        formData.introducer
      )
      setGeneratedCustomerId(customerId)
      setUseNewId(true)
      setErrors(prev => ({ ...prev, general: '' }))
    } catch (error: any) {
      console.error('生成客戶編號失敗:', error)
      setErrors(prev => ({ ...prev, general: error.message || '生成客戶編號失敗，請稍後再試' }))
    }
  }

  // 自動計算年齡
  const calculateAge = (dob: string): number | undefined => {
    if (!dob) return undefined
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? age : undefined
  }

  // 自動設置 LDS 狀況
  const autoSetLdsStatus = (voucherStatus: VoucherApplicationStatus | undefined) => {
    if (voucherStatus === '已經持有') {
      return '已經持有' as LdsStatus
    }
    return undefined
  }

  // 更新表單數據，包含自動邏輯
  const updateFormData = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // 自動計算年齡
      if (field === 'dob') {
        updated.age = calculateAge(value)
      }

      // 處理客戶類型變化
      if (field === 'customer_type') {
        if (value === '明家街客') {
          // 清除所有社區券相關欄位
          updated.voucher_application_status = undefined
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          updated.lds_status = undefined
          updated.home_visit_status = undefined
        }
      }

      // 處理社區券申請狀況變化
      if (field === 'voucher_application_status') {
        updated.lds_status = autoSetLdsStatus(value)
        if (value !== '已經持有') {
          // 清除只有"已經持有"才顯示的欄位
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
        }
      }

      // 處理自付比例等級變化
      if (field === 'copay_level') {
        if (value !== '5%') {
          // 清除慈善支援欄位
          updated.charity_support = undefined
        }
      }

      return updated
    })

    // 清除相關錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 必填基本資料驗證
    if (!formData.customer_name?.trim()) {
      newErrors.customer_name = '請輸入客戶姓名'
    }

    if (!formData.service_address?.trim()) {
      newErrors.service_address = '請輸入服務地址'
    }

    // 格式驗證
    if (formData.phone && !/^[0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = '請輸入8位數字的電話號碼'
    }

    if (formData.hkid && !/^[A-Z]{1,2}[0-9]{6}\([0-9A]\)$/i.test(formData.hkid)) {
      newErrors.hkid = '請輸入有效的香港身份證號碼格式 (例: A123456(7))'
    }

    if (formData.dob && new Date(formData.dob) >= new Date()) {
      newErrors.dob = '出生日期必須是過去的日期'
    }

    // 條件式欄位驗證
    if (formData.customer_type === '社區券客戶') {
      if (!formData.voucher_application_status) {
        newErrors.voucher_application_status = '請選擇社區券申請狀況'
      }

      if (formData.voucher_application_status === '已經持有') {
        if (!formData.voucher_number?.trim()) {
          newErrors.voucher_number = '請輸入社區券號碼'
        }

        if (!formData.copay_level) {
          newErrors.copay_level = '請選擇自付比例等級'
        }

        if (formData.copay_level === '5%' && formData.charity_support === undefined) {
          newErrors.charity_support = '請選擇是否需要慈善機構贊助'
        }
      }

      // 不論是「申請中」還是「已經持有」都需要選擇 LDS 和家訪狀況
      if (formData.voucher_application_status === '申請中' || formData.voucher_application_status === '已經持有') {
        if (!formData.lds_status) {
          newErrors.lds_status = '請選擇LDS狀況'
        }

        if (!formData.home_visit_status) {
          newErrors.home_visit_status = '請選擇家訪狀況'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // 決定使用的客戶編號
      const finalCustomerId = useNewId ? generatedCustomerId : originalCustomerId

      // 計算年齡
      let calculatedAge: number | undefined
      if (formData.dob) {
        const birthDate = new Date(formData.dob)
        const today = new Date()
        calculatedAge = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--
        }
      }

      // 準備更新數據
      const updateData = {
        ...formData,
        customer_id: finalCustomerId,
        age: calculatedAge,
        updated_at: new Date().toISOString()
      }

      // 更新客戶數據
      const { error } = await supabase
        .from('customer_personal_data')
        .update(updateData)
        .eq('customer_id', originalCustomerId)

      if (error) {
        console.error('更新客戶失敗:', error)
        setErrors({ general: '更新客戶失敗，請稍後再試' })
        return
      }

      // 成功後導航到客戶管理頁面
      router.push('/clients')
    } catch (error) {
      console.error('更新客戶失敗:', error)
      setErrors({ general: '更新客戶失敗，請稍後再試' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入客戶數據中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="bg-bg-primary border-b border-border">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-apple-title text-text-primary">編輯客戶</h1>
              <p className="mt-2 text-apple-body text-text-secondary">修改客戶基本資料</p>
            </div>
            <button
              onClick={() => router.push('/clients')}
              className="btn-apple-secondary"
            >
              返回列表
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 錯誤提示 */}
          {errors.general && (
            <div className="alert-apple-error">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-apple-body text-danger">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          {/* 客戶編號管理 */}
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content">
              <h2 className="text-apple-heading text-text-primary mb-6">客戶編號管理</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">原有編號</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={originalCustomerId}
                      disabled
                      className="flex-1 form-input-apple bg-bg-secondary text-text-secondary"
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={!useNewId}
                        onChange={() => setUseNewId(false)}
                        className="text-mingcare-blue focus:ring-mingcare-blue"
                      />
                      <span className="text-apple-body text-text-primary">保留原編號</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">新編號</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={generatedCustomerId}
                      disabled
                      placeholder="點擊「生成新編號」按鈕"
                      className="flex-1 form-input-apple bg-bg-secondary text-text-secondary"
                    />
                    <button
                      type="button"
                      onClick={generateNewCustomerId}
                      className="btn-apple-primary"
                    >
                      生成新編號
                    </button>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={useNewId}
                        onChange={() => setUseNewId(true)}
                        disabled={!generatedCustomerId}
                        className="text-mingcare-blue focus:ring-mingcare-blue"
                      />
                      <span className="text-apple-body text-text-primary">使用新編號</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 基本資料 */}
          <div className="card-apple fade-in-apple" style={{ animationDelay: '0.2s' }}>
            <div className="card-apple-content">
              <h2 className="text-apple-heading text-text-primary mb-6">基本資料</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 客戶類型 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    客戶類型 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => updateFormData('customer_type', e.target.value as CustomerType)}
                    className="form-input-apple"
                    required
                  >
                    <option value="社區券客戶">社區券客戶</option>
                    <option value="明家街客">明家街客</option>
                  </select>
                </div>

                {/* 客戶姓名 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    客戶姓名 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => updateFormData('customer_name', e.target.value)}
                    className={`form-input-apple ${errors.customer_name ? 'border-danger' : ''}`}
                    placeholder="請輸入客戶姓名"
                    required
                  />
                  {errors.customer_name && (
                    <p className="text-apple-caption text-danger mt-2">{errors.customer_name}</p>
                  )}
                </div>

                {/* 服務地址 */}
                <div className="md:col-span-2">
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    服務地址 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.service_address}
                    onChange={(e) => updateFormData('service_address', e.target.value)}
                    className={`form-input-apple ${errors.service_address ? 'border-danger' : ''}`}
                    placeholder="請輸入服務地址"
                    required
                  />
                  {errors.service_address && (
                    <p className="text-apple-caption text-danger mt-2">{errors.service_address}</p>
                  )}
                </div>

                {/* 電話 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    電話
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className={`form-input-apple ${errors.phone ? 'border-danger' : ''}`}
                    placeholder="請輸入電話號碼"
                  />
                  {errors.phone && (
                    <p className="text-apple-caption text-danger mt-2">{errors.phone}</p>
                  )}
                </div>

                {/* 身份證號碼 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    身份證號碼
                  </label>
                  <input
                    type="text"
                    value={formData.hkid || ''}
                    onChange={(e) => updateFormData('hkid', e.target.value.toUpperCase())}
                    className={`form-input-apple ${errors.hkid ? 'border-danger' : ''}`}
                    placeholder="例: A123456(7)"
                  />
                  {errors.hkid && (
                    <p className="text-apple-caption text-danger mt-2">{errors.hkid}</p>
                  )}
                </div>

                {/* 出生日期 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    出生日期
                  </label>
                  <input
                    type="date"
                    value={formData.dob || ''}
                    onChange={(e) => updateFormData('dob', e.target.value)}
                    className="form-input-apple"
                  />
                </div>

                {/* 年齡 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    年齡
                  </label>
                  <input
                    type="text"
                    value={formData.age ? `${formData.age} 歲` : ''}
                    readOnly
                    disabled
                    className="form-input-apple bg-bg-secondary text-text-secondary"
                    placeholder="自動計算"
                  />
                </div>

                {/* 地區 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    地區
                  </label>
                  <select
                    value={formData.district || ''}
                    onChange={(e) => updateFormData('district', e.target.value as District)}
                    className="form-input-apple"
                  >
                    <option value="">請選擇地區</option>
                    <option value="中西區">中西區</option>
                    <option value="九龍城區">九龍城區</option>
                    <option value="元朗區">元朗區</option>
                    <option value="北區">北區</option>
                    <option value="南區">南區</option>
                    <option value="大埔區">大埔區</option>
                    <option value="屯門區">屯門區</option>
                    <option value="東區">東區</option>
                    <option value="沙田區">沙田區</option>
                    <option value="油尖旺區">油尖旺區</option>
                    <option value="深水埗區">深水埗區</option>
                    <option value="灣仔區">灣仔區</option>
                    <option value="荃灣區">荃灣區</option>
                    <option value="葵青區">葵青區</option>
                    <option value="西貢區">西貢區</option>
                    <option value="觀塘區">觀塘區</option>
                    <option value="離島區">離島區</option>
                    <option value="黃大仙區">黃大仙區</option>
                    <option value="未分類（醫院,院舍)">未分類（醫院,院舍)</option>
                  </select>
                </div>

                {/* 介紹人 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    介紹人
                  </label>
                  <select
                    value={formData.introducer || ''}
                    onChange={(e) => updateFormData('introducer', e.target.value as Introducer)}
                    className="form-input-apple"
                  >
                    <option value="">請選擇介紹人</option>
                    <option value="Kanas Leung">Kanas Leung</option>
                    <option value="Joe Cheung">Joe Cheung</option>
                    <option value="Candy Ho">Candy Ho</option>
                    <option value="Steven Kwok">Steven Kwok</option>
                    <option value="Dr.Lee">Dr.Lee</option>
                    <option value="Annie">Annie</option>
                    <option value="Janet">Janet</option>
                    <option value="陸sir">陸sir</option>
                    <option value="吳翹政">吳翹政</option>
                    <option value="余翠英">余翠英</option>
                    <option value="陳小姐MC01">陳小姐MC01</option>
                    <option value="曾先生">曾先生</option>
                  </select>
                </div>

                {/* 項目經理 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    項目經理
                  </label>
                  <select
                    value={formData.staff_owner || ''}
                    onChange={(e) => updateFormData('staff_owner', e.target.value as StaffOwner)}
                    className="form-input-apple"
                  >
                    <option value="">請選擇項目經理</option>
                    <option value="Kanas Leung">Kanas Leung</option>
                    <option value="Joe Cheung">Joe Cheung</option>
                    <option value="Candy Ho">Candy Ho</option>
                  </select>
                </div>

                {/* 身體狀況 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    身體狀況
                  </label>
                  <select
                    value={formData.health_status || ''}
                    onChange={(e) => updateFormData('health_status', e.target.value as HealthStatus)}
                    className="form-input-apple"
                  >
                    <option value="">請選擇身體狀況</option>
                    <option value="良好">良好</option>
                    <option value="中風">中風</option>
                    <option value="需協助">需協助</option>
                    <option value="長期病患">長期病患</option>
                    <option value="認知障礙">認知障礙</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 社區券相關 (條件顯示) */}
          {formData.customer_type === '社區券客戶' && (
            <div className="card-apple fade-in-apple" style={{ animationDelay: '0.5s' }}>
              <div className="card-apple-content">
                <h2 className="text-apple-heading text-text-primary mb-6">社區券資訊</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 社區券申請狀況 */}
                  <div>
                    <label className="block text-apple-body font-medium text-text-primary mb-2">
                      社區券申請狀況 <span className="text-danger">*</span>
                    </label>
                    <select
                      value={formData.voucher_application_status || ''}
                      onChange={(e) => updateFormData('voucher_application_status', e.target.value as VoucherApplicationStatus)}
                      className={`form-input-apple ${errors.voucher_application_status ? 'border-danger' : ''}`}
                    >
                      <option value="">請選擇申請狀況</option>
                      <option value="已經持有">已經持有</option>
                      <option value="申請中">申請中</option>
                    </select>
                    {errors.voucher_application_status && (
                      <p className="text-apple-caption text-danger mt-2">{errors.voucher_application_status}</p>
                    )}
                  </div>

                  {/* 社區券號碼 (持有時顯示) */}
                  {formData.voucher_application_status === '已經持有' && (
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        社區券號碼 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.voucher_number || ''}
                        onChange={(e) => updateFormData('voucher_number', e.target.value)}
                        className={`form-input-apple ${errors.voucher_number ? 'border-danger' : ''}`}
                        placeholder="請輸入社區券號碼"
                      />
                      {errors.voucher_number && (
                        <p className="text-apple-caption text-danger mt-2">{errors.voucher_number}</p>
                      )}
                    </div>
                  )}

                  {/* 自付比例等級 (持有時顯示) */}
                  {formData.voucher_application_status === '已經持有' && (
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        自付比例等級 <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formData.copay_level || ''}
                        onChange={(e) => updateFormData('copay_level', e.target.value as CopayLevel)}
                        className={`form-input-apple ${errors.copay_level ? 'border-danger' : ''}`}
                      >
                        <option value="">請選擇自付比例等級</option>
                        <option value="5%">5%</option>
                        <option value="8%">8%</option>
                        <option value="12%">12%</option>
                        <option value="16%">16%</option>
                        <option value="25%">25%</option>
                        <option value="40%">40%</option>
                      </select>
                      {errors.copay_level && (
                        <p className="text-apple-caption text-danger mt-2">{errors.copay_level}</p>
                      )}
                    </div>
                  )}

                  {/* 慈善機構贊助 (自付比例=5%時顯示) */}
                  {formData.copay_level === '5%' && (
                    <div className="md:col-span-2">
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        是否需要慈善機構贊助 <span className="text-danger">*</span>
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="charity_support"
                            value="true"
                            checked={formData.charity_support === true}
                            onChange={() => updateFormData('charity_support', true)}
                            className="mr-2 text-mingcare-blue focus:ring-mingcare-blue"
                          />
                          <span className="text-apple-body text-text-primary">是</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="charity_support"
                            value="false"
                            checked={formData.charity_support === false}
                            onChange={() => updateFormData('charity_support', false)}
                            className="mr-2 text-mingcare-blue focus:ring-mingcare-blue"
                          />
                          <span className="text-apple-body text-text-primary">否</span>
                        </label>
                      </div>
                      {errors.charity_support && (
                        <p className="text-apple-caption text-danger mt-2">{errors.charity_support}</p>
                      )}
                    </div>
                  )}

                  {/* LDS 號碼狀況 */}
                  <div>
                    <label className="block text-apple-body font-medium text-text-primary mb-2">
                      LDS 號碼狀況
                    </label>
                    <select
                      value={formData.lds_status || ''}
                      onChange={(e) => updateFormData('lds_status', e.target.value as LdsStatus)}
                      className="form-input-apple"
                      disabled={formData.voucher_application_status === '已經持有'}
                    >
                      <option value="">請選擇 LDS 狀況</option>
                      <option value="已完成評估">已完成評估</option>
                      <option value="已經持有">已經持有</option>
                      <option value="待社工評估">待社工評估</option>
                    </select>
                  </div>

                  {/* 家訪狀況 */}
                  <div>
                    <label className="block text-apple-body font-medium text-text-primary mb-2">
                      家訪狀況
                    </label>
                    <select
                      value={formData.home_visit_status || ''}
                      onChange={(e) => updateFormData('home_visit_status', e.target.value as HomeVisitStatus)}
                      className="form-input-apple"
                    >
                      <option value="">請選擇家訪狀況</option>
                      <option value="已完成">已完成</option>
                      <option value="未完成">未完成</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/clients')}
              className="btn-apple-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-apple-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '更新中...' : '更新客戶'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
