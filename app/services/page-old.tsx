'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { BackToHomeButton } from '../../components/BackToHomeButton'
import type {
  BillingSalaryFilters,
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
import { getBusinessKPI, getProjectCategorySummary, exportToCSV } from '../../services/billing-salary-management'

export default function ServicesPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [kpiLoading, setKpiLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
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
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'reports'>('overview')

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

  // 載入 KPI 和統計數據
  useEffect(() => {
    if (user) {
      loadKPIData()
    }
  }, [user, filters.dateRange])

  const loadKPIData = async () => {
    setKpiLoading(true)
    try {
      const [kpiResult, summaryResult] = await Promise.all([
        getBusinessKPI(filters.dateRange),
        getProjectCategorySummary(filters.dateRange)
      ])

      if (kpiResult.success && kpiResult.data) {
        setKpiData(kpiResult.data)
      }

      if (summaryResult.success && summaryResult.data) {
        setCategorySummary(summaryResult.data)
      }
    } catch (error) {
      console.error('Error loading KPI data:', error)
    } finally {
      setKpiLoading(false)
    }
  }

  const updateDateRange = (preset: DateRangePreset) => {
    const now = new Date()
    let start: Date, end: Date

    switch (preset) {
      case 'last7days':
        end = new Date(now)
        start = new Date(now)
        start.setDate(start.getDate() - 6)
        break
      case 'last30days':
        end = new Date(now)
        start = new Date(now)
        start.setDate(start.getDate() - 29)
        break
      case 'last90days':
        end = new Date(now)
        start = new Date(now)
        start.setDate(start.getDate() - 89)
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
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    }))
  }

  const handleExportCSV = async () => {
    setExportLoading(true)
    try {
      const result = await exportToCSV(filters)
      
      if (result.success && result.data) {
        // 創建下載連結
        const blob = new Blob(['\uFEFF' + result.data], { 
          type: 'text/csv;charset=utf-8;' 
        })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        
        link.setAttribute('href', url)
        link.setAttribute('download', `護理服務記錄_${filters.dateRange.start}_${filters.dateRange.end}.csv`)
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
          <ScheduleTab />
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
        {/* 全域篩選條 */}
        <div className="card-apple border border-border-light mb-8 fade-in-apple">
          <div className="p-6">
            <h2 className="text-apple-heading text-text-primary mb-6">篩選條件</h2>
            
            {/* 第一行：日期區間快捷鍵 */}
            <div className="grid grid-cols-6 gap-3 mb-6">
              <button
                onClick={() => updateDateRange('last7days')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
              >
                最近7天
              </button>
              <button
                onClick={() => updateDateRange('last30days')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
              >
                最近30天
              </button>
              <button
                onClick={() => updateDateRange('last90days')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
              >
                最近90天
              </button>
              <button
                onClick={() => updateDateRange('thisMonth')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light bg-mingcare-blue text-white"
              >
                本月
              </button>
              <button
                onClick={() => updateDateRange('lastMonth')}
                className="px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200"
              >
                上月
              </button>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="flex-1 px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="flex-1 px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                />
              </div>
            </div>

            {/* 第二行：下拉篩選 */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">服務類型</label>
                <select
                  value={filters.serviceType || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    serviceType: e.target.value as ServiceType | undefined
                  }))}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                >
                  <option value="">全部</option>
                  {SERVICE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">所屬項目</label>
                <select
                  value={filters.projectCategory || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    projectCategory: e.target.value as ProjectCategory | undefined
                  }))}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                >
                  <option value="">全部</option>
                  {PROJECT_CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">項目經理</label>
                <select
                  value={filters.projectManager || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    projectManager: e.target.value as ProjectManager | undefined
                  }))}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                >
                  <option value="">全部</option>
                  {PROJECT_MANAGER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">護理人員</label>
                <input
                  type="text"
                  placeholder="搜尋護理人員姓名"
                  value={filters.careStaffName || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    careStaffName: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                />
              </div>
            </div>

            {/* 第三行：搜尋框和導出按鈕 */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="搜尋客戶姓名、電話或編號（至少2個字元）"
                  value={filters.searchTerm || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    searchTerm: e.target.value
                  }))}
                  className="w-full px-4 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                />
              </div>
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
          </div>
        </div>

        {/* 區塊① 本月業務快照 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* KPI 卡片 */}
          <div className="card-apple border border-border-light fade-in-apple">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-apple-heading text-text-primary">業務指標</h3>
                <div className="text-sm text-text-secondary">
                  {filters.dateRange.start} ~ {filters.dateRange.end}
                </div>
              </div>
              
              {kpiLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
                  <p className="text-sm text-text-secondary mt-3">計算中...</p>
                </div>
              ) : kpiData ? (
                <div className="space-y-6">
                  {/* 主要指標卡片 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-secondary rounded-lg p-4 border border-border-light">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-secondary">總收入</p>
                          <p className="text-2xl font-bold text-text-primary">
                            ${kpiData.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-mingcare-blue rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      </div>
                      {kpiData.revenueGrowthRate !== 0 && (
                        <div className="mt-2 flex items-center">
                          <span className={`text-xs font-medium ${
                            kpiData.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {kpiData.revenueGrowthRate >= 0 ? '↗' : '↘'} {Math.abs(kpiData.revenueGrowthRate).toFixed(1)}%
                          </span>
                          <span className="text-xs text-text-secondary ml-1">vs 上月</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-bg-secondary rounded-lg p-4 border border-border-light">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-secondary">總利潤</p>
                          <p className="text-2xl font-bold text-text-primary">
                            ${kpiData.totalProfit.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-mingcare-blue rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-text-secondary">
                          利潤率: {kpiData.totalRevenue > 0 ? ((kpiData.totalProfit / kpiData.totalRevenue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 次要指標 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-secondary rounded-lg p-4 border border-border-light">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-secondary">總服務時數</p>
                          <p className="text-xl font-bold text-text-primary">
                            {kpiData.totalServiceHours.toFixed(1)}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-xs text-text-secondary">小時</span>
                      </div>
                    </div>

                    <div className="bg-bg-secondary rounded-lg p-4 border border-border-light">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-secondary">每小時利潤</p>
                          <p className="text-xl font-bold text-text-primary">
                            ${kpiData.avgProfitPerHour.toFixed(2)}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-xs text-text-secondary">平均值</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-text-secondary">選取的日期範圍內暫無數據</p>
                  <p className="text-sm text-text-tertiary mt-1">請調整篩選條件</p>
                </div>
              )}
            </div>
          </div>

          {/* 項目分類小計 */}
          <div className="card-apple border border-border-light fade-in-apple">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-apple-heading text-text-primary">項目分類統計</h3>
                <div className="text-sm text-text-secondary">
                  {categorySummary.length} 個項目類別
                </div>
              </div>
              
              {kpiLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
                  <p className="text-sm text-text-secondary mt-3">計算中...</p>
                </div>
              ) : categorySummary.length > 0 ? (
                <div className="space-y-4">
                  {categorySummary.map((summary, index) => (
                    <div key={summary.category} className="bg-bg-secondary border border-border-light rounded-lg p-4 hover:shadow-apple transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-mingcare-blue rounded-full mr-3"></div>
                          <h4 className="font-semibold text-text-primary">{summary.category}</h4>
                          <span className="ml-2 text-xs text-text-tertiary bg-bg-tertiary px-2 py-1 rounded-full">
                            {summary.recordCount} 筆記錄
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-text-primary">
                            ${summary.totalFee.toLocaleString()}
                          </div>
                          <div className="text-xs text-text-secondary mt-1">收入</div>
                          <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-2">
                            <div 
                              className="bg-mingcare-blue h-1.5 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.min(100, (summary.totalFee / Math.max(...categorySummary.map(s => s.totalFee))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold text-text-primary">
                            {summary.totalHours.toFixed(1)}h
                          </div>
                          <div className="text-xs text-text-secondary mt-1">時數</div>
                          <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-2">
                            <div 
                              className="bg-mingcare-blue h-1.5 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.min(100, (summary.totalHours / Math.max(...categorySummary.map(s => s.totalHours))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold text-text-primary">
                            ${summary.totalProfit.toLocaleString()}
                          </div>
                          <div className="text-xs text-text-secondary mt-1">利潤</div>
                          <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-2">
                            <div 
                              className="bg-mingcare-blue h-1.5 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.min(100, (summary.totalProfit / Math.max(...categorySummary.map(s => s.totalProfit))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 項目效率指標 */}
                      <div className="mt-3 pt-3 border-t border-border-light">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-secondary">
                            每小時收入: ${summary.totalHours > 0 ? (summary.totalFee / summary.totalHours).toFixed(0) : 0}
                          </span>
                          <span className="text-text-secondary">
                            利潤率: {summary.totalFee > 0 ? ((summary.totalProfit / summary.totalFee) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* 總計摘要 */}
                  <div className="mt-6 p-4 bg-bg-secondary rounded-lg border border-border-light">
                    <h5 className="font-semibold text-text-primary mb-2">總計摘要</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-text-primary">
                          ${categorySummary.reduce((sum, s) => sum + s.totalFee, 0).toLocaleString()}
                        </div>
                        <div className="text-text-secondary">總收入</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900">
                          {categorySummary.reduce((sum, s) => sum + s.totalHours, 0).toFixed(1)}h
                        </div>
                        <div className="text-gray-600">總時數</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-text-primary">
                          {categorySummary.reduce((sum, s) => sum + s.totalHours, 0).toFixed(1)}h
                        </div>
                        <div className="text-text-secondary">總時數</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-text-primary">
                          ${categorySummary.reduce((sum, s) => sum + s.totalProfit, 0).toLocaleString()}
                        </div>
                        <div className="text-text-secondary">總利潤</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-text-secondary">選取的日期範圍內暫無項目數據</p>
                  <p className="text-sm text-text-tertiary mt-1">請調整篩選條件</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 區塊② 月曆排更 */}
        <div className="card-apple border border-border-light mb-8 fade-in-apple">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-apple-heading text-text-primary">月曆排更</h3>
              <button className="px-4 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200">
                + 多天新增
              </button>
            </div>
            
            {/* 月曆組件占位 */}
            <div className="bg-bg-secondary rounded-lg p-8 text-center">
              <p className="text-text-secondary mb-4">📅 月曆組件</p>
              <p className="text-sm text-text-secondary">
                將在下一步實作：單日點擊新增/編輯、拖選多日、服務記錄顯示
              </p>
            </div>
          </div>
        </div>

        {/* 區塊③ 列表檢視 */}
        <div className="card-apple border border-border-light fade-in-apple">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-apple-heading text-text-primary">服務記錄列表</h3>
              <div className="text-sm text-text-secondary">
                已篩選結果 | 分頁 | 排序功能
              </div>
            </div>
            
            {/* 列表組件占位 */}
            <div className="bg-bg-secondary rounded-lg p-8 text-center">
              <p className="text-text-secondary mb-4">📋 列表檢視</p>
              <p className="text-sm text-text-secondary">
                將在後續步驟實作：表格顯示、排序、分頁、編輯功能
              </p>
            </div>
          </div>
        </div>

        {/* 底部操作日誌 */}
        <div className="mt-8 text-center text-sm text-text-secondary">
          <p>操作日誌和儲存結果提示將在此顯示</p>
        </div>
      </main>
    </div>
  )
}
