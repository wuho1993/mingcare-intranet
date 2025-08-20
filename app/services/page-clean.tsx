'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { BackToHomeButton } from '../../components/BackToHomeButton'
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
  createMultipleDayRecords,
  exportToCSV
} from '../../services/billing-salary-management'

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
  handleExportCSV: () => void
}

// 概覽頁面組件
function OverviewTab({ filters, setFilters, updateDateRange, kpiData, kpiLoading, categorySummary }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* 選擇時段 - 根據圖片格式 */}
      <div className="card-apple border border-border-light fade-in-apple">
        <div className="p-6">
          <h2 className="text-apple-heading text-text-primary mb-4">選擇時段</h2>
          
          {/* 第一行：本月、上月按鈕 + 年月選擇器 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex gap-2">
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
            </div>
            
            {/* 年月選擇器 */}
            <div className="flex items-center gap-2">
              <select
                value={new Date(filters.dateRange.start).getFullYear()}
                onChange={(e) => {
                  const year = parseInt(e.target.value)
                  const month = new Date(filters.dateRange.start).getMonth()
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
                value={new Date(filters.dateRange.start).getMonth()}
                onChange={(e) => {
                  const year = new Date(filters.dateRange.start).getFullYear()
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
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
            />
            <span className="text-text-secondary">至</span>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
            />
          </div>
          
          <div className="mt-4 text-sm text-text-secondary">
            當前範圍：{filters.dateRange.start} ~ {filters.dateRange.end}
          </div>
        </div>
      </div>

      {/* KPI 卡片 - 簡化版 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
            <p className="text-sm text-text-secondary mt-3">計算中...</p>
          </div>
        ) : kpiData ? (
          <>
            <div className="card-apple border border-border-light p-6 text-center">
              <div className="text-3xl font-bold text-text-primary mb-2">
                ${kpiData.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-text-secondary">總收入</div>
              {kpiData.revenueGrowthRate !== 0 && (
                <div className={`text-xs mt-2 ${
                  kpiData.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpiData.revenueGrowthRate >= 0 ? '↗' : '↘'} {Math.abs(kpiData.revenueGrowthRate).toFixed(1)}%
                </div>
              )}
            </div>

            <div className="card-apple border border-border-light p-6 text-center">
              <div className="text-3xl font-bold text-text-primary mb-2">
                ${kpiData.totalProfit.toLocaleString()}
              </div>
              <div className="text-sm text-text-secondary">總利潤</div>
              <div className="text-xs text-text-secondary mt-2">
                利潤率: {kpiData.totalRevenue > 0 ? ((kpiData.totalProfit / kpiData.totalRevenue) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="card-apple border border-border-light p-6 text-center">
              <div className="text-3xl font-bold text-text-primary mb-2">
                {kpiData.totalServiceHours.toFixed(1)}
              </div>
              <div className="text-sm text-text-secondary">總服務時數</div>
            </div>

            <div className="card-apple border border-border-light p-6 text-center">
              <div className="text-3xl font-bold text-text-primary mb-2">
                ${kpiData.avgProfitPerHour.toFixed(2)}
              </div>
              <div className="text-sm text-text-secondary">每小時利潤</div>
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
          
          {categorySummary.length > 0 ? (
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
              
              {categorySummary.length > 5 && (
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

// 排程頁面組件
function ScheduleTab({ filters }: { filters: BillingSalaryFilters }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduleData, setScheduleData] = useState<Record<string, any[]>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([]) // 多日期選擇
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false) // 多選模式
  const [formSubmitting, setFormSubmitting] = useState(false)

  // 處理提交排班表單
  const handleSubmitSchedule = async (formData: BillingSalaryFormData) => {
    setFormSubmitting(true)
    try {
      if (selectedDates.length > 1) {
        // 多日排班：為每個選定日期創建記錄
        const promises = selectedDates.map(date => 
          createBillingSalaryRecord({ ...formData, service_date: date })
        )
        
        const results = await Promise.allSettled(promises)
        const successCount = results.filter(r => r.status === 'fulfilled').length
        const failedCount = results.length - successCount
        
        if (successCount > 0) {
          alert(`成功新增 ${successCount} 筆排班記錄${failedCount > 0 ? `，${failedCount} 筆失敗` : ''}`)
          setShowAddModal(false)
          setSelectedDate(null)
          setSelectedDates([])
          setIsMultiSelectMode(false)
        } else {
          alert('所有排班記錄新增失敗')
        }
      } else {
        // 單日排班
        const result = await createBillingSalaryRecord(formData)
        if (result.success) {
          alert('成功新增排班記錄')
          setShowAddModal(false)
          setSelectedDate(null)
          setSelectedDates([])
          setIsMultiSelectMode(false)
        } else {
          alert(result.error || '新增排班失敗')
        }
      }
    } catch (error) {
      console.error('提交排班失敗:', error)
      alert('系統錯誤，請稍後再試')
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
    const dateStr = date.toISOString().split('T')[0]
    
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
            <h3 className="text-apple-heading text-text-primary">月曆排班</h3>
            
            {/* 多天排班控制 */}
            <div className="flex items-center gap-4">
              {isMultiSelectMode && selectedDates.length > 0 && (
                <div className="text-sm text-text-secondary">
                  已選擇 {selectedDates.length} 天
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
            {calendarDays.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0]
              const isCurrentMonth = date.getMonth() === currentMonth
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const isSelected = selectedDates.includes(dateStr)
              const daySchedules = scheduleData[dateStr] || []
              
              return (
                <div
                  key={index}
                  onClick={() => isCurrentMonth && handleDateClick(date)}
                  className={`
                    min-h-[100px] p-2 border-2 rounded-lg cursor-pointer
                    transition-all duration-200 hover:shadow-md
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-300 border-gray-200' : 
                      isSelected ? 'bg-green-100 border-green-500 border-2' :
                      isWeekend ? 'bg-blue-50 border-blue-200' : 'bg-bg-primary border-border-light'}
                    ${isToday ? 'ring-2 ring-mingcare-blue border-mingcare-blue' : ''}
                    hover:border-mingcare-blue
                  `}
                >
                  <div className={`
                    text-sm font-bold mb-2 flex justify-between items-center
                    ${isToday ? 'text-mingcare-blue' : 
                      isCurrentMonth ? 'text-text-primary' : 'text-gray-300'}
                  `}>
                    <span>{date.getDate()}</span>
                    {isCurrentMonth && (
                      <span className="text-xs text-green-600">
                        +
                      </span>
                    )}
                  </div>
                  
                  {/* 排班內容 */}
                  {isCurrentMonth && (
                    <div className="space-y-1">
                      {daySchedules.length > 0 ? (
                        daySchedules.slice(0, 2).map((schedule, i) => (
                          <div
                            key={i}
                            className="text-xs bg-mingcare-blue text-white px-2 py-1 rounded truncate"
                          >
                            {schedule.care_staff_name}
                          </div>
                        ))
                      ) : (
                        <div className="h-8"></div>
                      )}
                      
                      {daySchedules.length > 2 && (
                        <div className="text-xs text-center text-text-secondary">
                          +{daySchedules.length - 2} 個排班
                        </div>
                      )}
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
        />
      )}
    </div>
  )
}

// 報表頁面組件
function ReportsTab({ filters, setFilters, updateDateRange, exportLoading, handleExportCSV }: ReportsTabProps) {
  return (
    <div className="space-y-8">
      {/* 詳細篩選 */}
      <div className="card-apple border border-border-light fade-in-apple">
        <div className="p-6">
          <h2 className="text-apple-heading text-text-primary mb-6">篩選條件</h2>
          
          {/* 第一行：日期區間 + 快捷按鈕 */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2 bg-white border border-border-light rounded-lg px-4 py-2">
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="border-none outline-none bg-transparent text-sm"
              />
              <span className="text-text-secondary">-</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="border-none outline-none bg-transparent text-sm"
              />
            </div>
            
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                setFilters(prev => ({
                  ...prev,
                  dateRange: { start: today, end: today }
                }))
              }}
              className="px-4 py-2 text-sm border border-border-light rounded-lg hover:bg-bg-secondary transition-all duration-200 whitespace-nowrap"
            >
              今日記錄
            </button>
            
            <button
              onClick={() => updateDateRange('thisMonth')}
              className="px-4 py-2 text-sm border border-border-light rounded-lg bg-mingcare-blue text-white whitespace-nowrap"
            >
              本月記錄
            </button>
          </div>

          {/* 第二行：下拉篩選 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <div className="relative">
                <svg className="absolute left-3 top-3 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜尋客戶項目編號"
                  value={filters.searchTerm || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    searchTerm: e.target.value
                  }))}
                  className="w-full pl-10 pr-4 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <select
                  value={filters.projectCategory || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    projectCategory: e.target.value as ProjectCategory | undefined
                  }))}
                  className="w-full px-4 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent appearance-none bg-white pr-10"
                >
                  <option value="">選擇所屬項目</option>
                  {PROJECT_CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
                  className="w-full px-4 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent appearance-none bg-white pr-10"
                >
                  <option value="">選擇服務類型</option>
                  {SERVICE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div>
              <div className="relative">
                <select
                  value={filters.careStaffName || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    careStaffName: e.target.value
                  }))}
                  className="w-full px-4 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent appearance-none bg-white pr-10"
                >
                  <option value="">選擇護理人員</option>
                  {/* 這裡之後可以從資料庫載入護理人員列表 */}
                  <option value="張護理師">張護理師</option>
                  <option value="李護理師">李護理師</option>
                  <option value="王護理師">王護理師</option>
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 詳細列表 */}
      <div className="card-apple border border-border-light fade-in-apple">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-apple-heading text-text-primary">服務記錄列表</h3>
            <button
              onClick={handleExportCSV}
              disabled={exportLoading}
              className="px-6 py-3 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>導出中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>導出 CSV</span>
                </>
              )}
            </button>
          </div>
          
          {/* 列表組件占位 */}
          <div className="bg-bg-secondary rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-mingcare-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-text-primary font-medium mb-2">📋 詳細記錄列表</p>
            <p className="text-sm text-text-secondary">
              將在後續步驟實作：表格顯示、排序、分頁、編輯功能
            </p>
          </div>
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
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'reports'>('overview')
  const router = useRouter()

  // 狀態管理
  const [filters, setFilters] = useState<BillingSalaryFilters>(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      dateRange: {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0]
      }
    }
  })

  const [kpiData, setKpiData] = useState<BusinessKPI | null>(null)
  const [categorySummary, setCategorySummary] = useState<ProjectCategorySummary[]>([])

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
        start: filters.dateRange.start,
        end: filters.dateRange.end
      })
      if (kpiResult.success && kpiResult.data) {
        setKpiData(kpiResult.data)
      }

      // 載入分類統計
      const categoryResult = await getProjectCategorySummary({
        start: filters.dateRange.start,
        end: filters.dateRange.end
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
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      default:
        return
    }

    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: start.getFullYear() + '-' + 
               String(start.getMonth() + 1).padStart(2, '0') + '-' + 
               String(start.getDate()).padStart(2, '0'),
        end: end.getFullYear() + '-' + 
             String(end.getMonth() + 1).padStart(2, '0') + '-' + 
             String(end.getDate()).padStart(2, '0')
      }
    }))
  }

  const handleExportCSV = async () => {
    setExportLoading(true)
    try {
      const result = await exportToCSV(filters)
      if (result.success && result.data) {
        // 創建下載連結
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `billing_salary_data_${filters.dateRange.start}_${filters.dateRange.end}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 顯示成功訊息
        alert(result.message || '導出成功')
      } else {
        alert(result.error || '導出失敗')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('導出時發生錯誤')
    } finally {
      setExportLoading(false)
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
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-apple-title text-text-primary mb-2">護理服務管理</h1>
              <p className="text-apple-body text-text-secondary">安排護理服務、管理服務排程及記錄</p>
            </div>
            <BackToHomeButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Tab 導航 */}
        <div className="mb-8">
          <div className="border-b border-border-light">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'border-mingcare-blue text-mingcare-blue'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-light'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>業務概覽</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'schedule'
                    ? 'border-mingcare-blue text-mingcare-blue'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-light'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>排程管理</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'reports'
                    ? 'border-mingcare-blue text-mingcare-blue'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-light'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>詳細報表</span>
                </div>
              </button>
            </nav>
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
            handleExportCSV={handleExportCSV}
          />
        )}
      </main>
    </div>
  )
}

// 排班表單 Modal 組件
interface ScheduleFormModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string | null
  selectedDates: string[]
  onSubmit: (formData: BillingSalaryFormData) => Promise<void>
}

function ScheduleFormModal({ isOpen, onClose, selectedDate, selectedDates, onSubmit }: ScheduleFormModalProps) {
  const [formData, setFormData] = useState<BillingSalaryFormData>({
    service_date: selectedDate || new Date().toISOString().split('T')[0],
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
  })

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // 搜尋功能狀態
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  
  const [staffSearchTerm, setStaffSearchTerm] = useState('')
  const [staffSuggestions, setStaffSuggestions] = useState<any[]>([])
  const [showStaffSuggestions, setShowStaffSuggestions] = useState(false)
  
  // 檢查是否為多日期排班
  const isMultiDay = selectedDates.length > 1

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
      
      // 準備提交的資料，不包含計算欄位
      const submitData = {
        ...formData,
        // hourly_rate 和 hourly_salary 由 trigger 自動計算，不需要傳送
        hourly_rate: 0,
        hourly_salary: 0
      }
      
      await onSubmit(submitData)
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
      
      // 自動計算服務時數
      if (field === 'start_time' || field === 'end_time') {
        updated.service_hours = calculateServiceHours(
          field === 'start_time' ? value : updated.start_time,
          field === 'end_time' ? value : updated.end_time
        )
      }
      
      // 自動計算每小時收費和時薪薪資（僅用於顯示）
      if (field === 'service_fee' || field === 'staff_salary' || field === 'service_hours') {
        if (updated.service_hours > 0) {
          updated.hourly_rate = updated.service_fee / updated.service_hours
          updated.hourly_salary = updated.staff_salary / updated.service_hours
        }
      }
      
      return updated
    })
  }

  // 客戶搜尋功能
  const handleCustomerSearch = async (searchTerm: string) => {
    setCustomerSearchTerm(searchTerm)
    
    if (searchTerm.trim().length < 2) {
      setCustomerSuggestions([])
      setShowCustomerSuggestions(false)
      return
    }

    try {
      const response = await fetch('/api/search-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCustomerSuggestions(data.data || [])
        setShowCustomerSuggestions(true)
      }
    } catch (error) {
      console.error('客戶搜尋失敗:', error)
    }
  }

  // 選擇客戶
  const selectCustomer = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.customer_name,
      customer_id: customer.customer_id || '',
      phone: customer.phone || '',
      service_address: customer.service_address || ''
    }))
    setCustomerSearchTerm(customer.customer_name)
    setShowCustomerSuggestions(false)
  }

  // 護理人員搜尋功能
  const handleStaffSearch = async (searchTerm: string) => {
    setStaffSearchTerm(searchTerm)
    
    if (searchTerm.trim().length < 2) {
      setStaffSuggestions([])
      setShowStaffSuggestions(false)
      return
    }

    try {
      const response = await fetch('/api/search-care-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm })
      })
      
      if (response.ok) {
        const data = await response.json()
        setStaffSuggestions(data.data || [])
        setShowStaffSuggestions(true)
      }
    } catch (error) {
      console.error('護理人員搜尋失敗:', error)
    }
  }

  // 選擇護理人員
  const selectStaff = (staff: any) => {
    setFormData(prev => ({
      ...prev,
      care_staff_name: staff.name_chinese
    }))
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
            {isMultiDay ? `批量新增排班 (${selectedDates.length} 天)` : `新增排班 - ${selectedDate}`}
          </h3>
          
          {isMultiDay && (
            <div className="mt-2 text-sm text-text-secondary">
              選定日期：{selectedDates.sort().join(', ')}
            </div>
          )}
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 表單內容占位，後續可以完整實作 */}
            <div className="text-center py-12">
              <p className="text-text-secondary">表單內容在這裡實作（節省空間暫時省略）</p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-light bg-bg-secondary">
          <div className="flex justify-end gap-3">
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
              {submitting ? '處理中...' : (isMultiDay ? '批量新增' : '新增排班')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
