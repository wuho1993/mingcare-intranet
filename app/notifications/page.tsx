'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabase-admin'
import LoadingScreen from '../../components/LoadingScreen'

interface User {
  id: string
  email?: string
}

interface Notification {
  id: string
  staff_name: string
  employee_code: string | null
  type: string
  title: string
  message: string
  related_shift_id: string | null
  related_service_date: string | null
  related_customer_name: string | null
  metadata: any
  is_read: boolean
  is_deleted: boolean
  read_at: string | null
  priority: string
  category: string
  is_pushed: boolean
  push_scheduled_at: string | null
  push_sent_at: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
}

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStaff, setFilterStaff] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterReadStatus, setFilterReadStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [notificationsPerPage] = useState(50)
  const router = useRouter()

  // 獲取唯一員工名單
  const uniqueStaff = Array.from(new Set(notifications.map(n => n.staff_name).filter(Boolean))).sort()

  // 通知類型
  const notificationTypes = [
    'shift_reminder_tomorrow',
    'shift_reminder_soon',
    'shift_assigned',
    'shift_changed',
    'shift_cancelled',
    'shift_address_changed',
    'clock_in_late',
    'clock_in_success',
    'clock_out_success',
    'clock_out_missing',
    'salary_monthly',
    'salary_weekly',
    'system_maintenance',
    'announcement',
    'other'
  ]

  const typeLabels: Record<string, string> = {
    'shift_reminder_tomorrow': '明日班次提醒',
    'shift_reminder_soon': '班次即將開始',
    'shift_assigned': '新增班次',
    'shift_changed': '班次變更',
    'shift_cancelled': '班次取消',
    'shift_address_changed': '班次地址變更',
    'clock_in_late': '打卡遲到提醒',
    'clock_in_success': '打卡成功',
    'clock_out_success': '下班打卡成功',
    'clock_out_missing': '缺少下班打卡',
    'salary_monthly': '月薪通知',
    'salary_weekly': '週薪通知',
    'system_maintenance': '系統維護通知',
    'announcement': '公告',
    'other': '其他'
  }

  const priorityLabels: Record<string, string> = {
    'urgent': '緊急',
    'high': '高',
    'normal': '普通',
    'low': '低'
  }

  const categoryLabels: Record<string, string> = {
    'shift': '班次相關',
    'salary': '薪資相關',
    'system': '系統相關',
    'announcement': '公告',
    'general': '一般'
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        loadNotifications()
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  const loadNotifications = async () => {
    try {
      // 使用管理員客戶端來獲取所有通知（繞過 RLS）
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('載入通知錯誤:', error)
        throw error
      }
      
      console.log('載入的通知:', data?.length || 0, '筆')
      setNotifications(data || [])
      setFilteredNotifications(data || [])
    } catch (error) {
      console.error('載入通知失敗:', error)
    }
  }

  // 篩選和搜尋
  useEffect(() => {
    let filtered = [...notifications]

    // 搜尋
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.related_customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 員工篩選
    if (filterStaff) {
      filtered = filtered.filter(notification => notification.staff_name === filterStaff)
    }

    // 類型篩選
    if (filterType) {
      filtered = filtered.filter(notification => notification.type === filterType)
    }

    // 優先級篩選
    if (filterPriority) {
      filtered = filtered.filter(notification => notification.priority === filterPriority)
    }

    // 分類篩選
    if (filterCategory) {
      filtered = filtered.filter(notification => notification.category === filterCategory)
    }

    // 已讀狀態篩選
    if (filterReadStatus) {
      const isRead = filterReadStatus === 'read'
      filtered = filtered.filter(notification => notification.is_read === isRead)
    }

    setFilteredNotifications(filtered)
    setCurrentPage(1)
  }, [searchQuery, filterStaff, filterType, filterPriority, filterCategory, filterReadStatus, notifications])

  // 分頁
  const indexOfLastNotification = currentPage * notificationsPerPage
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage
  const currentNotifications = filteredNotifications.slice(indexOfFirstNotification, indexOfLastNotification)
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage)

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-bg-tertiary text-text-primary'
      default: return 'bg-bg-tertiary text-text-primary'
    }
  }

  if (loading) {
    return <LoadingScreen message="正在載入通知訊息..." />
  }

  return (
    <div className="bg-bg-primary min-h-screen">
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="w-full px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-text-primary mb-1">應用程式通知訊息</h1>
              <p className="text-sm text-text-secondary">
                共 {filteredNotifications.length} 筆通知
                {' · '}未讀 {filteredNotifications.filter(n => !n.is_read).length} 筆
              </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* 搜尋 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  搜尋
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="員工、標題、內容..."
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

              {/* 通知類型篩選 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  通知類型
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="form-input-apple text-sm"
                >
                  <option value="">全部類型</option>
                  {notificationTypes.map(type => (
                    <option key={type} value={type}>{typeLabels[type] || type}</option>
                  ))}
                </select>
              </div>

              {/* 優先級篩選 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  優先級
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="form-input-apple text-sm"
                >
                  <option value="">全部優先級</option>
                  <option value="urgent">緊急</option>
                  <option value="high">高</option>
                  <option value="normal">普通</option>
                  <option value="low">低</option>
                </select>
              </div>

              {/* 分類篩選 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  分類
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="form-input-apple text-sm"
                >
                  <option value="">全部分類</option>
                  <option value="shift">班次相關</option>
                  <option value="salary">薪資相關</option>
                  <option value="system">系統相關</option>
                  <option value="announcement">公告</option>
                  <option value="general">一般</option>
                </select>
              </div>

              {/* 已讀狀態篩選 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  狀態
                </label>
                <select
                  value={filterReadStatus}
                  onChange={(e) => setFilterReadStatus(e.target.value)}
                  className="form-input-apple text-sm"
                >
                  <option value="">全部狀態</option>
                  <option value="unread">未讀</option>
                  <option value="read">已讀</option>
                </select>
              </div>
            </div>

            {/* 清除篩選按鈕 */}
            {(searchQuery || filterStaff || filterType || filterPriority || filterCategory || filterReadStatus) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStaff('')
                    setFilterType('')
                    setFilterPriority('')
                    setFilterCategory('')
                    setFilterReadStatus('')
                  }}
                  className="btn-apple-secondary text-sm"
                >
                  清除所有篩選
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 通知列表 */}
        <div className="card-apple fade-in-apple">
          <div className="overflow-x-auto">
            <table className="table-apple">
              <thead>
                <tr>
                  <th>狀態</th>
                  <th>創建時間</th>
                  <th>員工</th>
                  <th>優先級</th>
                  <th>分類</th>
                  <th>類型</th>
                  <th>標題</th>
                  <th>內容</th>
                  <th>相關資訊</th>
                  <th>推送狀態</th>
                </tr>
              </thead>
              <tbody>
                {currentNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-text-secondary">
                      沒有找到符合條件的通知
                    </td>
                  </tr>
                ) : (
                  currentNotifications.map((notification) => (
                    <tr key={notification.id} className={!notification.is_read ? 'bg-blue-50' : ''}>
                      <td>
                        {notification.is_read ? (
                          <span className="text-xs text-text-secondary">已讀</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            未讀
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-sm">
                        {formatDateTime(notification.created_at)}
                      </td>
                      <td>
                        <div>{notification.staff_name}</div>
                        {notification.employee_code && (
                          <div className="text-xs text-text-secondary">{notification.employee_code}</div>
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {priorityLabels[notification.priority] || notification.priority}
                        </span>
                      </td>
                      <td className="text-sm">{categoryLabels[notification.category] || notification.category}</td>
                      <td className="text-sm">{typeLabels[notification.type] || notification.type}</td>
                      <td className="font-medium max-w-xs truncate">{notification.title}</td>
                      <td className="max-w-md truncate text-sm">{notification.message}</td>
                      <td>
                        {notification.related_customer_name || notification.related_service_date ? (
                          <div className="text-xs">
                            {notification.related_customer_name && (
                              <div>客戶: {notification.related_customer_name}</div>
                            )}
                            {notification.related_service_date && (
                              <div>日期: {notification.related_service_date}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-secondary text-sm">-</span>
                        )}
                      </td>
                      <td>
                        {notification.is_pushed ? (
                          <div className="text-xs">
                            <div className="text-green-600">已推送</div>
                            {notification.push_sent_at && (
                              <div className="text-text-secondary">
                                {formatDateTime(notification.push_sent_at)}
                              </div>
                            )}
                          </div>
                        ) : notification.push_scheduled_at ? (
                          <div className="text-xs text-orange-600">
                            排程中
                          </div>
                        ) : (
                          <span className="text-text-secondary text-sm">-</span>
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
                顯示 {indexOfFirstNotification + 1} 至 {Math.min(indexOfLastNotification, filteredNotifications.length)} 筆，
                共 {filteredNotifications.length} 筆通知
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
