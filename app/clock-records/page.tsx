'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(50)
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
      const { data, error } = await supabase
        .from('clock_records')
        .select('*')
        .order('clock_time', { ascending: false })

      if (error) throw error
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
        record.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.service_address?.toLowerCase().includes(searchQuery.toLowerCase())
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

    setFilteredRecords(filtered)
    setCurrentPage(1)
  }, [searchQuery, filterStaff, filterClockType, filterDate, records])

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
      hour12: false
    })
  }

  const formatDistance = (meters: number | null) => {
    if (meters === null) return '-'
    if (meters < 1000) return `${meters.toFixed(0)}米`
    return `${(meters / 1000).toFixed(2)}公里`
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
    <div className="bg-bg-primary min-h-screen">
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="w-full px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-text-primary mb-1">員工打卡記錄</h1>
              <p className="text-sm text-text-secondary">共 {filteredRecords.length} 筆記錄</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-apple-secondary w-full sm:w-auto text-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回主頁
            </button>
          </div>
        </div>
      </header>

      {/* 篩選區 */}
      <div className="container-apple py-6">
        <div className="card-apple fade-in-apple mb-6">
          <div className="card-apple-content p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 搜尋 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
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
            </div>

            {/* 清除篩選按鈕 */}
            {(searchQuery || filterStaff || filterClockType || filterDate) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStaff('')
                    setFilterClockType('')
                    setFilterDate('')
                  }}
                  className="btn-apple-secondary text-sm"
                >
                  清除所有篩選
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 打卡記錄列表 */}
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
                  <th>客戶狀態</th>
                  <th>位置異常</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-text-secondary">
                      沒有找到符合條件的記錄
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap">
                        {formatDateTime(record.clock_time)}
                      </td>
                      <td>
                        <div>{record.staff_name}</div>
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
                      <td>{formatDistance(record.distance_from_customer)}</td>
                      <td>
                        {record.customer_emotion || record.customer_cooperation || record.customer_health ? (
                          <div className="text-xs">
                            {record.customer_emotion && <div>情緒: {record.customer_emotion}</div>}
                            {record.customer_cooperation && <div>配合: {record.customer_cooperation}</div>}
                            {record.customer_health && <div>健康: {record.customer_health}</div>}
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        {record.location_exception ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {record.location_exception_type || '是'}
                            </span>
                            {record.location_exception_reason && (
                              <div className="text-xs text-text-secondary mt-1">
                                {record.location_exception_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-secondary">-</span>
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
                  className="btn-apple-secondary text-sm disabled:opacity-50"
                >
                  上一頁
                </button>
                <span className="px-4 py-2 text-sm">
                  第 {currentPage} / {totalPages} 頁
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-apple-secondary text-sm disabled:opacity-50"
                >
                  下一頁
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
