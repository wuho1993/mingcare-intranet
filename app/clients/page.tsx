'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { CustomerManagementService } from '../../services/customer-management'
import SearchSuggestionsPortal from '../../components/SearchSuggestionsPortal'
import { generateCustomerPDF } from '../../services/pdf-export'
import type {
  CustomerListItem,
  CustomerFilters,
  SearchSuggestion
} from '../../types/customer-management'

interface User {
  id: string
  email?: string
}

// Customer Summary Component
interface CustomerSummaryProps {
  customers: CustomerListItem[]
  filters: CustomerFilters
  onExportPDF: () => void
  exportLoading: boolean
}

function CustomerSummary({ customers, filters, onExportPDF, exportLoading }: CustomerSummaryProps) {
  // State for monthly service usage data
  const [monthlyServiceUsage, setMonthlyServiceUsage] = useState<Record<string, number>>({})
  const [isLoadingServiceUsage, setIsLoadingServiceUsage] = useState(false)

  // Load monthly service usage data on component mount
  useEffect(() => {
    const loadMonthlyServiceUsage = async () => {
      setIsLoadingServiceUsage(true)
      try {
        const usage = await CustomerManagementService.getMonthlyVoucherServiceUsage()
        setMonthlyServiceUsage(usage)
      } catch (error) {
        console.error('Error loading monthly service usage:', error)
      } finally {
        setIsLoadingServiceUsage(false)
      }
    }
    
    loadMonthlyServiceUsage()
  }, [])

  // Calculate statistics based on actual database fields
  const totalCustomers = customers.length
  
  // Customer type stats (customer_type_enum: 社區券客戶, 明家街客, 家訪客戶)
  const customerTypeStats = customers.reduce((acc, customer) => {
    const type = customer.customer_type || '未分類'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // District stats (district_enum from database)
  const districtStats = customers.reduce((acc, customer) => {
    const district = customer.district || '未分類'
    acc[district] = (acc[district] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Introducer stats (introducer_enum: Kanas Leung, Joe Cheung, Candy Ho, Steven Kwok, Dr.Lee, Annie, Janet, 陸sir, 吳翹政, 余翠英, 陳小姐MC01, 曾先生, 梁曉峰, raymond)
  const introducerStats = customers.reduce((acc, customer) => {
    const introducer = (customer as any).introducer
    // Only count customers who have an introducer (exclude null/undefined/empty)
    if (introducer && introducer.trim()) {
      acc[introducer] = (acc[introducer] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Introducer stats grouped by customer type
  const introducerByCustomerTypeStats = customers.reduce((acc, customer) => {
    const introducer = (customer as any).introducer
    const customerType = customer.customer_type
    
    if (introducer && introducer.trim() && customerType) {
      if (!acc[introducer]) {
        acc[introducer] = {}
      }
      acc[introducer][customerType] = (acc[introducer][customerType] || 0) + 1
    }
    return acc
  }, {} as Record<string, Record<string, number>>)

  // Voucher application status (voucher_application_status_enum: 已經持有, 申請中)
  const voucherStats = customers.reduce((acc, customer) => {
    const status = customer.voucher_application_status
    // Only count customers who have a voucher status (exclude null/undefined/empty)
    if (status && status.trim()) {
      acc[status] = (acc[status] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // LDS Status stats (lds_status_enum: 已完成評估, 已經持有, 待社工評估)
  const ldsStats = customers.reduce((acc, customer) => {
    const status = (customer as any).lds_status
    // Only count customers who have an LDS status (exclude null/undefined/empty)
    if (status && status.trim()) {
      acc[status] = (acc[status] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // LDS Status for customers with voucher application status "申請中"
  const ldsStatsForApplying = customers
    .filter(customer => customer.voucher_application_status === '申請中')
    .reduce((acc, customer) => {
      const status = (customer as any).lds_status
      if (status && status.trim()) {
        acc[status] = (acc[status] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-text-primary">客戶統計總覽</h2>
        <button
          onClick={onExportPDF}
          disabled={exportLoading}
          className="btn-apple text-sm"
        >
          {exportLoading ? '導出中...' : '導出報表'}
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="card-apple fade-in-apple">
          <div className="card-apple-content text-center">
            <div className="text-2xl sm:text-3xl font-bold text-mingcare-blue mb-2">
              {totalCustomers}
            </div>
            <div className="text-sm text-text-secondary">總客戶數</div>
          </div>
        </div>

        {/* Monthly Voucher Service Usage Total */}
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.1s' }}>
          <div className="card-apple-content text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2">
              {Object.values(monthlyServiceUsage).reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-sm text-text-secondary">本月社區券服務人次</div>
          </div>
        </div>

        {/* Voucher Holders */}
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.2s' }}>
          <div className="card-apple-content text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
              {voucherStats['已經持有'] || 0}
            </div>
            <div className="text-sm text-text-secondary">持券客戶</div>
          </div>
        </div>

        {/* Applicants */}
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.3s' }}>
          <div className="card-apple-content text-center">
            <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">
              {voucherStats['申請中'] || 0}
            </div>
            <div className="text-sm text-text-secondary">申請中</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Type Distribution */}
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.4s' }}>
          <div className="card-apple-header">
            <h3 className="text-lg font-semibold text-text-primary">客戶類型分佈</h3>
          </div>
          <div className="card-apple-content">
            <div className="space-y-3">
              {Object.entries(customerTypeStats).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      type === '社區券客戶' ? 'bg-blue-500' :
                      type === '明家街客' ? 'bg-emerald-500' :
                      type === '家訪客戶' ? 'bg-purple-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-text-primary">{type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-text-primary">{count}</span>
                    <span className="text-xs text-text-secondary">
                      ({((count / totalCustomers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* District Distribution */}
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.5s' }}>
          <div className="card-apple-header">
            <h3 className="text-lg font-semibold text-text-primary">地區分佈</h3>
          </div>
          <div className="card-apple-content">
            <div className="space-y-3">
              {Object.entries(districtStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([district, count]) => (
                <div key={district} className="flex justify-between items-center">
                  <span className="text-sm text-text-primary">{district}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-mingcare-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(count / Math.max(...Object.values(districtStats))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-text-primary w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Referrers and Monthly Service Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.7s' }}>
          <div className="card-apple-header">
            <h3 className="text-lg font-semibold text-text-primary">主要介紹人</h3>
          </div>
          <div className="card-apple-content">
            <div className="space-y-4">
              {Object.entries(introducerByCustomerTypeStats)
                .sort(([,a], [,b]) => {
                  const aTotal = Object.values(a).reduce((sum, count) => sum + count, 0)
                  const bTotal = Object.values(b).reduce((sum, count) => sum + count, 0)
                  return bTotal - aTotal
                })
                .slice(0, 6)
                .map(([introducer, customerTypes]) => {
                  const totalCount = Object.values(customerTypes).reduce((sum, count) => sum + count, 0)
                  return (
                    <div key={introducer} className="border-b border-divider-light last:border-b-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-text-primary truncate">{introducer}</span>
                        <span className="text-sm font-semibold text-mingcare-blue">{totalCount}</span>
                      </div>
                      <div className="pl-2 space-y-1">
                        {Object.entries(customerTypes).map(([customerType, count]) => (
                          <div key={customerType} className="flex justify-between items-center">
                            <span className="text-xs text-text-secondary">• {customerType}</span>
                            <span className="text-xs text-text-secondary">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* Monthly Voucher Service Usage by Project Category */}
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.75s' }}>
          <div className="card-apple-header">
            <h3 className="text-lg font-semibold text-text-primary">
              本月社區券服務使用情況（按所屬項目）
            </h3>
            <div className="text-sm text-text-secondary">
              {new Date().getFullYear()}年{new Date().getMonth() + 1}月
            </div>
          </div>
          <div className="card-apple-content">
            {isLoadingServiceUsage ? (
              <div className="flex justify-center items-center py-4">
                <div className="text-sm text-text-secondary">載入中...</div>
              </div>
            ) : Object.keys(monthlyServiceUsage).length === 0 ? (
              <div className="text-center py-4">
                <div className="text-sm text-text-secondary">本月暫無社區券服務記錄</div>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(monthlyServiceUsage)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([projectCategory, count]) => (
                  <div key={projectCategory} className="flex justify-between items-center p-3 bg-bg-secondary rounded-lg">
                    <span className="text-sm text-text-primary font-medium">{projectCategory}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-mingcare-blue">{count as number}</span>
                      <span className="text-xs text-text-secondary">人次</span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-border-primary">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-text-primary">總服務人次</span>
                    <span className="font-bold text-mingcare-blue">
                      {Object.values(monthlyServiceUsage).reduce((sum, count) => sum + count, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voucher Application Status and Home Visit Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voucher Application Status */}
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.8s' }}>
          <div className="card-apple-header">
            <h3 className="text-lg font-semibold text-text-primary">社區券狀態統計</h3>
          </div>
          <div className="card-apple-content">
            <div className="space-y-4">
              {Object.entries(voucherStats)
                .filter(([status]) => status !== '未設定') // Exclude undefined/null entries
                .map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between items-center p-3 bg-bg-secondary rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === '已經持有' ? 'bg-emerald-500' :
                        status === '申請中' ? 'bg-orange-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm font-medium text-text-primary">{status}</span>
                    </div>
                    <span className="text-lg font-bold text-mingcare-blue">{count}</span>
                  </div>
                  
                  {/* Show LDS breakdown for 申請中 customers */}
                  {status === '申請中' && Object.keys(ldsStatsForApplying).length > 0 && (
                    <div className="ml-6 mt-2 space-y-2">
                      <div className="text-xs text-text-secondary font-medium">LDS狀態分佈:</div>
                      {Object.entries(ldsStatsForApplying)
                        .filter(([ldsStatus]) => ldsStatus !== '未設定')
                        .map(([ldsStatus, ldsCount]) => (
                        <div key={ldsStatus} className="flex justify-between items-center py-1 px-2 bg-bg-primary rounded text-xs">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              ldsStatus === '已經持有' ? 'bg-emerald-400' :
                              ldsStatus === '已完成評估' ? 'bg-blue-400' :
                              ldsStatus === '待社工評估' ? 'bg-amber-400' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-text-secondary">{ldsStatus}</span>
                          </div>
                          <span className="text-mingcare-blue font-semibold">{ldsCount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Applied Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.8s' }}>
          <div className="card-apple-header">
            <h3 className="text-lg font-semibold text-text-primary">目前篩選條件</h3>
          </div>
          <div className="card-apple-content">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => (
                <span key={key} className="px-3 py-1 bg-mingcare-blue text-white rounded-full text-xs">
                  {key.replace('_', ' ')}: {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ClientsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [allCustomers, setAllCustomers] = useState<CustomerListItem[]>([]) // Complete dataset for summary
  const [activeTab, setActiveTab] = useState<'list' | 'summary'>('list')
  // 移除 viewMode，只使用列表模式
  const [filters, setFilters] = useState<CustomerFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 從 URL 參數讀取頁碼（如果有的話）
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page')
    return pageParam ? parseInt(pageParam, 10) : 1
  })
  
  // 追蹤每個客戶的更新時間
  const [customerUpdateTimes, setCustomerUpdateTimes] = useState<Record<string, Date>>({})

  // 從 localStorage 載入所有客戶的更新時間（頁面載入時）
  useEffect(() => {
    const loadCustomerUpdateTimes = () => {
      const times: Record<string, Date> = {}
      const now = new Date()
      
      // 遍歷所有 localStorage 項目，找出客戶更新時間
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('customer_update_')) {
          const customerId = key.replace('customer_update_', '')
          const timeStr = localStorage.getItem(key)
          if (timeStr) {
            const updateTime = new Date(timeStr)
            const diffInMinutes = (now.getTime() - updateTime.getTime()) / (1000 * 60)
            
            // 只加載30分鐘內的更新時間
            if (diffInMinutes < 30) {
              times[customerId] = updateTime
            } else {
              // 清除超過30分鐘的舊記錄
              localStorage.removeItem(key)
            }
          }
        }
      }
      
      setCustomerUpdateTimes(times)
    }

    loadCustomerUpdateTimes()
  }, [])

  // 導出相關狀態
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportCustomerType, setExportCustomerType] = useState<'all' | 'mingcare-street' | 'voucher' | 'home-visit'>('all')
  const [exportStartMonth, setExportStartMonth] = useState('2025-09') // 當前月份
  const [exportEndMonth, setExportEndMonth] = useState('2025-09') // 當前月份

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadCustomers()
        await loadAllCustomers() // Load complete dataset for summary
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  // 載入客戶列表
  const loadCustomers = async () => {
    try {
      const response = await CustomerManagementService.getCustomers(
        filters,
        currentPage,
        pageSize
      )
      setCustomers(response.data)
      setTotalCount(response.count)
    } catch (error) {
      console.error('載入客戶列表失敗:', error)
    }
  }

  // 載入所有客戶數據用於總結 (不受篩選影響)
  const loadAllCustomers = async () => {
    try {
      const response = await CustomerManagementService.getCustomers(
        {}, // No filters for complete data
        1,
        10000 // Large page size to get all customers
      )
      setAllCustomers(response.data)
    } catch (error) {
      console.error('載入完整客戶數據失敗:', error)
    }
  }

  // 導出功能
  const handleExportPDF = () => {
    setShowExportModal(true)
  }

  const handleExportConfirm = async () => {
    setExportLoading(true)
    setShowExportModal(false)

    try {
      // 將月份轉換為完整的日期範圍
      let dateRange = undefined
      if (exportStartMonth && exportEndMonth) {
        // 開始日期：月初第1天
        const startDate = `${exportStartMonth}-01`
        // 結束日期：月末最後一天
        const endYear = parseInt(exportEndMonth.split('-')[0])
        const endMonth = parseInt(exportEndMonth.split('-')[1])
        const lastDayOfMonth = new Date(endYear, endMonth, 0).getDate()
        const endDate = `${exportEndMonth}-${lastDayOfMonth.toString().padStart(2, '0')}`
        
        dateRange = {
          startDate,
          endDate
        }
      }

      const options = {
        customerType: exportCustomerType,
        dateRange,
        includeStats: exportCustomerType === 'voucher'
      }

      await generateCustomerPDF(options)
      alert('PDF 報表已生成並下載')
    } catch (error) {
      console.error('導出 PDF 時發生錯誤:', error)
      alert('導出時發生錯誤，請重試')
    } finally {
      setExportLoading(false)
    }
  }

  const handleCancelExport = () => {
    setShowExportModal(false)
  }

  // 搜尋建議 (debounced)
  const handleSearchInput = async (query: string) => {
    setSearchQuery(query)

    // 清除之前的 timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (query.length >= 2) {
      // Debounce search - 等待 300ms 後執行
      const timeout = setTimeout(async () => {
        try {
          const response = await CustomerManagementService.getSearchSuggestions({
            query,
            limit: 8
          })
          if (response.data) {
            setSuggestions(response.data)
            setShowSuggestions(true)
          }
        } catch (error) {
          console.error('搜尋建議失敗:', error)
        }
      }, 300)

      setSearchTimeout(timeout)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  // 選擇搜尋建議
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // 只填入客戶姓名，觸發智慧搜尋功能
    setSearchQuery(suggestion.customer_name)
    setShowSuggestions(false)
    // 觸發實際搜尋
    handleSearch(suggestion.customer_name)
  }

  // 執行搜尋
  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery
    if (searchTerm.trim()) {
      const newFilters = { ...filters, search: searchTerm.trim() }
      setFilters(newFilters)
      setCurrentPage(1) // 重置到第一頁

      try {
        const response = await CustomerManagementService.getCustomers(
          newFilters,
          1,
          pageSize
        )
        setCustomers(response.data)
        setTotalCount(response.count)
      } catch (error) {
        console.error('搜尋失敗:', error)
      }
    }
  }

  // 清除搜尋
  const handleClearSearch = () => {
    setSearchQuery('')
    const newFilters = { ...filters }
    delete newFilters.search
    setFilters(newFilters)
    setCurrentPage(1)
    loadCustomers()
  }

  // 鍵盤導航
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch()
      setShowSuggestions(false)
    } else if (event.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // 載入時觸發搜尋
  useEffect(() => {
    if (user) {
      // 檢查是否從編輯頁返回（避免重新載入）
      const skipReload = sessionStorage.getItem('skipCustomerReload')
      if (skipReload === 'true') {
        console.log('🔄 從編輯頁返回，保持列表順序')
        sessionStorage.removeItem('skipCustomerReload')
        return
      }
      
      loadCustomers()
    }
  }, [filters, currentPage])

  // 監聽客戶更新事件
  useEffect(() => {
    const handleCustomerUpdate = () => {
      const updatedCustomerInfo = localStorage.getItem('customerUpdated')
      if (updatedCustomerInfo) {
        const { customerId, updateTime } = JSON.parse(updatedCustomerInfo)
        setCustomerUpdateTimes(prev => ({
          ...prev,
          [customerId]: new Date(updateTime)
        }))
        localStorage.removeItem('customerUpdated')
      }
    }

    // 檢查頁面載入時是否有更新
    handleCustomerUpdate()

    // 監聽 storage 事件
    window.addEventListener('storage', handleCustomerUpdate)
    
    // 監聽自定義事件（同頁面內的更新）
    window.addEventListener('customerUpdated', handleCustomerUpdate)

    return () => {
      window.removeEventListener('storage', handleCustomerUpdate)
      window.removeEventListener('customerUpdated', handleCustomerUpdate)
    }
  }, [])

  // 分頁處理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // 更新 URL 但不增加歷史記錄，保持頁面狀態
    const newUrl = page > 1 ? `/clients?page=${page}` : '/clients'
    window.history.replaceState({}, '', newUrl)
  }

  // 計算分頁信息
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary mb-1 sm:mb-2">客戶管理中心</h1>
              <p className="text-sm sm:text-base text-text-secondary">管理所有客戶資料、聯絡信息及服務記錄</p>
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

        {/* Search and Filter Section */}
        <div className="card-apple mb-4 sm:mb-6 fade-in-apple">
          <div className="card-apple-header">
            <h3 className="text-lg sm:text-xl font-semibold text-text-primary">搜尋與篩選</h3>
          </div>
          <div className="card-apple-content">
            {/* Enhanced Search Bar with Suggestions */}
            <div className="mb-4 sm:mb-6 relative" style={{ zIndex: 10000 }}>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  placeholder="搜尋客戶姓名、電話或項目編號..."
                  className="w-full pl-10 sm:pl-12 pr-20 sm:pr-24 py-2 sm:py-3 bg-bg-secondary border-transparent focus:bg-white focus:border-mingcare-blue focus:shadow-apple-focus rounded-apple-sm text-sm transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 space-x-1 sm:space-x-2">
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="text-text-tertiary hover:text-text-secondary transition-colors p-1"
                      type="button"
                    >
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleSearch()}
                    className="btn-apple-primary py-1 px-2 sm:px-3 text-xs"
                    type="button"
                  >
                    <span className="hidden sm:inline">搜尋</span>
                    <span className="sm:hidden">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>

              {/* Search Suggestions Portal */}
              <SearchSuggestionsPortal
                isVisible={showSuggestions}
                suggestions={searchSuggestions}
                onSelectSuggestion={handleSuggestionClick}
                onClose={() => setShowSuggestions(false)}
                targetRef={searchInputRef}
              />
            </div>

            {/* Enhanced Filter Controls - Expanded for more options */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
              {/* 客戶類型 */}
              <div className="min-w-0">
                <label className="flex text-xs font-medium text-text-primary mb-1 items-center">
                  <svg className="w-3 h-3 mr-1 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="truncate">客戶類型</span>
                </label>
                <select
                  value={filters.customer_type || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters }
                    if (e.target.value) {
                      newFilters.customer_type = e.target.value as '社區券客戶' | '明家街客' | '家訪客戶'
                    } else {
                      delete newFilters.customer_type
                    }
                    setFilters(newFilters)
                    setCurrentPage(1)
                  }}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">全部</option>
                  <option value="社區券客戶">社區券</option>
                  <option value="明家街客">明家街客</option>
                  <option value="家訪客戶">家訪客戶</option>
                </select>
              </div>

              {/* 地區 */}
              <div className="min-w-0">
                <label className="flex text-xs font-medium text-text-primary mb-1 items-center">
                  <svg className="w-3 h-3 mr-1 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">地區</span>
                </label>
                <select
                  value={filters.district || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters }
                    if (e.target.value) {
                      newFilters.district = e.target.value
                    } else {
                      delete newFilters.district
                    }
                    setFilters(newFilters)
                    setCurrentPage(1)
                  }}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="">全部</option>
                  <option value="中西區">中西區</option>
                  <option value="灣仔區">灣仔區</option>
                  <option value="東區">東區</option>
                  <option value="南區">南區</option>
                  <option value="深水埗區">深水埗</option>
                  <option value="油尖旺區">油尖旺</option>
                  <option value="九龍城區">九龍城</option>
                  <option value="黃大仙區">黃大仙</option>
                  <option value="觀塘區">觀塘區</option>
                  <option value="荃灣區">荃灣區</option>
                  <option value="屯門區">屯門區</option>
                  <option value="元朗區">元朗區</option>
                  <option value="北區">北區</option>
                  <option value="大埔區">大埔區</option>
                  <option value="沙田區">沙田區</option>
                  <option value="西貢區">西貢區</option>
                  <option value="葵青區">葵青區</option>
                  <option value="離島區">離島區</option>
                </select>
              </div>

              {/* 介紹人 */}
              <div className="min-w-0">
                <label className="flex text-xs font-medium text-text-primary mb-1 items-center">
                  <svg className="w-3 h-3 mr-1 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate">介紹人</span>
                </label>
                <select
                  value={filters.introducer || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters }
                    if (e.target.value) {
                      newFilters.introducer = e.target.value
                    } else {
                      delete newFilters.introducer
                    }
                    setFilters(newFilters)
                    setCurrentPage(1)
                  }}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">全部</option>
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
                  <option value="梁曉峰">梁曉峰</option>
                  <option value="raymond">raymond</option>
                </select>
              </div>

              {/* 負責同事 */}
              <div className="min-w-0">
                <label className="flex text-xs font-medium text-text-primary mb-1 items-center">
                  <svg className="w-3 h-3 mr-1 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 6V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2z" />
                  </svg>
                  <span className="truncate">負責同事</span>
                </label>
                <select
                  value={filters.project_manager || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters }
                    if (e.target.value) {
                      newFilters.project_manager = e.target.value
                    } else {
                      delete newFilters.project_manager
                    }
                    setFilters(newFilters)
                    setCurrentPage(1)
                  }}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="">全部</option>
                  <option value="Kanas Leung">Kanas Leung</option>
                  <option value="Joe Cheung">Joe Cheung</option>
                  <option value="Candy Ho">Candy Ho</option>
                </select>
              </div>

              {/* LDS 狀態 */}
              <div className="min-w-0">
                <label className="text-xs font-medium text-text-primary mb-1 flex items-center">
                  <svg className="w-3 h-3 mr-1 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate">LDS狀態</span>
                </label>
                <select
                  value={filters.lds_status || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters }
                    if (e.target.value) {
                      newFilters.lds_status = e.target.value
                    } else {
                      delete newFilters.lds_status
                    }
                    setFilters(newFilters)
                    setCurrentPage(1)
                  }}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">全部</option>
                  <option value="待社工評估">待社工評估</option>
                  <option value="已完成評估">已完成評估</option>
                  <option value="已經持有">已經持有</option>
                </select>
              </div>

              {/* 社區券狀況 */}
              <div className="min-w-0">
                <label className="text-xs font-medium text-text-primary mb-1 flex items-center">
                  <svg className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="truncate">社區券狀況</span>
                </label>
                <select
                  value={filters.voucher_application_status || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters }
                    if (e.target.value) {
                      newFilters.voucher_application_status = e.target.value
                    } else {
                      delete newFilters.voucher_application_status
                    }
                    setFilters(newFilters)
                    setCurrentPage(1)
                  }}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">全部</option>
                  <option value="申請中">申請中</option>
                  <option value="已經持有">已經持有</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button - Compact */}
            {(Object.keys(filters).length > 0 || searchQuery.trim()) && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={async () => {
                    // 清除所有篩選和搜尋狀態
                    setFilters({})
                    setCurrentPage(1)
                    setSearchQuery('')
                    setShowSuggestions(false)

                    // 重新載入全部客戶（無任何篩選）
                    try {
                      setLoading(true)
                      const { data, count } = await CustomerManagementService.getCustomers(
                        {}, // 空篩選條件
                        1,  // 第一頁
                        pageSize
                      )
                      setCustomers(data)
                      setTotalCount(count)
                    } catch (error) {
                      console.error('重新載入客戶列表失敗:', error)
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all border border-red-200 hover:border-red-300"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>清除篩選</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card-apple mb-4 sm:mb-6 fade-in-apple" style={{ animationDelay: '0.2s' }}>
          <div className="p-3 sm:p-4">
            <nav className="flex space-x-1 sm:space-x-2">
              {/* 客戶列表 Tab */}
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 ${
                  activeTab === 'list'
                    ? 'bg-mingcare-blue text-white shadow-lg'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline">客戶列表</span>
                <span className="sm:hidden">列表</span>
              </button>

              {/* 客戶總結 Tab */}
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 ${
                  activeTab === 'summary'
                    ? 'bg-mingcare-blue text-white shadow-lg'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">客戶總結</span>
                <span className="sm:hidden">總結</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Enhanced View Controls Section - Compact - Only show on list tab */}
        {activeTab === 'list' && (
        <div className="card-apple mb-4 fade-in-apple" style={{ animationDelay: '0.2s' }}>
          <div className="px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm text-text-primary">
                  共 <span className="font-semibold text-mingcare-blue">{totalCount}</span> 位客戶
                </span>
                {Object.keys(filters).length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-text-secondary">篩選:</span>
                    <div className="flex flex-wrap gap-1">
                      {filters.customer_type && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {filters.customer_type}
                        </span>
                      )}
                      {filters.district && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          {filters.district}
                        </span>
                      )}
                      {filters.introducer && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          {filters.introducer}
                        </span>
                      )}
                      {filters.project_manager && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                          {filters.project_manager}
                        </span>
                      )}
                      {filters.search && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          搜尋: {filters.search}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 新增客戶按鈕 - 移除視圖切換 */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => router.push('/clients/new')}
                  className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all"
                >
                  <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden sm:inline">新增客戶</span>
                  <span className="sm:hidden">新增</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Tab Content */}
        {activeTab === 'list' && (
          <>
            {/* Customer List/Cards Section */}
            <div className="card-apple fade-in-apple" style={{ animationDelay: '0.3s' }}>
              <div className="card-apple-content">
            {customers.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-apple-heading text-text-primary mb-2">
                  {Object.keys(filters).length > 0 ? '沒有符合條件的客戶' : '暫無客戶資料'}
                </h3>
                <p className="text-apple-body text-text-secondary mb-6 max-w-md mx-auto">
                  {Object.keys(filters).length > 0
                    ? '嘗試調整搜尋條件或篩選器以找到您需要的客戶'
                    : '開始新增客戶以建立您的客戶資料庫'
                  }
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/clients/new')}
                  className="btn-apple-primary"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  新增客戶
                </button>
              </div>
            ) : (
              /* Customer Data Display - 只使用列表視圖 */
              <>
                {/* List View */}
                <div className="overflow-hidden rounded-apple-sm border border-border-light">
                  <table className="min-w-full divide-y divide-border-light">
                    <thead className="bg-bg-tertiary">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                          客戶資料
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                          聯絡資訊
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                          服務地址
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                          類型
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                          狀態資訊
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                          建立日期
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                          最後更新
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border-light">
                      {customers.map((customer, index) => {
                        // 計算相對更新時間
                        const getRelativeTime = (customerId: string, createdAt: string) => {
                          // 優先使用 localStorage 中的更新時間
                          const updateTime = customerUpdateTimes[customerId]
                          const hasRecentUpdate = !!updateTime // 有更新記錄表示是最近編輯的
                          const timeToUse = updateTime || new Date(createdAt)
                          
                          const now = new Date()
                          const diffMs = now.getTime() - timeToUse.getTime()
                          const diffMins = Math.floor(diffMs / 60000)
                          const diffHours = Math.floor(diffMs / 3600000)
                          const diffDays = Math.floor(diffMs / 86400000)
                          
                          let text = ''
                          let colorClass = 'text-text-secondary' // 預設顏色
                          
                          if (diffMins < 1) {
                            text = '剛剛更新'
                            colorClass = hasRecentUpdate ? 'text-green-600 font-semibold' : 'text-text-secondary'
                          } else if (diffMins < 60) {
                            text = `${diffMins}分鐘前`
                            colorClass = hasRecentUpdate ? 'text-green-600 font-semibold' : 'text-text-secondary'
                          } else if (diffHours < 24) {
                            text = `${diffHours}小時前`
                            colorClass = hasRecentUpdate ? 'text-blue-600 font-medium' : 'text-text-secondary'
                          } else if (diffDays < 7) {
                            text = `${diffDays}天前`
                            colorClass = 'text-text-secondary'
                          } else {
                            text = timeToUse.toLocaleDateString('zh-TW')
                            colorClass = 'text-text-secondary'
                          }
                          
                          return <span className={colorClass}>{text}</span>
                        }
                        
                        return (
                          <tr
                            key={customer.id}
                            className="hover:bg-bg-tertiary transition-colors cursor-pointer"
                            onClick={() => router.push(`/clients/edit-client/edit?id=${customer.customer_id || customer.id}&returnPage=${currentPage}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-1 h-8 rounded-full mr-3 ${
                                  customer.customer_type === '社區券客戶'
                                    ? 'bg-green-500'
                                    : customer.customer_type === '家訪客戶'
                                    ? 'bg-purple-500'
                                    : 'bg-blue-500'
                                }`} />
                                <div>
                                  <div className="text-apple-body text-text-primary font-medium">
                                    {customer.customer_name}
                                  </div>
                                  <div className="text-apple-caption text-text-secondary">
                                    {customer.customer_id || '未分配編號'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-apple-caption text-text-primary">{customer.phone}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-apple-caption text-text-primary max-w-xs">
                                <div className="line-clamp-2">{customer.service_address}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                customer.customer_type === '社區券客戶'
                                  ? 'bg-green-100 text-green-800'
                                  : customer.customer_type === '家訪客戶'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {customer.customer_type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {customer.voucher_application_status && (
                                  <div className="flex items-center text-xs">
                                    <span className="font-medium text-text-primary mr-1">社區券：</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      customer.voucher_application_status === '已經持有'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {customer.voucher_application_status}
                                    </span>
                                  </div>
                                )}
                                {customer.lds_status && (
                                  <div className="flex items-center text-xs">
                                    <span className="font-medium text-text-primary mr-1">LDS：</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      customer.lds_status === '已完成評估' || customer.lds_status === '已經持有'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {customer.lds_status}
                                    </span>
                                  </div>
                                )}
                                {customer.home_visit_status && (
                                  <div className="flex items-center text-xs">
                                    <span className="font-medium text-text-primary mr-1">家訪：</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      customer.home_visit_status === '已完成'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {customer.home_visit_status}
                                    </span>
                                  </div>
                                )}
                                {customer.copay_level && (
                                  <div className="flex items-center text-xs">
                                    <span className="font-medium text-text-primary mr-1">自付：</span>
                                    <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                      {customer.copay_level}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-apple-caption text-text-secondary">
                              {new Date(customer.created_at).toLocaleDateString('zh-TW')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-apple-caption">
                              {getRelativeTime(customer.customer_id || customer.id, customer.created_at)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

          {/* Enhanced Pagination Section */}
          {customers.length > 0 && (
            <div className="card-apple fade-in-apple" style={{ animationDelay: '0.4s' }}>
              <div className="card-apple-content flex flex-col sm:flex-row justify-between items-center py-6">
                <div className="text-apple-caption text-text-secondary mb-4 sm:mb-0">
                  顯示第 <span className="font-medium">{startItem}</span> 到 <span className="font-medium">{endItem}</span> 項，
                  共 <span className="font-medium">{totalCount}</span> 項結果
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="btn-apple-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={pageNum === currentPage
                            ? 'btn-apple-primary px-3 py-2 text-sm'
                            : 'btn-apple-secondary px-3 py-2 text-sm'
                          }
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="btn-apple-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          </>
        )}

        {/* Customer Summary Tab */}
        {activeTab === 'summary' && (
          <CustomerSummary 
            customers={allCustomers} 
            filters={filters} 
            onExportPDF={handleExportPDF}
            exportLoading={exportLoading}
          />
        )}
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCancelExport}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">導出客戶報表</h3>
            
            <div className="space-y-4">
              {/* Customer Type Selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">客戶類型</label>
                <select
                  value={exportCustomerType}
                  onChange={(e) => setExportCustomerType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                >
                  <option value="all">全部客戶</option>
                  <option value="mingcare-street">明家街客</option>
                  <option value="voucher">社區券客戶</option>
                  <option value="home-visit">家訪客戶</option>
                </select>
              </div>

              {/* Month Range Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">開始月份</label>
                  <input
                    type="month"
                    value={exportStartMonth}
                    onChange={(e) => setExportStartMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                    placeholder="2025-09"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">結束月份</label>
                  <input
                    type="month"
                    value={exportEndMonth}
                    onChange={(e) => setExportEndMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"
                    placeholder="2025-09"
                  />
                </div>
              </div>

              {/* Export Info */}
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  {exportCustomerType === 'voucher' 
                    ? `將導出社區券客戶報表，包含詳細統計分析（${exportStartMonth ? exportStartMonth.split('-')[1] : '9'}月服務使用情況、介紹人分佈、狀態統計等）`
                    : '將導出基本客戶列表和統計信息'
                  }
                </p>
                {exportStartMonth && exportEndMonth && (
                  <p className="text-xs text-blue-600 mt-1">
                    統計範圍：{exportStartMonth} 至 {exportEndMonth}（月初第1天至月末最後一天）
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelExport}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleExportConfirm}
                disabled={exportLoading}
                className="px-4 py-2 bg-mingcare-blue text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? '導出中...' : '確認導出'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
