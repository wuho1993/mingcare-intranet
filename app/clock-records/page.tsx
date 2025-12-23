'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabase-admin'

interface User {
  id: string
  email?: string
}

interface ClockRecord {
  id: string
  staff_id: string
  staff_name: string
  shift_id: string | null
  clock_type: string
  clock_time: string
  location_latitude: number | null
  location_longitude: number | null
  location_address: string | null
  customer_name: string | null
  service_address: string | null
  service_date: string | null
  start_time: string | null
  end_time: string | null
  service_type: string | null
  location_exception: boolean
  location_exception_type: string | null
  location_exception_reason: string | null
  clock_latitude: number | null
  clock_longitude: number | null
  distance_from_customer: number | null
  customer_emotion: string | null
  customer_cooperation: string | null
  customer_health: string | null
  customer_status_rating: number | null
  customer_status_note: string | null
  customer_other_notes: string | null
  created_at: string
  updated_at: string
}

export default function ClockRecordsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<ClockRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<ClockRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStaff, setFilterStaff] = useState('')
  const [filterClockType, setFilterClockType] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterLocationException, setFilterLocationException] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(20)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [selectedRecord, setSelectedRecord] = useState<ClockRecord | null>(null)
  const router = useRouter()

  // 獲取唯一員工名單
  const uniqueStaff = Array.from(new Set(records.map(r => r.staff_name).filter(Boolean))).sort()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        loadRecords()
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  const loadRecords = async () => {
    try {
      // 使用管理員客戶端來獲取所有打卡記錄（繞過 RLS）
      const { data, error } = await supabaseAdmin
        .from('clock_records')
        .select('*')
        .order('clock_time', { ascending: false })

      if (error) {
        console.error('載入打卡記錄錯誤:', error)
        throw error
      }
      
      console.log('載入的打卡記錄:', data?.length || 0, '筆')
      setRecords(data || [])
      setFilteredRecords(data || [])
    } catch (error) {
      console.error('載入打卡記錄失敗:', error)
    }
  }

  // 篩選和搜尋
  useEffect(() => {
    let filtered = [...records]

    // 搜尋
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.staff_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.service_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.location_address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 員工篩選
    if (filterStaff) {
      filtered = filtered.filter(record => record.staff_name === filterStaff)
    }

    // 打卡類型篩選
    if (filterClockType) {
      filtered = filtered.filter(record => record.clock_type === filterClockType)
    }

    // 日期篩選
    if (filterDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.clock_time).toISOString().split('T')[0]
        return recordDate === filterDate
      })
    }

    // 位置異常篩選
    if (filterLocationException) {
      const hasException = filterLocationException === 'yes'
      filtered = filtered.filter(record => record.location_exception === hasException)
    }

    setFilteredRecords(filtered)
    setCurrentPage(1)
  }, [searchQuery, filterStaff, filterClockType, filterDate, filterLocationException, records])

  // 分頁
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-'
    return timeString.substring(0, 5) // HH:mm
  }

  const formatDistance = (meters: number | null) => {
    if (meters === null) return '-'
    if (meters < 1000) return `${meters.toFixed(0)} 米`
    return `${(meters / 1000).toFixed(2)} 公里`
  }

  const getStatusRatingColor = (rating: number | null) => {
    if (rating === null) return 'text-text-tertiary'
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusRatingStars = (rating: number | null) => {
    if (rating === null) return '☆☆☆☆☆'
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-apple-body text-text-secondary mt-4">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-primary min-h-screen">
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-text-primary">員工打卡記錄</h1>
                  <p className="text-sm text-text-secondary">共 {filteredRecords.length} 筆記錄</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 視圖切換 */}
              <div className="flex rounded-xl border border-border-light overflow-hidden">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-bg-primary text-text-secondary hover:bg-bg-secondary'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-bg-primary text-text-secondary hover:bg-bg-secondary'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-apple-secondary text-sm"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 篩選區 */}
      <div className="container-apple py-6">
        <div className="card-apple fade-in-apple mb-6">
          <div className="card-apple-content p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 搜尋 */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  搜尋
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="員工、客戶、地址..."
                  className="form-input-apple text-sm"
                />
              </div>

              {/* 員工篩選 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  員工
                </label>
                <select
                  value={filterStaff}
                  onChange={(e) => setFilterStaff(e.target.value)}
                  className="form-input-apple text-sm"
                >
                  <option value="">全部員工</option>
                  {uniqueStaff.map(staff => (
                    <option key={staff} value={staff}>{staff}</option>
                  ))}
                </select>
              </div>

              {/* 打卡類型篩選 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  打卡類型
                </label>
                <select
                  value={filterClockType}
                  onChange={(e) => setFilterClockType(e.target.value)}
                  className="form-input-apple text-sm"
                >
                  <option value="">全部類型</option>
                  <option value="上班">上班</option>
                  <option value="下班">下班</option>
                </select>
              </div>

              {/* 日期篩選 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  日期
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="form-input-apple text-sm"
                />
              </div>

              {/* 位置異常篩選 */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  位置異常
                </label>
                <select
                  value={filterLocationException}
                  onChange={(e) => setFilterLocationException(e.target.value)}
                  className="form-input-apple text-sm"
                >
                  <option value="">全部</option>
                  <option value="yes">有異常</option>
                  <option value="no">正常</option>
                </select>
              </div>
            </div>

            {/* 清除篩選按鈕 */}
            {(searchQuery || filterStaff || filterClockType || filterDate || filterLocationException) && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStaff('')
                    setFilterClockType('')
                    setFilterDate('')
                    setFilterLocationException('')
                  }}
                  className="btn-apple-secondary text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  清除篩選
                </button>
                <span className="text-sm text-text-secondary">
                  已篩選 {filteredRecords.length} / {records.length} 筆
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 打卡記錄 - 卡片視圖 */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentRecords.length === 0 ? (
              <div className="col-span-full">
                <div className="card-apple">
                  <div className="card-apple-content p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-bg-tertiary rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-text-secondary text-lg">沒有找到符合條件的打卡記錄</p>
                    <p className="text-text-secondary text-sm mt-2">請調整篩選條件或清除所有篩選</p>
                  </div>
                </div>
              </div>
            ) : (
              currentRecords.map((record) => (
                <div key={record.id} className="card-apple hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => setSelectedRecord(record)}>
                  <div className="card-apple-content p-5">
                    {/* 頂部信息 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          record.clock_type === '上班' 
                            ? 'bg-green-100' 
                            : 'bg-blue-100'
                        }`}>
                          <svg className={`w-6 h-6 ${
                            record.clock_type === '上班' 
                              ? 'text-green-600' 
                              : 'text-blue-600'
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-text-primary">{record.staff_name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.clock_type === '上班' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {record.clock_type}
                            </span>
                          </div>
                          {record.staff_id && (
                            <p className="text-xs text-text-secondary mb-2">員工編號: {record.staff_id}</p>
                          )}
                          <p className="text-sm text-text-secondary">
                            <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDateTime(record.clock_time)}
                          </p>
                        </div>
                      </div>
                      {record.location_exception && (
                        <div className="ml-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            位置異常
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 服務信息 */}
                    {record.customer_name && (
                      <div className="bg-bg-secondary rounded-xl p-3 mb-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-text-secondary text-xs mb-1">客戶姓名</p>
                            <p className="font-medium text-text-primary">{record.customer_name}</p>
                          </div>
                          {record.service_type && (
                            <div>
                              <p className="text-text-secondary text-xs mb-1">服務類型</p>
                              <p className="font-medium text-text-primary">{record.service_type}</p>
                            </div>
                          )}
                        </div>
                        {record.service_address && (
                          <div className="mt-2">
                            <p className="text-text-secondary text-xs mb-1">服務地址</p>
                            <p className="text-sm text-text-primary">{record.service_address}</p>
                          </div>
                        )}
                        {(record.service_date || record.start_time || record.end_time) && (
                          <div className="mt-2 flex items-center gap-4 text-xs text-text-secondary">
                            {record.service_date && (
                              <span>
                                📅 {formatDate(record.service_date)}
                              </span>
                            )}
                            {(record.start_time || record.end_time) && (
                              <span>
                                ⏰ {formatTime(record.start_time)} - {formatTime(record.end_time)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 位置和距離 */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {record.distance_from_customer !== null && (
                        <div className="bg-blue-50 rounded-xl p-2.5">
                          <p className="text-xs text-blue-600 mb-1">距離客戶</p>
                          <p className="text-sm font-semibold text-blue-700">{formatDistance(record.distance_from_customer)}</p>
                        </div>
                      )}
                      {record.location_address && (
                        <div className="bg-purple-50 rounded-xl p-2.5">
                          <p className="text-xs text-purple-600 mb-1">打卡位置</p>
                          <p className="text-xs text-purple-700 truncate">{record.location_address}</p>
                        </div>
                      )}
                    </div>

                    {/* 客戶狀態 */}
                    {(record.customer_emotion || record.customer_cooperation || record.customer_health || record.customer_status_rating) && (
                      <div className="border-t border-border-light pt-3">
                        <p className="text-xs font-medium text-text-primary mb-2">客戶狀態評估</p>
                        <div className="space-y-1.5">
                          {record.customer_status_rating !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-secondary">整體評分</span>
                              <span className={`text-sm font-medium ${getStatusRatingColor(record.customer_status_rating)}`}>
                                {getStatusRatingStars(record.customer_status_rating)}
                              </span>
                            </div>
                          )}
                          {record.customer_emotion && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-secondary">情緒狀態</span>
                              <span className="text-xs font-medium text-text-primary">{record.customer_emotion}</span>
                            </div>
                          )}
                          {record.customer_cooperation && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-secondary">配合度</span>
                              <span className="text-xs font-medium text-text-primary">{record.customer_cooperation}</span>
                            </div>
                          )}
                          {record.customer_health && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-secondary">健康狀況</span>
                              <span className="text-xs font-medium text-text-primary">{record.customer_health}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 備註 */}
                    {(record.customer_status_note || record.customer_other_notes || record.location_exception_reason) && (
                      <div className="mt-3 pt-3 border-t border-border-light">
                        {record.location_exception_reason && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-yellow-700 mb-1">位置異常原因</p>
                            <p className="text-xs text-yellow-600 bg-yellow-50 rounded p-2">{record.location_exception_reason}</p>
                          </div>
                        )}
                        {record.customer_status_note && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-text-secondary mb-1">狀態備註</p>
                            <p className="text-xs text-text-secondary">{record.customer_status_note}</p>
                          </div>
                        )}
                        {record.customer_other_notes && (
                          <div>
                            <p className="text-xs font-medium text-text-secondary mb-1">其他備註</p>
                            <p className="text-xs text-text-secondary">{record.customer_other_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 打卡記錄 - 表格視圖 */}
        {viewMode === 'table' && (
          <div className="card-apple fade-in-apple">
            <div className="overflow-x-auto">
              <table className="table-apple">
                <thead>
                  <tr>
                    <th>打卡時間</th>
                    <th>員工</th>
                    <th>類型</th>
                    <th>客戶</th>
                    <th>服務地址</th>
                    <th>距離</th>
                    <th>客戶評分</th>
                    <th>位置異常</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-bg-tertiary rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-text-secondary">沒有找到符合條件的記錄</p>
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((record) => (
                      <tr key={record.id} className="cursor-pointer hover:bg-bg-secondary" onClick={() => setSelectedRecord(record)}>
                        <td className="whitespace-nowrap text-sm">
                          {formatDateTime(record.clock_time)}
                        </td>
                        <td>
                          <div className="font-medium">{record.staff_name}</div>
                          {record.staff_id && (
                            <div className="text-xs text-text-secondary">{record.staff_id}</div>
                          )}
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.clock_type === '上班' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {record.clock_type}
                          </span>
                        </td>
                        <td>{record.customer_name || '-'}</td>
                        <td className="max-w-xs truncate">{record.service_address || '-'}</td>
                        <td className="text-sm">{formatDistance(record.distance_from_customer)}</td>
                        <td className="text-center">
                          {record.customer_status_rating !== null ? (
                            <span className={`text-sm ${getStatusRatingColor(record.customer_status_rating)}`}>
                              {getStatusRatingStars(record.customer_status_rating)}
                            </span>
                          ) : (
                            <span className="text-text-secondary text-sm">-</span>
                          )}
                        </td>
                        <td>
                          {record.location_exception ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-yellow-100 text-yellow-800">
                              異常
                            </span>
                          ) : (
                            <span className="text-text-secondary text-sm">正常</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分頁 */}
            {totalPages > 1 && (
              <div className="border-t border-border-light p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-text-secondary">
                  顯示 {indexOfFirstRecord + 1} 至 {Math.min(indexOfLastRecord, filteredRecords.length)} 筆，
                  共 {filteredRecords.length} 筆記錄
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn-apple-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一頁
                  </button>
                  <span className="px-4 py-2 text-sm">
                    第 {currentPage} / {totalPages} 頁
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-apple-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 分頁 - 卡片視圖 */}
        {viewMode === 'card' && totalPages > 1 && (
          <div className="mt-6 card-apple">
            <div className="card-apple-content p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-text-secondary">
                顯示 {indexOfFirstRecord + 1} 至 {Math.min(indexOfLastRecord, filteredRecords.length)} 筆，
                共 {filteredRecords.length} 筆記錄
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn-apple-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一頁
                </button>
                <span className="px-4 py-2 text-sm">
                  第 {currentPage} / {totalPages} 頁
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-apple-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 詳細信息彈窗 */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-border-light px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">打卡記錄詳情</h2>
              <button onClick={() => setSelectedRecord(null)} className="text-text-secondary hover:text-text-primary">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* 員工信息 */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  員工信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-secondary rounded-xl p-3">
                    <p className="text-xs text-text-secondary mb-1">姓名</p>
                    <p className="font-medium">{selectedRecord.staff_name}</p>
                  </div>
                  <div className="bg-bg-secondary rounded-xl p-3">
                    <p className="text-xs text-text-secondary mb-1">員工編號</p>
                    <p className="font-medium">{selectedRecord.staff_id || '-'}</p>
                  </div>
                  <div className="bg-bg-secondary rounded-xl p-3">
                    <p className="text-xs text-text-secondary mb-1">打卡類型</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedRecord.clock_type === '上班' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedRecord.clock_type}
                    </span>
                  </div>
                  <div className="bg-bg-secondary rounded-xl p-3">
                    <p className="text-xs text-text-secondary mb-1">打卡時間</p>
                    <p className="font-medium text-sm">{formatDateTime(selectedRecord.clock_time)}</p>
                  </div>
                </div>
              </div>

              {/* 服務信息 */}
              {selectedRecord.customer_name && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    服務信息
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-bg-secondary rounded-xl p-3">
                      <p className="text-xs text-text-secondary mb-1">客戶姓名</p>
                      <p className="font-medium">{selectedRecord.customer_name}</p>
                    </div>
                    {selectedRecord.service_address && (
                      <div className="bg-bg-secondary rounded-xl p-3">
                        <p className="text-xs text-text-secondary mb-1">服務地址</p>
                        <p className="text-sm">{selectedRecord.service_address}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {selectedRecord.service_date && (
                        <div className="bg-bg-secondary rounded-xl p-3">
                          <p className="text-xs text-text-secondary mb-1">服務日期</p>
                          <p className="text-sm font-medium">{formatDate(selectedRecord.service_date)}</p>
                        </div>
                      )}
                      {selectedRecord.start_time && (
                        <div className="bg-bg-secondary rounded-xl p-3">
                          <p className="text-xs text-text-secondary mb-1">開始時間</p>
                          <p className="text-sm font-medium">{formatTime(selectedRecord.start_time)}</p>
                        </div>
                      )}
                      {selectedRecord.end_time && (
                        <div className="bg-bg-secondary rounded-xl p-3">
                          <p className="text-xs text-text-secondary mb-1">結束時間</p>
                          <p className="text-sm font-medium">{formatTime(selectedRecord.end_time)}</p>
                        </div>
                      )}
                    </div>
                    {selectedRecord.service_type && (
                      <div className="bg-bg-secondary rounded-xl p-3">
                        <p className="text-xs text-text-secondary mb-1">服務類型</p>
                        <p className="font-medium">{selectedRecord.service_type}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 位置信息 */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  位置信息
                </h3>
                <div className="space-y-3">
                  {selectedRecord.location_address && (
                    <div className="bg-bg-secondary rounded-xl p-3">
                      <p className="text-xs text-text-secondary mb-1">打卡地址</p>
                      <p className="text-sm">{selectedRecord.location_address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRecord.distance_from_customer !== null && (
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs text-blue-600 mb-1">距離客戶</p>
                        <p className="font-semibold text-blue-700">{formatDistance(selectedRecord.distance_from_customer)}</p>
                      </div>
                    )}
                    <div className={`rounded-xl p-3 ${selectedRecord.location_exception ? 'bg-yellow-50' : 'bg-green-50'}`}>
                      <p className={`text-xs mb-1 ${selectedRecord.location_exception ? 'text-yellow-600' : 'text-green-600'}`}>
                        位置狀態
                      </p>
                      <p className={`font-semibold ${selectedRecord.location_exception ? 'text-yellow-700' : 'text-green-700'}`}>
                        {selectedRecord.location_exception ? '異常' : '正常'}
                      </p>
                    </div>
                  </div>
                  {selectedRecord.location_exception && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-xs text-yellow-700 font-medium mb-1">異常原因</p>
                      <p className="text-sm text-yellow-800">
                        {selectedRecord.location_exception_type && <span className="font-medium">{selectedRecord.location_exception_type}</span>}
                        {selectedRecord.location_exception_reason && <span className="block mt-1">{selectedRecord.location_exception_reason}</span>}
                      </p>
                    </div>
                  )}
                  {(selectedRecord.clock_latitude !== null || selectedRecord.clock_longitude !== null) && (
                    <div className="bg-bg-secondary rounded-xl p-3">
                      <p className="text-xs text-text-secondary mb-1">打卡坐標</p>
                      <p className="text-sm font-mono">
                        {selectedRecord.clock_latitude?.toFixed(6)}, {selectedRecord.clock_longitude?.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 客戶狀態評估 */}
              {(selectedRecord.customer_emotion || selectedRecord.customer_cooperation || selectedRecord.customer_health || selectedRecord.customer_status_rating) && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    客戶狀態評估
                  </h3>
                  <div className="space-y-3">
                    {selectedRecord.customer_status_rating !== null && (
                      <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-xs text-purple-600 mb-2">整體評分</p>
                        <p className={`text-2xl font-bold ${getStatusRatingColor(selectedRecord.customer_status_rating)}`}>
                          {getStatusRatingStars(selectedRecord.customer_status_rating)}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {selectedRecord.customer_emotion && (
                        <div className="bg-bg-secondary rounded-xl p-3">
                          <p className="text-xs text-text-secondary mb-1">情緒狀態</p>
                          <p className="font-medium text-sm">{selectedRecord.customer_emotion}</p>
                        </div>
                      )}
                      {selectedRecord.customer_cooperation && (
                        <div className="bg-bg-secondary rounded-xl p-3">
                          <p className="text-xs text-text-secondary mb-1">配合度</p>
                          <p className="font-medium text-sm">{selectedRecord.customer_cooperation}</p>
                        </div>
                      )}
                      {selectedRecord.customer_health && (
                        <div className="bg-bg-secondary rounded-xl p-3">
                          <p className="text-xs text-text-secondary mb-1">健康狀況</p>
                          <p className="font-medium text-sm">{selectedRecord.customer_health}</p>
                        </div>
                      )}
                    </div>
                    {selectedRecord.customer_status_note && (
                      <div className="bg-bg-secondary rounded-xl p-3">
                        <p className="text-xs text-text-secondary mb-1">狀態備註</p>
                        <p className="text-sm">{selectedRecord.customer_status_note}</p>
                      </div>
                    )}
                    {selectedRecord.customer_other_notes && (
                      <div className="bg-bg-secondary rounded-xl p-3">
                        <p className="text-xs text-text-secondary mb-1">其他備註</p>
                        <p className="text-sm">{selectedRecord.customer_other_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 系統信息 */}
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-3">系統信息</h3>
                <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary">
                  <div className="bg-bg-secondary rounded-xl p-3">
                    <p className="mb-1">記錄ID</p>
                    <p className="font-mono">{selectedRecord.id}</p>
                  </div>
                  {selectedRecord.shift_id && (
                    <div className="bg-bg-secondary rounded-xl p-3">
                      <p className="mb-1">班次ID</p>
                      <p className="font-mono">{selectedRecord.shift_id}</p>
                    </div>
                  )}
                  <div className="bg-bg-secondary rounded-xl p-3">
                    <p className="mb-1">創建時間</p>
                    <p>{formatDateTime(selectedRecord.created_at)}</p>
                  </div>
                  <div className="bg-bg-secondary rounded-xl p-3">
                    <p className="mb-1">更新時間</p>
                    <p>{formatDateTime(selectedRecord.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-bg-secondary border-t border-border-light px-6 py-4">
              <button onClick={() => setSelectedRecord(null)} className="btn-apple-primary w-full">
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
