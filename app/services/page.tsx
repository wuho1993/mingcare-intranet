'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getAssetPath } from '../../utils/asset-path'
import { BackToHomeButton } from '../../components/BackToHomeButton'
import { CareStaffSearchableSelect } from '../../components/CareStaffSearchableSelect'
import LastUpdateIndicator from '../../components/LastUpdateIndicator'
import CardUpdateIndicator from '../../components/CardUpdateIndicator'
import TestUpdateButton from '../../components/TestUpdateButton'
import type {
  BillingSalaryFilters,
  BillingSalaryRecord,
  BillingSalaryFormData,
  DateRangePreset,
  ServiceType,
  ProjectCategory,
  ProjectManager,
  BusinessKPI,
  ProjectCategorySummary
} from '../../types/billing-salary'
import {
  SERVICE_TYPE_OPTIONS,
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_MANAGER_OPTIONS
} from '../../types/billing-salary'
import {
  getBusinessKPI,
  getProjectCategorySummary,
  fetchBillingSalaryRecords,
  createBillingSalaryRecord,
  updateBillingSalaryRecord,
  deleteBillingSalaryRecord,
  createMultipleDayRecords,
  exportToCSV,
  getAllCareStaff,
  CustomerSearchResult,
  fetchVoucherRates,
  calculateVoucherSummary,
  VoucherRate
} from '../../services/billing-salary-management'

// 佣金相關類型定義
interface CommissionRate {
  introducer: string
  first_month_commission: number
  subsequent_month_commission: number
}

interface CustomerCommissionData {
  customer_id: string
  customer_name: string
  introducer: string
  service_month: string
  monthly_hours: number
  monthly_fee: number
  is_qualified: boolean
  month_sequence: number
  commission_amount: number
  first_service_date: string
}

interface MonthlyCommissionSummary {
  totalCommission: number
  totalQualifiedCustomers: number
  totalCustomers: number
  introducerCount: number
}

// 安全的日期格式化函數 - 避免時區問題
const formatDateSafely = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0] // 返回今日日期作為備選
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 詳細記錄列表組件
interface DetailedRecordsListProps {
  filters: BillingSalaryFilters
  onRefresh?: () => void  // 添加刷新回調函數
}

// 排序類型
type SortField = 'service_date' | 'customer_name' | 'customer_id'
type SortDirection = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

// 報表月曆檢視組件
function ReportsCalendarView({
  filters,
  onEdit,
  onDelete,
  refreshTrigger,
  recordUpdateTimes
}: {
  filters: BillingSalaryFilters;
  onEdit: (record: BillingSalaryRecord) => void;
  onDelete: (recordId: string) => void;
  refreshTrigger?: number;
  recordUpdateTimes?: Record<string, Date>;
}) {
  const [calendarData, setCalendarData] = useState<Record<string, BillingSalaryRecord[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)

  // 監聽螢幕尺寸變化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }

    // 初始化
    handleResize()

    // 監聽 resize 事件
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  const [selectedRecord, setSelectedRecord] = useState<BillingSalaryRecord | null>(null)
  const [showRecordMenu, setShowRecordMenu] = useState(false)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  // 載入月曆數據
  useEffect(() => {
    const loadCalendarData = async () => {
      setLoading(true)
      try {
        const response = await fetchBillingSalaryRecords(filters, 1, 1000) // 獲取更多記錄用於月曆顯示

        if (response.success && response.data) {
          // 將記錄按日期分組
          const groupedByDate: Record<string, BillingSalaryRecord[]> = {}
          ;(response.data.data || []).forEach((record: BillingSalaryRecord) => {
            const dateKey = record.service_date
            if (!groupedByDate[dateKey]) {
              groupedByDate[dateKey] = []
            }
            groupedByDate[dateKey].push(record)
          })

          setCalendarData(groupedByDate)
        }
      } catch (error) {
        console.error('載入月曆數據失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCalendarData()
  }, [filters, refreshTrigger])

  // 生成月曆日期
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 從週日開始

    const days = []
    const current = new Date(startDate)

    // 生成6週的日期（42天）
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  // 月份導航
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const calendarDays = generateCalendarDays()
  const currentMonth = currentDate.getMonth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
        <span className="ml-3 text-text-secondary">載入月曆數據中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 月份導航 - 移動端優化 */}
      <div className="flex justify-between items-center px-2 sm:px-0">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 sm:p-3 rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h4 className="text-base sm:text-lg font-medium text-text-primary">
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </h4>

        <button
          onClick={() => navigateMonth('next')}
          className="p-2 sm:p-3 rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 星期標題 - 移動端優化 */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="p-1 sm:p-2 text-center font-medium text-text-secondary bg-bg-secondary rounded text-xs sm:text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* 月曆網格 - 移動端優化 */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {calendarDays && calendarDays.map((date, index) => {
          const dateStr = formatDateSafely(date)
          const isCurrentMonth = date.getMonth() === currentMonth
          const isToday = dateStr === formatDateSafely(new Date())
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          const dayRecords = calendarData[dateStr] || []

          // 根據記錄數量動態調整高度 - 移動端小一些
          const baseHeight = isMobile ? 80 : 120
          const additionalHeight = isMobile ? 50 : 80
          const minHeight = dayRecords.length > 0
            ? Math.max(baseHeight, baseHeight + (dayRecords.length - 1) * additionalHeight)
            : baseHeight

          return (
            <div
              key={index}
              style={{ minHeight: `${minHeight}px` }}
              className={`
                p-1 sm:p-2 border rounded-lg
                ${!isCurrentMonth ? 'bg-gray-50 text-gray-300 border-gray-200' :
                  isWeekend ? 'bg-blue-50 border-blue-200' : 'bg-bg-primary border-border-light'}
                ${isToday ? 'ring-1 sm:ring-2 ring-mingcare-blue border-mingcare-blue' : ''}
              `}
            >
              <div className={`
                text-xs sm:text-sm font-bold mb-1 sm:mb-2
                ${isToday ? 'text-mingcare-blue' :
                  isCurrentMonth ? 'text-text-primary' : 'text-gray-300'}
              `}>
                {date.getDate()}
              </div>

              {/* 服務記錄 - 移動端優化 */}
              {isCurrentMonth && dayRecords.length > 0 && (
                <div className="space-y-0.5 sm:space-y-1">
                  {/* 決定要顯示多少筆記錄 - 移動端顯示較少 */}
                  {(() => {
                    const dateKey = formatDateSafely(date)
                    const isExpanded = expandedDates.has(dateKey)
                    const maxRecords = isMobile ? 2 : 3
                    const recordsToShow = isExpanded ? dayRecords : dayRecords.slice(0, maxRecords)

                    return (recordsToShow || []).map((record, i) => (
                      <div
                        key={`${record.id}-${i}`}
                        onClick={() => {
                          setSelectedRecord(record)
                          setShowRecordMenu(true)
                        }}
                        className="text-xs sm:text-sm bg-white border border-gray-200 rounded p-1 sm:p-2 shadow-sm cursor-pointer hover:shadow-md hover:border-mingcare-blue transition-all duration-200 relative overflow-visible"
                      >
                        {/* 30分鐘更新提示 */}
                        <CardUpdateIndicator 
                          lastUpdateTime={recordUpdateTimes?.[record.id] || null}
                        />
                        
                        <div className="font-medium text-gray-800 mb-0.5 sm:mb-1 leading-tight text-xs sm:text-sm">
                          <span className="hidden sm:inline">{record.customer_name}/{record.care_staff_name}</span>
                          <span className="sm:hidden">{record.customer_name.substring(0, 6)}/{record.care_staff_name.substring(0, 6)}</span>
                        </div>
                        <div className="text-blue-600 mb-0.5 sm:mb-1 leading-tight text-xs">
                          {record.service_type}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {record.start_time}-{record.end_time}
                        </div>
                      </div>
                    ))
                  })()}

                  {/* 展開/收合按鈕 */}
                  {dayRecords.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const dateKey = formatDateSafely(date)
                        const newExpandedDates = new Set(expandedDates)

                        if (expandedDates.has(dateKey)) {
                          newExpandedDates.delete(dateKey)
                        } else {
                          newExpandedDates.add(dateKey)
                        }

                        setExpandedDates(newExpandedDates)
                      }}
                      className="w-full text-sm text-mingcare-blue hover:text-blue-700 text-center py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      {expandedDates.has(formatDateSafely(date))
                        ? '收合記錄'
                        : `還有 ${dayRecords.length - 3} 筆記錄...`
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 記錄操作模態框 */}
      {showRecordMenu && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-text-primary mb-4">選擇操作</h3>

            {/* 記錄詳情 */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="text-sm text-text-secondary mb-1">
                {selectedRecord.service_date} {selectedRecord.start_time}-{selectedRecord.end_time}
              </div>
              <div className="font-medium text-text-primary">
                {selectedRecord.customer_name}
              </div>
              <div className="text-sm text-text-secondary">
                護理員：{selectedRecord.care_staff_name}
              </div>
              <div className="text-sm text-blue-600">
                {selectedRecord.service_type}
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('📝 編輯按鈕被點擊:', selectedRecord)
                  onEdit(selectedRecord)
                  setShowRecordMenu(false)
                  setSelectedRecord(null)
                }}
                className="flex-1 bg-mingcare-blue text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                編輯
              </button>
              <button
                onClick={() => {
                  console.log('🗑️ 刪除按鈕被點擊:', selectedRecord.id)
                  onDelete(selectedRecord.id)
                  setShowRecordMenu(false)
                  setSelectedRecord(null)
                }}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                刪除
              </button>
            </div>

            {/* 取消按鈕 */}
            <button
              onClick={() => {
                setShowRecordMenu(false)
                setSelectedRecord(null)
              }}
              className="w-full mt-3 bg-gray-200 text-text-secondary py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailedRecordsList({ filters, onRefresh }: DetailedRecordsListProps) {
  const [records, setRecords] = useState<BillingSalaryRecord[]>([])
  const [originalRecords, setOriginalRecords] = useState<BillingSalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'service_date', direction: 'desc' })

  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const pageSize = 100 // 每頁顯示100筆記錄

  // 編輯狀態
  const [editingRecord, setEditingRecord] = useState<BillingSalaryRecord | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // 載入真實數據
  useEffect(() => {
    loadRecords()
  }, [filters]) // 移除 currentPage 依賴，因為不再使用分頁

  const loadRecords = async () => {
    try {
      setLoading(true)
      setError(null)

      // 二月和四月的特別調試
      if (filters.dateRange?.start) {
        const startMonth = new Date(filters.dateRange.start).getMonth() + 1
        if (startMonth === 2 || startMonth === 4) {
          console.log(`🔍 載入${startMonth}月記錄，filters:`, filters)
        }
      }

      // 一次獲取所有記錄，不使用分頁
      const response = await fetchBillingSalaryRecords(filters, 1, 10000)

      // 二月和四月的特別調試
      if (filters.dateRange?.start) {
        const startMonth = new Date(filters.dateRange.start).getMonth() + 1
        if (startMonth === 2 || startMonth === 4) {
          console.log(`🔍 ${startMonth}月 API 響應:`, {
            success: response.success,
            dataExists: !!response.data,
            dataType: typeof response.data,
            dataDataExists: !!(response.data?.data),
            dataDataType: typeof response.data?.data,
            dataDataLength: response.data?.data?.length
          })
        }
      }

      if (response.success && response.data) {
        const fetchedRecords = response.data.data || []
        setTotalRecords(response.data.total || 0) // 設置總記錄數
        setOriginalRecords(fetchedRecords)
        // 應用當前排序
        sortRecords(fetchedRecords, sortConfig)
      } else {
        setError(response.error || '載入數據失敗')
      }
    } catch (err) {
      console.error('載入記錄失敗:', err)
      setError('載入數據失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  // 排序記錄
  const sortRecords = (recordsToSort: BillingSalaryRecord[], config: SortConfig) => {
    const sorted = [...recordsToSort].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (config.field) {
        case 'service_date':
          aValue = a.service_date
          bValue = b.service_date
          break
        case 'customer_name':
          aValue = a.customer_name
          bValue = b.customer_name
          break
        case 'customer_id':
          aValue = a.customer_id
          bValue = b.customer_id
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return config.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return config.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    setRecords(sorted)
  }

  // 處理排序按鈕點擊
  const handleSort = (field: SortField) => {
    const newDirection: SortDirection =
      sortConfig.field === field && sortConfig.direction === 'desc'
        ? 'asc'
        : 'desc'

    const newConfig: SortConfig = { field, direction: newDirection }
    setSortConfig(newConfig)
    sortRecords(originalRecords, newConfig)
  }

  // 編輯功能
  const handleEdit = (record: BillingSalaryRecord) => {
    console.log('🖊️ 第一個 handleEdit - 點擊編輯按鈕，記錄:', record)
    setEditingRecord(record)
    setIsEditModalOpen(true)
    console.log('🖊️ 第一個 handleEdit - 模態框狀態已更新:', {
      isEditModalOpen: true,
      editingRecordId: record.id
    })
  }

  const handleEditSave = async (formData: BillingSalaryFormData) => {
    if (!editingRecord) return

    try {
      setLoading(true)
      console.log('🔄 開始更新記錄:', {
        recordId: editingRecord.id,
        formData
      })

      const response = await updateBillingSalaryRecord(editingRecord.id, formData)

      console.log('📝 更新結果:', response)

      if (response.success) {
        // 顯示成功提示
        alert('記錄更新成功！')
        setIsEditModalOpen(false)
        setEditingRecord(null)
        // 觸發資料刷新
        if (onRefresh) {
          onRefresh()
        }
        // 重新載入本地記錄列表
        loadRecords()
      } else {
        setError(response.error || '更新記錄失敗')
        alert('更新記錄失敗：' + (response.error || '未知錯誤'))
      }
    } catch (err) {
      console.error('更新記錄失敗:', err)
      setError('更新記錄失敗，請重試')
      alert('更新記錄失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCancel = () => {
    setIsEditModalOpen(false)
    setEditingRecord(null)
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('確定要刪除這筆記錄嗎？此操作無法撤銷。')) return

    try {
      setLoading(true)
      console.log('🗑️ 開始刪除記錄:', recordId)

      const response = await deleteBillingSalaryRecord(recordId)

      console.log('🗑️ 刪除結果:', response)

      if (response.success) {
        alert('記錄刪除成功！')
        // 觸發資料刷新
        if (onRefresh) {
          onRefresh()
        }
        // 重新載入本地記錄列表
        loadRecords()
      } else {
        setError(response.error || '刪除記錄失敗')
        alert('刪除記錄失敗：' + (response.error || '未知錯誤'))
      }
    } catch (err) {
      console.error('刪除記錄失敗:', err)
      setError('刪除記錄失敗，請重試')
      alert('刪除記錄失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  // 截斷地址顯示
  const truncateAddress = (address: string, maxLength: number = 30) => {
    if (!address) return ''
    return address.length > maxLength ? address.substring(0, maxLength) + '...' : address
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-border-light rounded-lg p-4 animate-pulse">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium mb-2">{error}</p>
        <button
          onClick={loadRecords}
          className="px-4 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          重新載入
        </button>
      </div>
    )
  }

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-text-primary font-medium mb-2">沒有找到記錄</p>
        <p className="text-sm text-text-secondary">
          請調整篩選條件或新增服務記錄
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 排序控制按鈕 - 移動端優化 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border-light pb-4 space-y-3 sm:space-y-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary font-medium">排序：</span>

          {/* 按日期排序 */}
          <button
            onClick={() => handleSort('service_date')}
            className={`flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              sortConfig.field === 'service_date'
                ? 'bg-mingcare-blue text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            <span>日期</span>
            {sortConfig.field === 'service_date' && (
              <svg
                className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${
                  sortConfig.direction === 'desc' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>

          {/* 按客戶名稱排序 */}
          <button
            onClick={() => handleSort('customer_name')}
            className={`flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              sortConfig.field === 'customer_name'
                ? 'bg-mingcare-blue text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            <span className="hidden sm:inline">客戶名稱</span>
            <span className="sm:hidden">客戶</span>
            {sortConfig.field === 'customer_name' && (
              <svg
                className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${
                  sortConfig.direction === 'desc' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>

          {/* 按客戶編號排序 */}
          <button
            onClick={() => handleSort('customer_id')}
            className={`flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              sortConfig.field === 'customer_id'
                ? 'bg-mingcare-blue text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            <span className="hidden sm:inline">客戶編號</span>
            <span className="sm:hidden">編號</span>
            {sortConfig.field === 'customer_id' && (
              <svg
                className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${
                  sortConfig.direction === 'desc' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* 記錄數量顯示 */}
        <div className="text-xs sm:text-sm text-text-secondary text-center sm:text-right">
          共 {records?.length || 0} 筆記錄
        </div>
      </div>

      {/* 記錄列表 - 移動端優化 */}
      <div className="space-y-3">
        {records && records.map((record) => (
          <div
            key={record.id}
            className="border border-border-light rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200 bg-white"
          >
            {/* 第1行：日期、所屬項目、操作按鈕 - 移動端垂直佈局 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                <span className="font-medium text-text-primary text-sm sm:text-base">{record.service_date}</span>
                <span className="text-xs sm:text-sm text-text-secondary">{record.project_category}</span>
              </div>

              {/* 操作按鈕 - 移動端優化 */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    console.log('🖱️ 編輯按鈕被點擊，記錄ID:', record.id)
                    handleEdit(record)
                  }}
                  className="p-1.5 sm:p-2 text-mingcare-blue hover:bg-blue-50 rounded-lg transition-colors"
                  title="編輯記錄"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    console.log('🖱️ 刪除按鈕被點擊，記錄ID:', record.id)
                    handleDelete(record.id)
                  }}
                  className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="刪除記錄"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 第2行：客戶姓名+編號、服務類型 - 移動端優化 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-text-primary text-sm sm:text-base">
                  {record.customer_name} ({record.customer_id})
                </span>
              </div>
              <span className="text-xs sm:text-sm bg-mingcare-blue text-white px-2 sm:px-3 py-1 rounded-full self-start sm:self-center">
                {record.service_type}
              </span>
            </div>

            {/* 第3行：服務地址 - 移動端優化 */}
            <div className="mb-2">
              <span
                className="text-xs sm:text-sm text-text-secondary cursor-help block break-words overflow-hidden"
                title={record.service_address}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {record.service_address}
              </span>
            </div>

            {/* 第4行：時間、時數、護理人員 - 移動端垂直佈局 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm space-y-1 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                <span className="text-text-secondary">
                  {record.start_time}-{record.end_time}
                </span>
                <span className="font-medium text-text-primary">
                  {record.service_hours}小時
                </span>
              </div>
              <span className="font-medium text-text-primary self-start sm:self-center">
                {record.care_staff_name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 記錄統計信息 */}
      <div className="text-center text-xs sm:text-sm text-text-secondary mt-6">
        共 {totalRecords} 筆記錄
      </div>

      {/* 編輯模態框 */}
      {isEditModalOpen && editingRecord && (
        <ScheduleFormModal
          isOpen={isEditModalOpen}
          onClose={handleEditCancel}
          onSubmit={handleEditSave}
          isMultiDay={false}
          existingRecord={editingRecord}
        />
      )}
    </div>
  )
}

// Tab 組件定義
interface OverviewTabProps {
  filters: BillingSalaryFilters
  setFilters: (filters: BillingSalaryFilters | ((prev: BillingSalaryFilters) => BillingSalaryFilters)) => void
  updateDateRange: (preset: DateRangePreset) => void
  kpiData: BusinessKPI | null
  kpiLoading: boolean
  categorySummary: ProjectCategorySummary[]
}

interface ReportsTabProps {
  filters: BillingSalaryFilters
  setFilters: (filters: BillingSalaryFilters | ((prev: BillingSalaryFilters) => BillingSalaryFilters)) => void
  updateDateRange: (preset: DateRangePreset) => void
  exportLoading: boolean
  handleExport: () => void
  reportsViewMode: 'list' | 'calendar'
  setReportsViewMode: (mode: 'list' | 'calendar') => void
  onEdit: (record: BillingSalaryRecord) => void
  onDelete: (recordId: string) => void
  refreshTrigger: number
  onRefresh?: () => void  // 添加刷新函數
  recordUpdateTimes?: Record<string, Date> // 添加記錄更新時間
}

// 概覽頁面組件
function OverviewTab({
  filters,
  setFilters,
  updateDateRange,
  kpiData,
  kpiLoading,
  categorySummary
}: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* 搜尋與篩選 - 根據圖片格式 */}
      <div className="card-apple mb-4 sm:mb-6 fade-in-apple">
        <div className="card-apple-header">
          <h3 className="text-lg sm:text-xl font-semibold text-text-primary">搜尋與篩選</h3>
        </div>
        <div className="card-apple-content">
          <h2 className="text-apple-heading text-text-primary mb-4">選擇時段</h2>

          {/* 第一行：快捷選擇按鈕 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => updateDateRange('thisMonth')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light bg-mingcare-blue text-white transition-all duration-200"
              >
                本月
              </button>
              <button
                onClick={() => updateDateRange('lastMonth')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
              >
                上月
              </button>
              <button
                onClick={() => updateDateRange('last3months')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
              >
                最近3個月
              </button>
              <button
                onClick={() => updateDateRange('last6months')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
              >
                最近6個月
              </button>
              <button
                onClick={() => updateDateRange('thisQuarter')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
              >
                本季度
              </button>
              <button
                onClick={() => updateDateRange('thisYear')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
              >
                本年度
              </button>
            </div>
          </div>

          {/* 第二行：年月選擇器 */}
          <div className="flex items-center gap-4 mb-4">
            {/* 年月選擇器 */}
            <div className="flex items-center gap-2">
              <select
                value={filters.dateRange?.start ? new Date(filters.dateRange.start).getFullYear() : new Date().getFullYear()}
                onChange={(e) => {
                  const year = parseInt(e.target.value)
                  const month = filters.dateRange?.start ? new Date(filters.dateRange.start).getMonth() : new Date().getMonth()
                  const startDate = new Date(year, month, 1)
                  const endDate = new Date(year, month + 1, 0)

                  // 使用本地日期格式避免時區問題
                  const start = year + '-' +
                               String(month + 1).padStart(2, '0') + '-01'
                  const end = endDate.getFullYear() + '-' +
                             String(endDate.getMonth() + 1).padStart(2, '0') + '-' +
                             String(endDate.getDate()).padStart(2, '0')

                  setFilters(prev => ({
                    ...prev,
                    dateRange: { start, end }
                  }))
                }}
                className="px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i
                  return (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  )
                })}
              </select>

              <select
                value={filters.dateRange?.start ? new Date(filters.dateRange.start).getMonth() : new Date().getMonth()}
                onChange={(e) => {
                  const year = filters.dateRange?.start ? new Date(filters.dateRange.start).getFullYear() : new Date().getFullYear()
                  const month = parseInt(e.target.value)
                  const startDate = new Date(year, month, 1)
                  const endDate = new Date(year, month + 1, 0)

                  // 使用本地日期格式避免時區問題
                  const start = year + '-' +
                               String(month + 1).padStart(2, '0') + '-01'
                  const end = endDate.getFullYear() + '-' +
                             String(endDate.getMonth() + 1).padStart(2, '0') + '-' +
                             String(endDate.getDate()).padStart(2, '0')

                  setFilters(prev => ({
                    ...prev,
                    dateRange: { start, end }
                  }))
                }}
                className="px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {i + 1}月
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 第二行：月曆時間段選擇 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">時間段：</label>
            <input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
            />
            <span className="text-text-secondary">至</span>
            <input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
            />
          </div>

          <div className="mt-4 text-sm text-text-secondary">
            當前範圍：{filters.dateRange?.start || '未設定'} ~ {filters.dateRange?.end || '未設定'}
          </div>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {kpiLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
            <p className="text-sm text-text-secondary mt-3">計算中...</p>
          </div>
        ) : kpiData ? (
          <>
            <div className="card-apple border border-border-light p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                ${kpiData.totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-text-secondary">總收入</div>
              {kpiData.revenueGrowthRate !== 0 && (
                <div className={`text-xs mt-2 ${
                  kpiData.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpiData.revenueGrowthRate >= 0 ? '↗' : '↘'} {Math.abs(kpiData.revenueGrowthRate).toFixed(1)}%
                </div>
              )}
            </div>

            <div className="card-apple border border-border-light p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                ${kpiData.totalProfit.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-text-secondary">總利潤</div>
              <div className="text-xs text-text-secondary mt-2">
                利潤率: {kpiData.totalRevenue > 0 ? ((kpiData.totalProfit / kpiData.totalRevenue) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="card-apple border border-border-light p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                {kpiData.totalServiceHours.toFixed(1)}
              </div>
              <div className="text-xs md:text-sm text-text-secondary">總服務時數</div>
            </div>

            <div className="card-apple border border-border-light p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                ${kpiData.avgProfitPerHour.toFixed(2)}
              </div>
              <div className="text-xs md:text-sm text-text-secondary">每小時利潤</div>
            </div>
          </>
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-text-secondary">選取的日期範圍內暫無數據</p>
          </div>
        )}
      </div>

      {/* 項目分類統計 - 簡化版 */}
      <div className="card-apple border border-border-light fade-in-apple">
        <div className="p-6">
          <h3 className="text-apple-heading text-text-primary mb-6">項目分類統計</h3>

          {categorySummary && categorySummary.length > 0 ? (
            <div className="space-y-4">
              {categorySummary.slice(0, 5).map((summary, index) => (
                <div key={summary.category} className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-border-light">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-mingcare-blue rounded-full mr-3"></div>
                    <div>
                      <h4 className="font-medium text-text-primary">{summary.category}</h4>
                      <p className="text-sm text-text-secondary">
                        {summary.recordCount} 筆記錄 • {summary.uniqueCustomers} 位客戶
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-text-primary">
                      ${summary.totalFee.toLocaleString()}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {summary.totalHours.toFixed(1)}h • 利潤 ${summary.totalProfit.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              {categorySummary && categorySummary.length > 5 && (
                <div className="text-center text-sm text-text-secondary">
                  還有 {categorySummary.length - 5} 個項目，請到詳細報表查看
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary">選取的日期範圍內暫無項目數據</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 排班小結組件
function ScheduleSummaryView({ localSchedules }: { localSchedules: Record<string, BillingSalaryFormData[]> }) {
  const calculateSummary = () => {
    const allSchedules = Object.values(localSchedules || {}).flat()
    const totalHours = (allSchedules || []).reduce((sum, schedule) => sum + (schedule.service_hours || 0), 0)
    const totalFee = (allSchedules || []).reduce((sum, schedule) => sum + (schedule.service_fee || 0), 0)
    const totalCount = allSchedules?.length || 0

    return {
      totalCount,
      totalHours,
      totalFee
    }
  }

  // 社區券統計 state
  const [voucherSummary, setVoucherSummary] = useState<{
    service_type: string
    count: number
    total_hours: number
    total_rate: number
    total_amount: number
  }[]>([])

  const calculateVoucherSummary = async () => {
    const allSchedules = Object.values(localSchedules || {}).flat()
    console.log('計算社區券統計 - 本地排程:', localSchedules) // 調試日誌
    console.log('所有排程:', allSchedules) // 調試日誌

    try {
      // 獲取 voucher_rate 費率表
      const voucherRatesResponse = await fetchVoucherRates()
      if (!voucherRatesResponse.success || !voucherRatesResponse.data) {
        console.error('無法獲取社區券費率')
        return []
      }

      const voucherRates = voucherRatesResponse.data
      const rateMap = new Map(voucherRates.map(rate => [rate.service_type, rate.service_rate]))
      console.log('社區券費率表:', rateMap) // 調試日誌

      // 按服務類型分組統計
      const serviceTypeStats: Record<string, {
        count: number
        total_hours: number
        rate: number
        total_amount: number
      }> = {}

      allSchedules.forEach(schedule => {
        const serviceType = schedule.service_type || '未分類'
        const rate = rateMap.get(serviceType) || 0
        const hours = schedule.service_hours || 0

        if (!serviceTypeStats[serviceType]) {
          serviceTypeStats[serviceType] = {
            count: 0,
            total_hours: 0,
            rate: rate,
            total_amount: 0
          }
        }

        serviceTypeStats[serviceType].count += 1
        serviceTypeStats[serviceType].total_hours += hours
        serviceTypeStats[serviceType].total_amount += hours * rate
      })

      const result = Object.entries(serviceTypeStats).map(([serviceType, stats]) => ({
        service_type: serviceType,
        count: stats.count,
        total_hours: stats.total_hours,
        total_rate: stats.rate,
        total_amount: stats.total_amount
      }))

      console.log('社區券統計結果:', result) // 調試日誌
      setVoucherSummary(result)
      return result
    } catch (error) {
      console.error('計算社區券統計失敗:', error)
      setVoucherSummary([])
      return []
    }
  }

  // 當本地排程改變時重新計算社區券統計
  useEffect(() => {
    calculateVoucherSummary()
  }, [localSchedules])

  const summary = calculateSummary()
  const totalVoucherAmount = voucherSummary.reduce((sum: number, item) => sum + item.total_amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-apple-heading text-text-primary mb-4">排班小結</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-mingcare-blue">{summary.totalCount}</div>
            <div className="text-sm text-text-secondary">總排班數</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{summary.totalHours.toFixed(1)}</div>
            <div className="text-sm text-text-secondary">總時數</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">${summary.totalFee.toFixed(2)}</div>
            <div className="text-sm text-text-secondary">總服務費用</div>
          </div>
        </div>
      </div>

      {/* 社區券機數統計 */}
      {voucherSummary.length > 0 ? (
        <div>
          <h3 className="text-apple-heading text-text-primary mb-4">社區券機數統計（當前排班）</h3>

          {/* 總計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{summary.totalCount}</div>
              <div className="text-sm text-text-secondary">總服務次數</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-600">{summary.totalHours.toFixed(1)}</div>
              <div className="text-sm text-text-secondary">總服務時數</div>
            </div>
            <div className="bg-pink-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-pink-600">${totalVoucherAmount.toFixed(2)}</div>
              <div className="text-sm text-text-secondary">總社區券金額</div>
            </div>
          </div>

          {/* 服務類型明細表格 */}
          <div className="bg-white border border-border-light rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">服務類型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">次數</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">時數</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">費率/小時</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">金額</th>
                </tr>
              </thead>
              <tbody>
                {voucherSummary && voucherSummary.map((item, index) => (
                  <tr key={item.service_type} className={index % 2 === 0 ? 'bg-white' : 'bg-bg-secondary'}>
                    <td className="py-3 px-4 text-sm text-text-primary">{item.service_type}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{item.count}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{item.total_hours.toFixed(1)}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">${item.total_rate.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-text-primary font-medium">${item.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-apple-heading text-text-primary mb-4">社區券機數統計（當前排班）</h3>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-text-secondary">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-text-primary mb-2">尚無排班資料</p>
              <p className="text-sm text-text-secondary">請先添加排班記錄以查看社區券統計</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 社區券統計組件
function VoucherSummaryView({ filters }: { filters: BillingSalaryFilters }) {
  const [voucherData, setVoucherData] = useState<{
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
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadVoucherSummary = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await calculateVoucherSummary(filters)
        if (response.success && response.data) {
          setVoucherData(response.data)
        } else {
          setError(response.error || '載入社區券統計失敗')
        }
      } catch (err) {
        console.error('載入社區券統計失敗:', err)
        setError('載入社區券統計失敗')
      } finally {
        setLoading(false)
      }
    }

    loadVoucherSummary()
  }, [filters])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
        <span className="ml-3 text-text-secondary">載入統計數據中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!voucherData) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">暫無數據</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-apple-heading text-text-primary mb-4">社區券機數統計</h3>

      {/* 總計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-mingcare-blue">{voucherData.grandTotal.total_count}</div>
          <div className="text-sm text-text-secondary">總服務次數</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{voucherData.grandTotal.total_hours.toFixed(1)}</div>
          <div className="text-sm text-text-secondary">總服務時數</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">${voucherData.grandTotal.total_amount.toFixed(2)}</div>
          <div className="text-sm text-text-secondary">總社區券金額</div>
        </div>
      </div>

      {/* 服務類型明細表格 */}
      <div className="bg-white border border-border-light rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-secondary">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">服務類型</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">次數</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">時數</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">單價</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-primary">金額</th>
            </tr>
          </thead>
          <tbody>
            {voucherData.serviceTypeSummary && voucherData.serviceTypeSummary.map((item, index) => (
              <tr key={item.service_type} className={index % 2 === 0 ? 'bg-white' : 'bg-bg-secondary'}>
                <td className="py-3 px-4 text-sm text-text-primary">{item.service_type}</td>
                <td className="py-3 px-4 text-sm text-text-primary">{item.count}</td>
                <td className="py-3 px-4 text-sm text-text-primary">{item.total_hours.toFixed(1)}</td>
                <td className="py-3 px-4 text-sm text-text-primary">${item.total_rate.toFixed(2)}</td>
                <td className="py-3 px-4 text-sm text-text-primary font-medium">${item.total_amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 排程頁面組件
function ScheduleTab({ filters }: { filters: BillingSalaryFilters }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduleData, setScheduleData] = useState<Record<string, any[]>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([]) // 多日期選擇
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false) // 多選模式
  const [formSubmitting, setFormSubmitting] = useState(false)

  // 本地排程狀態 - 新增的排程先存在這裡，不立即保存到 Supabase
  const [localSchedules, setLocalSchedules] = useState<Record<string, BillingSalaryFormData[]>>({})

  // 月曆客戶篩選狀態
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>('all') // 'all' 或客戶名稱

  // 載入月曆數據
  useEffect(() => {
    const loadCalendarData = async () => {
      // 載入現有的排程數據
      try {
        // 這裡可以載入現有的排程數據
        console.log('載入月曆數據')
      } catch (error) {
        console.error('載入月曆數據失敗:', error)
      }
    }
    loadCalendarData()
  }, [currentDate])

  // 本地排程編輯模態框狀態
  const [localScheduleEditModal, setLocalScheduleEditModal] = useState<{
    isOpen: boolean
    schedule: BillingSalaryFormData | null
    dateStr: string
    scheduleIndex: number
  }>({
    isOpen: false,
    schedule: null,
    dateStr: '',
    scheduleIndex: -1
  })

  // 正在編輯的本地排程狀態
  const [editingLocalSchedule, setEditingLocalSchedule] = useState<{
    originalDateStr: string
    originalIndex: number
    schedule: BillingSalaryFormData | null
  } | null>(null)

  // 添加新的狀態：統計視圖（移除，不再需要）

  // 計算本地排程總數
  const getTotalLocalSchedules = () => {
    return Object.values(localSchedules || {}).reduce((total, daySchedules) => total + (daySchedules?.length || 0), 0)
  }

  // 獲取本地排程中的所有客戶名稱
  const getLocalCustomerNames = () => {
    const customerNames = new Set<string>()
    Object.values(localSchedules || {}).forEach(daySchedules => {
      ;(daySchedules || []).forEach(schedule => {
        if (schedule.customer_name) {
          customerNames.add(schedule.customer_name)
        }
      })
    })
    return Array.from(customerNames).sort()
  }

  // 根據篩選條件獲取要顯示的本地排程
  const getFilteredLocalSchedules = () => {
    if (selectedCustomerFilter === 'all') {
      return localSchedules
    }

    const filtered: Record<string, BillingSalaryFormData[]> = {}
    Object.entries(localSchedules).forEach(([dateStr, daySchedules]) => {
      const filteredSchedules = daySchedules.filter(schedule =>
        schedule.customer_name === selectedCustomerFilter
      )
      if (filteredSchedules.length > 0) {
        filtered[dateStr] = filteredSchedules
      }
    })
    return filtered
  }

  // 計算本地排程小結
  const calculateLocalScheduleSummary = () => {
    const allSchedules = Object.values(localSchedules || {}).flat()
    const totalHours = (allSchedules || []).reduce((sum, schedule) => sum + (schedule.service_hours || 0), 0)
    const totalFee = (allSchedules || []).reduce((sum, schedule) => sum + (schedule.service_fee || 0), 0)
    const totalCount = allSchedules?.length || 0

    return {
      totalCount,
      totalHours,
      totalFee
    }
  }

  // 確認儲存本地排程到Supabase（只儲存篩選後的）
  const handleSaveLocalSchedules = async () => {
    const filteredSchedules = getFilteredLocalSchedules()
    const filteredTotal = Object.values(filteredSchedules || {}).reduce((total, daySchedules) => total + (daySchedules?.length || 0), 0)

    if (filteredTotal === 0) {
      if (selectedCustomerFilter === 'all') {
        alert('沒有待儲存的排程')
      } else {
        alert(`沒有 ${selectedCustomerFilter} 的待儲存排程`)
      }
      return
    }

    const customerInfo = selectedCustomerFilter === 'all' ? '全部' : selectedCustomerFilter
    const confirmSave = confirm(`確定要儲存 ${customerInfo} 的 ${filteredTotal} 個排程到資料庫嗎？`)
    if (!confirmSave) return

    try {
      setFormSubmitting(true)

      // 將篩選後的本地排程直接儲存到 Supabase
      for (const [dateStr, daySchedules] of Object.entries(filteredSchedules)) {
        for (const schedule of daySchedules) {
          const supabaseData = {
            customer_id: schedule.customer_id,
            care_staff_name: schedule.care_staff_name,
            service_date: schedule.service_date,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            service_type: schedule.service_type,
            service_address: schedule.service_address,
            hourly_rate: schedule.hourly_rate || (schedule.service_hours > 0 ? (schedule.service_fee || 0) / schedule.service_hours : 0),
            service_fee: schedule.service_fee,
            staff_salary: schedule.staff_salary,
            phone: schedule.phone,
            customer_name: schedule.customer_name,
            service_hours: schedule.service_hours,
            hourly_salary: schedule.hourly_salary || (schedule.service_hours > 0 ? (schedule.staff_salary || 0) / schedule.service_hours : 0),
            project_category: schedule.project_category,
            project_manager: schedule.project_manager
          }

          // 直接使用 Supabase 客戶端儲存資料（正確的表名）
          const { data, error } = await supabase
            .from('billing_salary_data')
            .insert([supabaseData])

          if (error) {
            console.error('Supabase 儲存錯誤:', error)
            throw new Error(`儲存排程失敗: ${error.message}`)
          }

          console.log('成功儲存排程到 Supabase:', data)
        }
      }

      // 從本地排程中移除已儲存的排程
      if (selectedCustomerFilter === 'all') {
        // 如果是全部儲存，清空所有本地排程
        setLocalSchedules({})
      } else {
        // 如果是特定客戶，只移除該客戶的排程
        setLocalSchedules(prev => {
          const newSchedules = { ...prev }
          Object.keys(filteredSchedules).forEach(dateStr => {
            if (newSchedules[dateStr]) {
              newSchedules[dateStr] = newSchedules[dateStr].filter(schedule =>
                schedule.customer_name !== selectedCustomerFilter
              )
              // 如果該日期沒有排程了，刪除整個日期鍵
              if (newSchedules[dateStr].length === 0) {
                delete newSchedules[dateStr]
              }
            }
          })
          return newSchedules
        })
      }

      alert(`成功儲存 ${customerInfo} 的 ${filteredTotal} 個排程到資料庫！`)

    } catch (error) {
      console.error('儲存本地排程失敗:', error)
      alert('儲存排程時發生錯誤，請稍後再試')
    } finally {
      setFormSubmitting(false)
    }
  }

  // 清除特定本地排程
  const handleDeleteLocalSchedule = (dateStr: string, scheduleIndex: number) => {
    setLocalSchedules(prev => {
      const newSchedules = { ...prev }
      if (newSchedules[dateStr]) {
        newSchedules[dateStr] = newSchedules[dateStr].filter((_, index) => index !== scheduleIndex)
        // 如果該日期沒有排程了，刪除整個日期鍵
        if (newSchedules[dateStr].length === 0) {
          delete newSchedules[dateStr]
        }
      }
      return newSchedules
    })
  }

  // 處理本地排程點擊 - 打開編輯/刪除選項
  const handleLocalScheduleClick = (dateStr: string, scheduleIndex: number, schedule: BillingSalaryFormData) => {
    setLocalScheduleEditModal({
      isOpen: true,
      schedule,
      dateStr,
      scheduleIndex
    })
  }

  // 更新本地排程
  const handleUpdateLocalSchedule = (formData: BillingSalaryFormData) => {
    const { dateStr, scheduleIndex } = localScheduleEditModal
    setLocalSchedules(prev => {
      const newSchedules = { ...prev }
      if (newSchedules[dateStr]) {
        newSchedules[dateStr][scheduleIndex] = formData
      }
      return newSchedules
    })
    setLocalScheduleEditModal({
      isOpen: false,
      schedule: null,
      dateStr: '',
      scheduleIndex: -1
    })
  }

  // 刪除本地排程（從模態框）
  const handleDeleteLocalScheduleFromModal = () => {
    const { dateStr, scheduleIndex } = localScheduleEditModal
    handleDeleteLocalSchedule(dateStr, scheduleIndex)
    setLocalScheduleEditModal({
      isOpen: false,
      schedule: null,
      dateStr: '',
      scheduleIndex: -1
    })
  }

  // 處理編輯本地排程 - 打開編輯表單
  const handleEditLocalSchedule = () => {
    const { dateStr, scheduleIndex, schedule } = localScheduleEditModal
    if (!schedule) return

    console.log('開始編輯本地排程:', {
      originalDate: dateStr,
      originalIndex: scheduleIndex,
      scheduleDate: schedule.service_date
    })

    // 設定編輯狀態
    setEditingLocalSchedule({
      originalDateStr: dateStr,
      originalIndex: scheduleIndex,
      schedule: schedule
    })

    // 設定選中的日期
    setSelectedDate(schedule.service_date)
    setSelectedDates([])
    setIsMultiSelectMode(false)

    // 關閉選項模態框，打開編輯表單
    setLocalScheduleEditModal({
      isOpen: false,
      schedule: null,
      dateStr: '',
      scheduleIndex: -1
    })
    setShowAddModal(true)
  }

  // 處理提交排班表單 - 添加到本地狀態
  const handleSubmitSchedule = async (formData: BillingSalaryFormData) => {
    setFormSubmitting(true)
    try {
      // 檢查是否為編輯模式
      if (editingLocalSchedule) {
        // 編輯模式：更新現有的本地排程
        const { originalDateStr, originalIndex } = editingLocalSchedule
        const newDate = formData.service_date

        console.log('編輯排程 - 原日期:', originalDateStr, '新日期:', newDate)

        setLocalSchedules(prev => {
          const newSchedules = { ...prev }

          // 從原日期移除排程
          if (newSchedules[originalDateStr]) {
            newSchedules[originalDateStr] = newSchedules[originalDateStr].filter((_, index) => index !== originalIndex)
            // 如果該日期沒有排程了，刪除整個日期鍵
            if (newSchedules[originalDateStr].length === 0) {
              delete newSchedules[originalDateStr]
            }
          }

          // 添加到新日期
          newSchedules[newDate] = [...(newSchedules[newDate] || []), formData]

          console.log('更新後的本地排程:', newSchedules)
          return newSchedules
        })

        alert('成功更新排班記錄')
        setEditingLocalSchedule(null) // 清除編輯狀態
      } else if (selectedDates.length > 1) {
        // 多日排班：為每個選定日期添加到本地狀態
        selectedDates.forEach(date => {
          const scheduleWithDate = { ...formData, service_date: date }
          setLocalSchedules(prev => ({
            ...prev,
            [date]: [...(prev[date] || []), scheduleWithDate]
          }))
        })

        alert(`成功添加 ${selectedDates.length} 筆排班記錄到月曆`)
      } else {
        // 單日排班
        const date = formData.service_date
        setLocalSchedules(prev => ({
          ...prev,
          [date]: [...(prev[date] || []), formData]
        }))

        alert('成功添加排班記錄到月曆')
      }

      // 關閉模態框並重置狀態
      setShowAddModal(false)
      setSelectedDate(null)
      setSelectedDates([])
      setIsMultiSelectMode(false)
    } catch (error) {
      console.error('處理排班失敗:', error)
      alert('處理排班失敗，請重試')
    } finally {
      setFormSubmitting(false)
    }
  }

  // 生成月曆數據
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 從週日開始

    const days = []
    const current = new Date(startDate)

    // 生成6週的日期（42天）
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  // 月份導航
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  // 處理日期點擊 - 新增排班
  const handleDateClick = (date: Date) => {
    const dateStr = formatDateSafely(date)

    if (isMultiSelectMode) {
      // 多選模式：切換日期選擇狀態
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(prev => prev.filter(d => d !== dateStr))
      } else {
        setSelectedDates(prev => [...prev, dateStr])
      }
    } else {
      // 單選模式：直接開啟表單
      setSelectedDate(dateStr)
      setSelectedDates([dateStr])
      setShowAddModal(true)
    }
  }

  const calendarDays = generateCalendarDays()
  const currentMonth = currentDate.getMonth()

  return (
    <div className="space-y-8">
      {/* 月曆排班組件 */}
      <div className="card-apple border border-border-light fade-in-apple">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-apple-heading text-text-primary">月曆排班</h3>

              {/* 客戶篩選器 */}
              {getLocalCustomerNames().length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-text-secondary">顯示客戶:</span>
                  <select
                    value={selectedCustomerFilter}
                    onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                    className="px-3 py-1 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                  >
                    <option value="all">全部客戶</option>
                    {getLocalCustomerNames().map(customerName => (
                      <option key={customerName} value={customerName}>
                        {customerName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 多天排班控制 */}
            <div className="flex items-center gap-4">
              {isMultiSelectMode && selectedDates.length > 0 && (
                <div className="text-sm text-text-secondary">
                  已選擇 {selectedDates.length} 天
                </div>
              )}

              {/* 顯示本地排程數量 */}
              {getTotalLocalSchedules() > 0 && (
                <div className="text-sm text-orange-600 font-medium">
                  {selectedCustomerFilter === 'all'
                    ? `待儲存 ${getTotalLocalSchedules()} 個排程`
                    : `${selectedCustomerFilter}: ${Object.values(getFilteredLocalSchedules()).reduce((total, daySchedules) => total + daySchedules.length, 0)} 個排程`
                  }
                </div>
              )}

              <button
                onClick={() => {
                  setIsMultiSelectMode(!isMultiSelectMode)
                  setSelectedDates([])
                  setSelectedDate(null)
                }}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                  isMultiSelectMode
                    ? 'bg-mingcare-blue text-white border-mingcare-blue'
                    : 'border-border-light hover:bg-bg-secondary text-text-secondary'
                }`}
              >
                {isMultiSelectMode ? '取消多選' : '多天排班'}
              </button>

              {isMultiSelectMode && selectedDates.length > 0 && (
                <button
                  onClick={() => {
                    setShowAddModal(true)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                >
                  確認排班
                </button>
              )}

              {/* 確認儲存按鈕 */}
              {getTotalLocalSchedules() > 0 && (
                <button
                  onClick={handleSaveLocalSchedules}
                  disabled={formSubmitting}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    formSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {formSubmitting ? '儲存中...' :
                    selectedCustomerFilter === 'all' ? '確認儲存全部' : `儲存 ${selectedCustomerFilter}`
                  }
                </button>
              )}
            </div>
          </div>

          {/* 月份導航 */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h4 className="text-lg font-medium text-text-primary">
              {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月 排班表
            </h4>

            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 週標題 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['週日', '週一', '週二', '週三', '週四', '週五', '週六'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-text-secondary bg-bg-secondary rounded-lg">
                {day}
              </div>
            ))}
          </div>

          {/* 月曆格子 - 排班視圖 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays && calendarDays.map((date, index) => {
              const dateStr = formatDateSafely(date)
              const isCurrentMonth = date.getMonth() === currentMonth
              const isToday = dateStr === formatDateSafely(new Date())
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const isSelected = selectedDates.includes(dateStr)
              // 合併本地排程和遠端排程
              const remoteSchedules = scheduleData[dateStr] || []
              const filteredLocalSchedules = getFilteredLocalSchedules()
              const localDaySchedules = filteredLocalSchedules[dateStr] || []
              const allSchedules = [...remoteSchedules, ...localDaySchedules]

              // 根據排程數量動態調整高度 - 考慮文字換行需要更多空間
              const minHeight = allSchedules.length > 0
                ? Math.max(140, 140 + (allSchedules.length - 1) * 90)
                : 140

              return (
                <div
                  key={index}
                  onClick={() => isCurrentMonth && handleDateClick(date)}
                  style={{ minHeight: `${minHeight}px` }}
                  className={`
                    p-2 border-2 rounded-lg cursor-pointer
                    transition-all duration-200 hover:shadow-md
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-300 border-gray-200' :
                      isSelected ? 'bg-green-100 border-green-500 border-2' :
                      isWeekend ? 'bg-blue-50 border-blue-200' : 'bg-bg-primary border-border-light'}
                    ${isToday ? 'ring-2 ring-mingcare-blue border-mingcare-blue' : ''}
                    hover:border-mingcare-blue
                  `}
                >
                  <div className={`
                    text-lg font-bold mb-3 flex justify-between items-center
                    ${isToday ? 'text-mingcare-blue' :
                      isCurrentMonth ? 'text-text-primary' : 'text-gray-300'}
                  `}>
                    <span>{date.getDate()}</span>
                    {isCurrentMonth && (
                      <span className="text-base text-green-600">
                        +
                      </span>
                    )}
                  </div>

                  {/* 排班內容 - 新格式 */}
                  {isCurrentMonth && (
                    <div className="space-y-2">
                      {/* 遠端排程 - 不可刪除 */}
                      {(remoteSchedules || []).map((schedule, i) => (
                        <div
                          key={`remote-${i}`}
                          className="text-base bg-white border border-gray-200 rounded p-3 shadow-sm"
                        >
                          {/* 第一行：客戶名稱/護理人員名稱 - 允許換行 */}
                          <div className="font-medium text-gray-800 mb-2 text-base break-words leading-tight">
                            {schedule.customer_name}/{schedule.care_staff_name}
                          </div>

                          {/* 第二行：服務類型 - 允許換行 */}
                          <div className="text-blue-600 mb-2 text-base break-words leading-tight">
                            {schedule.service_type}
                          </div>

                          {/* 第三行：開始時間-結束時間 */}
                          <div className="text-gray-600 text-base font-medium">
                            {schedule.start_time}-{schedule.end_time}
                          </div>
                        </div>
                      ))}

                      {/* 本地排程 - 可點擊編輯/刪除 */}
                      {(localDaySchedules || []).map((schedule, i) => (
                        <div
                          key={`local-${i}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLocalScheduleClick(dateStr, i, schedule)
                          }}
                          className="text-base bg-yellow-50 border-2 border-yellow-300 rounded p-3 shadow-sm cursor-pointer hover:bg-yellow-100 transition-colors relative group"
                        >
                          {/* 編輯按鈕提示 */}
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <span className="text-blue-700 font-bold text-sm">點擊編輯</span>
                          </div>

                          {/* 第一行：客戶名稱/護理人員名稱 - 允許換行 */}
                          <div className="font-medium text-gray-800 mb-2 text-base break-words leading-tight">
                            {schedule.customer_name}/{schedule.care_staff_name}
                          </div>

                          {/* 第二行：服務類型 - 允許換行 */}
                          <div className="text-blue-600 mb-2 text-base break-words leading-tight">
                            {schedule.service_type}
                          </div>

                          {/* 第三行：開始時間-結束時間 */}
                          <div className="text-gray-600 text-base font-medium">
                            {schedule.start_time}-{schedule.end_time}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 排班說明 */}
      <div className="card-apple border border-border-light fade-in-apple">
        <div className="p-6">
          <h3 className="text-apple-heading text-text-primary mb-4">排班說明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded"></div>
              <span className="text-text-secondary">週末</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-mingcare-blue rounded"></div>
              <span className="text-text-secondary">已安排服務</span>
            </div>
          </div>
        </div>
      </div>

      {/* 排班小結 */}
      <div className="card-apple border border-border-light fade-in-apple">
        <div className="p-6">
          <ScheduleSummaryView localSchedules={localSchedules} />
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
            setEditingLocalSchedule(null) // 清除編輯狀態
          }}
          selectedDate={selectedDate}
          selectedDates={selectedDates}
          existingRecord={editingLocalSchedule?.schedule ? {
            id: 'local-edit',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            service_date: editingLocalSchedule.schedule.service_date,
            customer_id: editingLocalSchedule.schedule.customer_id,
            customer_name: editingLocalSchedule.schedule.customer_name,
            phone: editingLocalSchedule.schedule.phone,
            service_address: editingLocalSchedule.schedule.service_address,
            start_time: editingLocalSchedule.schedule.start_time,
            end_time: editingLocalSchedule.schedule.end_time,
            service_hours: editingLocalSchedule.schedule.service_hours,
            care_staff_name: editingLocalSchedule.schedule.care_staff_name,
            service_fee: editingLocalSchedule.schedule.service_fee,
            staff_salary: editingLocalSchedule.schedule.staff_salary,
            hourly_rate: editingLocalSchedule.schedule.hourly_rate,
            hourly_salary: editingLocalSchedule.schedule.hourly_salary,
            service_type: editingLocalSchedule.schedule.service_type as any,
            project_category: editingLocalSchedule.schedule.project_category as any,
            project_manager: editingLocalSchedule.schedule.project_manager as any
          } : null}
          onSubmit={handleSubmitSchedule}
        />
      )}

      {/* 本地排程編輯模態框 */}
      {localScheduleEditModal.isOpen && (
        <LocalScheduleEditModal
          isOpen={localScheduleEditModal.isOpen}
          schedule={localScheduleEditModal.schedule}
          onClose={() => setLocalScheduleEditModal({
            isOpen: false,
            schedule: null,
            dateStr: '',
            scheduleIndex: -1
          })}
          onUpdate={handleUpdateLocalSchedule}
          onDelete={handleDeleteLocalScheduleFromModal}
          onEdit={handleEditLocalSchedule}
        />
      )}
    </div>
  )
}

// 報表頁面組件
function ReportsTab({ filters, setFilters, updateDateRange, exportLoading, handleExport, reportsViewMode, setReportsViewMode, onEdit, onDelete, refreshTrigger, onRefresh, recordUpdateTimes }: ReportsTabProps) {
  const [careStaffList, setCareStaffList] = useState<{ name_chinese: string }[]>([])
  const [careStaffLoading, setCareStaffLoading] = useState(true)

  // 客戶搜尋相關狀態
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSearchResult[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<CustomerSearchResult[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // 項目分類下拉選單狀態
  const [isProjectCategoryDropdownOpen, setIsProjectCategoryDropdownOpen] = useState(false)

  // 計算下拉選單位置
  const updateDropdownPosition = () => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.customer-search-container')) {
        setShowCustomerSuggestions(false)
      }
      if (!target.closest('.project-category-dropdown')) {
        setIsProjectCategoryDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 載入護理人員列表
  useEffect(() => {
    loadCareStaffList()
  }, [])

  const loadCareStaffList = async () => {
    try {
      setCareStaffLoading(true)
      const response = await getAllCareStaff()
      if (response.success && response.data) {
        setCareStaffList(response.data || [])
      }
    } catch (error) {
      console.error('載入護理人員列表失敗:', error)
    } finally {
      setCareStaffLoading(false)
    }
  }

  // 客戶搜尋函數
  const handleCustomerSearch = async (searchTerm: string) => {
    console.log('客戶搜尋開始:', searchTerm) // 除錯輸出

    if (searchTerm.length < 1) {
      setCustomerSuggestions([])
      setShowCustomerSuggestions(false)
      return
    }

    try {
      setCustomerSearchLoading(true)
      console.log('使用 Supabase 直接進行客戶搜尋') // 調試日誌

      // 直接使用 Supabase 客戶端查詢（正確的表名和欄位名）
      const { data, error } = await supabase
        .from('customer_personal_data')
        .select('customer_id, customer_name, phone, service_address')
        .or(`customer_name.ilike.%${searchTerm.trim()}%,customer_id.ilike.%${searchTerm.trim()}%,phone.ilike.%${searchTerm.trim()}%,service_address.ilike.%${searchTerm.trim()}%`)
        .limit(10)

      if (error) {
        console.error('Supabase 客戶搜尋錯誤:', error)
        setCustomerSuggestions([])
        setShowCustomerSuggestions(false)
        return
      }

      const results = (data || []).map(item => ({
        customer_id: item.customer_id || '',
        customer_name: item.customer_name || '',
        phone: item.phone || '',
        service_address: item.service_address || '',
        display_text: item.customer_name || '',
        type: 'customer' as const
      }))

      console.log('客戶搜尋結果:', results) // 調試日誌
      setCustomerSuggestions(results)
      setShowCustomerSuggestions(true)
      console.log('設定建議列表:', results.length, '筆資料') // 除錯輸出

    } catch (error) {
      console.error('客戶搜尋失敗:', error)
      setCustomerSuggestions([])
      setShowCustomerSuggestions(false)
    } finally {
      setCustomerSearchLoading(false)
    }
  }

  // 選擇客戶 (單選)
  const selectCustomer = (customer: CustomerSearchResult) => {
    setCustomerSearchTerm(customer.display_text)
    setFilters(prev => ({
      ...prev,
      searchTerm: customer.customer_name
    }))
    setShowCustomerSuggestions(false)
  }

  // 切換客戶選擇狀態 (多選)
  const toggleCustomerSelection = (customer: CustomerSearchResult) => {
    console.log('切換客戶選擇:', customer.customer_name) // 除錯輸出
    setSelectedCustomers(prev => {
      const isSelected = prev.some(c => c.customer_id === customer.customer_id)
      let newSelection

      if (isSelected) {
        newSelection = (prev || []).filter(c => c.customer_id !== customer.customer_id)
        console.log('移除客戶:', customer.customer_name) // 除錯輸出
      } else {
        newSelection = [...(prev || []), customer]
        console.log('新增客戶:', customer.customer_name) // 除錯輸出
      }

      return newSelection
    })

    // 選擇客戶後不要立即隱藏下拉選單，讓用戶可以繼續選擇
    // setCustomerSearchTerm('')
    // setShowCustomerSuggestions(false)
  }

  // 當選中客戶變化時，更新篩選條件
  useEffect(() => {
    if (selectedCustomers && selectedCustomers.length > 0) {
      // 使用選中客戶的 ID 陣列進行精確搜尋
      const customerIds = (selectedCustomers || []).map(c => c?.customer_id).filter(id => id)
      setFilters(prevFilters => ({
        ...prevFilters,
        selectedCustomerIds: customerIds,
        searchTerm: '' // 清空模糊搜尋條件
      }))
      console.log('設定客戶篩選條件:', customerIds) // 除錯輸出
    } else {
      // 沒有選中客戶時，清空客戶篩選條件
      setFilters(prevFilters => ({
        ...prevFilters,
        selectedCustomerIds: undefined,
        searchTerm: ''
      }))
      console.log('清除客戶篩選條件') // 除錯輸出
    }
  }, [selectedCustomers])

  // 移除選中的客戶
  const removeSelectedCustomer = (customer: CustomerSearchResult) => {
    toggleCustomerSelection(customer)
  }

  // 處理搜尋輸入變化
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchTerm(value)

    // 只在沒有選中客戶時才直接更新篩選條件
    if (!selectedCustomers || selectedCustomers.length === 0) {
      setFilters(prev => ({
        ...prev,
        searchTerm: value
      }))
    }

    // 觸發搜尋建議（降低門檻，輸入1個字符就開始搜尋）
    if (value.length >= 1) {
      updateDropdownPosition() // 更新位置
      handleCustomerSearch(value)
    } else {
      // 清空建議並隱藏下拉選單
      setCustomerSuggestions([])
      setShowCustomerSuggestions(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 搜尋與篩選 */}
      <div className="card-apple mb-4 sm:mb-6 fade-in-apple" style={{ overflow: 'visible' }}>
        <div className="card-apple-header">
          <h3 className="text-lg sm:text-xl font-semibold text-text-primary">搜尋與篩選</h3>
        </div>
        <div className="card-apple-content" style={{ overflow: 'visible' }}>
          <h2 className="text-apple-heading text-text-primary mb-6">篩選條件</h2>

          {/* 第一行：日期區間 + 快捷按鈕 - 移動端優化 */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="flex items-center space-x-2 bg-white border border-border-light rounded-lg px-3 py-2 w-full sm:w-auto">
              <svg className="w-4 h-4 text-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="border-none outline-none bg-transparent text-sm min-w-0 flex-1"
              />
              <span className="text-text-secondary">-</span>
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="border-none outline-none bg-transparent text-sm min-w-0 flex-1"
              />
            </div>

            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={() => {
                  const today = formatDateSafely(new Date())
                  setFilters(prev => ({
                    ...prev,
                    dateRange: { start: today, end: today }
                  }))
                }}
                className="px-3 py-2 text-xs sm:text-sm border border-border-light rounded-lg hover:bg-bg-secondary transition-all duration-200 whitespace-nowrap flex-1 sm:flex-none"
              >
                今日記錄
              </button>

              <button
                onClick={() => updateDateRange('thisMonth')}
                className="px-3 py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-mingcare-blue text-white whitespace-nowrap flex-1 sm:flex-none"
              >
                本月記錄
              </button>
            </div>
          </div>

          {/* 第二行：客戶搜尋 + 下拉篩選 - 移動端優化 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 relative">
            <div className="relative z-20 overflow-visible">
              <div className="relative customer-search-container overflow-visible">
                <svg className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="搜尋客戶（姓名/編號/電話）"
                  value={customerSearchTerm}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => {
                    console.log('輸入框被點擊') // 除錯輸出
                    updateDropdownPosition() // 更新位置
                    // 點擊輸入框時，如果有搜尋詞就重新搜尋，或顯示現有建議
                    if (customerSearchTerm.length >= 1) {
                      if (customerSuggestions.length > 0) {
                        setShowCustomerSuggestions(true)
                      } else {
                        handleCustomerSearch(customerSearchTerm)
                      }
                    }
                  }}
                  onBlur={() => {
                    console.log('輸入框失去焦點') // 除錯輸出
                    // 延遲隱藏下拉選單，讓點擊事件有時間執行
                    setTimeout(() => {
                      setShowCustomerSuggestions(false)
                    }, 150)
                  }}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent text-xs sm:text-sm"
                />

                {/* 客戶搜尋建議下拉選單 - 使用 Portal + 移動端優化 */}
                {showCustomerSuggestions && typeof window !== 'undefined' && createPortal(
                  <div
                    className="fixed bg-white border border-border-light rounded-lg shadow-2xl max-h-48 overflow-y-auto z-[9999]"
                    style={{
                      top: `${Math.min(dropdownPosition.top, window.innerHeight - 250)}px`,
                      left: `${Math.max(8, Math.min(dropdownPosition.left, window.innerWidth - dropdownPosition.width - 8))}px`,
                      width: `${Math.min(dropdownPosition.width, window.innerWidth - 16)}px`,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb'
                    }}
                    onMouseDown={(e) => {
                      console.log('下拉選單被點擊') // 除錯輸出
                      e.preventDefault() // 防止 blur 事件觸發
                    }}
                  >
                    {customerSearchLoading ? (
                      <div className="p-3 text-center text-text-secondary">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-mingcare-blue border-t-transparent mx-auto"></div>
                      </div>
                    ) : customerSuggestions && customerSuggestions.length > 0 ? (
                      customerSuggestions.map((customer, index) => (
                        <div
                          key={`${customer.customer_id}-${index}`}
                          className="p-3 hover:bg-bg-secondary cursor-pointer border-b border-border-light last:border-b-0 flex items-center transition-colors"
                          onMouseDown={(e) => {
                            console.log('選項被點擊:', customer.customer_name) // 除錯輸出
                            e.preventDefault()
                            e.stopPropagation()
                            toggleCustomerSelection(customer)
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCustomers.some(c => c.customer_id === customer.customer_id)}
                            className="mr-3 rounded border-border-light focus:ring-mingcare-blue pointer-events-none"
                            readOnly
                          />
                          <div className="flex-1">
                            <div className="font-medium text-text-primary">{customer.customer_name}</div>
                            <div className="text-sm text-text-secondary">
                              {customer.customer_id} {customer.phone && `• ${customer.phone}`}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-text-secondary text-sm">
                        沒有找到相關客戶
                      </div>
                    )}
                  </div>,
                  document.body
                )}
              </div>

              {/* 選中客戶的 chips 顯示 - 移動端優化 */}
              {selectedCustomers && selectedCustomers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                  {selectedCustomers && selectedCustomers.map((customer) => (
                    <div
                      key={customer.customer_id}
                      className="inline-flex items-center bg-mingcare-blue text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full"
                    >
                      <span className="mr-1 sm:mr-2 truncate max-w-[120px] sm:max-w-none">
                        {customer.customer_name} ({customer.customer_id})
                      </span>
                      <button
                        onClick={() => removeSelectedCustomer(customer)}
                        className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 sm:p-1 ml-1"
                      >
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="relative project-category-dropdown">
                <div
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent bg-white min-h-[44px] sm:min-h-[48px] cursor-pointer"
                  onClick={() => setIsProjectCategoryDropdownOpen(!isProjectCategoryDropdownOpen)}
                >
                  <div className="flex flex-wrap gap-1">
                    {filters.projectCategory && filters.projectCategory.length > 0 ? (
                      filters.projectCategory.map(category => {
                        const option = PROJECT_CATEGORY_OPTIONS.find(opt => opt.value === category)
                        return (
                          <span
                            key={category}
                            className="inline-flex items-center px-2 py-0.5 sm:py-1 bg-mingcare-blue/10 text-mingcare-blue text-xs sm:text-sm rounded-md"
                          >
                            <span className="truncate max-w-[80px] sm:max-w-none">{option?.label}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFilters(prev => ({
                                  ...prev,
                                  projectCategory: prev.projectCategory?.filter(c => c !== category) || []
                                }))
                              }}
                              className="ml-1 text-mingcare-blue hover:text-red-600"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })
                    ) : (
                      <span className="text-text-secondary text-xs sm:text-sm">選擇所屬項目（可多選）</span>
                    )}
                  </div>
                </div>
                <svg className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-text-secondary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>

                {isProjectCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-light rounded-lg shadow-lg z-50 max-h-48 sm:max-h-60 overflow-y-auto">
                    {PROJECT_CATEGORY_OPTIONS.map(option => {
                      const isSelected = filters.projectCategory?.includes(option.value) || false
                      return (
                        <div
                          key={option.value}
                          className={`px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-bg-secondary flex items-center justify-between text-xs sm:text-sm ${
                            isSelected ? 'bg-mingcare-blue/5 text-mingcare-blue' : 'text-text-primary'
                          }`}
                          onClick={() => {
                            const currentCategories = filters.projectCategory || []
                            const newCategories = isSelected
                              ? currentCategories.filter(c => c !== option.value)
                              : [...currentCategories, option.value]

                            setFilters(prev => ({
                              ...prev,
                              projectCategory: newCategories
                            }))
                          }}
                        >
                          <span className="truncate">{option.label}</span>
                          {isSelected && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-mingcare-blue flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="relative">
                <select
                  value={filters.serviceType || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    serviceType: e.target.value as ServiceType | undefined
                  }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent appearance-none bg-white pr-8 sm:pr-10 text-xs sm:text-sm"
                >
                  <option value="">選擇服務類型</option>
                  {SERVICE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-text-secondary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div>
              <CareStaffSearchableSelect
                careStaffList={careStaffList}
                value={filters.careStaffName || ''}
                onChange={(value) => setFilters(prev => ({
                  ...prev,
                  careStaffName: value
                }))}
                loading={careStaffLoading}
                placeholder="選擇護理人員"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 詳細列表 */}
      <div className="card-apple border border-border-light fade-in-apple">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <h3 className="text-apple-heading text-text-primary">服務記錄列表</h3>

            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* 檢視模式切換 */}
              <div className="flex items-center border border-border-light rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => setReportsViewMode('list')}
                  className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 flex-1 sm:flex-none ${
                    reportsViewMode === 'list'
                      ? 'bg-mingcare-blue text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>列表</span>
                </button>
                <button
                  onClick={() => setReportsViewMode('calendar')}
                  className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 flex-1 sm:flex-none ${
                    reportsViewMode === 'calendar'
                      ? 'bg-mingcare-blue text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>月曆</span>
                </button>
              </div>

              {/* 導出按鈕 */}
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs sm:text-sm"
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                    <span>導出中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>導出報表</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 服務記錄顯示 */}
          {reportsViewMode === 'list' ? (
            <DetailedRecordsList filters={filters} onRefresh={onRefresh} />
          ) : (
            <>
              <ReportsCalendarView 
                filters={filters} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                refreshTrigger={refreshTrigger} 
                recordUpdateTimes={recordUpdateTimes}
              />

              {/* 社區券機數統計 */}
              <div className="mt-8">
                <div className="card-apple border border-border-light fade-in-apple">
                  <div className="p-6">
                    <VoucherSummaryView filters={filters} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [kpiLoading, setKpiLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'reports'>('reports')
  const [reportsViewMode, setReportsViewMode] = useState<'list' | 'calendar'>('list') // 報表檢視模式
  const router = useRouter()

  // 狀態管理
  const [filters, setFilters] = useState<BillingSalaryFilters>(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // 使用本地日期格式，避免時區轉換問題
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      dateRange: {
        start: formatLocalDate(startOfMonth),
        end: formatLocalDate(endOfMonth)
      },
      projectCategory: [] // 初始化為空陣列
    }
  })

  const [kpiData, setKpiData] = useState<BusinessKPI | null>(null)
  const [categorySummary, setCategorySummary] = useState<ProjectCategorySummary[]>([])

  // 編輯相關狀態
  const [editingRecord, setEditingRecord] = useState<BillingSalaryRecord | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // 刷新觸發器
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 最後更新時間狀態
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  
  // 追蹤每個記錄的更新時間
  const [recordUpdateTimes, setRecordUpdateTimes] = useState<Record<string, Date>>({})

  // 從 localStorage 載入所有服務記錄的更新時間（頁面載入時）
  useEffect(() => {
    const loadRecordUpdateTimes = () => {
      const times: Record<string, Date> = {}
      const now = new Date()
      
      // 遍歷所有 localStorage 項目，找出服務記錄更新時間
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('record_update_')) {
          const recordId = key.replace('record_update_', '')
          const timeStr = localStorage.getItem(key)
          if (timeStr) {
            const updateTime = new Date(timeStr)
            const diffInMinutes = (now.getTime() - updateTime.getTime()) / (1000 * 60)
            
            // 只加載30分鐘內的更新時間
            if (diffInMinutes < 30) {
              times[recordId] = updateTime
            } else {
              // 清除超過30分鐘的舊記錄
              localStorage.removeItem(key)
            }
          }
        }
      }
      
      setRecordUpdateTimes(times)
    }

    loadRecordUpdateTimes()
  }, [])

  // 監聽服務記錄更新事件
  useEffect(() => {
    const handleRecordUpdate = (event: any) => {
      if (event?.detail?.recordId) {
        // 處理自定義事件
        const recordId = event.detail.recordId
        const updateTime = localStorage.getItem(`record_update_${recordId}`)
        if (updateTime) {
          setRecordUpdateTimes(prev => ({
            ...prev,
            [recordId]: new Date(updateTime)
          }))
        }
      }
    }

    const handleStorageUpdate = () => {
      // 處理 storage 事件或頁面載入時的檢查
      const updatedRecordInfo = localStorage.getItem('recordUpdated')
      if (updatedRecordInfo) {
        const { recordId, updateTime } = JSON.parse(updatedRecordInfo)
        setRecordUpdateTimes(prev => ({
          ...prev,
          [recordId]: new Date(updateTime)
        }))
        localStorage.removeItem('recordUpdated')
      }
    }

    // 檢查頁面載入時是否有更新
    handleStorageUpdate()

    // 監聽 storage 事件
    window.addEventListener('storage', handleStorageUpdate)
    
    // 監聽自定義事件（同頁面內的更新）
    window.addEventListener('recordUpdated', handleRecordUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageUpdate)
      window.removeEventListener('recordUpdated', handleRecordUpdate)
    }
  }, [])
  // 導出相關狀態
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('pdf')
  const [exportMode, setExportMode] = useState<'accounting' | 'payroll'>('accounting')
  const [payrollExportType, setPayrollExportType] = useState<'separate' | 'combined'>('combined') // 工資模式的子選項

  // 護理員分開PDF頁面狀態
  const [showStaffListPage, setShowStaffListPage] = useState(false)
  const [staffDownloadStatus, setStaffDownloadStatus] = useState<Record<string, string>>({}) // 記錄每個護理員的下載狀態 ('idle' | 'downloading' | 'downloaded' | 'error')
  const [staffList, setStaffList] = useState<string[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)

  // 默認選中的欄位：1.服務日期 2.客戶姓名 3.服務地址 4.服務類型 5.開始時間-結束時間 6.時數 7.護理員姓名
  const [exportColumns, setExportColumns] = useState({
    service_date: true,      // 1. 服務日期 (默認)
    customer_id: false,
    customer_name: true,     // 2. 客戶姓名 (默認)
    phone: false,
    service_address: true,   // 3. 服務地址 (默認)
    start_time: true,        // 5. 開始時間 (默認)
    end_time: true,          // 5. 結束時間 (默認)
    service_hours: true,     // 6. 時數 (默認)
    care_staff_name: true,   // 7. 護理員姓名 (默認)
    service_fee: false,
    staff_salary: false,
    service_profit: false,   // 新增：服務利潤
    hourly_rate: false,
    hourly_salary: false,
    service_type: true,      // 4. 服務類型 (默認)
    project_category: false,
    project_manager: false,
  })

  // 預設模式配置
  const exportModeConfigs = {
    accounting: {
      name: '對數模式',
      description: '包含服務費用和收費相關欄位',
      columns: {
        service_date: true,
        customer_name: true,
        service_address: true,
        start_time: true,
        end_time: true,
        service_hours: true,
        care_staff_name: true,
        service_type: true,
        service_fee: true,      // 對數模式自動包含
        service_profit: true,   // 對數模式自動包含：服務利潤
        hourly_rate: true,      // 對數模式自動包含
        customer_id: false,
        phone: false,
        staff_salary: false,
        hourly_salary: false,
        project_category: false,
        project_manager: false,
      }
    },
    payroll: {
      name: '工資模式',
      description: '包含護理員工資和薪酬相關欄位',
      columns: {
        service_date: true,
        customer_name: true,
        service_address: true,
        start_time: true,
        end_time: true,
        service_hours: true,
        care_staff_name: false,  // 工資模式不預設勾選，因為大標題會顯示
        service_type: true,
        staff_salary: true,     // 工資模式自動包含
        service_profit: false,  // 工資模式不包含服務利潤
        hourly_salary: true,    // 工資模式自動包含
        customer_id: false,
        phone: false,
        service_fee: false,
        hourly_rate: false,
        project_category: false,
        project_manager: false,
      }
    }
  }

  // 觸發資料刷新的函數
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // 主要組件的編輯和刪除處理函數
  const handleEdit = (record: BillingSalaryRecord) => {
    console.log('🖊️ 主要組件 handleEdit - 點擊編輯按鈕，記錄:', record)
    setEditingRecord(record)
    setIsEditModalOpen(true)
  }

  const handleEditSave = async (formData: BillingSalaryFormData) => {
    if (!editingRecord) return

    try {
      setExportLoading(true)
      console.log('🔄 主要組件 handleEditSave 開始更新記錄:', {
        recordId: editingRecord.id,
        formData
      })

      const response = await updateBillingSalaryRecord(editingRecord.id, formData)

      console.log('📝 主要組件 handleEditSave 更新結果:', response)

      if (response.success) {
        alert('記錄更新成功！')
        setIsEditModalOpen(false)
        setEditingRecord(null)
        // 觸發資料刷新
        handleRefresh()
        // 設置最後更新時間
        setLastUpdateTime(new Date())
        // 設置特定記錄的更新時間
        if (editingRecord) {
          const updateTime = new Date()
          const updateTimeStr = updateTime.toISOString()
          
          // 更新狀態
          setRecordUpdateTimes(prev => ({
            ...prev,
            [editingRecord.id]: updateTime
          }))
          
          // 持久化到 localStorage（30分鐘）
          localStorage.setItem(`record_update_${editingRecord.id}`, updateTimeStr)
          
          // 觸發自定義事件
          window.dispatchEvent(new CustomEvent('recordUpdated', {
            detail: { recordId: editingRecord.id }
          }))
        }
      } else {
        alert('更新記錄失敗：' + (response.error || '未知錯誤'))
      }
    } catch (error) {
      console.error('更新記錄失敗:', error)
      alert('更新失敗')
    } finally {
      setExportLoading(false)
    }
  }

  const handleEditCancel = () => {
    setIsEditModalOpen(false)
    setEditingRecord(null)
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('確定要刪除這筆記錄嗎？此操作無法撤銷。')) return

    try {
      setExportLoading(true)
      console.log('🗑️ 主要組件 handleDelete 開始刪除記錄:', recordId)

      const response = await deleteBillingSalaryRecord(recordId)

      console.log('🗑️ 主要組件 handleDelete 刪除結果:', response)

      if (response.success) {
        alert('記錄刪除成功！')
        // 觸發資料刷新
        handleRefresh()
        // 設置最後更新時間
        setLastUpdateTime(new Date())
        // 設置特定記錄的更新時間（刪除後會被清除，但先設置以防其他組件需要）
        setRecordUpdateTimes(prev => ({
          ...prev,
          [recordId]: new Date()
        }))
      } else {
        alert('刪除記錄失敗：' + (response.error || '未知錯誤'))
      }
    } catch (error) {
      console.error('刪除記錄失敗:', error)
      alert('刪除記錄失敗，請重試')
    } finally {
      setExportLoading(false)
    }
  }

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

  // 載入 KPI 和分類數據
  useEffect(() => {
    if (user && activeTab === 'overview') {
      loadKPIData()
    }
  }, [user, filters.dateRange, activeTab])

  const loadKPIData = async () => {
    setKpiLoading(true)
    try {
      // 載入 KPI 數據
      const kpiResult = await getBusinessKPI({
        start: filters.dateRange?.start || '',
        end: filters.dateRange?.end || ''
      })
      if (kpiResult.success && kpiResult.data) {
        setKpiData(kpiResult.data)
      }

      // 載入分類統計
      const categoryResult = await getProjectCategorySummary({
        start: filters.dateRange?.start || '',
        end: filters.dateRange?.end || ''
      })
      if (categoryResult.success && categoryResult.data) {
        setCategorySummary(categoryResult.data)
      }
    } catch (error) {
      console.error('載入數據失敗:', error)
    } finally {
      setKpiLoading(false)
    }
  }

  // 載入護理員列表 (當需要顯示護理員下載頁面時)
  useEffect(() => {
    if (showStaffListPage) {
      const loadStaffList = async () => {
        setLoadingStaff(true)
        try {
          const response = await fetchBillingSalaryRecords(filters, 1, 10000)
          if (response.success && response.data) {
            // 從當前數據中提取護理員列表
            const uniqueStaff = Array.from(new Set(
              response.data.data
                .filter((record: BillingSalaryRecord) => record.care_staff_name && record.care_staff_name.trim() !== '')
                .map((record: BillingSalaryRecord) => record.care_staff_name)
            )).sort() as string[]

            setStaffList(uniqueStaff)
          }
        } catch (error) {
          console.error('載入護理員列表失敗:', error)
        } finally {
          setLoadingStaff(false)
        }
      }

      loadStaffList()
    }
  }, [showStaffListPage, filters])

  const updateDateRange = (preset: DateRangePreset) => {
    const now = new Date()
    let start: Date, end: Date

    switch (preset) {
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        end = now
        break
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        end = now
        break
      case 'last90days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        end = now
        break
      case 'thisMonth':
        // 確保使用本地時間，避免時區問題
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        // 確保使用本地時間，避免時區問題
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last3months':
        // 最近3個月
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last6months':
        // 最近6個月
        start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'thisQuarter':
        // 本季度
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        start = new Date(now.getFullYear(), quarterStart, 1)
        end = new Date(now.getFullYear(), quarterStart + 3, 0)
        break
      case 'thisYear':
        // 本年度
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 12, 0)
        break
      default:
        return
    }

    // 使用本地日期格式，避免時區轉換問題
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: formatLocalDate(start),
        end: formatLocalDate(end)
      }
    }))
  }

  // 處理導出模式切換
  const handleExportModeChange = (mode: 'accounting' | 'payroll') => {
    setExportMode(mode)
    // 所有模式都自動配置預設欄位
    setExportColumns(exportModeConfigs[mode].columns)
  }

  // 導出功能 - 支持PDF和項目選擇
  const handleExport = () => {
    setShowExportModal(true)
  }

  const handleExportConfirm = async () => {
    setExportLoading(true)
    setShowExportModal(false)

    try {
      // 獲取要導出的數據
      const response = await fetchBillingSalaryRecords(filters, 1, 10000) // 獲取所有記錄

      if (!response.success || !response.data) {
        throw new Error('無法獲取數據')
      }

      let records = response.data.data || []

      // 對數模式需要特殊排序：先按客戶名稱，再按日期
      if (exportMode === 'accounting') {
        records = records.sort((a, b) => {
          // 1. 先按客戶名稱排序
          const nameComparison = (a.customer_name || '').localeCompare(b.customer_name || '', 'zh-TW')
          if (nameComparison !== 0) {
            return nameComparison
          }

          // 2. 客戶名稱相同時，再按日期排序
          const dateA = new Date(a.service_date || '')
          const dateB = new Date(b.service_date || '')
          return dateA.getTime() - dateB.getTime()
        })
      }

      // 根據選擇的欄位過濾數據
      const selectedColumns = Object.entries(exportColumns)
        .filter(([_, selected]) => selected)
        .map(([column, _]) => column)

      if (exportFormat === 'pdf') {
        // 工資模式且選擇分開PDF的特殊處理
        if (exportMode === 'payroll' && payrollExportType === 'separate') {
          // 跳轉到護理員列表頁面
          setShowExportModal(false)
          setShowStaffListPage(true)
          setStaffDownloadStatus({}) // 重置下載狀態
        } else {
          await exportToPDF(records, selectedColumns)
        }
      } else {
        await exportToCSVCustom(records, selectedColumns)
      }

      alert('導出成功')
    } catch (error) {
      console.error('Export error:', error)
      alert('導出時發生錯誤')
    } finally {
      setExportLoading(false)
    }
  }

  const downloadSingleStaffPDF = async (staffName: string, records: any[], columns: string[]) => {
    try {
      // 篩選該護理員的記錄
      const staffRecords = (records || []).filter(record =>
        (record.care_staff_name || '未知護理人員') === staffName
      )

      if (staffRecords.length === 0) {
        alert('該護理員沒有記錄')
        return
      }

      // 按日期排序
      staffRecords.sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime())

      await generateAndDownloadStaffPDF(staffRecords, columns, staffName)

      // 更新下載狀態
      setStaffDownloadStatus(prev => ({
        ...prev,
        [staffName]: 'downloaded'
      }))

    } catch (error) {
      console.error('下載護理員PDF時發生錯誤:', error)
      alert('下載護理員PDF時發生錯誤')
    }
  }

  const generateAndDownloadStaffPDF = async (records: any[], columns: string[], staffName: string) => {
    // 查詢員工資料
    let staffData = null
    try {
      const { data, error } = await supabase
        .from('care_staff_profiles')
        .select('staff_id, name_chinese, name_english, hkid')
        .eq('name_chinese', staffName)
        .single()

      if (!error && data) {
        staffData = data
      }
    } catch (error) {
      console.error('查詢護理人員資料失敗:', error)
    }

    // 完整的欄位標籤映射
    const columnLabels: Record<string, string> = {
      service_date: '服務日期',
      customer_id: '客戶編號',
      customer_name: '客戶姓名',
      phone: '客戶電話',
      service_address: '服務地址',
      start_time: '開始時間',
      end_time: '結束時間',
      service_hours: '服務時數',
      care_staff_name: '護理員姓名',
      service_fee: '服務費用',
      staff_salary: '護理員工資',
      service_profit: '服務利潤',
      hourly_rate: '每小時收費',
      hourly_salary: '每小時工資',
      service_type: '服務類型',
      project_category: '所屬項目',
      project_manager: '項目經理',
      // 舊欄位名稱兼容
      service_time: '服務時間',
      duration_hours: '時數',
      billing_amount: '金額',
      customer_address: '客戶地址',
      notes: '備註'
    }

    // 計算總結數據
    const totalRecords = records.length
    const totalHours = records.reduce((sum, record) => {
      const hours = parseFloat(record.service_hours || record.duration_hours || '0')
      return sum + (isNaN(hours) ? 0 : hours)
    }, 0)
    const totalSalary = records.reduce((sum, record) => {
      const salary = parseFloat(record.staff_salary || record.billing_amount || '0')
      return sum + (isNaN(salary) ? 0 : salary)
    }, 0)

    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // 生成YYYY-MM格式（根據記錄的第一個日期）
    const firstRecord = records[0]
    const serviceDate = new Date(firstRecord?.service_date || today)
    const yearMonth = `${serviceDate.getFullYear()}-${String(serviceDate.getMonth() + 1).padStart(2, '0')}`

    // 創建HTML內容
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${staffName} ${yearMonth}工資明細</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: "PingFang TC", "Microsoft JhengHei", "SimHei", sans-serif;
            margin: 0;
            padding: 15px;
            font-size: max(11px, 0.8vw);
            line-height: 1.3;
            min-font-size: 9px;
          }
          @media print {
            body {
              font-size: 11px !important;
            }
            .responsive-text {
              font-size: max(9px, 10px) !important;
            }
            .keep-together {
              page-break-inside: avoid;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
          .header-container {
            margin-bottom: 20px;
            position: relative;
          }
          .company-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }
          .company-info {
            flex: 1;
            text-align: left;
          }
          .company-logo {
            flex: 0 0 180px;
            text-align: center;
          }
          .company-logo img {
            max-width: 180px;
            max-height: 180px;
          }
          .company-stamp {
            flex: 0 0 60px;
            text-align: center;
          }
          .company-stamp img {
            max-width: 60px;
            max-height: 60px;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .company-details {
            font-size: 11px;
            line-height: 1.4;
          }
          .staff-info {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 8px;
            margin-bottom: 15px;
          }
          .staff-info-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 6px;
            color: #495057;
          }
          .staff-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            font-size: 10px;
          }
          .staff-field {
            display: flex;
          }
          .staff-field strong {
            width: 70px;
            color: #495057;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .subtitle {
            font-size: 12px;
            margin-bottom: 5px;
          }
          .summary {
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: max(10px, 0.7vw);
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px 4px;
            text-align: left;
            font-size: max(10px, 0.7vw);
            word-wrap: break-word;
          }
          @media print {
            table {
              font-size: 10px !important;
            }
            th, td {
              font-size: 10px !important;
              padding: 4px 3px;
            }
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <!-- 公司信息與標誌 -->
          <div class="company-header">
            <div class="company-info">
              <div class="company-name">明家居家護理服護有限公司</div>
              <div class="company-details">
                地址：新界荃灣橫龍街43-47號龍力工業大廈3樓308室<br>
                電話：+852 2338 1811<br>
                電郵：info@mingcarehome.com<br>
                網址：www.mingcarehome.com
              </div>
            </div>
            <div class="company-logo">
              <img src={getAssetPath("images/mingcare-logo.png")} alt="明家居家護理標誌" onerror="this.style.display='none'">
            </div>
          </div>

          <!-- 護理人員資料 -->
          ${staffData ? `
          <div class="staff-info">
            <div class="staff-info-title">護理人員資料</div>
            <div class="staff-details">
              <div class="staff-field">
                <strong>中文姓名:</strong>
                <span>${staffData.name_chinese || staffName}</span>
              </div>
              <div class="staff-field">
                <strong>英文姓名:</strong>
                <span>${staffData.name_english || ''}</span>
              </div>
              <div class="staff-field">
                <strong>員工編號:</strong>
                <span>${staffData.staff_id || ''}</span>
              </div>
              <div class="staff-field">
                <strong>身份證號:</strong>
                <span>${staffData.hkid ? staffData.hkid.substring(0, Math.max(0, staffData.hkid.length - 4)) + 'xxxx' : ''}</span>
              </div>
            </div>
          </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${columnLabels[col] || col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${records.map(record => `
              <tr>
                ${columns.map(col => {
                  let value = ''
                  switch (col) {
                    case 'service_date':
                      const date = new Date(record[col])
                      value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                      break
                    case 'start_time':
                    case 'end_time':
                      // 如果時間格式是 HH:MM，直接顯示；如果是完整日期時間，提取時間部分
                      const timeValue = record[col] || ''
                      if (timeValue.includes('T') || timeValue.includes(' ')) {
                        const timeDate = new Date(timeValue)
                        value = `${String(timeDate.getHours()).padStart(2, '0')}:${String(timeDate.getMinutes()).padStart(2, '0')}`
                      } else {
                        value = timeValue
                      }
                      break
                    case 'service_hours':
                    case 'duration_hours':
                      const hours = parseFloat(record[col] || '0')
                      value = isNaN(hours) ? '0' : hours.toString()
                      break
                    case 'staff_salary':
                    case 'service_fee':
                    case 'hourly_rate':
                    case 'hourly_salary':
                    case 'billing_amount':
                      const num = parseFloat(record[col] || '0')
                      value = isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`
                      break
                    case 'service_profit':
                      const serviceFee = parseFloat(record.service_fee || '0')
                      const staffSalary = parseFloat(record.staff_salary || '0')
                      const profit = serviceFee - staffSalary
                      value = `$${profit.toFixed(2)}`
                      break
                    default:
                      value = String(record[col] || '')
                  }
                  return `<td>${value}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- 底部佈局：左邊統計，右邊印章 -->
        <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
          <!-- 左邊：統計資訊 -->
          <div style="flex: 1;">
            <div style="margin-bottom: 5px; font-size: 12px;"><strong>服務次數:</strong> ${totalRecords} 次</div>
            <div style="margin-bottom: 5px; font-size: 12px;"><strong>總時數:</strong> ${totalHours.toFixed(1)} 小時</div>
            <div style="font-weight: bold; font-size: 14px; color: #000000;"><strong>總工資:</strong> $${totalSalary.toFixed(2)}</div>
          </div>
          <!-- 右邊：公司印章 -->
          <div style="flex: 0 0 auto;">
            <img src="/images/company-stamp.png" alt="公司印章" style="width: 80px; height: auto;" onerror="this.style.display='none'">
          </div>
        </div>
      </body>
      </html>
    `

    // 在新視窗中開啟並列印
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      })
    }
  }

  const generateAndDownloadSummaryPDF = async (summaryData: { staffName: string; totalAmount: number; recordCount: number }[]) => {
    const grandTotal = summaryData.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalRecords = summaryData.reduce((sum, item) => sum + item.recordCount, 0)

    const today = new Date()
    const dateStr = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`

    // 創建HTML內容
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>工資總結報表</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: "PingFang TC", "Microsoft JhengHei", "SimHei", sans-serif;
            margin: 0;
            padding: 15px;
            font-size: max(11px, 0.8vw);
            line-height: 1.3;
            min-font-size: 9px;
          }
          @media print {
            body {
              font-size: 11px !important;
            }
            .keep-together {
              page-break-inside: avoid;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
          .header-container {
            margin-bottom: 20px;
            position: relative;
          }
          .company-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }
          .company-info {
            flex: 1;
            text-align: left;
          }
          .company-logo {
            flex: 0 0 180px;
            text-align: center;
          }
          .company-logo img {
            max-width: 180px;
            max-height: 180px;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .company-details {
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .subtitle {
            font-size: 12px;
            margin-bottom: 5px;
          }
          .summary {
            margin-bottom: 15px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin: 15px 0 8px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
            font-size: max(11px, 0.8vw);
          }
          @media print {
            th, td {
              font-size: 11px !important;
            }
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .total-row {
            background-color: #e6f3ff;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer-container {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .company-stamp {
            flex: 0 0 60px;
            text-align: left;
          }
          .company-stamp img {
            max-width: 60px;
            max-height: 60px;
          }
          .footer-company-info {
            flex: 1;
            text-align: right;
            font-size: 10px;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <!-- 公司信息與標誌 -->
          <div class="company-header">
            <div class="company-info">
              <div class="company-name">明家居家護理服護有限公司</div>
              <div class="company-details">
                地址：新界荃灣橫龍街43-47號龍力工業大廈3樓308室<br>
                電話：+852 2338 1811<br>
                電郵：info@mingcarehome.com<br>
                網址：www.mingcarehome.com
              </div>
            </div>
            <div class="company-logo">
              <img src={getAssetPath("images/mingcare-logo.png")} alt="明家居家護理標誌" onerror="this.style.display='none'">
            </div>
          </div>
        </div>

        <div class="summary">
          <div>總護理人員數: ${summaryData.length}人</div>
          <div>總記錄數: ${totalRecords}筆</div>
          <div>總金額: $${grandTotal.toFixed(2)}</div>
        </div>

        <div class="section-title">各護理人員明細:</div>

        <table>
          <thead>
            <tr>
              <th>護理人員</th>
              <th>記錄數</th>
              <th>總金額</th>
            </tr>
          </thead>
          <tbody>
            ${summaryData.map(item => `
              <tr>
                <td>${item.staffName}</td>
                <td>${item.recordCount}</td>
                <td>$${item.totalAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>總計</td>
              <td>${totalRecords}</td>
              <td>$${grandTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- 底部佈局：左邊統計，右邊印章 -->
        <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
          <!-- 左邊：統計資訊 -->
          <div style="flex: 1;">
            <div style="margin-bottom: 5px; font-size: 12px;"><strong>總護理人員數:</strong> ${summaryData.length}人</div>
            <div style="margin-bottom: 5px; font-size: 12px;"><strong>總記錄數:</strong> ${totalRecords}筆</div>
            <div style="font-weight: bold; font-size: 14px; color: #000000;"><strong>總金額:</strong> $${grandTotal.toFixed(2)}</div>
          </div>
          <!-- 右邊：公司印章 -->
          <div style="flex: 0 0 auto;">
            <img src="/images/company-stamp.png" alt="公司印章" style="width: 80px; height: auto;" onerror="this.style.display='none'">
          </div>
        </div>
      </body>
      </html>
    `

    // 在新視窗中開啟並列印
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      })
    }
  }

  const exportToPDF = async (records: any[], columns: string[]) => {
    try {
      // 欄位標籤映射 - 使用中文標題
      const columnLabels: Record<string, string> = {
        service_date: '服務日期',
        customer_id: '客戶編號',
        customer_name: '客戶姓名',
        phone: '客戶電話',
        service_address: '服務地址',
        start_time: '開始時間',
        end_time: '結束時間',
        service_hours: '服務時數',
        care_staff_name: '護理員姓名',
        service_fee: '服務費用',
        staff_salary: '護理員工資',
        hourly_rate: '每小時收費',
        hourly_salary: '每小時工資',
        service_type: '服務類型',
        project_category: '所屬項目',
        project_manager: '項目經理'
      }

      // 檢查是否為對數模式
      const isAccountingMode = exportMode === 'accounting'

      let tableContent = ''
      let summaryContent = ''

      if (isAccountingMode) {
        // 對數模式：按客戶分組並為每個客戶創建獨立表格
        const customerGroups: Record<string, any[]> = {}
        ;(records || []).forEach(record => {
          const customerName = record.customer_name || '未知客戶'
          if (!customerGroups[customerName]) {
            customerGroups[customerName] = []
          }
          customerGroups[customerName].push(record)
        })

        // 大結統計
        let totalCustomers = Object.keys(customerGroups).length
        let totalServices = records.length
        let totalHours = 0
        let totalFees = 0

        // 為每個客戶生成獨立的表格
        const customerTables = Object.keys(customerGroups).map((customerName, index) => {
          const customerRecords = customerGroups[customerName]

          // 客戶小結計算
          let customerHours = 0
          let customerFees = 0

          // 生成客戶記錄
          const customerRows = customerRecords.map(record => {
            // 累計小結數據
            customerHours += parseFloat(record.service_hours || '0')
            customerFees += parseFloat(record.service_fee || '0')

            return `
              <tr>
                ${columns.map(col => {
                  const value = record[col] || ''
                  const isNumber = ['hourly_rate', 'hourly_salary', 'service_hours', 'service_fee', 'staff_salary', 'service_profit'].includes(col)
                  return `<td class="${isNumber ? 'number' : ''}">${String(value)}</td>`
                }).join('')}
              </tr>
            `
          }).join('')

          // 客戶小結行
          const subtotalRow = `
            <tr class="customer-subtotal">
              <td colspan="${columns.length - 2}" style="text-align: right; font-weight: bold; background-color: #f0f8ff; border-top: 2px solid #428bca;">
                ${customerName} 小結：
              </td>
              <td style="text-align: right; font-weight: bold; background-color: #f0f8ff; border-top: 2px solid #428bca;">
                ${customerHours.toFixed(1)}
              </td>
              <td style="text-align: right; font-weight: bold; background-color: #f0f8ff; border-top: 2px solid #428bca;">
                $${customerFees.toFixed(2)}
              </td>
            </tr>
          `

          // 累計大結數據
          totalHours += customerHours
          totalFees += customerFees

          // 生成客戶獨立表格
          return `
            <div class="customer-group">
              <h3 style="color: #428bca; margin: 20px 0 10px 0; font-size: 16px; border-bottom: 1px solid #428bca; padding-bottom: 5px;">
                ${customerName} (${customerRecords.length} 次服務)
              </h3>
              <table>
                <thead>
                  <tr>
                    ${columns.map(col => `<th>${columnLabels[col] || col}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${customerRows}
                  ${subtotalRow}
                </tbody>
              </table>
            </div>
          `
        }).join('')

        tableContent = customerTables

        // 計算服務類型統計
        const serviceTypeStats: Record<string, {
          count: number
          hours: number
          amount: number
        }> = {}

        records.forEach(record => {
          const serviceType = record.service_type || '未知服務類型'
          const hours = parseFloat(record.service_hours || '0')
          const amount = parseFloat(record.service_fee || '0')

          if (!serviceTypeStats[serviceType]) {
            serviceTypeStats[serviceType] = { count: 0, hours: 0, amount: 0 }
          }

          serviceTypeStats[serviceType].count += 1
          serviceTypeStats[serviceType].hours += hours
          serviceTypeStats[serviceType].amount += amount
        })

        // 生成服務類型統計表格
        const serviceTypeTable = Object.keys(serviceTypeStats)
          .sort()
          .map(serviceType => {
            const stats = serviceTypeStats[serviceType]
            return `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${serviceType}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${stats.count}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${stats.hours.toFixed(1)}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${stats.amount.toFixed(2)}</td>
              </tr>
            `
          }).join('')

        // 大結內容
        summaryContent = `
          <div style="margin-top: 30px; padding: 20px; border: 2px solid #428bca; background-color: #f8f9fa; page-break-inside: avoid;">
            <h3 style="text-align: center; color: #428bca; margin-bottom: 15px;">總結報告</h3>

            <!-- 總覽統計 -->
            <div style="display: flex; justify-content: space-around; font-size: 14px; margin-bottom: 20px;">
              <div style="text-align: center;">
                <div style="font-weight: bold; color: #428bca;">客戶總數</div>
                <div style="font-size: 18px; font-weight: bold;">${totalCustomers}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-weight: bold; color: #428bca;">服務次數</div>
                <div style="font-size: 18px; font-weight: bold;">${totalServices}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-weight: bold; color: #428bca;">總服務時數</div>
                <div style="font-size: 18px; font-weight: bold;">${totalHours.toFixed(1)}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-weight: bold; color: #428bca;">總服務費用</div>
                <div style="font-size: 18px; font-weight: bold;">$${totalFees.toFixed(2)}</div>
              </div>
            </div>

            <!-- 服務類型細分統計 -->
            <div style="margin-top: 20px;">
              <h4 style="color: #428bca; margin-bottom: 10px; text-align: center;">服務類型統計明細</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background-color: #428bca; color: white;">
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">服務類型</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">次數</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">時數</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">金額</th>
                  </tr>
                </thead>
                <tbody>
                  ${serviceTypeTable}
                  <tr style="background-color: #e7f3ff; font-weight: bold; border-top: 2px solid #428bca;">
                    <td style="padding: 8px; border: 1px solid #ddd;">總計</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalServices}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalHours.toFixed(1)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${totalFees.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `

      } else if (exportMode === 'payroll') {
        // 工資模式：按護理人員分組，每人一頁
        const staffGroups: Record<string, any[]> = {}
        records.forEach(record => {
          const staffName = record.care_staff_name || '未知護理人員'
          if (!staffGroups[staffName]) {
            staffGroups[staffName] = []
          }
          staffGroups[staffName].push(record)
        })

        // 為每個護理人員排序（先按護理人員名稱，再按日期）
        const sortedStaffNames = Object.keys(staffGroups).sort()

        // 總統計
        let totalStaff = Object.keys(staffGroups).length
        let totalServices = records.length
        let totalHours = 0
        let totalSalary = 0

        // 為每個護理人員生成獨立的表格
        const staffTables = sortedStaffNames.map((staffName, index) => {
          const staffRecords = staffGroups[staffName]

          // 按日期排序
          staffRecords.sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime())

          // 計算該護理人員的統計
          let staffHours = 0
          let staffSalary = 0

          staffRecords.forEach(record => {
            const hours = parseFloat(record.service_hours || record.duration_hours || '0')
            const salary = parseFloat(record.staff_salary || '0')
            staffHours += isNaN(hours) ? 0 : hours
            staffSalary += isNaN(salary) ? 0 : salary
          })

          totalHours += staffHours
          totalSalary += staffSalary

          return `
            <div class="staff-group">
              <div class="staff-header">
                <h2>${staffName}</h2>
                <div class="staff-info">記錄數: ${staffRecords.length}筆</div>
              </div>

              <table class="data-table">
                <thead>
                  <tr>
                    ${columns.map(col => `<th>${columnLabels[col] || col}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${staffRecords.map(record => `
                    <tr>
                      ${columns.map(col => {
                        const value = record[col] || ''
                        const isNumber = ['hourly_rate', 'hourly_salary', 'service_hours', 'duration_hours', 'service_fee', 'staff_salary', 'service_profit'].includes(col)
                        let displayValue = String(value)

                        // 特殊格式化
                        if (col === 'service_date' && value) {
                          const date = new Date(value)
                          const year = date.getFullYear()
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const day = String(date.getDate()).padStart(2, '0')
                          displayValue = `${year}-${month}-${day}`
                        } else if (col === 'service_profit') {
                          const serviceFee = parseFloat(record.service_fee || '0')
                          const staffSalary = parseFloat(record.staff_salary || '0')
                          const profit = serviceFee - staffSalary
                          displayValue = profit.toFixed(2)
                        } else if (isNumber && value) {
                          const num = parseFloat(value)
                          displayValue = isNaN(num) ? '0' : num.toFixed(2)
                        }

                        return `<td class="${isNumber ? 'number' : ''}">${displayValue}</td>`
                      }).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="staff-summary">
                <div class="summary-row">
                  <div class="summary-item">
                    <span class="label">服務時數:</span>
                    <span class="value">${staffHours.toFixed(1)} 小時</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">護理員工資:</span>
                    <span class="value">$${staffSalary.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          `
        }).join('')

        tableContent = staffTables

        // 總結頁面
        summaryContent = `
          <div class="total-summary-page">
            <div class="summary-header">
              <h2>工資總結</h2>
            </div>
            <div class="summary-stats">
              <div class="stat-row">
                <div class="stat-item">
                  <div class="stat-label">護理員數量</div>
                  <div class="stat-value">${totalStaff} 人</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">總服務時數</div>
                  <div class="stat-value">${totalHours.toFixed(1)} 小時</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">總工資</div>
                  <div class="stat-value">$${totalSalary.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div class="staff-summary-table">
              <h3>各護理人員明細</h3>
              <table class="summary-table">
                <thead>
                  <tr>
                    <th>護理人員</th>
                    <th>服務次數</th>
                    <th>服務時數</th>
                    <th>工資</th>
                  </tr>
                </thead>
                <tbody>
                  ${sortedStaffNames.map(staffName => {
                    const staffRecords = staffGroups[staffName]
                    const staffHours = staffRecords.reduce((sum, record) => {
                      const hours = parseFloat(record.service_hours || record.duration_hours || '0')
                      return sum + (isNaN(hours) ? 0 : hours)
                    }, 0)
                    const staffSalary = staffRecords.reduce((sum, record) => {
                      const salary = parseFloat(record.staff_salary || '0')
                      return sum + (isNaN(salary) ? 0 : salary)
                    }, 0)

                    return `
                      <tr>
                        <td>${staffName}</td>
                        <td class="number">${staffRecords.length}</td>
                        <td class="number">${staffHours.toFixed(1)}</td>
                        <td class="number">$${staffSalary.toFixed(2)}</td>
                      </tr>
                    `
                  }).join('')}
                  <tr class="total-row">
                    <td><strong>總計</strong></td>
                    <td class="number"><strong>${totalServices}</strong></td>
                    <td class="number"><strong>${totalHours.toFixed(1)}</strong></td>
                    <td class="number"><strong>$${totalSalary.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `

      } else {
        // 非對數模式：普通表格
        tableContent = records.map(record => `
          <tr>
            ${columns.map(col => {
              let value = record[col] || ''
              const isNumber = ['hourly_rate', 'hourly_salary', 'service_hours', 'service_fee', 'staff_salary', 'service_profit'].includes(col)

              // 特殊處理服務利潤
              if (col === 'service_profit') {
                const serviceFee = parseFloat(record.service_fee || '0')
                const staffSalary = parseFloat(record.staff_salary || '0')
                value = (serviceFee - staffSalary).toFixed(2)
              }

              return `<td class="${isNumber ? 'number' : ''}">${String(value)}</td>`
            }).join('')}
          </tr>
        `).join('')
      }

      // 創建可打印的HTML內容
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>茗護護理服務記錄報表</title>
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm;
              }
              body {
                margin: 0;
                font-size: 10px;
              }
              .customer-group {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              .customer-group:last-child {
                page-break-after: auto;
              }
              .staff-group {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              .staff-group:last-child {
                page-break-after: auto;
              }
              .total-summary-page {
                page-break-before: auto;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微軟雅黑", Arial, sans-serif;
              font-size: max(10px, 0.7vw);
              line-height: 1.3;
              margin: 0;
              padding: 8px;
              min-font-size: 9px;
            }
            @media print {
              body {
                font-size: 10px !important;
              }
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
            }
            .header h1 {
              margin: 0;
              font-size: 16px;
              color: #333;
            }
            .header h2 {
              margin: 5px 0;
              font-size: 12px;
              color: #666;
            }
            .meta {
              text-align: center;
              margin: 8px 0;
              font-size: 9px;
              color: #888;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
              font-size: max(9px, 0.6vw);
            }
            th, td {
              border: 1px solid #ddd;
              padding: 3px 4px;
              text-align: left;
              word-wrap: break-word;
            }
            @media print {
              table {
                font-size: 9px !important;
              }
              th, td {
                font-size: 9px !important;
                padding: 2px 3px;
              }
            }
            th {
              background-color: #428bca;
              color: white;
              font-weight: bold;
              text-align: center;
              font-size: 10px;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .number {
              text-align: right;
            }
            .customer-subtotal {
              background-color: #f0f8ff !important;
            }
            .staff-group {
              margin-bottom: 30px;
            }
            .staff-header {
              background-color: #e8f4fd;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #428bca;
            }
            .staff-header h2 {
              margin: 0;
              color: #2c5282;
              font-size: 18px;
            }
            .staff-info {
              color: #666;
              font-size: 14px;
              margin-top: 5px;
            }
            .staff-summary {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
              border: 1px solid #e0e0e0;
            }
            .summary-row {
              display: flex;
              justify-content: space-around;
              align-items: center;
            }
            .summary-item {
              text-align: center;
              flex: 1;
            }
            .summary-item .label {
              display: block;
              font-weight: bold;
              color: #666;
              font-size: 13px;
              margin-bottom: 5px;
            }
            .summary-item .value {
              display: block;
              font-size: 16px;
              font-weight: bold;
              color: #2c5282;
            }
            .total-summary-page {
              padding: 20px;
            }
            .summary-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #428bca;
              padding-bottom: 15px;
            }
            .summary-header h2 {
              margin: 0;
              color: #2c5282;
              font-size: 24px;
            }
            .summary-stats {
              margin-bottom: 30px;
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
            }
            .stat-row {
              display: flex;
              justify-content: space-around;
              align-items: center;
            }
            .stat-item {
              text-align: center;
              flex: 1;
            }
            .stat-label {
              font-weight: bold;
              color: #666;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .stat-value {
              font-size: 20px;
              font-weight: bold;
              color: #2c5282;
            }
            .staff-summary-table h3 {
              color: #2c5282;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .summary-table {
              margin-top: 0;
            }
            .total-row {
              background-color: #e8f4fd !important;
              font-weight: bold;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media screen {
              .print-button {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                z-index: 1000;
              }
              .print-button:hover {
                background: #0056b3;
              }
            }
            @media print {
              .print-button { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">列印 / 儲存為PDF</button>

          <div class="header">
            <!-- Company Info and Logo Row -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
              <!-- Left: Company Info -->
              <div style="flex: 1; font-size: 12px; line-height: 1.4; text-align: left;">
                <div style="font-weight: bold; color: #2c5aa0;">明家居家護理服護有限公司</div>
                <div>地址：新界荃灣橫龍街43-47號龍力工業大廈3樓308室</div>
                <div>電話：+852 2338 1811</div>
                <div>電郵：info@mingcarehome.com</div>
                <div>網址：www.mingcarehome.com</div>
              </div>

              <!-- Right: Company Logo -->
              <div style="flex: 0 0 auto; text-align: right;">
                <img src={getAssetPath("images/mingcare-logo.png")} alt="明家居家護理標誌" style="height: 180px; width: auto;">
              </div>
            </div>

            <h1>明家居家護理服護有限公司</h1>
            <h2>護理服務記錄報表</h2>
            ${isAccountingMode ? '<div style="color: #428bca; font-weight: bold; margin-top: 5px;">對數模式</div>' : ''}
            ${exportMode === 'payroll' ? '<div style="color: #28a745; font-weight: bold; margin-top: 5px;">工資模式</div>' : ''}
          </div>

          <div class="meta">
            日期範圍: ${filters.dateRange?.start || '未設定'} ~ ${filters.dateRange?.end || '未設定'}<br>
            生成時間: ${new Date().toLocaleDateString('zh-TW')} ${new Date().toLocaleTimeString('zh-TW')}
          </div>

          ${isAccountingMode || exportMode === 'payroll' ? tableContent : `
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${columnLabels[col] || col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableContent}
            </tbody>
          </table>
          `}

          ${summaryContent}

          <!-- 底部佈局：左邊統計，右邊印章 -->
          <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
            <!-- 左邊：報表統計 -->
            <div style="flex: 1;">
              <div style="margin-bottom: 5px; font-size: 12px;"><strong>報表記錄數:</strong> ${records.length} 筆</div>
              <div style="margin-bottom: 5px; font-size: 12px;"><strong>欄位數:</strong> ${columns.length} 個</div>
            </div>
            <!-- 右邊：公司印章 -->
            <div style="flex: 0 0 auto;">
              <img src="/images/company-stamp.png" alt="公司印章" style="height: 80px; width: auto;">
            </div>
          </div>
        </body>
        </html>
      `

      // 在新視窗中打開可打印的頁面
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()

        // 等待內容載入後自動打印
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus()
            // 用戶可以選擇打印或儲存為PDF
          }, 500)
        }
      } else {
        // 如果無法開啟新視窗，回退到下載HTML文件
        const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `mingcare_report_${filters.dateRange?.start || 'unknown'}_${filters.dateRange?.end || 'unknown'}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        alert('已下載HTML文件，請在瀏覽器中打開後列印或儲存為PDF')
      }

    } catch (error) {
      console.error('PDF導出錯誤:', error)
      alert('PDF導出失敗，請稍後再試或選擇CSV格式')
      throw error
    }
  }

  const exportToCSVCustom = async (records: any[], columns: string[]) => {
    const columnLabels: Record<string, string> = {
      service_date: '服務日期',
      customer_id: '客戶編號',
      customer_name: '客戶姓名',
      phone: '客戶電話',
      service_address: '服務地址',
      start_time: '開始時間',
      end_time: '結束時間',
      service_hours: '服務時數',
      care_staff_name: '護理員姓名',
      service_fee: '服務費用',
      staff_salary: '護理員工資',
      service_profit: '服務利潤',
      hourly_rate: '每小時收費',
      hourly_salary: '每小時工資',
      service_type: '服務類型',
      project_category: '所屬項目',
      project_manager: '項目經理'
    }

    // 創建CSV內容
    const headers = columns.map(col => columnLabels[col] || col)
    const csvContent = [
      headers.join(','),
      ...records.map(record =>
        columns.map(col => {
          let value = record[col] || ''

          // 特殊處理服務利潤
          if (col === 'service_profit') {
            const serviceFee = parseFloat(record.service_fee || '0')
            const staffSalary = parseFloat(record.staff_salary || '0')
            value = (serviceFee - staffSalary).toFixed(2)
          }

          // 處理包含逗號、引號或換行的值
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      )
    ].join('\n')

    // 添加BOM以支持中文字符，確保Excel正確顯示
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;'
    })

    // 下載CSV
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `mingcare_report_${filters.dateRange?.start || 'unknown'}_${filters.dateRange?.end || 'unknown'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理URL對象
    URL.revokeObjectURL(url)
  }

  // 使用傳遞下來的 onEdit 和 onDelete props，而不是自己定義編輯邏輯

  const downloadAllStaffPDFs = async () => {
    try {
      // 獲取所有記錄
      const response = await fetchBillingSalaryRecords(filters, 1, 10000)
      if (!response.success || !response.data) {
        alert('無法獲取記錄資料')
        return
      }

      const allRecords = response.data.data || []
      const selectedColumns = Object.entries(exportColumns)
        .filter(([_, selected]) => selected)
        .map(([column, _]) => column)

      // 設置所有護理員為下載中狀態
      const newStatus: Record<string, string> = {}
      ;(staffList || []).forEach(staffName => {
        newStatus[staffName] = 'downloading'
      })
      setStaffDownloadStatus(newStatus)

      let successCount = 0
      let failureCount = 0

      // 順序下載每個護理員的PDF（避免同時打開多個窗口）
      for (const staffName of staffList) {
        try {
          // 篩選該護理員的記錄
          const staffRecords = allRecords.filter(record =>
            (record.care_staff_name || '未知護理人員') === staffName
          )

          if (staffRecords.length === 0) {
            console.warn(`護理員 ${staffName} 沒有記錄`)
            setStaffDownloadStatus(prev => ({
              ...prev,
              [staffName]: 'error'
            }))
            failureCount++
            continue
          }

          // 按日期排序
          staffRecords.sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime())

          await generateAndDownloadStaffPDF(staffRecords, selectedColumns, staffName)

          // 更新為成功狀態
          setStaffDownloadStatus(prev => ({
            ...prev,
            [staffName]: 'downloaded'
          }))

          successCount++

          // 短暫延遲避免瀏覽器阻擋彈窗
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.error(`下載護理員 ${staffName} PDF失敗:`, error)
          setStaffDownloadStatus(prev => ({
            ...prev,
            [staffName]: 'error'
          }))
          failureCount++
        }
      }

      // 顯示完成總結
      if (successCount > 0 && failureCount === 0) {
        alert(`全部下載完成！成功下載 ${successCount} 個護理員的工資明細`)
      } else if (successCount > 0 && failureCount > 0) {
        alert(`部分下載完成！成功下載 ${successCount} 個，失敗 ${failureCount} 個`)
      } else {
        alert('下載全部失敗，請檢查資料並重試')
      }

    } catch (error) {
      console.error('批量下載失敗:', error)
      alert('批量下載時發生錯誤，請重試')
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

  // 護理員列表下載頁面
  if (showStaffListPage) {
    return (
      <div className="min-h-screen bg-bg-primary overflow-auto">
        {/* Header */}
        <header className="card-apple border-b border-border-light fade-in-apple sticky top-0 z-10">
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div>
                <h1 className="text-apple-title text-text-primary mb-2">工資明細下載</h1>
                <p className="text-apple-body text-text-secondary">選擇護理員下載其工資明細</p>
              </div>
              <button
                onClick={() => setShowStaffListPage(false)}
                className="px-4 py-2 text-mingcare-blue border border-mingcare-blue rounded-lg hover:bg-mingcare-blue hover:text-white transition-all duration-200"
              >
                返回報表
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 lg:px-8 py-8 pb-16">
          <div className="card-apple">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-text-primary">護理員工資明細</h3>
                {/* 一次過全部下載按鈕 */}
                {!loadingStaff && staffList && staffList.length > 0 && (
                  <button
                    onClick={downloadAllStaffPDFs}
                    disabled={Object.values(staffDownloadStatus).some(status => status === 'downloading')}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      Object.values(staffDownloadStatus).some(status => status === 'downloading')
                        ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                        : 'bg-mingcare-blue text-white hover:bg-blue-600 active:bg-blue-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>
                      {Object.values(staffDownloadStatus).some(status => status === 'downloading')
                        ? '下載中...'
                        : '一次過全部下載'
                      }
                    </span>
                  </button>
                )}
              </div>

              {loadingStaff ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary">載入中...</p>
                </div>
              ) : !staffList || staffList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary">沒有找到護理員資料</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-none">
                  {staffList && staffList.map((staffName: string) => {
                    const isDownloaded = staffDownloadStatus[staffName] === 'downloaded'
                    const isDownloading = staffDownloadStatus[staffName] === 'downloading'

                    // 生成文件名：護理員A YYYY-MM工資明細
                    const fileName = `${staffName} ${(filters.dateRange?.start || 'unknown').substring(0, 7)}工資明細`

                    return (
                      <div key={staffName} className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                        <div>
                          <h4 className="font-medium text-text-primary">{fileName}</h4>
                          <p className="text-sm text-text-secondary mt-1">
                            期間：{filters.dateRange?.start || '未設定'} 至 {filters.dateRange?.end || '未設定'}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          {isDownloaded ? (
                            <>
                              {/* 已下載狀態顯示 */}
                              <div className="px-4 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg font-medium">
                                已成功下載
                              </div>
                              {/* 再次下載按鈕 */}
                              <button
                                onClick={async () => {
                                  setStaffDownloadStatus(prev => ({
                                    ...prev,
                                    [staffName]: 'downloading'
                                  }))

                                  try {
                                    // 獲取該護理員的記錄
                                    const response = await fetchBillingSalaryRecords(filters, 1, 10000)
                                    if (response.success && response.data) {
                                      const selectedColumns = Object.entries(exportColumns)
                                        .filter(([_, selected]) => selected)
                                        .map(([column, _]) => column)

                                      await downloadSingleStaffPDF(staffName, response.data.data || [], selectedColumns)
                                    }
                                  } catch (error) {
                                    console.error('下載失敗:', error)
                                    setStaffDownloadStatus(prev => ({
                                      ...prev,
                                      [staffName]: 'error'
                                    }))
                                    alert('下載失敗，請重試')
                                  }
                                }}
                                disabled={isDownloading}
                                className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg font-medium hover:bg-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                再次下載
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={async () => {
                                if (isDownloading) return

                                setStaffDownloadStatus(prev => ({
                                  ...prev,
                                  [staffName]: 'downloading'
                                }))

                                try {
                                  // 獲取該護理員的記錄
                                  const response = await fetchBillingSalaryRecords(filters, 1, 10000)
                                  if (response.success && response.data) {
                                    const selectedColumns = Object.entries(exportColumns)
                                      .filter(([_, selected]) => selected)
                                      .map(([column, _]) => column)

                                    await downloadSingleStaffPDF(staffName, response.data.data || [], selectedColumns)
                                  }
                                } catch (error) {
                                  console.error('下載失敗:', error)
                                  setStaffDownloadStatus(prev => ({
                                    ...prev,
                                    [staffName]: 'error'
                                  }))
                                  alert('下載失敗，請重試')
                                }
                              }}
                              disabled={isDownloading}
                              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                                isDownloading
                                ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                                : 'bg-mingcare-blue text-white hover:bg-blue-600 active:bg-blue-700'
                              }`}
                            >
                              {isDownloading ? '下載中...' : '下載'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-0">
            <div className="flex items-start gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary mb-1 sm:mb-2">護理服務管理</h1>
                <p className="text-sm sm:text-base text-text-secondary">安排護理服務、管理服務排程及記錄</p>
              </div>
              <LastUpdateIndicator lastUpdateTime={lastUpdateTime} />
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-apple-secondary text-xs sm:text-sm self-start sm:self-auto"
            >
              返回主頁
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Tab 導航 - 移動端優化 */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="card-apple border border-border-light fade-in-apple">
            <div className="p-3 sm:p-4">
              <nav className="flex space-x-1 sm:space-x-2">
                {/* 1. 詳細報表 */}
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 ${
                    activeTab === 'reports'
                      ? 'bg-mingcare-blue text-white shadow-lg'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">詳細報表</span>
                  <span className="sm:hidden">報表</span>
                </button>

                {/* 2. 排程管理 */}
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 ${
                    activeTab === 'schedule'
                      ? 'bg-mingcare-blue text-white shadow-lg'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">排程管理</span>
                  <span className="sm:hidden">排程</span>
                </button>

                {/* 3. 業務概覽 */}
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 ${
                    activeTab === 'overview'
                      ? 'bg-mingcare-blue text-white shadow-lg'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="hidden sm:inline">業務概覽</span>
                  <span className="sm:hidden">概覽</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Tab 內容 */}
        {activeTab === 'overview' && (
          <OverviewTab
            filters={filters}
            setFilters={setFilters}
            updateDateRange={updateDateRange}
            kpiData={kpiData}
            kpiLoading={kpiLoading}
            categorySummary={categorySummary}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab filters={filters} />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            filters={filters}
            setFilters={setFilters}
            updateDateRange={updateDateRange}
            exportLoading={exportLoading}
            handleExport={handleExport}
            reportsViewMode={reportsViewMode}
            setReportsViewMode={setReportsViewMode}
            onEdit={handleEdit}
            onDelete={handleDelete}
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
            recordUpdateTimes={recordUpdateTimes}
          />
        )}
      </main>

      {/* 編輯模態框 */}
      {isEditModalOpen && editingRecord && (
        <ScheduleFormModal
          isOpen={isEditModalOpen}
          onClose={handleEditCancel}
          onSubmit={handleEditSave}
          onDelete={handleDelete}
          existingRecord={editingRecord}
        />
      )}

      {/* 導出選項模態框 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-medium text-text-primary">導出設定</h3>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 預設模式選擇 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-3">預設模式</label>
                <div className="space-y-3">
                  {Object.entries(exportModeConfigs).map(([mode, config]) => (
                    <label key={mode} className="flex items-start">
                      <input
                        type="radio"
                        name="exportMode"
                        value={mode}
                        checked={exportMode === mode}
                        onChange={(e) => handleExportModeChange(e.target.value as 'accounting' | 'payroll')}
                        className="mr-3 mt-1"
                      />
                      <div>
                        <div className="font-medium text-text-primary">{config.name}</div>
                        <div className="text-sm text-text-secondary">{config.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 格式選擇 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-3">導出格式</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv')}
                      className="mr-2"
                    />
                    <span>PDF</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv')}
                      className="mr-2"
                    />
                    <span>CSV</span>
                  </label>
                </div>
              </div>

              {/* 工資模式子選項 */}
              {exportMode === 'payroll' && exportFormat === 'pdf' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-primary mb-3">工資導出方式</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payrollType"
                        value="combined"
                        checked={payrollExportType === 'combined'}
                        onChange={(e) => setPayrollExportType(e.target.value as 'separate' | 'combined')}
                        className="mr-2"
                      />
                      <span>合併報表 (一個PDF包含所有人員)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payrollType"
                        value="separate"
                        checked={payrollExportType === 'separate'}
                        onChange={(e) => setPayrollExportType(e.target.value as 'separate' | 'combined')}
                        className="mr-2"
                      />
                      <span>個別報表 (每人單獨PDF檔案)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 欄位選擇 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-3">
                  選擇要導出的欄位
                  <span className="text-xs text-text-secondary ml-2">
                    ({exportModeConfigs[exportMode].name} 預設配置，可自由調整)
                  </span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {Object.entries({
                    service_date: '服務日期',
                    customer_id: '客戶編號',
                    customer_name: '客戶姓名',
                    phone: '客戶電話',
                    service_address: '服務地址',
                    start_time: '開始時間',
                    end_time: '結束時間',
                    service_hours: '服務時數',
                    care_staff_name: '護理員姓名',
                    service_fee: '服務費用',
                    staff_salary: '護理員工資',
                    service_profit: '服務利潤',
                    hourly_rate: '每小時收費',
                    hourly_salary: '每小時工資',
                    service_type: '服務類型',
                    project_category: '所屬項目',
                    project_manager: '項目經理'
                  }).map(([key, label]) => {
                    const isDefaultField = ['service_date', 'customer_name', 'service_address', 'start_time', 'end_time', 'service_hours', 'care_staff_name', 'service_type'].includes(key)
                    return (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportColumns[key as keyof typeof exportColumns]}
                          onChange={(e) => {
                            setExportColumns(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))
                          }}
                          className="mr-2"
                        />
                        <span className={`text-sm ${isDefaultField ? 'font-medium text-mingcare-blue' : ''}`}>
                          {label}
                          {isDefaultField && <span className="text-xs text-mingcare-blue ml-1">(默認)</span>}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-bg-secondary transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleExportConfirm}
                disabled={Object.values(exportColumns).every(v => !v)}
                className="px-4 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                確認導出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 排班表單 Modal 組件
interface ScheduleFormModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: string | null
  selectedDates?: string[]
  onSubmit: (formData: BillingSalaryFormData) => Promise<void>
  onDelete?: (recordId: string) => Promise<void>
  isMultiDay?: boolean
  existingRecord?: BillingSalaryRecord | null
}

function ScheduleFormModal({
  isOpen,
  onClose,
  selectedDate,
  selectedDates = [],
  onSubmit,
  onDelete,
  isMultiDay = false,
  existingRecord = null
}: ScheduleFormModalProps) {
  // 初始化表單數據
  const getInitialFormData = (): BillingSalaryFormData => {
    if (existingRecord) {
      // 編輯模式：使用現有記錄的數據，確保日期格式一致
      return {
        service_date: existingRecord.service_date, // 保持原有格式，因為已經是字符串
        customer_id: existingRecord.customer_id,
        customer_name: existingRecord.customer_name,
        phone: existingRecord.phone,
        service_address: existingRecord.service_address,
        start_time: existingRecord.start_time,
        end_time: existingRecord.end_time,
        service_hours: existingRecord.service_hours,
        care_staff_name: existingRecord.care_staff_name,
        service_fee: existingRecord.service_fee,
        staff_salary: existingRecord.staff_salary,
        hourly_rate: existingRecord.hourly_rate || 0,
        hourly_salary: existingRecord.hourly_salary || 0,
        service_type: existingRecord.service_type,
        project_category: existingRecord.project_category,
        project_manager: existingRecord.project_manager
      }
    } else {
      // 新增模式：使用默認值
      return {
        service_date: selectedDate || formatDateSafely(new Date()),
        customer_id: '',
        customer_name: '',
        phone: '',
        service_address: '',
        start_time: '09:00',
        end_time: '17:00',
        service_hours: 8,
        care_staff_name: '',
        service_fee: 0,
        staff_salary: 0,
        hourly_rate: 0,
        hourly_salary: 0,
        service_type: '',
        project_category: '',
        project_manager: ''
      }
    }
  }

  const [formData, setFormData] = useState<BillingSalaryFormData>(getInitialFormData)

  // 當existingRecord改變時重新初始化表單
  useEffect(() => {
    setFormData(getInitialFormData())
    // 同時更新搜索項
    if (existingRecord) {
      setCustomerSearchTerm(existingRecord.customer_name)
      setStaffSearchTerm(existingRecord.care_staff_name)
    } else {
      setCustomerSearchTerm('')
      setStaffSearchTerm('')
    }
  }, [existingRecord, selectedDate])

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 搜尋功能狀態
  const [customerSearchTerm, setCustomerSearchTerm] = useState(existingRecord ? existingRecord.customer_name : '')
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSearchResult[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)

  const [staffSearchTerm, setStaffSearchTerm] = useState(existingRecord ? existingRecord.care_staff_name : '')
  const [staffSuggestions, setStaffSuggestions] = useState<any[]>([])
  const [showStaffSuggestions, setShowStaffSuggestions] = useState(false)

  // 搜尋防抖定時器
  const [customerSearchTimeout, setCustomerSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [staffSearchTimeout, setStaffSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // 清理定時器
  useEffect(() => {
    console.log('ScheduleFormModal組件已掛載') // 調試日誌
    return () => {
      console.log('ScheduleFormModal組件將卸載') // 調試日誌
      if (customerSearchTimeout) {
        clearTimeout(customerSearchTimeout)
      }
      if (staffSearchTimeout) {
        clearTimeout(staffSearchTimeout)
      }
    }
  }, [customerSearchTimeout, staffSearchTimeout])

  // 點擊外部關閉搜尋建議
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.customer-search-container')) {
        setShowCustomerSuggestions(false)
      }
      if (!target.closest('.staff-search-container')) {
        setShowStaffSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 點擊外部關閉搜尋建議
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.customer-search-container')) {
        setShowCustomerSuggestions(false)
      }
      if (!target.closest('.staff-search-container')) {
        setShowStaffSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 檢查是否為多日期排班（使用參數中的isMultiDay或根據selectedDates計算）
  const isMultipleDays = isMultiDay || selectedDates.length > 1

  // 表單驗證
  const validateForm = (data: BillingSalaryFormData): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!data.customer_name.trim()) errors.customer_name = '客戶姓名不能為空'
    if (!data.phone.trim()) errors.phone = '聯絡電話不能為空'
    if (!data.service_address.trim()) errors.service_address = '服務地址不能為空'
    if (!data.care_staff_name.trim()) errors.care_staff_name = '護理人員不能為空'
    if (data.service_fee <= 0) errors.service_fee = '服務費用必須大於 0'
    if (data.staff_salary < 0) errors.staff_salary = '員工薪資不能為負數'
    if (data.service_hours <= 0) errors.service_hours = '服務時數必須大於 0'
    if (!data.service_type) errors.service_type = '請選擇服務類型'
    if (!data.project_category) errors.project_category = '請選擇項目分類'
    if (!data.project_manager) errors.project_manager = '請選擇項目負責人'

    // 檢查時間邏輯
    if (data.start_time >= data.end_time) {
      errors.end_time = '結束時間必須晚於開始時間'
    }

    return errors
  }

  // 計算服務時數
  const calculateServiceHours = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    return Math.max(0, (endMinutes - startMinutes) / 60)
  }

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formErrors = validateForm(formData)

      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors)
        return
      }

      setErrors({})

      // 準備提交的資料，讓資料庫自動計算 hourly_rate 和 hourly_salary
      const submitData: Omit<BillingSalaryFormData, 'hourly_rate' | 'hourly_salary'> = {
        service_date: formData.service_date,
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        phone: formData.phone,
        service_address: formData.service_address,
        start_time: formData.start_time,
        end_time: formData.end_time,
        service_hours: formData.service_hours,
        care_staff_name: formData.care_staff_name,
        service_fee: formData.service_fee,
        staff_salary: formData.staff_salary,
        service_type: formData.service_type,
        project_category: formData.project_category,
        project_manager: formData.project_manager
      }

      await onSubmit(submitData as BillingSalaryFormData)
      onClose()
    } catch (error) {
      console.error('提交表單失敗:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // 更新表單欄位
  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // 處理日期欄位，確保格式一致
      if (field === 'service_date' && value) {
        // 如果是日期字符串，確保格式正確
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          updated.service_date = value // 已經是正確格式
        }
      }

      // 自動計算服務時數（當開始或結束時間改變時）
      if (field === 'start_time' || field === 'end_time') {
        if (updated.start_time && updated.end_time) {
          const calculatedHours = calculateServiceHours(updated.start_time, updated.end_time)
          const roundedHours = Math.round(calculatedHours * 2) / 2 // 四捨五入到 0.5
          updated.service_hours = roundedHours
        }
      }

      // 自動計算每小時收費和時薪薪資（僅用於顯示）
      if (field === 'service_fee' || field === 'staff_salary' || field === 'service_hours') {
        if (updated.service_hours > 0) {
          updated.hourly_rate = (updated.service_fee || 0) / updated.service_hours
          updated.hourly_salary = (updated.staff_salary || 0) / updated.service_hours
        }
      }

      return updated
    })

    // 同步更新搜索項
    if (field === 'customer_name') {
      setCustomerSearchTerm(value)
    } else if (field === 'care_staff_name') {
      setStaffSearchTerm(value)
    }
  }

  // 內部客戶搜尋功能
  const handleFormCustomerSearch = async (searchTerm: string) => {
    console.log('表單客戶搜尋開始:', searchTerm) // 調試日誌
    setCustomerSearchTerm(searchTerm)

    if (searchTerm.trim().length < 1) {
      setCustomerSuggestions([])
      setShowCustomerSuggestions(false)
      return
    }

    try {
      console.log('使用 Supabase 直接進行表單客戶搜尋') // 調試日誌

      // 直接使用 Supabase 客戶端查詢（正確的表名和欄位名）
      const { data, error } = await supabase
        .from('customer_personal_data')
        .select('customer_id, customer_name, phone, service_address')
        .or(`customer_name.ilike.%${searchTerm.trim()}%,customer_id.ilike.%${searchTerm.trim()}%,phone.ilike.%${searchTerm.trim()}%,service_address.ilike.%${searchTerm.trim()}%`)
        .limit(10)

      if (error) {
        console.error('Supabase 表單客戶搜尋錯誤:', error)
        setCustomerSuggestions([])
        setShowCustomerSuggestions(false)
        return
      }

      // 轉換為 CustomerSearchResult 格式
      const suggestions: CustomerSearchResult[] = (data || []).map((item: any) => ({
        customer_id: item.customer_id || '',
        customer_name: item.customer_name || '',
        phone: item.phone || '',
        service_address: item.service_address || '',
        display_text: item.customer_name || '',
        type: 'customer' as const
      }))

      console.log('表單客戶搜尋結果:', suggestions) // 調試日誌
      setCustomerSuggestions(suggestions)
      setShowCustomerSuggestions(true)

    } catch (error) {
      console.error('客戶搜尋失敗:', error)
      setCustomerSuggestions([])
      setShowCustomerSuggestions(false)
    }
  }

  // 選擇客戶
  const selectCustomer = (customer: CustomerSearchResult) => {
    updateField('customer_name', customer.customer_name || customer.display_text)
    updateField('customer_id', customer.customer_id || '')
    updateField('phone', customer.phone || '')
    updateField('service_address', customer.service_address || '')
    setCustomerSearchTerm(customer.customer_name || customer.display_text)
    setShowCustomerSuggestions(false)
  }

  // 護理人員搜尋功能
  const handleStaffSearch = async (searchTerm: string) => {
    console.log('護理人員搜尋開始:', searchTerm) // 調試日誌
    setStaffSearchTerm(searchTerm)

    if (searchTerm.trim().length < 1) {
      setStaffSuggestions([])
      setShowStaffSuggestions(false)
      return
    }

    try {
      console.log('使用 Supabase 直接進行護理人員搜尋') // 調試日誌

      // 直接使用 Supabase 客戶端查詢
      const { data, error } = await supabase
        .from('care_staff_profiles')
        .select('name_chinese, name_english, staff_id, phone')
        .or(`name_chinese.ilike.%${searchTerm.trim()}%,name_english.ilike.%${searchTerm.trim()}%,staff_id.ilike.%${searchTerm.trim()}%,phone.ilike.%${searchTerm.trim()}%`)
        .limit(10)

      if (error) {
        console.error('Supabase 護理人員搜尋錯誤:', error)
        setStaffSuggestions([])
        setShowStaffSuggestions(false)
        return
      }

      const results = (data || []).map(item => ({
        name_chinese: item.name_chinese || '',
        name_english: item.name_english || '',
        staff_id: item.staff_id || '',
        phone: item.phone || ''
      }))

      console.log('護理人員搜尋結果:', results) // 調試日誌
      setStaffSuggestions(results)
      setShowStaffSuggestions(true)

    } catch (error) {
      console.error('護理人員搜尋失敗:', error)
      setStaffSuggestions([])
      setShowStaffSuggestions(false)
    }
  }

  // 選擇護理人員
  const selectStaff = (staff: any) => {
    updateField('care_staff_name', staff.name_chinese)
    setStaffSearchTerm(staff.name_chinese)
    setShowStaffSuggestions(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-primary rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-light">
          <h3 className="text-lg font-medium text-text-primary">
            {existingRecord
              ? `編輯排班 - ${existingRecord.service_date}`
              : isMultipleDays
                ? `批量新增排班 (${selectedDates.length} 天)`
                : `新增排班 - ${selectedDate}`
            }
          </h3>

          {isMultipleDays && (
            <div className="mt-2 text-sm text-text-secondary">
              選定日期：{selectedDates.sort().join(', ')}
            </div>
          )}
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 卡片 0：服務日期（編輯模式時顯示） */}
            {existingRecord && (
              <div className="card-apple border border-border-light">
                <div className="p-6">
                  <h4 className="text-apple-heading text-text-primary mb-4">服務日期</h4>
                  <div>
                    <label className="block text-apple-caption font-medium text-text-primary mb-2">
                      日期 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.service_date}
                      onChange={(e) => updateField('service_date', e.target.value)}
                      className={`form-input-apple w-full ${errors.service_date ? 'border-danger' : ''}`}
                      required
                    />
                    {errors.service_date && (
                      <p className="text-apple-caption text-danger mt-1">{errors.service_date}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 卡片 1：客戶基本資料 */}
            <div className="card-apple border border-border-light">
              <div className="p-6">
                <h4 className="text-apple-heading text-text-primary mb-4">客戶基本資料</h4>

                <div className="space-y-4">
                  {/* 第一行：服務類型 + 項目分類 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 服務類型 */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        服務類型 <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formData.service_type}
                        onChange={(e) => updateField('service_type', e.target.value)}
                        className={`form-input-apple w-full ${errors.service_type ? 'border-danger' : ''}`}
                        required
                      >
                        <option value="">請選擇服務類型</option>
                        {SERVICE_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.service_type && (
                        <p className="text-apple-caption text-danger mt-1">{errors.service_type}</p>
                      )}
                    </div>

                    {/* 項目分類 */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        項目分類 <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formData.project_category}
                        onChange={(e) => updateField('project_category', e.target.value)}
                        className={`form-input-apple w-full ${errors.project_category ? 'border-danger' : ''}`}
                        required
                      >
                        <option value="">請選擇項目分類</option>
                        {PROJECT_CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.project_category && (
                        <p className="text-apple-caption text-danger mt-1">{errors.project_category}</p>
                      )}
                    </div>
                  </div>

                  {/* 第二行：項目負責人 */}
                  <div>
                    <label className="block text-apple-caption font-medium text-text-primary mb-2">
                      項目負責人 <span className="text-danger">*</span>
                    </label>
                    <select
                      value={formData.project_manager}
                      onChange={(e) => updateField('project_manager', e.target.value)}
                      className={`form-input-apple w-full ${errors.project_manager ? 'border-danger' : ''}`}
                      required
                    >
                      <option value="">請選擇項目負責人</option>
                      {PROJECT_MANAGER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.project_manager && (
                      <p className="text-apple-caption text-danger mt-1">{errors.project_manager}</p>
                    )}
                  </div>

                  {/* 第三行：客戶姓名（含搜尋） + 客戶編號 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 客戶姓名（含搜尋功能） */}
                    <div className="relative customer-search-container">
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        客戶姓名 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerSearchTerm}
                        onChange={(e) => {
                          const value = e.target.value
                          console.log('客戶搜尋輸入變化:', value) // 調試日誌
                          setCustomerSearchTerm(value)
                          updateField('customer_name', value) // 同步更新表單數據

                          // 清除之前的搜尋定時器
                          if (customerSearchTimeout) {
                            clearTimeout(customerSearchTimeout)
                          }

                          if (value.length >= 1) {
                            console.log('設置客戶搜尋定時器') // 調試日誌
                            // 設置新的搜尋定時器（300ms 防抖）
                            const timeout = setTimeout(() => {
                              console.log('執行客戶搜尋') // 調試日誌
                              handleFormCustomerSearch(value)
                            }, 300)
                            setCustomerSearchTimeout(timeout)
                          } else {
                            setShowCustomerSuggestions(false)
                          }
                        }}
                        onFocus={() => {
                          console.log('客戶輸入框獲得焦點') // 調試日誌
                          // 聚焦時如果有搜尋詞且有結果，顯示建議
                          if (customerSearchTerm.length >= 1 && customerSuggestions.length > 0) {
                            setShowCustomerSuggestions(true)
                          }
                        }}
                        className={`form-input-apple w-full ${errors.customer_name ? 'border-danger' : ''}`}
                        placeholder="請輸入客戶姓名或編號（≥1字元）"
                        autoComplete="off"
                        required
                      />

                      {/* 客戶搜尋建議 */}
                      {showCustomerSuggestions && customerSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-bg-primary border border-border-light rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {customerSuggestions.map((customer: CustomerSearchResult, index: number) => (
                            <div
                              key={customer.customer_id || index}
                              onClick={() => selectCustomer(customer)}
                              className="px-4 py-2 hover:bg-bg-secondary cursor-pointer border-b border-border-light last:border-b-0"
                            >
                              <div className="font-medium text-text-primary">
                                {customer.customer_name || customer.display_text}
                                {customer.customer_id && (
                                  <span className="text-text-secondary ml-1">（{customer.customer_id}）</span>
                                )}
                              </div>
                              {customer.phone && (
                                <div className="text-sm text-text-secondary">{customer.phone}</div>
                              )}
                              {customer.service_address && (
                                <div className="text-sm text-text-secondary truncate">{customer.service_address}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.customer_name && (
                        <p className="text-apple-caption text-danger mt-1">{errors.customer_name}</p>
                      )}
                    </div>

                    {/* 客戶編號 */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        客戶編號
                      </label>
                      <input
                        type="text"
                        value={formData.customer_id || ''}
                        readOnly
                        className="form-input-apple w-full bg-bg-secondary text-text-secondary cursor-not-allowed"
                        placeholder="選擇客戶後自動填入"
                      />
                    </div>
                  </div>

                  {/* 第四行：聯絡電話 + 服務地址 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 聯絡電話（唯讀） */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        聯絡電話
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        readOnly
                        className="form-input-apple w-full bg-bg-secondary text-text-secondary cursor-not-allowed"
                        placeholder="選擇客戶後自動填入"
                      />
                    </div>

                    {/* 服務地址（獨立一行，可編輯） */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        服務地址
                      </label>
                      <input
                        type="text"
                        value={formData.service_address}
                        onChange={(e) => updateField('service_address', e.target.value)}
                        className={`form-input-apple w-full ${errors.service_address ? 'border-danger' : ''}`}
                        placeholder="請輸入服務地址"
                      />
                      {errors.service_address && (
                        <p className="text-apple-caption text-danger mt-1">{errors.service_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 卡片 2：服務詳情 */}
            <div className="card-apple border border-border-light">
              <div className="p-6">
                <h4 className="text-apple-heading text-text-primary mb-4">服務詳情</h4>

                <div className="space-y-4">
                  {/* 第一行：護理人員搜尋（獨立一行） */}
                  <div className="relative staff-search-container">
                    <label className="block text-apple-caption font-medium text-text-primary mb-2">
                      護理人員
                    </label>
                    <input
                      type="text"
                      value={staffSearchTerm}
                      onChange={(e) => {
                        const value = e.target.value
                        console.log('護理人員搜尋輸入變化:', value) // 調試日誌
                        setStaffSearchTerm(value)
                        updateField('care_staff_name', value) // 同步更新表單數據

                        // 清除之前的搜尋定時器
                        if (staffSearchTimeout) {
                          clearTimeout(staffSearchTimeout)
                        }

                        if (value.length >= 1) {
                          console.log('設置護理人員搜尋定時器') // 調試日誌
                          // 設置新的搜尋定時器（300ms 防抖）
                          const timeout = setTimeout(() => {
                            console.log('執行護理人員搜尋') // 調試日誌
                            handleStaffSearch(value)
                          }, 300)
                          setStaffSearchTimeout(timeout)
                        } else {
                          setShowStaffSuggestions(false)
                        }
                      }}
                      onFocus={() => {
                        console.log('護理人員輸入框獲得焦點') // 調試日誌
                        // 聚焦時如果有搜尋詞且有結果，顯示建議
                        if (staffSearchTerm.length >= 1 && staffSuggestions.length > 0) {
                          setShowStaffSuggestions(true)
                        }
                      }}
                      className={`form-input-apple w-full ${errors.care_staff_name ? 'border-danger' : ''}`}
                      placeholder="輸入護理人員中文姓名或編號（≥1字元）"
                      autoComplete="off"
                    />

                    {/* 護理人員搜尋建議 */}
                    {showStaffSuggestions && staffSuggestions && staffSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-bg-primary border border-border-light rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {staffSuggestions.map((staff, index) => (
                          <div
                            key={staff.staff_id || index}
                            onClick={() => selectStaff(staff)}
                            className="px-4 py-2 hover:bg-bg-secondary cursor-pointer border-b border-border-light last:border-b-0"
                          >
                            <div className="font-medium text-text-primary">
                              {staff.name_chinese}
                              {staff.staff_id && (
                                <span className="text-text-secondary ml-1">（{staff.staff_id}）</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.care_staff_name && (
                      <p className="text-apple-caption text-danger mt-1">{errors.care_staff_name}</p>
                    )}
                  </div>

                  {/* 第二行：開始時間 + 結束時間 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 開始時間 */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        開始時間
                      </label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => updateField('start_time', e.target.value)}
                        className="form-input-apple w-full"
                        step="1800"
                      />
                    </div>

                    {/* 結束時間 */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        結束時間
                      </label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => updateField('end_time', e.target.value)}
                        className={`form-input-apple w-full ${errors.end_time ? 'border-danger' : ''}`}
                        step="1800"
                      />
                      {errors.end_time && (
                        <p className="text-apple-caption text-danger mt-1">{errors.end_time}</p>
                      )}
                    </div>
                  </div>

                  {/* 第三行：服務時數（自動計算，獨立一行） */}
                  <div>
                    <label className="block text-apple-caption font-medium text-text-primary mb-2">
                      服務時數 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.service_hours || ''}
                      onChange={(e) => updateField('service_hours', parseFloat(e.target.value) || 0)}
                      className={`form-input-apple w-full ${errors.service_hours ? 'border-danger' : ''}`}
                      placeholder="請輸入服務時數"
                      step="0.5"
                      min="0"
                      required
                    />
                    {errors.service_hours && (
                      <p className="text-apple-caption text-danger mt-1">{errors.service_hours}</p>
                    )}
                    <p className="text-apple-caption text-text-secondary mt-1">
                      填入開始/結束時間後會自動計算，也可手動輸入
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 卡片 3：收費與工資 */}
            <div className="card-apple border border-border-light">
              <div className="p-6">
                <h4 className="text-apple-heading text-text-primary mb-4">收費與工資</h4>

                <div className="space-y-4">
                  {/* 第一行：服務費用 + 員工薪資 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 服務費用 */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        服務費用 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.service_fee || ''}
                        onChange={(e) => updateField('service_fee', parseFloat(e.target.value) || 0)}
                        className={`form-input-apple w-full ${errors.service_fee ? 'border-danger' : ''}`}
                        placeholder="請輸入服務費用"
                        min="0"
                        step="0.01"
                        required
                      />
                      {errors.service_fee && (
                        <p className="text-apple-caption text-danger mt-1">{errors.service_fee}</p>
                      )}
                    </div>

                    {/* 員工薪資 */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        員工薪資 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.staff_salary || ''}
                        onChange={(e) => updateField('staff_salary', parseFloat(e.target.value) || 0)}
                        className={`form-input-apple w-full ${errors.staff_salary ? 'border-danger' : ''}`}
                        placeholder="請輸入員工薪資"
                        min="0"
                        max={formData.service_fee || undefined}
                        step="0.01"
                        required
                      />
                      {errors.staff_salary && (
                        <p className="text-apple-caption text-danger mt-1">{errors.staff_salary}</p>
                      )}
                      <p className="text-apple-caption text-text-secondary mt-1">
                        員工薪資不能超過服務費用
                      </p>
                    </div>
                  </div>

                  {/* 第二行：每小時收費 + 每小時薪資 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 每小時收費（自動計算） */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        每小時收費
                      </label>
                      <input
                        type="number"
                        value={formData.hourly_rate.toFixed(2)}
                        readOnly
                        className="form-input-apple w-full bg-bg-secondary text-text-secondary cursor-not-allowed"
                        placeholder="自動計算"
                      />
                      <p className="text-apple-caption text-text-secondary mt-1">
                        自動計算：服務費用 ÷ 服務時數
                      </p>
                    </div>

                    {/* 每小時薪資（自動計算） */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        每小時薪資
                      </label>
                      <input
                        type="number"
                        value={formData.hourly_salary.toFixed(2)}
                        readOnly
                        className="form-input-apple w-full bg-bg-secondary text-text-secondary cursor-not-allowed"
                        placeholder="自動計算"
                      />
                      <p className="text-apple-caption text-text-secondary mt-1">
                        自動計算：員工薪資 ÷ 服務時數
                      </p>
                    </div>
                  </div>

                  {/* 第三行：本次利潤（突出顯示） */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <label className="text-apple-body font-medium text-green-800">
                        本次利潤
                      </label>
                      <div className="text-apple-heading font-bold text-green-700">
                        ${((formData.service_fee || 0) - (formData.staff_salary || 0)).toFixed(2)}
                      </div>
                    </div>
                    <p className="text-apple-caption text-green-600 mt-1">
                      計算公式：服務費用 - 員工薪資
                    </p>
                  </div>

                  {/* 費用摘要（額外資訊） */}
                  <div className="border-t border-border-light pt-4">
                    <h5 className="text-apple-body font-medium text-text-primary mb-2">費用摘要</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-text-secondary">服務費用</div>
                        <div className="font-medium text-text-primary">${(formData.service_fee || 0).toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-text-secondary">員工薪資</div>
                        <div className="font-medium text-text-primary">${(formData.staff_salary || 0).toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-text-secondary">利潤率</div>
                        <div className="font-medium text-text-primary">
                          {(formData.service_fee || 0) > 0 ?
                            `${((((formData.service_fee || 0) - (formData.staff_salary || 0)) / (formData.service_fee || 1)) * 100).toFixed(1)}%` :
                            '0%'
                          }
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-text-secondary">服務時數</div>
                        <div className="font-medium text-text-primary">{formData.service_hours}小時</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-light bg-bg-secondary">
          <div className="flex justify-between">
            {/* 左側 - 刪除按鈕（只在編輯模式顯示） */}
            <div>
              {existingRecord && onDelete && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('確定要刪除這筆記錄嗎？此操作無法復原。')) {
                      try {
                        await onDelete(existingRecord.id)
                        onClose()
                      } catch (error) {
                        console.error('刪除失敗:', error)
                        alert('刪除失敗，請稍後再試')
                      }
                    }
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? '刪除中...' : '刪除'}
                </button>
              )}
            </div>

            {/* 右側 - 取消和確認按鈕 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-bg-primary transition-all duration-200"
                disabled={submitting}
              >
                取消
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50"
              >
                {submitting ? '處理中...' : existingRecord ? '儲存修改' : (isMultipleDays ? '批量新增' : '新增排班')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 本地排程編輯模態框
interface LocalScheduleEditModalProps {
  isOpen: boolean
  schedule: BillingSalaryFormData | null
  onClose: () => void
  onUpdate: (formData: BillingSalaryFormData) => void
  onDelete: () => void
  onEdit: () => void
}

function LocalScheduleEditModal({
  isOpen,
  schedule,
  onClose,
  onUpdate,
  onDelete,
  onEdit
}: LocalScheduleEditModalProps) {
  if (!isOpen || !schedule) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-primary rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-light">
          <h3 className="text-lg font-medium text-text-primary">
            排程選項
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            選擇要對此排程執行的操作
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* 排程詳情 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 mb-2">
              <strong>日期：</strong> {schedule.service_date}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <strong>客戶：</strong> {schedule.customer_name}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <strong>護理人員：</strong> {schedule.care_staff_name}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <strong>服務類型：</strong> {schedule.service_type}
            </div>
            <div className="text-sm text-gray-600">
              <strong>時間：</strong> {schedule.start_time} - {schedule.end_time}
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="space-y-3">
            <button
              onClick={onEdit}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                編輯排程
              </div>
            </button>

            <button
              onClick={() => {
                if (confirm('確定要刪除這個排程嗎？')) {
                  onDelete()
                }
              }}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-left"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                刪除排程
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-light bg-bg-secondary">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-bg-primary transition-all duration-200"
          >
            取消
          </button>
        </div>
      </div>
      
      {/* 測試更新通知按鈕 */}
      <TestUpdateButton
        label="服務記錄更新"
        onTriggerUpdate={() => {
          // 使用測試 ID 觸發服務記錄的更新通知
          const testRecordId = 'test-record-1'
          const updateTime = new Date().toISOString()
          localStorage.setItem(`record_update_${testRecordId}`, updateTime)
          window.dispatchEvent(new CustomEvent('recordUpdated', {
            detail: { recordId: testRecordId }
          }))
        }}
      />
    </div>
  )
}
