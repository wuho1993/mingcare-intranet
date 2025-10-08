'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { CustomerManagementService } from '../../../../services/customer-management'
import LastUpdateIndicator from '../../../../components/LastUpdateIndicator'
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

export default function EditClientPage() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('id')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)

  // 客戶編號管理
  const [originalCustomerId, setOriginalCustomerId] = useState<string>('')
  const [generatedCustomerId, setGeneratedCustomerId] = useState<string>('')
  const [useNewCustomerId, setUseNewCustomerId] = useState(false)
  const [showCustomerIdChoice, setShowCustomerIdChoice] = useState(false)
  const [hasUserModifiedFields, setHasUserModifiedFields] = useState(false)

  const [formData, setFormData] = useState<CustomerFormData>({
    customer_type: '社區券客戶',
    customer_name: '',
    service_address: '',
    charity_support: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [gettingLocation, setGettingLocation] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      setUser(user)

      // Load client data if ID is provided
      if (clientId) {
        await loadClientData(clientId)
      }

      setLoading(false)
    }

    checkUser()
  }, [router, clientId])

  // 載入客戶資料
  const loadClientData = async (id: string) => {
    try {
      const response = await CustomerManagementService.getCustomerById(id)
      if (response.data) {
        setFormData(response.data as CustomerFormData)
        setOriginalCustomerId(response.data.customer_id || '')
      } else {
        setErrors({ general: response.error || '載入客戶資料失敗' })
      }
    } catch (error: any) {
      console.error('Failed to load customer data:', error)
      setErrors({ general: error.message || '載入客戶資料失敗' })
    }
  }

  // 自動偵測並生成客戶編號
  const autoDetectAndGenerateCustomerId = async () => {
    try {
      // 檢查生成條件
      const shouldGenerate = formData.customer_type === '明家街客' ||
        (formData.customer_type === '社區券客戶' && formData.voucher_application_status === '已經持有')

      if (!shouldGenerate || !formData.introducer) {
        setGeneratedCustomerId('')
        setShowCustomerIdChoice(false)
        return
      }

      // 自動生成客戶編號
      const customerId = await CustomerManagementService.generateNextCustomerId(
        formData.customer_type,
        formData.introducer
      )

      // 檢查編號類型是否與原編號相同
      if (isSameCustomerIdType(originalCustomerId, customerId)) {
        // 相同類型，不顯示選擇界面
        setGeneratedCustomerId('')
        setShowCustomerIdChoice(false)
        console.log('編號類型相同，不提示用戶選擇:', originalCustomerId, '→', customerId)
        return
      }

      setGeneratedCustomerId(customerId)
      setShowCustomerIdChoice(true) // 顯示選擇界面
      setErrors(prev => ({ ...prev, customerIdGeneration: '', general: '' }))
    } catch (error: any) {
      console.error('自動生成客戶編號失敗:', error)
      setErrors(prev => ({ ...prev, customerIdGeneration: error.message || '生成客戶編號失敗' }))
      setGeneratedCustomerId('')
      setShowCustomerIdChoice(false)
    }
  }

  // 判斷兩個客戶編號是否為相同類型
  const isSameCustomerIdType = (originalId: string, newId: string): boolean => {
    if (!originalId || !newId) return false

    // 定義編號類型識別規則
    const getCustomerIdType = (id: string): string => {
      if (id.startsWith('S-CCSV')) return 'steven-community-voucher'
      if (id.startsWith('CCSV-MC')) return 'community-voucher'
      if (id.startsWith('MC') && /^MC\d+$/.test(id)) return 'mingcare-direct'
      return 'unknown'
    }

    const originalType = getCustomerIdType(originalId)
    const newType = getCustomerIdType(newId)

    console.log('編號類型比較:', {
      original: { id: originalId, type: originalType },
      new: { id: newId, type: newType },
      isSame: originalType === newType && originalType !== 'unknown'
    })

    return originalType === newType && originalType !== 'unknown'
  }

  // 僅在用戶修改相關欄位時自動偵測是否可以生成新編號
  useEffect(() => {
    if (hasUserModifiedFields && formData.customer_type && formData.introducer) {
      autoDetectAndGenerateCustomerId()
    }
  }, [formData.customer_type, formData.introducer, formData.voucher_application_status, hasUserModifiedFields])

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

  // 更新表單數據，包含條件邏輯（僅在生成新編號時生效）
  const updateFormData = (field: keyof CustomerFormData, value: any) => {
    // 標記用戶已修改相關欄位（影響客戶編號生成的欄位）
    if (field === 'customer_type' || field === 'introducer' || field === 'voucher_application_status') {
      setHasUserModifiedFields(true)
    }

    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // 自動計算年齡
      if (field === 'dob') {
        updated.age = calculateAge(value)
      }

      // 僅在生成新編號模式下套用條件邏輯
      if (useNewCustomerId) {
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
          } else if (value === '社區券客戶') {
            // 切換到社區券客戶時，重置相關欄位
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

  // 獲取當前位置
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('您的瀏覽器不支持定位功能')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setFormData(prev => ({
          ...prev,
          location_latitude: latitude,
          location_longitude: longitude
        }))
        setGettingLocation(false)
        alert(`定位成功！\n緯度: ${latitude.toFixed(6)}\n經度: ${longitude.toFixed(6)}`)
      },
      (error) => {
        setGettingLocation(false)
        let errorMessage = '無法獲取位置'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '用戶拒絕了定位請求'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用'
            break
          case error.TIMEOUT:
            errorMessage = '定位請求超時'
            break
        }
        alert(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // 表單驗證 (更寬鬆的驗證，僅檢查必要欄位)
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 僅驗證客戶姓名為必填
    if (!formData.customer_name?.trim()) {
      newErrors.customer_name = '請輸入客戶姓名'
    }

    // 其他欄位都允許為空，系統會自動處理

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId) {
      setErrors({ general: '客戶 ID 不存在' })
      return
    }

    // 只做基本驗證
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // 計算年齡 (如果有提供出生日期)
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

      // 準備更新資料，過濾掉空值
      const updateData = Object.fromEntries(
        Object.entries({
          ...formData,
          age: calculatedAge || formData.age,
          customer_id: useNewCustomerId ? generatedCustomerId : originalCustomerId
        }).filter(([key, value]) => value !== '' && value !== null && value !== undefined)
      )

      console.log('Updating customer with data:', updateData)
      
      const response = await CustomerManagementService.updateCustomer(clientId, updateData as any)

      if (response.error) {
        console.error('Update error:', response.error, response.message)
        setErrors({ general: response.error + (response.message ? ': ' + response.message : '') })
      } else {
        console.log('Update successful:', response.data)
        // Show success message and stay on current page
        alert('客戶資料更新成功！')
        // Clear any previous errors
        setErrors({})
        // Set last update time for notification
        setLastUpdateTime(new Date())
        
        // 通知客戶列表頁面更新時間 - 使用新的持久化格式
        const updateTime = new Date()
        const updateTimeStr = updateTime.toISOString()
        
        // 設置具體客戶的更新時間（持久化30分鐘）
        localStorage.setItem(`customer_update_${clientId}`, updateTimeStr)
        
        // 保留舊格式以兼容現有邏輯
        localStorage.setItem('customerUpdated', JSON.stringify({
          customerId: clientId,
          updateTime: updateTimeStr
        }))
        
        // 觸發自定義事件
        window.dispatchEvent(new CustomEvent('customerUpdated', {
          detail: { customerId: clientId }
        }))
        
        // Optionally refresh the form data to show updated values
        // window.location.reload() // Uncomment if you want to reload the page
      }
    } catch (error: any) {
      console.error('Failed to update customer:', error)
      setErrors({ general: '更新客戶資料失敗: ' + (error.message || '未知錯誤') })
    } finally {
      setSubmitting(false)
    }
  }

  // 刪除客戶功能
  const handleDelete = async () => {
    if (!clientId) {
      setErrors({ general: '客戶 ID 不存在' })
      return
    }

    // 確認對話框
    const isConfirmed = window.confirm(
      `確定要刪除客戶「${formData.customer_name}」嗎？\n\n此操作無法復原，將永久刪除所有相關資料。`
    )

    if (!isConfirmed) {
      return
    }

    setSubmitting(true)

    try {
      const response = await CustomerManagementService.deleteCustomer(clientId)

      if (response.error) {
        setErrors({ general: response.error })
      } else {
        // Show success message
        alert('客戶資料刪除成功！將返回客戶列表。')
        // 刪除成功，返回客戶列表 - 保持搜尋狀態
        window.history.back()
      }
    } catch (error: any) {
      console.error('Failed to delete customer:', error)
      setErrors({ general: error.message || '刪除客戶失敗' })
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
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-lg sm:text-xl font-bold text-text-primary mb-1">編輯客戶資料</h1>
                <LastUpdateIndicator lastUpdateTime={lastUpdateTime} />
              </div>
              <p className="text-sm text-text-secondary">更新客戶的基本資料和服務資訊</p>
            </div>
            <button
              onClick={() => window.history.back()}
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
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

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

          {/* 客戶編號管理 */}
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content">
              <h2 className="text-lg sm:text-apple-heading text-text-primary mb-4 sm:mb-6">客戶編號管理</h2>

              <div className="space-y-4">
                {/* 目前編號顯示 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    客戶編號
                  </label>
                  <input
                    type="text"
                    value={useNewCustomerId ? generatedCustomerId : originalCustomerId}
                    readOnly
                    className="form-input-apple bg-bg-secondary w-full"
                    placeholder="載入中..."
                  />
                  {originalCustomerId && !useNewCustomerId && (
                    <p className="text-apple-caption text-text-secondary mt-2">
                      目前使用：{originalCustomerId}
                    </p>
                  )}
                  {useNewCustomerId && generatedCustomerId && (
                    <p className="text-apple-caption text-success mt-2">
                      ✓ 將使用新編號：{generatedCustomerId}
                    </p>
                  )}
                </div>

                {/* 自動偵測到可生成新編號時的選擇界面 */}
                {showCustomerIdChoice && generatedCustomerId && (
                  <div className="bg-bg-tertiary rounded-apple-sm p-4 border border-border-light">
                    <div className="flex items-start space-x-3 mb-4">
                      <svg className="h-5 w-5 text-mingcare-blue mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-apple-body font-medium text-text-primary mb-2">
                          系統偵測到可以生成新的客戶編號
                        </h3>
                        <p className="text-apple-caption text-text-secondary mb-4">
                          根據目前的客戶類型（{formData.customer_type}）和介紹人（{formData.introducer}），
                          系統可以為此客戶生成新的編號：<span className="font-medium text-mingcare-blue">{generatedCustomerId}</span>
                        </p>
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setUseNewCustomerId(false)
                              setShowCustomerIdChoice(false)
                              setHasUserModifiedFields(false) // 重置修改標記
                            }}
                            className="btn-apple-secondary text-sm"
                          >
                            保留原編號（{originalCustomerId}）
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUseNewCustomerId(true)
                              setShowCustomerIdChoice(false)
                              setHasUserModifiedFields(false) // 重置修改標記
                            }}
                            className="btn-apple-primary text-sm"
                          >
                            使用新編號（{generatedCustomerId}）
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 錯誤訊息 */}
                {errors.customerIdGeneration && (
                  <div className="bg-danger-light border border-danger rounded-apple-sm p-3">
                    <p className="text-apple-caption text-danger">
                      {errors.customerIdGeneration}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 基礎資訊 */}
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content">
              <h2 className="text-lg sm:text-apple-heading text-text-primary mb-4 sm:mb-6">基礎資訊</h2>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-6">
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

                {/* 介紹人 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    介紹人 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.introducer || ''}
                    onChange={(e) => updateFormData('introducer', e.target.value as Introducer)}
                    className="form-input-apple"
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
                  {useNewCustomerId && (
                    <p className="text-apple-caption text-text-secondary mt-1">
                      請先選擇介紹人，確定後才會生成客戶編號
                    </p>
                  )}
                </div>
              </div>

              {/* 社區券資訊 - 條件顯示（僅在社區券客戶時） */}
              {formData.customer_type === '社區券客戶' && (
                <div className="mt-6 pt-6 border-t border-border-primary">
                  <h3 className="text-apple-body font-semibold text-text-primary mb-4">社區券資訊</h3>

                  <div className="space-y-4">
                    {/* 申請狀況 */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        申請狀況 {useNewCustomerId && <span className="text-danger">*</span>}
                      </label>
                      <select
                        value={formData.voucher_application_status || ''}
                        onChange={(e) => updateFormData('voucher_application_status', e.target.value as VoucherApplicationStatus)}
                        className={`form-input-apple ${errors.voucher_application_status ? 'border-danger' : ''}`}
                        required={useNewCustomerId}
                      >
                        <option value="">請選擇申請狀況</option>
                        <option value="已經持有">已經持有</option>
                        <option value="申請中">申請中</option>
                      </select>
                      {errors.voucher_application_status && (
                        <p className="text-apple-caption text-danger mt-1">{errors.voucher_application_status}</p>
                      )}
                      {useNewCustomerId && formData.voucher_application_status === '申請中' && (
                        <p className="text-apple-caption text-text-secondary mt-1">
                          申請中狀態不會生成客戶編號
                        </p>
                      )}
                    </div>

                    {/* 當有申請狀況時顯示（編輯模式下始終顯示，生成新編號時條件顯示） */}
                    {(!useNewCustomerId || (formData.voucher_application_status === '申請中' || formData.voucher_application_status === '已經持有')) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* LDS 狀態 */}
                        <div>
                          <label className="block text-apple-caption font-medium text-text-primary mb-2">
                            LDS 狀態 {useNewCustomerId && <span className="text-danger">*</span>}
                          </label>
                          <select
                            value={formData.lds_status || ''}
                            onChange={(e) => updateFormData('lds_status', e.target.value as LdsStatus)}
                            className={`form-input-apple ${errors.lds_status ? 'border-danger' : ''}`}
                            disabled={useNewCustomerId && formData.voucher_application_status === '已經持有'}
                            required={useNewCustomerId}
                          >
                            <option value="">請選擇 LDS 狀態</option>
                            <option value="已完成評估">已完成評估</option>
                            <option value="已經持有">已經持有</option>
                            <option value="待社工評估">待社工評估</option>
                          </select>
                          {useNewCustomerId && formData.voucher_application_status === '已經持有' && (
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
                          <label className="block text-apple-caption font-medium text-text-primary mb-2">
                            家訪狀況 {useNewCustomerId && <span className="text-danger">*</span>}
                          </label>
                          <select
                            value={formData.home_visit_status || ''}
                            onChange={(e) => updateFormData('home_visit_status', e.target.value as HomeVisitStatus)}
                            className={`form-input-apple ${errors.home_visit_status ? 'border-danger' : ''}`}
                            required={useNewCustomerId}
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

                    {/* 當申請狀況為「已經持有」時顯示額外欄位（編輯模式下始終顯示，生成新編號時條件顯示） */}
                    {(!useNewCustomerId || formData.voucher_application_status === '已經持有') && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 社區券號碼 */}
                          <div>
                            <label className="block text-apple-caption font-medium text-text-primary mb-2">
                              社區券號碼 {useNewCustomerId && <span className="text-danger">*</span>}
                            </label>
                            <input
                              type="text"
                              value={formData.voucher_number || ''}
                              onChange={(e) => updateFormData('voucher_number', e.target.value)}
                              className={`form-input-apple ${errors.voucher_number ? 'border-danger' : ''}`}
                              placeholder="請輸入社區券號碼"
                              required={useNewCustomerId}
                            />
                            {errors.voucher_number && (
                              <p className="text-apple-caption text-danger mt-1">{errors.voucher_number}</p>
                            )}
                          </div>

                          {/* 自付額等級 */}
                          <div>
                            <label className="block text-apple-caption font-medium text-text-primary mb-2">
                              自付額 {useNewCustomerId && <span className="text-danger">*</span>}
                            </label>
                            <select
                              value={formData.copay_level || ''}
                              onChange={(e) => updateFormData('copay_level', e.target.value as CopayLevel)}
                              className={`form-input-apple ${errors.copay_level ? 'border-danger' : ''}`}
                              required={useNewCustomerId}
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

                        {/* 慈善補助 - 僅在自付額為5%時顯示（編輯模式下始終顯示，生成新編號時條件顯示） */}
                        {(!useNewCustomerId || formData.copay_level === '5%') && (
                          <div>
                            <label className="block text-apple-caption font-medium text-text-primary mb-2">
                              慈善補助 {useNewCustomerId && formData.copay_level === '5%' && <span className="text-danger">*</span>}
                            </label>
                            <div className="flex space-x-4 mt-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="charity_support"
                                  value="true"
                                  checked={formData.charity_support === true}
                                  onChange={(e) => updateFormData('charity_support', e.target.value === 'true')}
                                  className="w-4 h-4 text-mingcare-blue focus:ring-mingcare-blue"
                                />
                                <span className="ml-2 text-apple-caption">是</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="charity_support"
                                  value="false"
                                  checked={formData.charity_support === false}
                                  onChange={(e) => updateFormData('charity_support', e.target.value === 'false')}
                                  className="w-4 h-4 text-mingcare-blue focus:ring-mingcare-blue"
                                />
                                <span className="ml-2 text-apple-caption">否</span>
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
            </div>
          </div>

          {/* 個人資訊 */}
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content">
              <h2 className="text-lg sm:text-apple-heading text-text-primary mb-4 sm:mb-6">個人資訊</h2>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-6">
                {/* 客戶姓名 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    客戶姓名 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name || ''}
                    onChange={(e) => updateFormData('customer_name', e.target.value)}
                    className={`form-input-apple ${errors.customer_name ? 'border-danger' : ''}`}
                    placeholder="請輸入客戶姓名"
                    required
                  />
                  {errors.customer_name && (
                    <p className="text-apple-caption text-danger mt-1">{errors.customer_name}</p>
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
                    className="form-input-apple"
                    placeholder="請輸入電話號碼"
                  />
                </div>

                {/* 服務地址 */}
                <div className="md:col-span-2">
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    服務地址 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.service_address || ''}
                    onChange={(e) => updateFormData('service_address', e.target.value)}
                    className={`form-input-apple ${errors.service_address ? 'border-danger' : ''}`}
                    placeholder="請輸入完整服務地址"
                    required
                  />
                  {errors.service_address && (
                    <p className="text-apple-caption text-danger mt-1">{errors.service_address}</p>
                  )}
                  
                  {/* 定位功能 */}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="btn-secondary-apple flex items-center gap-2 text-sm"
                    >
                      {gettingLocation ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          定位中...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          獲取當前位置
                        </>
                      )}
                    </button>
                    {formData.location_latitude && formData.location_longitude && (
                      <span className="text-sm text-text-secondary">
                        📍 已定位 ({formData.location_latitude.toFixed(6)}, {formData.location_longitude.toFixed(6)})
                      </span>
                    )}
                  </div>
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

                {/* 身份證號碼 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    身份證號碼
                  </label>
                  <input
                    type="text"
                    value={formData.hkid || ''}
                    onChange={(e) => updateFormData('hkid', e.target.value)}
                    className="form-input-apple"
                    placeholder="請輸入身份證號碼"
                  />
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

                {/* 年齡（自動計算） */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    年齡
                  </label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    readOnly
                    className="form-input-apple bg-bg-secondary"
                    placeholder="系統自動計算"
                  />
                </div>

                {/* 健康狀況 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    健康狀況
                  </label>
                  <select
                    value={formData.health_status || ''}
                    onChange={(e) => updateFormData('health_status', e.target.value as HealthStatus)}
                    className="form-input-apple"
                  >
                    <option value="">請選擇健康狀況</option>
                    <option value="良好">良好</option>
                    <option value="中風">中風</option>
                    <option value="需協助">需協助</option>
                    <option value="長期病患">長期病患</option>
                    <option value="認知障礙">認知障礙</option>
                  </select>
                </div>

                {/* 負責職員 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    負責職員
                  </label>
                  <select
                    value={formData.staff_owner || ''}
                    onChange={(e) => updateFormData('staff_owner', e.target.value as StaffOwner)}
                    className="form-input-apple"
                  >
                    <option value="">請選擇負責職員</option>
                    <option value="Kanas Leung">Kanas Leung</option>
                    <option value="Joe Cheung">Joe Cheung</option>
                    <option value="Candy Ho">Candy Ho</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
            {/* 左側：刪除按鈕 */}
            <button
              type="button"
              onClick={handleDelete}
              className="btn-apple-danger w-full sm:w-auto order-2 sm:order-1"
            >
              刪除客戶
            </button>

            {/* 右側：取消和保存按鈕 */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-4 order-1 sm:order-2">
              <button
                type="button"
                onClick={() => router.push('/clients')}
                className="btn-apple-secondary w-full sm:w-auto"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-apple-primary w-full sm:w-auto"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    保存中...
                  </div>
                ) : (
                  '保存變更'
                )}
              </button>
            </div>
          </div>
        </form>
        </div>
      </main>
    </div>
  )
}
