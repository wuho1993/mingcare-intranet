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
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([]) // 多日期選擇
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false) // 多選模式
  const [formSubmitting, setFormSubmitting] = useState(false)

  // 切換多選模式
  const toggleMultiSelectMode = () => {
    if (isMultiSelectMode) {
      // 取消多選：清除選擇，回到單日模式
      setSelectedDates([])
      setIsMultiSelectMode(false)
    } else {
      // 啟動多選模式
      setIsMultiSelectMode(true)
      setSelectedDates([])
    }
  }

  // 確認多選日期並開彈窗
  const confirmMultipleSelection = () => {
    if (selectedDates.length > 0) {
      setShowAddModal(true)
    }
  }

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
                onClick={toggleMultiSelectMode}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                  isMultiSelectMode
                    ? 'bg-mingcare-blue text-white border-mingcare-blue'
                    : 'border-border-light hover:bg-bg-secondary text-text-secondary'
                }`}
              >
                {isMultiSelectMode ? '取消多選' : '+ 多天排更'}
              </button>
              
              {isMultiSelectMode && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">
                    已選擇 {selectedDates.length} 天
                  </span>
                  {selectedDates.length > 0 && (
                    <button
                      onClick={confirmMultipleSelection}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                    >
                      確認日期
                    </button>
                  )}
                </div>
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
            
            <h4 className="text-lg font-medium text-text-primary flex items-center gap-2">
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
                    ${isMultiSelectMode && isCurrentMonth ? 'hover:bg-green-50 hover:border-green-300' : 'hover:border-mingcare-blue'}
                  `}
                >
                  <div className={`
                    text-sm font-bold mb-2 flex justify-between items-center
                    ${isToday ? 'text-mingcare-blue' : 
                      isCurrentMonth ? 'text-text-primary' : 'text-gray-300'}
                  `}>
                    <span>{date.getDate()}</span>
                    {isCurrentMonth && (
                      <div className="flex items-center gap-1">
                        {/* 多選模式下顯示勾選標記 */}
                        {isMultiSelectMode && isSelected && (
                          <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                        {/* 單日模式下顯示加號 */}
                        {!isMultiSelectMode && (
                          <span className="text-xs text-green-600">
                            +
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* 排班內容區域 */}
                  {isCurrentMonth && (
                    <div className="space-y-1">
                      <div className="h-8 flex items-center justify-center">
                        {isMultiSelectMode ? (
                          <span className="text-xs text-text-secondary text-center">
                            {isSelected ? '已選擇' : '點擊選擇'}
                          </span>
                        ) : (
                          <span className="text-xs text-text-secondary text-center">
                            點擊排班
                          </span>
                        )}
                      </div>
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
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'reports'>('reports')
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
    if (user) {
      loadKPIData()
    }
  }, [user, filters.dateRange])

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
  
  // Step 4: 兩步提交狀態
  const [submitStep, setSubmitStep] = useState<'form' | 'preview'>('form')
  const [previewData, setPreviewData] = useState<any>(null)
  const [conflictData, setConflictData] = useState<any[]>([])
  const [showConflictWarning, setShowConflictWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Step 3: 常用時段配置
  const commonTimeSlots = [
    { label: '早上', start: '08:00', end: '12:00' },
    { label: '下午', start: '12:00', end: '18:00' },
    { label: '晚上', start: '18:00', end: '22:00' },
    { label: '日間', start: '09:00', end: '17:00' },
    { label: '通宵', start: '22:00', end: '06:00' }
  ]

  // Step 3: 生成時間選項 (00/30分鐘限制)
  const generateTimeOptions = () => {
    const times = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        times.push(timeString)
      }
    }
    return times
  }

  // Step 3: 設定快速時間
  const setQuickTime = (startTime: string, endTime: string) => {
    setFormData(prev => ({ 
      ...prev, 
      start_time: startTime, 
      end_time: endTime,
      service_hours: calculateServiceHours(startTime, endTime)
    }))
    setShowStartTimePicker(false)
    setShowEndTimePicker(false)
  }

  // Step 3: 更新開始時間
  const updateStartTime = (time: string) => {
    setFormData(prev => ({ 
      ...prev, 
      start_time: time,
      service_hours: prev.end_time ? calculateServiceHours(time, prev.end_time) : 0
    }))
    setShowStartTimePicker(false)
  }

  // Step 3: 更新結束時間
  const updateEndTime = (time: string) => {
    setFormData(prev => ({ 
      ...prev, 
      end_time: time,
      service_hours: prev.start_time ? calculateServiceHours(prev.start_time, time) : 0
    }))
    setShowEndTimePicker(false)
  }

  // Step 3: 計算服務時數
  const calculateServiceHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0
    
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    
    let startTotalMinutes = startHour * 60 + startMinute
    let endTotalMinutes = endHour * 60 + endMinute
    
    // 處理跨日情況 (例如: 22:00 到 06:00)
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60 // 加上一天的分鐘數
    }
    
    const diffMinutes = endTotalMinutes - startTotalMinutes
    return Number((diffMinutes / 60).toFixed(1))
  }
  
  // Step 2: 隱藏的 customer_id 欄位（用於資料庫關聯）
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  
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

  // Step 4: 處理表單提交 - 兩步流程
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (submitStep === 'form') {
      // 步驟一：驗證表單並進入預覽
      const formErrors = validateForm(formData)
      
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors)
        return
      }
      
      // Step 5: 衝突掃描
      await performConflictScan()
      
      // 準備預覽資料
      setPreviewData({
        ...formData,
        selectedDates,
        calculatedData: {
          hourly_rate: formData.service_hours > 0 ? (formData.service_fee / formData.service_hours) : 0,
          hourly_salary: formData.service_hours > 0 ? (formData.staff_salary / formData.service_hours) : 0,
          profit: formData.service_fee - formData.staff_salary
        }
      })
      
      setSubmitStep('preview')
    } else {
      // 步驟二：確認提交到 Supabase
      await submitToDatabase()
    }
  }

  // Step 5: 衝突掃描功能
  const performConflictScan = async () => {
    try {
      setIsLoading(true)
      const conflicts = []
      
      for (const dateStr of selectedDates) {
        // 檢查護理人員衝突
        if (formData.care_staff_name && formData.start_time && formData.end_time) {
          const staffConflicts = await checkStaffConflict(
            formData.care_staff_name,
            dateStr,
            formData.start_time,
            formData.end_time
          )
          conflicts.push(...staffConflicts)
        }
        
        // 檢查客戶重複預約
        if (formData.customer_id && formData.start_time && formData.end_time) {
          const customerConflicts = await checkCustomerConflict(
            formData.customer_id,
            dateStr,
            formData.start_time,
            formData.end_time
          )
          conflicts.push(...customerConflicts)
        }
      }
      
      setConflictData(conflicts)
      setShowConflictWarning(conflicts.length > 0)
    } catch (error) {
      console.error('衝突掃描錯誤:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 5: 檢查護理人員時間衝突
  const checkStaffConflict = async (staffName: string, date: string, startTime: string, endTime: string) => {
    try {
      const { data, error } = await supabase
        .from('billing_salary_data')
        .select('*')
        .eq('care_staff_name', staffName)
        .eq('service_date', date)
        .not('start_time', 'gte', endTime)
        .not('end_time', 'lte', startTime)
      
      if (error) throw error
      
      return data.map(conflict => ({
        type: 'staff',
        message: `護理人員 ${staffName} 在 ${date} ${conflict.start_time}-${conflict.end_time} 已有其他預約`,
        data: conflict
      }))
    } catch (error) {
      console.error('檢查護理人員衝突錯誤:', error)
      return []
    }
  }

  // Step 5: 檢查客戶重複預約
  const checkCustomerConflict = async (customerId: string, date: string, startTime: string, endTime: string) => {
    try {
      const { data, error } = await supabase
        .from('billing_salary_data')
        .select('*')
        .eq('customer_id', customerId)
        .eq('service_date', date)
        .not('start_time', 'gte', endTime)
        .not('end_time', 'lte', startTime)
      
      if (error) throw error
      
      return data.map(conflict => ({
        type: 'customer',
        message: `客戶在 ${date} ${conflict.start_time}-${conflict.end_time} 已有預約`,
        data: conflict
      }))
    } catch (error) {
      console.error('檢查客戶衝突錯誤:', error)
      return []
    }
  }

  // Step 6: 提交到資料庫
  const submitToDatabase = async () => {
    try {
      setSubmitting(true)
      
      const records = selectedDates.map(dateStr => ({
        service_date: dateStr,
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
        hourly_rate: formData.service_hours > 0 ? (formData.service_fee / formData.service_hours) : 0,
        hourly_salary: formData.service_hours > 0 ? (formData.staff_salary / formData.service_hours) : 0,
        service_type: formData.service_type,
        project_category: formData.project_category,
        project_manager: formData.project_manager
      }))
      
      // 批量插入到 Supabase
      const { error } = await supabase
        .from('billing_salary_data')
        .insert(records)
      
      if (error) throw error
      
      // 成功後重置表單
      resetForm()
      setIsModalOpen(false)
      alert('排班記錄已成功建立！')
      
    } catch (error) {
      console.error('提交錯誤:', error)
      alert('提交失敗，請重試')
    } finally {
      setSubmitting(false)
    }
  }

  // 重置表單
  const resetForm = () => {
    setFormData({
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
    setSubmitStep('form')
    setPreviewData(null)
    setConflictData([])
    setShowConflictWarning(false)
    setErrors({})
  }

  // 返回表單編輯
  const backToForm = () => {
    setSubmitStep('form')
    setPreviewData(null)
  }
    setSubmitStep('form')
    setPreviewData(null)
  }

  // Step 4: 關閉 modal 時重置步驟
  const handleClose = () => {
    setSubmitStep('form')
    setPreviewData(null)
    onClose()
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

  // Step 2: 選擇客戶 - 增強版
  const selectCustomer = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.customer_name,
      // Step 2: 自動填入客戶資料
      phone: customer.phone || '',
      service_address: customer.service_address || ''
    }))
    setSelectedCustomerId(customer.customer_id) // 保存 customer_id（規格要求）
    setCustomerSearchTerm(customer.customer_name)
    setShowCustomerSuggestions(false)
    
    console.log('已自動填入客戶資料:', {
      客戶ID: customer.customer_id,
      姓名: customer.customer_name,
      電話: customer.phone,
      地址: customer.service_address
    })
  }
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

  // Step 3: 關閉搜尋建議
  const closeStaffSuggestions = () => {
    setShowStaffSuggestions(false)
  }

  // Step 2: 點擊外部關閉建議
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.staff-search-container')) {
        setShowStaffSuggestions(false)
      }
      if (!target.closest('.customer-search-container')) {
        setShowCustomerSuggestions(false)
      }
      // Step 3: 點擊外部關閉時間選擇器
      if (!target.closest('.time-picker-container')) {
        setShowStartTimePicker(false)
        setShowEndTimePicker(false)
      }
    }

    if (showStaffSuggestions || showCustomerSuggestions || showStartTimePicker || showEndTimePicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStaffSuggestions, showCustomerSuggestions, showStartTimePicker, showEndTimePicker])

  // Step 2: 選擇護理人員 - 增強版自動填入
  const selectStaff = (staff: any) => {
    setFormData(prev => ({
      ...prev,
      care_staff_name: staff.name_chinese,
      // Step 2: 自動填入護理員資料
      ...(staff.phone && { staff_phone: staff.phone }),
      ...(staff.email && { staff_email: staff.email }),
      // 如果有時薪資料，自動填入建議薪資
      ...(staff.hourly_rates && staff.hourly_rates.length > 0 && {
        staff_salary: staff.hourly_rates[0]?.rate || prev.staff_salary
      })
    }))
    setStaffSearchTerm(staff.name_chinese)
    setShowStaffSuggestions(false)
    
    // Step 2: 用戶體驗提示
    console.log('已自動填入護理員資料:', {
      姓名: staff.name_chinese,
      電話: staff.phone,
      信箱: staff.email,
      職位: staff.job_position,
      時薪: staff.hourly_rates
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-primary rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Step 4: Header with Progress Indicator */}
        <div className="p-6 border-b border-border-light">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-text-primary">
              {isMultiDay ? `批量新增排班 (${selectedDates.length} 天)` : `新增排班 - ${selectedDate}`}
            </h3>
            
            {/* Step 4: 步驟指示器 */}
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                submitStep === 'form' ? 'bg-mingcare-blue text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                submitStep === 'preview' ? 'bg-mingcare-blue text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>
          
          {/* Step 4: 步驟標題 */}
          <div className="text-sm text-text-secondary mb-2">
            {submitStep === 'form' && '步驟一：填寫排班資訊'}
            {submitStep === 'preview' && '步驟二：確認提交'}
          </div>
          
          {isMultiDay && (
            <div className="text-sm text-text-secondary">
              選定日期：{selectedDates.sort().join(', ')}
            </div>
          )}
        </div>

        {/* Step 2: Form Content with Three-Card Layout */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {submitStep === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Step 2: 卡片 1 - 客戶基本資料 */}
              <div className="card-apple border border-border-light p-6">
                <h4 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                  📋 客戶基本資料
                </h4>
                
                {/* 客戶搜尋 */}
                <div className="relative customer-search-container mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    客戶搜尋 *
                  </label>
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    placeholder="輸入客戶姓名或客戶編號..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue ${
                      errors.customer_name ? 'border-red-300' : 'border-border-light'
                    }`}
                  />
                  {errors.customer_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>
                  )}
                  
                  {/* 客戶搜尋建議列表 */}
                  {showCustomerSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-border-light rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {customerSuggestions.map((customer, index) => (
                        <div
                          key={customer.customer_id || index}
                          onClick={() => selectCustomer(customer)}
                          className="p-3 hover:bg-bg-secondary cursor-pointer border-b border-border-light last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-text-primary">
                                {customer.customer_name}
                                <span className="text-text-secondary ml-2">({customer.customer_id})</span>
                              </div>
                              <div className="text-sm text-text-secondary mt-1">
                                {customer.phone && <span className="mr-3">📱 {customer.phone}</span>}
                                {customer.service_address && <span>📍 {customer.service_address}</span>}
                              </div>
                            </div>
                            <div className="text-xs text-text-secondary">選擇</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 客戶資料欄位 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">客戶姓名 *</label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue"
                      placeholder="從上方搜尋選擇或手動輸入"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">聯絡電話</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue"
                      placeholder="可修改"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">服務地址</label>
                    <input
                      type="text"
                      value={formData.service_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_address: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue"
                      placeholder="可修改"
                    />
                  </div>

                  {/* 隱藏的客戶ID顯示（方便檢查） */}
                  {selectedCustomerId && (
                    <div className="md:col-span-2">
                      <div className="text-xs text-text-secondary bg-bg-secondary p-2 rounded">
                        客戶ID: {selectedCustomerId}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: 卡片 2 - 服務詳情 */}
              <div className="card-apple border border-border-light p-6">
                <h4 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                  🏥 服務詳情
                </h4>
                
                {/* 下拉選單 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">服務類型 *</label>
                    <select
                      value={formData.service_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value as ServiceType }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue"
                    >
                      <option value="">選擇服務類型</option>
                      {SERVICE_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">項目分類 *</label>
                    <select
                      value={formData.project_category}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_category: e.target.value as ProjectCategory }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue"
                    >
                      <option value="">選擇項目分類</option>
                      {PROJECT_CATEGORY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">項目負責人 *</label>
                    <select
                      value={formData.project_manager}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_manager: e.target.value as ProjectManager }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue"
                    >
                      <option value="">選擇項目負責人</option>
                      {PROJECT_MANAGER_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 護理人員搜尋 */}
                <div className="relative staff-search-container mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    護理人員 *
                  </label>
                  <input
                    type="text"
                    value={staffSearchTerm}
                    onChange={(e) => handleStaffSearch(e.target.value)}
                    onFocus={() => setShowStaffSuggestions(true)}
                    placeholder="輸入護理人員姓名或員工編號..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue ${
                      errors.care_staff_name ? 'border-red-300' : 'border-border-light'
                    }`}
                  />
                  {errors.care_staff_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.care_staff_name}</p>
                  )}
                  
                  {/* 護理人員搜尋建議列表 */}
                  {showStaffSuggestions && staffSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-border-light rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {staffSuggestions.map((staff, index) => (
                        <div
                          key={staff.staff_id || index}
                          onClick={() => selectStaff(staff)}
                          className="p-3 hover:bg-bg-secondary cursor-pointer border-b border-border-light last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-text-primary">
                                {staff.name_chinese}
                                <span className="text-text-secondary ml-2">({staff.staff_id})</span>
                              </div>
                              <div className="text-sm text-text-secondary mt-1">
                                {staff.phone && <span className="mr-3">📱 {staff.phone}</span>}
                              </div>
                              {staff.job_position && (
                                <div className="text-xs text-mingcare-blue mt-1">
                                  💼 {staff.job_position}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-text-secondary">選擇</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 3: 時間選擇器 - 限制 00/30 分鐘 */}
                <div className="time-picker-container">
                  <label className="block text-sm font-medium text-text-primary mb-2">服務時間 *</label>
                  
                  {/* 常用時段快速選擇 */}
                  <div className="mb-4">
                    <p className="text-xs text-text-secondary mb-2">常用時段：</p>
                    <div className="flex flex-wrap gap-2">
                      {commonTimeSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setQuickTime(slot.start, slot.end)}
                          className="px-3 py-1 text-sm border border-border-light rounded-lg hover:bg-mingcare-blue hover:text-white transition-all duration-200"
                        >
                          {slot.label} ({slot.start}-{slot.end})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 開始和結束時間選擇器 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* 開始時間 */}
                    <div className="relative">
                      <label className="block text-xs text-text-secondary mb-1">開始時間</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowStartTimePicker(!showStartTimePicker)
                          setShowEndTimePicker(false)
                        }}
                        className="w-full px-3 py-2 border border-border-light rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-mingcare-blue flex items-center justify-between"
                      >
                        <span>{formData.start_time || '選擇時間'}</span>
                        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      {/* 開始時間選擇器下拉 */}
                      {showStartTimePicker && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-border-light rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {generateTimeOptions().map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => updateStartTime(time)}
                              className="w-full px-3 py-2 text-left hover:bg-bg-secondary transition-colors duration-200"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 結束時間 */}
                    <div className="relative">
                      <label className="block text-xs text-text-secondary mb-1">結束時間</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEndTimePicker(!showEndTimePicker)
                          setShowStartTimePicker(false)
                        }}
                        className="w-full px-3 py-2 border border-border-light rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-mingcare-blue flex items-center justify-between"
                      >
                        <span>{formData.end_time || '選擇時間'}</span>
                        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      {/* 結束時間選擇器下拉 */}
                      {showEndTimePicker && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-border-light rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {generateTimeOptions().map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => updateEndTime(time)}
                              className="w-full px-3 py-2 text-left hover:bg-bg-secondary transition-colors duration-200"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: 服務時數與計算按鈕 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">服務時數 *</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={formData.service_hours}
                          onChange={(e) => setFormData(prev => ({ ...prev, service_hours: parseFloat(e.target.value) || 0 }))}
                          className="flex-1 px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue"
                          placeholder="小時"
                        />
                        {formData.start_time && formData.end_time && (
                          <button
                            type="button"
                            onClick={() => {
                              const calculated = calculateServiceHours(formData.start_time, formData.end_time)
                              setFormData(prev => ({ ...prev, service_hours: calculated }))
                            }}
                            className="px-3 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200"
                          >
                            計算
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 自動計算的服務時數顯示 */}
                    {formData.start_time && formData.end_time && (
                      <div className="flex items-end">
                        <div className="w-full p-2 bg-bg-secondary rounded-lg">
                          <p className="text-sm text-text-secondary">
                            預計時數：<span className="font-medium text-mingcare-blue">{calculateServiceHours(formData.start_time, formData.end_time)} 小時</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: 卡片 3 - 收費與工資 */}
              <div className="card-apple border border-border-light p-6">
                <h4 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                  💰 收費與工資
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">服務費用 * (HK$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.service_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_fee: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">員工薪資 * (HK$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.service_fee}
                      value={formData.staff_salary}
                      onChange={(e) => setFormData(prev => ({ ...prev, staff_salary: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-mingcare-blue"
                    />
                  </div>

                  {/* 自動計算欄位 */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">時薪 (自動計算)</label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                      HK$ {formData.service_hours > 0 ? (formData.service_fee / formData.service_hours).toFixed(2) : '0.00'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">員工時薪 (自動計算)</label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                      HK$ {formData.service_hours > 0 ? (formData.staff_salary / formData.service_hours).toFixed(2) : '0.00'}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">本次利潤</label>
                    <div className={`px-3 py-2 border rounded-lg font-medium ${
                      (formData.service_fee - formData.staff_salary) >= 0 
                        ? 'bg-green-50 border-green-300 text-green-700' 
                        : 'bg-red-50 border-red-300 text-red-700'
                    }`}>
                      HK$ {(formData.service_fee - formData.staff_salary).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

            </form>
          )}

          {/* Step 4: 預覽確認界面 */}
          {submitStep === 'preview' && previewData && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-lg font-medium text-yellow-800">請確認排班資訊</h4>
                </div>
                <p className="text-sm text-yellow-700">請仔細核對以下資訊，確認無誤後點擊「確認提交」</p>
              </div>

              {/* 衝突警告 */}
              {showConflictWarning && conflictData.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-lg font-medium text-red-800">發現時間衝突</h4>
                  </div>
                  <div className="space-y-2">
                    {conflictData.map((conflict, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-100 rounded p-2">
                        ⚠️ {conflict.message}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-red-600 mt-2">請檢查時間安排，或選擇「強制提交」繼續。</p>
                </div>
              )}

              {/* 預覽內容 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 服務資訊 */}
                <div className="card-apple border border-border-light p-6">
                  <h4 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                    📅 服務資訊
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-text-secondary">服務日期：</span>
                      <div className="font-medium">
                        {selectedDates.length === 1 
                          ? selectedDates[0]
                          : `${selectedDates[0]} 等 ${selectedDates.length} 個日期`
                        }
                      </div>
                      {selectedDates.length > 1 && (
                        <div className="text-xs text-text-secondary mt-1">
                          完整日期：{selectedDates.join(', ')}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-text-secondary">服務時間：</span>
                      <div className="font-medium">{previewData.start_time} - {previewData.end_time}</div>
                    </div>
                    <div>
                      <span className="text-sm text-text-secondary">服務時數：</span>
                      <div className="font-medium">{previewData.service_hours} 小時</div>
                    </div>
                    <div>
                      <span className="text-sm text-text-secondary">服務類型：</span>
                      <div className="font-medium">{previewData.service_type}</div>
                    </div>
                  </div>
                </div>

                {/* 客戶資訊 */}
                <div className="card-apple border border-border-light p-6">
                  <h4 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                    🏥 客戶資訊
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-text-secondary">客戶姓名：</span>
                      <div className="font-medium">{previewData.customer_name}</div>
                    </div>
                    <div>
                      <span className="text-sm text-text-secondary">聯繫電話：</span>
                      <div className="font-medium">{previewData.phone}</div>
                    </div>
                    <div>
                      <span className="text-sm text-text-secondary">服務地址：</span>
                      <div className="font-medium">{previewData.service_address}</div>
                    </div>
                    <div>
                      <span className="text-sm text-text-secondary">護理人員：</span>
                      <div className="font-medium">{previewData.care_staff_name}</div>
                    </div>
                  </div>
                </div>

                {/* 費用資訊 */}
                <div className="card-apple border border-border-light p-6 md:col-span-2">
                  <h4 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                    💰 費用計算
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-600">服務費用</div>
                      <div className="text-xl font-bold text-blue-800">HK$ {previewData.service_fee.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-green-600">員工薪資</div>
                      <div className="text-xl font-bold text-green-800">HK$ {previewData.staff_salary.toFixed(2)}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-sm text-purple-600">時薪</div>
                      <div className="text-xl font-bold text-purple-800">HK$ {previewData.calculatedData.hourly_rate.toFixed(2)}</div>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      previewData.calculatedData.profit >= 0 
                        ? 'bg-green-50 text-green-800' 
                        : 'bg-red-50 text-red-800'
                    }`}>
                      <div className={`text-sm ${
                        previewData.calculatedData.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        本次利潤
                      </div>
                      <div className="text-xl font-bold">
                        HK$ {previewData.calculatedData.profit.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* 批量建立提示 */}
                  {selectedDates.length > 1 && (
                    <div className="mt-4 p-3 bg-mingcare-blue bg-opacity-10 rounded-lg border border-mingcare-blue border-opacity-30">
                      <div className="text-sm text-mingcare-blue font-medium">
                        📋 批量建立提示：將為 {selectedDates.length} 個日期建立相同的排班記錄
                      </div>
                      <div className="text-xs text-mingcare-blue mt-1">
                        總收入：HK$ {(previewData.service_fee * selectedDates.length).toFixed(2)} | 
                        總支出：HK$ {(previewData.staff_salary * selectedDates.length).toFixed(2)} | 
                        總利潤：HK$ {(previewData.calculatedData.profit * selectedDates.length).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}          {/* Step 4: Preview Step */}
          {submitStep === 'preview' && previewData && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-yellow-800 font-medium">請確認以下排班資訊</p>
                </div>
              </div>

              {/* 基本資訊預覽 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-text-primary border-b border-border-light pb-2">客戶資訊</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">客戶姓名：</span>
                      <span className="text-text-primary font-medium">{previewData.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">聯絡電話：</span>
                      <span className="text-text-primary">{previewData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">服務地址：</span>
                      <span className="text-text-primary">{previewData.service_address}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-text-primary border-b border-border-light pb-2">護理人員</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">護理人員：</span>
                      <span className="text-text-primary font-medium">{previewData.care_staff_name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-text-primary border-b border-border-light pb-2">服務時間</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">開始時間：</span>
                      <span className="text-text-primary">{previewData.start_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">結束時間：</span>
                      <span className="text-text-primary">{previewData.end_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">服務時數：</span>
                      <span className="text-mingcare-blue font-medium">{previewData.service_hours} 小時</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-text-primary border-b border-border-light pb-2">費用資訊</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">服務費用：</span>
                      <span className="text-text-primary">HK$ {previewData.service_fee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">員工薪資：</span>
                      <span className="text-text-primary">HK$ {previewData.staff_salary}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 多日期排班特殊顯示 */}
              {isMultiDay && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">批量排班資訊</h4>
                  <p className="text-blue-700 text-sm">
                    此排班將應用於 <span className="font-medium">{selectedDates.length} 天</span>：
                    {selectedDates.sort().join(', ')}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    總計將創建 {selectedDates.length} 筆排班記錄
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 4: Footer with Conditional Buttons */}
        <div className="p-6 border-t border-border-light bg-bg-secondary">
          <div className="flex justify-between">
            {/* Left side buttons */}
            <div className="flex gap-3">
              {submitStep === 'preview' && (
                <button
                  type="button"
                  onClick={handleBackToForm}
                  className="px-4 py-2 text-mingcare-blue border border-mingcare-blue rounded-lg hover:bg-mingcare-blue hover:text-white transition-all duration-200"
                  disabled={submitting}
                >
                  ← 返回修改
                </button>
              )}
            </div>
            
            {/* Right side buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-bg-primary transition-all duration-200"
                disabled={submitting}
              >
                取消
              </button>
              
            {/* Step 4: 按鈕區域 - 支援兩步流程 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-bg-secondary transition-all duration-200"
              >
                取消
              </button>
              
              {submitStep === 'form' && (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={submitting || isLoading}
                  className="px-6 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isLoading ? '掃描中...' : '下一步 →'}
                </button>
              )}
              
              {submitStep === 'preview' && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={backToForm}
                    className="px-4 py-2 text-mingcare-blue border border-mingcare-blue rounded-lg hover:bg-mingcare-blue hover:bg-opacity-10 transition-all duration-200"
                  >
                    ← 返回編輯
                  </button>
                  
                  {showConflictWarning && conflictData.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {submitting ? '提交中...' : '⚠️ 強制提交'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {submitting ? '提交中...' : '✅ 確認提交'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
