'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import BackToHomeButton from '../../components/BackToHomeButton'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  BillingSalaryRecord,
  BillingSalaryFilters,
  BusinessKPI,
  ProjectCategorySummary,
  ServiceType,
  ProjectCategory,
  ProjectManager,
  BillingSalaryFormData
} from '../../types/billing-salary'
import {
  SERVICE_TYPE_OPTIONS,
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_MANAGER_OPTIONS
} from '../../types/billing-salary'
import {
  getBusinessKPI,
  getProjectCategorySummary,
  submitBillingSalaryRecord,
  validateBillingSalaryRecord,
  exportToCSV,
  searchCustomers,
  searchCareStaff
} from '../../services/billing-salary-management'

const localizer = momentLocalizer(moment)

// Supabase 客戶端配置
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 日曆組件
function ScheduleTab() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([]) // 多日期選擇
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false) // 多選模式
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Step 1: 處理日期選擇
  const handleSelectSlot = ({ start }: { start: Date }) => {
    const dateStr = moment(start).format('YYYY-MM-DD')
    
    if (isMultiSelectMode) {
      // 多選模式
      setSelectedDates(prev => 
        prev.includes(dateStr) 
          ? prev.filter(d => d !== dateStr)
          : [...prev, dateStr]
      )
    } else {
      // 單選模式
      setSelectedDate(dateStr)
      setSelectedDates([dateStr])
    }
  }

  // Step 1: 確認建立排班
  const handleConfirmSchedule = () => {
    if (selectedDates.length > 0) {
      setShowAddModal(true)
    }
  }

  // 切換多選模式
  const toggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    setSelectedDates([])
    setSelectedDate(null)
  }

  // 清空選擇
  const clearSelection = () => {
    setSelectedDates([])
    setSelectedDate(null)
  }

  // 模擬提交處理
  const handleSubmitSchedule = async (formData: BillingSalaryFormData) => {
    setFormSubmitting(true)
    try {
      console.log('提交排班資料:', { formData, selectedDates })
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('排班已成功建立！')
      setShowAddModal(false)
      setSelectedDates([])
      setSelectedDate(null)
    } catch (error) {
      console.error('提交失敗:', error)
      alert('提交失敗，請重試')
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-bg-primary rounded-lg p-6 shadow-sm border border-border-light">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-text-primary">📅 月曆排班</h3>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMultiSelect}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                isMultiSelectMode
                  ? 'bg-mingcare-blue text-white border-mingcare-blue'
                  : 'bg-white text-text-primary border-border-light hover:border-mingcare-blue'
              }`}
            >
              {isMultiSelectMode ? '🔢 多日選擇' : '📅 單日選擇'}
            </button>
            
            {selectedDates.length > 0 && (
              <>
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-bg-secondary transition-all duration-200"
                >
                  清空
                </button>
                <button
                  onClick={handleConfirmSchedule}
                  className="px-4 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200"
                >
                  確認建立排班 ({selectedDates.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* 選擇狀態顯示 */}
        {selectedDates.length > 0 && (
          <div className="mb-4 p-3 bg-mingcare-blue bg-opacity-10 rounded-lg border border-mingcare-blue border-opacity-30">
            <div className="text-sm text-mingcare-blue">
              <strong>已選擇 {selectedDates.length} 個日期：</strong>
              <div className="mt-1 flex flex-wrap gap-2">
                {selectedDates.sort().map(date => (
                  <span 
                    key={date} 
                    className="inline-block bg-mingcare-blue text-white px-2 py-1 rounded text-xs"
                  >
                    {date}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 日曆 */}
        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={[]}
            startAccessor="start"
            endAccessor="end"
            onSelectSlot={handleSelectSlot}
            selectable
            views={['month']}
            defaultView="month"
            step={60}
            showMultiDayTimes
            date={currentDate}
            onNavigate={setCurrentDate}
          />
        </div>
      </div>

      {/* 排班表單 Modal */}
      {showAddModal && (
        <ScheduleFormModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setSelectedDate(null)
            setSelectedDates([])
            setIsMultiSelectMode(false)
          }}
          selectedDate={selectedDate}
          selectedDates={selectedDates}
          onSubmit={handleSubmitSchedule}
          submitting={formSubmitting}
        />
      )}
    </div>
  )
}

// 簡化的排班表單 Modal
interface ScheduleFormModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string | null
  selectedDates: string[]
  onSubmit: (formData: BillingSalaryFormData) => Promise<void>
  submitting: boolean
}

function ScheduleFormModal({ isOpen, onClose, selectedDates, onSubmit, submitting }: ScheduleFormModalProps) {
  const [formData, setFormData] = useState<BillingSalaryFormData>({
    service_date: '',
    customer_id: '',
    customer_name: '',
    phone: '',
    service_address: '',
    start_time: '',
    end_time: '',
    service_hours: 0,
    care_staff_name: '',
    service_fee: 0,
    staff_salary: 0,
    hourly_rate: 0,
    hourly_salary: 0,
    service_type: '' as ServiceType,
    project_category: '' as ProjectCategory,
    project_manager: '' as ProjectManager
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">建立排班</h3>
          <p className="text-sm text-gray-600 mt-1">
            將為 {selectedDates.length} 個日期建立排班：{selectedDates.join(', ')}
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">客戶姓名 *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">護理人員 *</label>
                <input
                  type="text"
                  value={formData.care_staff_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, care_staff_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">開始時間 *</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">結束時間 *</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">服務費用 *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.service_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_fee: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">員工薪資 *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.staff_salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, staff_salary: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={submitting}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '提交中...' : '確認提交'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'reports'>('reports')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">請先登入</h2>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            前往登入頁面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-primary">護理服務管理</h1>
          <BackToHomeButton />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border-light">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'reports', label: '詳細報表', icon: '📊' },
                { id: 'schedule', label: '月曆排班', icon: '📅' },
                { id: 'overview', label: '概覽統計', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-mingcare-blue text-mingcare-blue'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-light'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'schedule' && <ScheduleTab />}
          {activeTab === 'reports' && <div>詳細報表功能開發中...</div>}
          {activeTab === 'overview' && <div>概覽統計功能開發中...</div>}
        </div>
      </div>
    </div>
  )
}
