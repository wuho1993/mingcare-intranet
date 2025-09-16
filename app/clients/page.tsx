'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { CustomerManagementService } from '../../services/customer-management'
import SearchSuggestionsPortal from '../../components/SearchSuggestionsPortal'
import type { 
  CustomerListItem, 
  CustomerFilters, 
  ViewMode,
  SearchSuggestion 
} from '../../types/customer-management'

interface User {
  id: string
  email?: string
}

export default function ClientsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [filters, setFilters] = useState<CustomerFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadCustomers()
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
      loadCustomers()
    }
  }, [filters, currentPage])

  // 分頁處理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/clients/summary')}
                className="btn-apple-primary text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                📊 客戶總結
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-apple-secondary text-xs sm:text-sm self-start sm:self-auto"
              >
                返回主頁
              </button>
            </div>
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

            {/* Enhanced Filter Controls - Updated Layout */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {/* 客戶類型 */}
              <div className="min-w-0">
                <label className="block text-xs font-medium text-text-primary mb-1 flex items-center">
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
                      newFilters.customer_type = e.target.value as '社區券客戶' | '明家街客' | '家訪客戶' | '家訪客戶'
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
                <label className="block text-xs font-medium text-text-primary mb-1 flex items-center">
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
                <label className="block text-xs font-medium text-text-primary mb-1 flex items-center">
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
                  <option value="Kanas Leung">Kanas</option>
                  <option value="Joe Cheung">Joe</option>
                  <option value="Candy Ho">Candy</option>
                  <option value="Steven Kwok">Steven</option>
                  <option value="Dr.Lee">Dr.Lee</option>
                  <option value="Annie">Annie</option>
                  <option value="Janet">Janet</option>
                  <option value="陸sir">陸sir</option>
                  <option value="吳翹政">吳翹政</option>
                  <option value="余翠英">余翠英</option>
                  <option value="陳小姐MC01">陳小姐</option>
                  <option value="曾先生">曾先生</option>
                </select>
              </div>

              {/* 負責同事 */}
              <div className="min-w-0">
                <label className="block text-xs font-medium text-text-primary mb-1 flex items-center">
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
                  <option value="Kanas Leung">Kanas</option>
                  <option value="Joe Cheung">Joe</option>
                  <option value="Candy Ho">Candy</option>
                </select>
              </div>

              {/* LDS 狀況 */}
              <div className="min-w-0">
                <label className="block text-xs font-medium text-text-primary mb-1 flex items-center">
                  <svg className="w-3 h-3 mr-1 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate">LDS 狀況</span>
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
                  <option value="已完成評估">已完成評估</option>
                  <option value="已經持有">已經持有</option>
                  <option value="待社工評估">待社工評估</option>
                </select>
              </div>

              {/* 社區券申請狀況 */}
              <div className="min-w-0">
                <label className="block text-xs font-medium text-text-primary mb-1 flex items-center">
                  <svg className="w-3 h-3 mr-1 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
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
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="">全部</option>
                  <option value="已經持有">已經持有</option>
                  <option value="申請中">申請中</option>
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

        {/* Enhanced View Controls Section - Compact */}
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
              
              {/* 新增客戶 & 檢視切換按鈕 */}
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
                
                <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                      viewMode === 'card' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="hidden sm:inline">卡片</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="hidden sm:inline">列表</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              /* Customer Data Display */
              <>
                {viewMode === 'card' ? (
                  /* Card View */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                    {customers.map((customer, index) => (
                      <div
                        key={customer.id}
                        className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 relative overflow-hidden transform hover:rotate-1 card-hover-float pulse-glow rounded-2xl md:rounded-3xl border-2 border-gray-100 hover:border-transparent bg-white shadow-lg"
                        style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                        onClick={() => router.push(`/clients/edit-client/edit?id=${customer.customer_id || customer.id}`)}
                      >
                        {/* Enhanced Customer Type Header Bar */}
                        <div className={`px-3 py-2 md:px-4 md:py-3 text-white font-medium text-xs md:text-sm rounded-t-2xl md:rounded-t-3xl ${
                          customer.customer_type === '社區券客戶' 
                            ? 'bg-gradient-to-r from-green-500 to-green-600' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}>
                          <div className="flex items-center justify-center">
                            <span>{customer.customer_type}</span>
                          </div>
                        </div>
                        
                        <div className="p-3 md:p-6 bg-white rounded-b-2xl md:rounded-b-3xl relative z-10">
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-2 md:mb-4">
                            <div className="flex-1">
                              <h3 className="text-base md:text-xl font-bold text-gray-900 truncate mb-1 group-hover:text-gray-700 transition-colors duration-300">
                                {customer.customer_name}
                              </h3>
                              <p className="text-xs md:text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                                {customer.customer_id || '未分配編號'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Card Body */}
                          <div className="space-y-2 md:space-y-3 mb-2 md:mb-4">
                            <div className="flex items-center text-xs md:text-apple-caption text-text-secondary">
                              <svg className="h-3 w-3 md:h-4 md:w-4 mr-2 md:mr-3 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {customer.phone}
                            </div>
                            <div className="flex items-start text-xs md:text-apple-caption text-text-secondary">
                              <svg className="h-3 w-3 md:h-4 md:w-4 mr-2 md:mr-3 mt-0.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="line-clamp-2">{customer.service_address}</span>
                            </div>
                          </div>
                          
                          {/* Status Information - 2個標籤一行 */}
                          <div className="space-y-1.5 md:space-y-2 mb-2 md:mb-4">
                            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                              {customer.voucher_application_status && (
                                <div className="text-xs">
                                  <span className="font-medium text-text-primary block mb-0.5 md:mb-1 text-xs">社區券：</span>
                                  <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs w-full text-center block ${
                                    customer.voucher_application_status === '已經持有' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {customer.voucher_application_status}
                                  </span>
                                </div>
                              )}
                              {customer.lds_status && (
                                <div className="text-xs">
                                  <span className="font-medium text-text-primary block mb-0.5 md:mb-1 text-xs">LDS：</span>
                                  <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs w-full text-center block ${
                                    customer.lds_status === '已完成評估' || customer.lds_status === '已經持有'
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {customer.lds_status}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                              {customer.home_visit_status && (
                                <div className="text-xs">
                                  <span className="font-medium text-text-primary block mb-0.5 md:mb-1 text-xs">家訪：</span>
                                  <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs w-full text-center block ${
                                    customer.home_visit_status === '已完成' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {customer.home_visit_status}
                                  </span>
                                </div>
                              )}
                              {customer.copay_level && (
                                <div className="text-xs">
                                  <span className="font-medium text-text-primary block mb-0.5 md:mb-1 text-xs">自付：</span>
                                  <span className="px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs bg-purple-100 text-purple-800 w-full text-center block">
                                    {customer.copay_level}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Card Footer - 移除客戶類型，只保留日期 */}
                          <div className="pt-2 md:pt-4 border-t border-border-light text-right">
                            <span className="text-xs text-text-tertiary">
                              {new Date(customer.created_at).toLocaleDateString('zh-TW')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* List View */
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-border-light">
                        {customers.map((customer, index) => (
                          <tr 
                            key={customer.id} 
                            className="hover:bg-bg-tertiary transition-colors cursor-pointer"
                            onClick={() => router.push(`/clients/edit-client/edit?id=${customer.customer_id || customer.id}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-1 h-8 rounded-full mr-3 ${
                                  customer.customer_type === '社區券客戶' 
                                    ? 'bg-green-500' 
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
      </main>
    </div>
  );
}
