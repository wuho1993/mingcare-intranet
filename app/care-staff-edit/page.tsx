'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { ResponsiveLogo } from '../../components/Logo'
import LastUpdateIndicator from '../../components/LastUpdateIndicator'

interface CareStaffMember {
  id: number
  name: string
  email: string | null
  phone: string
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  qualifications: string | null
  experience_years: number | null
  specialties: string | null
  availability: string | null
  notes: string | null
  status: string
}

export default function CareStaffEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const staffId = searchParams.get('id')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [staffMember, setStaffMember] = useState<CareStaffMember | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    qualifications: '',
    experience_years: '',
    specialties: '',
    availability: '',
    notes: '',
    status: 'active'
  })

  useEffect(() => {
    if (staffId) {
      fetchStaffMember()
    } else {
      setLoading(false)
    }
  }, [staffId])

  const fetchStaffMember = async () => {
    if (!staffId) return
    
    try {
      const { data, error } = await supabase
        .from('care_staff')
        .select('*')
        .eq('id', staffId)
        .single()

      if (error) {
        console.error('Error fetching staff member:', error)
        alert('載入護理員資料時發生錯誤')
        return
      }

      if (data) {
        setStaffMember(data)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          qualifications: data.qualifications || '',
          experience_years: data.experience_years?.toString() || '',
          specialties: data.specialties || '',
          availability: data.availability || '',
          notes: data.notes || '',
          status: data.status || 'active'
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('載入護理員資料時發生未預期的錯誤')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId) return
    
    setSaving(true)

    try {
      const { error } = await supabase
        .from('care_staff')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone,
          address: formData.address || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          qualifications: formData.qualifications || null,
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          specialties: formData.specialties || null,
          availability: formData.availability || null,
          notes: formData.notes || null,
          status: formData.status
        })
        .eq('id', staffId)

      if (error) {
        console.error('Error updating staff member:', error)
        alert('更新護理員資料時發生錯誤')
        return
      }

      alert('護理員資料更新成功！')
      setLastUpdateTime(new Date())
      
      // 通知護理人員列表頁面更新時間 - 使用新的持久化格式
      const updateTime = new Date()
      const updateTimeStr = updateTime.toISOString()
      
      // 設置具體護理人員的更新時間（持久化30分鐘）
      localStorage.setItem(`staff_update_${staffId}`, updateTimeStr)
      
      // 保留舊格式以兼容現有邏輯
      localStorage.setItem('staffUpdated', JSON.stringify({
        staffId: staffId,
        updateTime: updateTimeStr
      }))
      
      // 觸發自定義事件
      window.dispatchEvent(new CustomEvent('staffUpdated', {
        detail: { staffId: staffId }
      }))
      
      router.back()
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('更新護理員資料時發生未預期的錯誤')
    } finally {
      setSaving(false)
    }
  }

  if (!staffId) {
    return (
      <div className="min-h-screen bg-apple-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-primary text-lg mb-4">缺少護理員ID參數</p>
          <button 
            onClick={() => router.back()}
            className="btn-apple-primary"
          >
            返回護理員列表
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mb-4"></div>
          <p className="text-text-secondary">載入護理員資料中...</p>
        </div>
      </div>
    )
  }

  if (!staffMember) {
    return (
      <div className="min-h-screen bg-apple-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-primary text-lg mb-4">找不到護理員資料</p>
          <button 
            onClick={() => router.back()}
            className="btn-apple-primary"
          >
            返回護理員列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-apple-background">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-apple-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <ResponsiveLogo />
              <div className="hidden sm:block h-6 w-px bg-apple-border"></div>
              <h1 className="hidden sm:block text-lg font-medium text-text-primary">編輯護理員</h1>
              <LastUpdateIndicator lastUpdateTime={lastUpdateTime} />
            </div>
            <button
              onClick={() => router.back()}
              className="btn-apple-secondary text-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回護理員列表
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-apple-border shadow-sm">
          <div className="border-b border-apple-border p-6">
            <h2 className="text-xl font-semibold text-text-primary">編輯護理員資料</h2>
            <p className="text-sm text-text-secondary mt-1">更新護理員的基本資料和專業資訊</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 基本資料 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary border-b border-apple-border pb-2">基本資料</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input-apple"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    電話 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="input-apple"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    電子郵件
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input-apple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    狀態 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="input-apple"
                    required
                  >
                    <option value="active">在職</option>
                    <option value="inactive">停職</option>
                    <option value="resigned">離職</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  地址
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                  className="input-apple resize-none"
                />
              </div>
            </div>

            {/* 緊急聯絡人 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary border-b border-apple-border pb-2">緊急聯絡人</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    緊急聯絡人姓名
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="input-apple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    緊急聯絡人電話
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    className="input-apple"
                  />
                </div>
              </div>
            </div>

            {/* 專業資料 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary border-b border-apple-border pb-2">專業資料</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    工作經驗（年）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => handleInputChange('experience_years', e.target.value)}
                    className="input-apple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    專長領域
                  </label>
                  <input
                    type="text"
                    value={formData.specialties}
                    onChange={(e) => handleInputChange('specialties', e.target.value)}
                    className="input-apple"
                    placeholder="例：長照、居家護理、復健"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  專業資格
                </label>
                <textarea
                  value={formData.qualifications}
                  onChange={(e) => handleInputChange('qualifications', e.target.value)}
                  rows={3}
                  className="input-apple resize-none"
                  placeholder="請列出相關證照、資格等..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  可工作時間
                </label>
                <textarea
                  value={formData.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                  rows={2}
                  className="input-apple resize-none"
                  placeholder="例：週一至週五 9:00-17:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  備註
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="input-apple resize-none"
                  placeholder="其他相關資訊..."
                />
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-apple-border">
              <button
                type="submit"
                disabled={saving}
                className="btn-apple-primary flex-1 sm:flex-none"
              >
                {saving ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    更新中...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    儲存更新
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-apple-secondary flex-1 sm:flex-none"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}