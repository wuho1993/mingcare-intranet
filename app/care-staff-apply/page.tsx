'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { ResponsiveLogo } from '../../components/Logo'
import LastUpdateIndicator from '../../components/LastUpdateIndicator'

export default function CareStaffApply() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    notes: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('care_staff')
        .insert([{
          ...formData,
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          status: 'pending', // 申請狀態：pending, approved, rejected
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('新增護理人員錯誤:', error)
        alert('新增失敗：' + error.message)
        return
      }

      alert('護理人員申請已提交！')
      // Set last update time for notification
      setLastUpdateTime(new Date())
      // Navigate after a brief delay to show notification
      setTimeout(() => {
        router.push('/care-staff')
      }, 1500)
    } catch (error) {
      console.error('提交錯誤:', error)
      alert('提交失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <div className="card-apple border-b border-border-light rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex items-center space-x-4">
              <ResponsiveLogo />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-text-primary">護理人員申請</h1>
                  <LastUpdateIndicator lastUpdateTime={lastUpdateTime} />
                </div>
                <p className="text-sm text-text-secondary">新增護理人員資料</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="btn-apple-secondary"
            >
              ← 返回
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="card-apple fade-in-apple">
          <form onSubmit={handleSubmit} className="card-apple-content space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本資料 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                  姓名 <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input-apple w-full"
                  placeholder="請輸入姓名"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                  電子郵件
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input-apple w-full"
                  placeholder="請輸入電子郵件"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                  聯絡電話 <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input-apple w-full"
                  placeholder="請輸入聯絡電話"
                />
              </div>

              <div>
                <label htmlFor="experience_years" className="block text-sm font-medium text-text-primary mb-2">
                  工作經驗（年）
                </label>
                <input
                  type="number"
                  id="experience_years"
                  name="experience_years"
                  min="0"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  className="form-input-apple w-full"
                  placeholder="請輸入工作年資"
                />
              </div>
            </div>

            {/* 地址 */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-2">
                地址
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input-apple w-full"
                placeholder="請輸入地址"
              />
            </div>

            {/* 緊急聯絡人 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-text-primary mb-2">
                  緊急聯絡人姓名
                </label>
                <input
                  type="text"
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  className="form-input-apple w-full"
                  placeholder="請輸入緊急聯絡人姓名"
                />
              </div>

              <div>
                <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-text-primary mb-2">
                  緊急聯絡人電話
                </label>
                <input
                  type="tel"
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  className="form-input-apple w-full"
                  placeholder="請輸入緊急聯絡人電話"
                />
              </div>
            </div>

            {/* 專業資料 */}
            <div>
              <label htmlFor="qualifications" className="block text-sm font-medium text-text-primary mb-2">
                專業資格
              </label>
              <textarea
                id="qualifications"
                name="qualifications"
                rows={3}
                value={formData.qualifications}
                onChange={handleInputChange}
                className="form-input-apple w-full"
                placeholder="請輸入專業資格（如：護理師執照、照顧服務員證照等）"
              />
            </div>

            <div>
              <label htmlFor="specialties" className="block text-sm font-medium text-text-primary mb-2">
                專長領域
              </label>
              <textarea
                id="specialties"
                name="specialties"
                rows={3}
                value={formData.specialties}
                onChange={handleInputChange}
                className="form-input-apple w-full"
                placeholder="請輸入專長領域（如：長期照護、復健護理、傷口護理等）"
              />
            </div>

            <div>
              <label htmlFor="availability" className="block text-sm font-medium text-text-primary mb-2">
                可工作時間
              </label>
              <textarea
                id="availability"
                name="availability"
                rows={2}
                value={formData.availability}
                onChange={handleInputChange}
                className="form-input-apple w-full"
                placeholder="請輸入可工作的時間（如：週一至週五 9:00-17:00）"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-text-primary mb-2">
                備註
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                className="form-input-apple w-full"
                placeholder="其他需要說明的事項"
              />
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-apple-secondary"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-apple-primary"
                disabled={loading}
              >
                {loading ? '提交中...' : '提交申請'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}