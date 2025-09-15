'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface User {
  id: string
  email?: string
}

interface CustomerSummaryStats {
  customerType: { type: string; count: number }[]
  voucherStatus: { status: string; count: number }[]
  districtStats: { district: string; count: number }[]
  projectManagerStats: { manager: string; count: number }[]
  ldsStatus: { status: string; count: number }[]
  homeVisitStatus: { status: string; count: number }[]
  ageGroups: { ageGroup: string; count: number }[]
  healthStatus: { status: string; count: number }[]
  totalCustomers: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0']

export default function CustomerSummaryPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CustomerSummaryStats | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [customerFilter, setCustomerFilter] = useState<'all' | '社區券客戶' | '明家街客' | '家訪客戶'>('all')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadSummaryStats()
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  // 當篩選條件改變時重新計算統計
  useEffect(() => {
    if (stats) {
      loadSummaryStats()
    }
  }, [customerFilter])

  const loadSummaryStats = async () => {
    try {
      setLoading(true)
      
      // 獲取所有客戶數據
      const { data: customers, error } = await supabase
        .from('customer_personal_data')
        .select('*')
      
      if (error) throw error
      
      if (customers) {
        const summaryStats = calculateStats(customers)
        setStats(summaryStats)
      }
    } catch (error) {
      console.error('加載客戶總結統計時出錯:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (customers: any[]): CustomerSummaryStats => {
    // 根據篩選條件過濾客戶
    const filteredCustomers = customerFilter === 'all' 
      ? customers 
      : customers.filter(customer => customer.customer_type === customerFilter)
    
    const totalCustomers = filteredCustomers.length

    // 客戶分類統計
    const customerTypeCount = filteredCustomers.reduce((acc, customer) => {
      const type = customer.customer_type || '未分類'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    const customerType = Object.entries(customerTypeCount).map(([type, count]) => ({
      type,
      count: count as number
    }))

    // 社區券申請狀況 - 只顯示社區券客戶
    const voucherCustomers = filteredCustomers.filter(customer => 
      customer.customer_type === '社區券客戶'
    )
    const voucherStatusCount = voucherCustomers.reduce((acc, customer) => {
      const status = customer.voucher_application_status || '未填寫'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    const voucherStatus = Object.entries(voucherStatusCount).map(([status, count]) => ({
      status,
      count: count as number
    }))

    // 地區分佈
    const districtCount = filteredCustomers.reduce((acc, customer) => {
      const district = customer.district || '未分類'
      acc[district] = (acc[district] || 0) + 1
      return acc
    }, {})
    const districtStats = Object.entries(districtCount)
      .map(([district, count]) => ({
        district,
        count: count as number
      }))
      .sort((a, b) => b.count - a.count)

    // 負責同事統計
    const projectManagerCount = filteredCustomers.reduce((acc, customer) => {
      const manager = customer.project_manager || '未分配'
      acc[manager] = (acc[manager] || 0) + 1
      return acc
    }, {})
    const projectManagerStats = Object.entries(projectManagerCount).map(([manager, count]) => ({
      manager,
      count: count as number
    }))

    // LDS狀況統計 - 只顯示社區券客戶
    const ldsStatusCount = voucherCustomers.reduce((acc, customer) => {
      const status = customer.lds_status || '未填寫'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    const ldsStatus = Object.entries(ldsStatusCount).map(([status, count]) => ({
      status,
      count: count as number
    }))

    // 家訪狀況統計
    const homeVisitStatusCount = filteredCustomers.reduce((acc, customer) => {
      const status = customer.home_visit_status || '未填寫'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    const homeVisitStatus = Object.entries(homeVisitStatusCount).map(([status, count]) => ({
      status,
      count: count as number
    }))

    // 年齡分組統計
    const ageGroupCount = filteredCustomers.reduce((acc, customer) => {
      const age = customer.age
      let ageGroup = '未填寫'
      
      if (age !== null && age !== undefined) {
        if (age < 50) ageGroup = '50歲以下'
        else if (age < 60) ageGroup = '50-59歲'
        else if (age < 70) ageGroup = '60-69歲'
        else if (age < 80) ageGroup = '70-79歲'
        else if (age < 90) ageGroup = '80-89歲'
        else ageGroup = '90歲以上'
      }
      
      acc[ageGroup] = (acc[ageGroup] || 0) + 1
      return acc
    }, {})
    const ageGroups = Object.entries(ageGroupCount).map(([ageGroup, count]) => ({
      ageGroup,
      count: count as number
    }))

    // 身體狀況統計
    const healthStatusCount = filteredCustomers.reduce((acc, customer) => {
      const status = customer.health_status || '未填寫'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    const healthStatus = Object.entries(healthStatusCount).map(([status, count]) => ({
      status,
      count: count as number
    }))

    return {
      customerType,
      voucherStatus,
      districtStats,
      projectManagerStats,
      ldsStatus,
      homeVisitStatus,
      ageGroups,
      healthStatus,
      totalCustomers
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">無法加載統計數據</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">客戶總結</h1>
            <p className="text-text-secondary mt-1">客戶數據統計概覽</p>
          </div>
          <button
            onClick={() => router.push('/clients')}
            className="px-4 py-2 bg-surface-secondary rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
          >
            返回客戶列表
          </button>
        </div>

        {/* 客戶類型篩選按鈕 */}
        <div className="bg-surface-primary rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">篩選條件</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCustomerFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                customerFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              全部客戶
            </button>
            <button
              onClick={() => setCustomerFilter('社區券客戶')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                customerFilter === '社區券客戶'
                  ? 'bg-primary text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              社區券客戶
            </button>
            <button
              onClick={() => setCustomerFilter('明家街客')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                customerFilter === '明家街客'
                  ? 'bg-primary text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              明家街客
            </button>
            <button
              onClick={() => setCustomerFilter('家訪客戶')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                customerFilter === '家訪客戶'
                  ? 'bg-primary text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              家訪客戶
            </button>
          </div>
        </div>

        {/* 總客戶數 */}
        <div className="bg-surface-primary rounded-xl p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">{stats.totalCustomers}</div>
            <div className="text-text-secondary">
              {customerFilter === 'all' && '總客戶數'}
              {customerFilter === '社區券客戶' && '社區券客戶數'}
              {customerFilter === '明家街客' && '明家街客數'}
              {customerFilter === '家訪客戶' && '家訪客戶數'}
            </div>
          </div>
        </div>

        {/* 統計圖表網格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 客戶分類 */}
          <div className="bg-surface-primary rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">客戶分類</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.customerType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count, percent }: any) => `${type}: ${count} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.customerType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 社區券申請狀況 */}
          <div className="bg-surface-primary rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              社區券申請狀況
              {customerFilter !== '社區券客戶' && (
                <span className="text-sm text-text-secondary ml-2">(僅顯示社區券客戶)</span>
              )}
            </h3>
            {stats.voucherStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.voucherStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count, percent }: any) => `${status}: ${count} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.voucherStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-text-secondary">
                {customerFilter === '明家街客' || customerFilter === '家訪客戶'
                  ? `${customerFilter}無社區券申請數據` 
                  : '暫無社區券申請數據'}
              </div>
            )}
          </div>

          {/* 負責同事工作量 */}
          <div className="bg-surface-primary rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">負責同事工作量</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.projectManagerStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="manager" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* LDS狀況 */}
          <div className="bg-surface-primary rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              LDS狀況分佈
              {customerFilter !== '社區券客戶' && (
                <span className="text-sm text-text-secondary ml-2">(僅顯示社區券客戶)</span>
              )}
            </h3>
            {stats.ldsStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.ldsStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-text-secondary">
                {customerFilter === '明家街客' || customerFilter === '家訪客戶'
                  ? `${customerFilter}無LDS狀況數據` 
                  : '暫無LDS狀況數據'}
              </div>
            )}
          </div>

          {/* 家訪完成情況 */}
          <div className="bg-surface-primary rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">家訪完成情況</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.homeVisitStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count, percent }: any) => `${status}: ${count} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.homeVisitStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 年齡分佈 */}
          <div className="bg-surface-primary rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">年齡分佈</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.ageGroups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageGroup" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* 地區分佈表格 */}
        <div className="bg-surface-primary rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">地區分佈詳情</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">地區</th>
                  <th className="text-right py-3 px-4 font-medium text-text-secondary">客戶數量</th>
                  <th className="text-right py-3 px-4 font-medium text-text-secondary">佔比</th>
                </tr>
              </thead>
              <tbody>
                {stats.districtStats.map((item, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="py-3 px-4 text-text-primary">{item.district}</td>
                    <td className="py-3 px-4 text-right text-text-primary">{item.count}</td>
                    <td className="py-3 px-4 text-right text-text-secondary">
                      {((item.count / stats.totalCustomers) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 身體狀況統計 */}
        <div className="bg-surface-primary rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">身體狀況分佈</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.healthStatus.map((item, index) => (
              <div key={index} className="text-center p-4 bg-surface-secondary rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">{item.count}</div>
                <div className="text-sm text-text-secondary">{item.status}</div>
                <div className="text-xs text-text-tertiary mt-1">
                  {((item.count / stats.totalCustomers) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
