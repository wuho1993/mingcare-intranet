'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { CustomerManagementService } from '../../../services/customer-management'
import LastUpdateIndicator from '../../../components/LastUpdateIndicator'
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
} from '../../../types/database'

interface User {
  id: string
  email?: string
}

export default function NewCustomerPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [generatedCustomerId, setGeneratedCustomerId] = useState<string>('')
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)

  // 兩階段表單狀態
  const [formStage, setFormStage] = useState<'initial' | 'expanded'>('initial')

  const [formData, setFormData] = useState<CustomerFormData>({
    customer_type: '社區券客戶',
    customer_name: '',
    service_address: '',
    charity_support: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  // 生成客戶編號 - 使用 Supabase RPC（並發安全）
  const generateCustomerId = async () => {
    try {
      // 僅在符合條件時生成編號 - 家訪客戶不需要編號
      const shouldGenerate = formData.customer_type === '明家街客' ||
        (formData.customer_type === '社區券客戶' && formData.voucher_application_status === '已經持有')

      if (!shouldGenerate) {
        setGeneratedCustomerId('')
        return
      }

      const customerId = await CustomerManagementService.generateNextCustomerId(
        formData.customer_type,
        formData.introducer
      )
      setGeneratedCustomerId(customerId)
      setErrors(prev => ({ ...prev, general: '' }))
    } catch (error: any) {
      console.error('生成客戶編號失敗:', error)
      setErrors(prev => ({ ...prev, general: error.message || '生成客戶編號失敗，請稍後再試' }))
    }
  }

  // 當客戶類型、介紹人或申請狀況改變時重新生成編號
  useEffect(() => {
    if (formData.customer_type && formData.introducer) {
      generateCustomerId()
    }
  }, [formData.customer_type, formData.introducer, formData.voucher_application_status])

  // 檢查是否可以展開第二階段 - 自動展開邏輯
  useEffect(() => {
    const canExpand = formData.customer_type && formData.introducer
    if (canExpand && formStage === 'initial') {
      // 添加短暫延遲，然後自動展開第二階段
      const timer = setTimeout(() => {
        setFormStage('expanded')
      }, 500) // 500ms 延遲，讓用戶看到客戶編號生成

      return () => clearTimeout(timer)
    }
  }, [formData.customer_type, formData.introducer, formStage])

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
        if (value === '明家街客' || value === '家訪客戶') {
          // 清除所有社區券相關欄位
          updated.voucher_application_status = undefined
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          updated.lds_status = undefined
          updated.home_visit_status = undefined
        } else if (value === '社區券客戶') {
          // 切換到社區券客戶時，只保留基本狀態
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
        if (value === '已經持有') {
          // 自動設置 LDS 狀況為「已經持有」
          updated.lds_status = '已經持有'
        } else if (value === '申請中') {
          // 清除只有"已經持有"才顯示的欄位
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          // LDS 狀況可以自由選擇
          updated.lds_status = undefined
        } else {
          // 未選擇申請狀況時清空所有相關欄位
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          updated.lds_status = undefined
          updated.home_visit_status = undefined
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

  // 表單驗證 - 按照完整規格實施
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 必填基本資料驗證
    if (!formData.customer_name?.trim()) {
      newErrors.customer_name = '請輸入客戶姓名'
    }

    if (!formData.service_address?.trim()) {
      newErrors.service_address = '請輸入服務地址'
    }

    // 社區券客戶的條件式驗證
    if (formData.customer_type === '社區券客戶') {
      if (!formData.voucher_application_status) {
        newErrors.voucher_application_status = '請選擇社區券申請狀況'
      }

      // 申請狀況為「已經持有」時的必填驗證
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

      // 有選擇申請狀況時的 LDS 和家訪驗證
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

  // 提交表單 - 按照完整規格實施
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
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

      // 準備提交數據 - 僅包含目前可見且符合條件的欄位
      const submissionData: CustomerFormData = {
        customer_type: formData.customer_type,
        customer_name: formData.customer_name,
        service_address: formData.service_address,
        phone: formData.phone || undefined,
        hkid: formData.hkid || undefined,
        dob: formData.dob || undefined,
        age: calculatedAge || undefined,
        district: formData.district || undefined,
        health_status: formData.health_status || undefined,
        introducer: formData.introducer || undefined,
        staff_owner: formData.staff_owner || undefined,
        charity_support: false // 預設值
      }

      // 僅在社區券客戶且有申請狀況時添加相關欄位
      if (formData.customer_type === '社區券客戶' && formData.voucher_application_status) {
        submissionData.voucher_application_status = formData.voucher_application_status

        // LDS 和家訪狀況在有申請狀況時都可能存在
        if (formData.lds_status) {
          submissionData.lds_status = formData.lds_status
        }
        if (formData.home_visit_status) {
          submissionData.home_visit_status = formData.home_visit_status
        }

        // 僅在「已經持有」時添加這些欄位
        if (formData.voucher_application_status === '已經持有') {
          if (formData.voucher_number) {
            submissionData.voucher_number = formData.voucher_number
          }
          if (formData.copay_level) {
            submissionData.copay_level = formData.copay_level
          }
          // 僅在自付比例為5%時添加慈善支援
          if (formData.copay_level === '5%' && formData.charity_support !== undefined) {
            submissionData.charity_support = formData.charity_support
          }
        }
      }

      // 調用服務層
      const result = await CustomerManagementService.createCustomer(submissionData)

      if (result.success) {
        // Set last update time for notification
        setLastUpdateTime(new Date())
        // Navigate after a brief delay to show notification
        setTimeout(() => {
          router.push('/clients')
        }, 1500)
      } else {
        setErrors({ general: result.error || '新增客戶失敗' })
      }
    } catch (error: any) {
      console.error('新增客戶失敗:', error)
      setErrors({ general: error.message || '新增客戶失敗，請稍後再試' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
          <p className="text-apple-body text-text-secondary mt-4">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-primary min-h-screen" style={{ minHeight: '100vh', height: 'auto' }}>
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="w-full px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-lg sm:text-xl font-bold text-text-primary mb-1">新增客戶</h1>
                <LastUpdateIndicator lastUpdateTime={lastUpdateTime} />
              </div>
              <p className="text-sm text-text-secondary">建立新的客戶資料</p>
            </div>
            <button
              onClick={() => router.push('/clients')}
              className="btn-apple-secondary w-full sm:w-auto text-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回客戶列表
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="w-full py-4 sm:py-6 px-4 sm:px-6 pb-32 sm:pb-20">
        <div className="w-full max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

          {/* 錯誤訊息 */}
          {errors.general && (
            <div className="card-apple border-danger bg-danger-light fade-in-apple">
              <div className="card-apple-content">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-danger mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-apple-body text-danger">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          {/* 第一階段：基礎選擇 */}
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content">
              <h2 className="text-lg sm:text-apple-heading text-text-primary mb-4 sm:mb-6">基礎資訊</h2>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-6">
                {/* 客戶類型 */}
                <div>
                  <label className="block text-sm sm:text-apple-body font-medium text-text-primary mb-2">
                    客戶類型 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => updateFormData('customer_type', e.target.value as CustomerType)}
                    className="form-input-apple text-base min-h-[44px]"
                    required
                  >
                    <option value="社區券客戶">社區券客戶</option>
                    <option value="明家街客">明家街客</option>
                    <option value="家訪客戶">家訪客戶</option>
                  </select>
                </div>

                {/* 介紹人 */}
                <div>
                  <label className="block text-sm sm:text-apple-body font-medium text-text-primary mb-2">
                    介紹人 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.introducer || ''}
                    onChange={(e) => updateFormData('introducer', e.target.value as Introducer)}
                    className="form-input-apple text-base min-h-[44px]"
                    required
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
              </div>

              {/* 社區券資訊 - 在基礎資訊中條件顯示 */}
              {formData.customer_type === '社區券客戶' && (
                <div className="mt-6 pt-6 border-t border-border-primary">
                  <h3 className="text-base sm:text-apple-body font-semibold text-text-primary mb-4">社區券資訊</h3>

                  <div className="space-y-4">
                    {/* 社區券申請狀況 */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        申請狀況 <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formData.voucher_application_status || ''}
                        onChange={(e) => updateFormData('voucher_application_status', e.target.value as VoucherApplicationStatus)}
                        className={`form-input-apple text-base min-h-[44px] ${errors.voucher_application_status ? 'border-danger' : ''}`}
                        required
                      >
                        <option value="">請選擇申請狀況</option>
                        <option value="已經持有">已經持有</option>
                        <option value="申請中">申請中</option>
                      </select>
                      {errors.voucher_application_status && (
                        <p className="text-apple-caption text-danger mt-1">{errors.voucher_application_status}</p>
                      )}
                    </div>

                    {/* 當有申請狀況時顯示 LDS 和家訪狀況 */}
                    {(formData.voucher_application_status === '申請中' || formData.voucher_application_status === '已經持有') && (
                      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4">
                        {/* LDS 狀態 */}
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            LDS 狀態 <span className="text-danger">*</span>
                          </label>
                          <select
                            value={formData.lds_status || ''}
                            onChange={(e) => updateFormData('lds_status', e.target.value as LdsStatus)}
                            className={`form-input-apple text-base min-h-[44px] ${errors.lds_status ? 'border-danger' : ''}`}
                            disabled={formData.voucher_application_status === '已經持有'}
                            required
                          >
                            <option value="">請選擇 LDS 狀態</option>
                            <option value="已完成評估">已完成評估</option>
                            <option value="已經持有">已經持有</option>
                            <option value="待社工評估">待社工評估</option>
                          </select>
                          {formData.voucher_application_status === '已經持有' && (
                            <p className="text-apple-caption text-text-secondary mt-1">
                              已自動設為「已經持有」
                            </p>
                          )}
                          {errors.lds_status && (
                            <p className="text-apple-caption text-danger mt-1">{errors.lds_status}</p>
                          )}
                        </div>

                        {/* 家訪狀況 */}
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            家訪狀況 <span className="text-danger">*</span>
                          </label>
                          <select
                            value={formData.home_visit_status || ''}
                            onChange={(e) => updateFormData('home_visit_status', e.target.value as HomeVisitStatus)}
                            className={`form-input-apple text-base min-h-[44px] ${errors.home_visit_status ? 'border-danger' : ''}`}
                            required
                          >
                            <option value="">請選擇家訪狀況</option>
                            <option value="已完成">已完成</option>
                            <option value="未完成">未完成</option>
                          </select>
                          {errors.home_visit_status && (
                            <p className="text-apple-caption text-danger mt-1">{errors.home_visit_status}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 當申請狀況為「已經持有」時顯示額外欄位 */}
                    {formData.voucher_application_status === '已經持有' && (
                      <div className="space-y-4">
                        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4">
                          {/* 社區券號碼 */}
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              社區券號碼 <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.voucher_number || ''}
                              onChange={(e) => updateFormData('voucher_number', e.target.value)}
                              className={`form-input-apple text-base min-h-[44px] ${errors.voucher_number ? 'border-danger' : ''}`}
                              placeholder="請輸入社區券號碼"
                              required
                            />
                            {errors.voucher_number && (
                              <p className="text-apple-caption text-danger mt-1">{errors.voucher_number}</p>
                            )}
                          </div>

                          {/* 自付額等級 */}
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              自付額 <span className="text-danger">*</span>
                            </label>
                            <select
                              value={formData.copay_level || ''}
                              onChange={(e) => updateFormData('copay_level', e.target.value as CopayLevel)}
                              className={`form-input-apple text-base min-h-[44px] ${errors.copay_level ? 'border-danger' : ''}`}
                              required
                            >
                              <option value="">請選擇自付額</option>
                              <option value="5%">5%</option>
                              <option value="8%">8%</option>
                              <option value="12%">12%</option>
                              <option value="16%">16%</option>
                              <option value="25%">25%</option>
                              <option value="40%">40%</option>
                            </select>
                            {errors.copay_level && (
                              <p className="text-apple-caption text-danger mt-1">{errors.copay_level}</p>
                            )}
                          </div>
                        </div>

                        {/* 慈善補助 - 僅在自付額為5%時顯示 */}
                        {formData.copay_level === '5%' && (
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              慈善補助 <span className="text-danger">*</span>
                            </label>
                            <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0 mt-3">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="charity_support"
                                  value="true"
                                  checked={formData.charity_support === true}
                                  onChange={(e) => updateFormData('charity_support', e.target.value === 'true')}
                                  className="w-5 h-5 text-mingcare-blue focus:ring-mingcare-blue"
                                />
                                <span className="ml-3 text-base">是</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="charity_support"
                                  value="false"
                                  checked={formData.charity_support === false}
                                  onChange={(e) => updateFormData('charity_support', e.target.value === 'false')}
                                  className="w-5 h-5 text-mingcare-blue focus:ring-mingcare-blue"
                                />
                                <span className="ml-3 text-base">否</span>
                              </label>
                            </div>
                            {errors.charity_support && (
                              <p className="text-apple-caption text-danger mt-1">{errors.charity_support}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 客戶編號預覽 */}
              {formData.customer_type && formData.introducer && (
                <div className="mt-6 bg-bg-tertiary rounded-apple-sm p-4 fade-in-apple">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-mingcare-blue rounded-full flex items-center justify-center mr-4">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-apple-caption text-text-secondary">客戶編號</p>
                      <p className="text-apple-heading text-text-primary font-mono">
                        {generatedCustomerId || (
                          formData.customer_type === '家訪客戶'
                            ? '不需要編號'
                            : formData.customer_type === '社區券客戶' && formData.voucher_application_status === '申請中'
                            ? '申請中不生成編號'
                            : '生成中...'
                        )}
                      </p>
                      {formData.customer_type === '社區券客戶' && formData.voucher_application_status === '申請中' && (
                        <p className="text-apple-caption text-text-secondary mt-1">
                          客戶編號將在申請狀況變更為「已經持有」後生成
                        </p>
                      )}
                      {formData.customer_type === '家訪客戶' && (
                        <p className="text-apple-caption text-text-secondary mt-1">
                          家訪客戶無需客戶編號
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 第二階段：詳細表單 (條件顯示 + 滑下動畫) */}
          <div
            className={`overflow-hidden transition-all duration-700 ease-in-out ${
              formStage === 'expanded'
                ? 'max-h-screen opacity-100 transform translate-y-0'
                : 'max-h-0 opacity-0 transform -translate-y-4'
            }`}
          >
            <div className="space-y-6 sm:space-y-8">
              {/* 基本資料 */}
              <div className="card-apple">
                <div className="card-apple-content">
                  <h2 className="text-lg sm:text-apple-heading text-text-primary mb-4 sm:mb-6">基本資料</h2>

                  <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-6">
                    {/* 客戶姓名 */}
                    <div>
                      <label className="block text-sm sm:text-apple-body font-medium text-text-primary mb-2">
                        客戶姓名 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => updateFormData('customer_name', e.target.value)}
                        className={`form-input-apple text-base min-h-[44px] ${errors.customer_name ? 'border-danger' : ''}`}
                        placeholder="請輸入客戶姓名"
                        required
                      />
                      {errors.customer_name && (
                        <p className="text-sm text-danger mt-2">{errors.customer_name}</p>
                      )}
                    </div>

                    {/* 服務地址 */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm sm:text-apple-body font-medium text-text-primary mb-2">
                        服務地址 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.service_address}
                        onChange={(e) => updateFormData('service_address', e.target.value)}
                        className={`form-input-apple text-base min-h-[44px] ${errors.service_address ? 'border-danger' : ''}`}
                        placeholder="請輸入服務地址"
                        required
                      />
                      {errors.service_address && (
                        <p className="text-sm text-danger mt-2">{errors.service_address}</p>
                      )}
                    </div>

                    {/* 電話號碼 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        電話號碼
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
                      <p className="text-apple-caption text-text-secondary mt-1">
                        年齡將根據出生日期自動計算
                      </p>
                    </div>

                    {/* 客戶地區 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        客戶地區
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

              {/* 提交按鈕 */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/clients')}
                  className="btn-apple-secondary w-full sm:w-auto min-h-[44px]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-apple-primary w-full sm:w-auto min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '新增中...' : '新增客戶'}
                </button>
              </div>
            </div>
          </div>
        </form>
        </div>
      </main>
    </div>
  )
}
