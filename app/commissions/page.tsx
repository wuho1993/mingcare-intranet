'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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

interface IntroducerSummary {
  introducer: string
  total_commission: number
  first_month_count: number
  subsequent_month_count: number
  customers: CustomerCommissionData[]
}

export default function CommissionsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [commissionData, setCommissionData] = useState<IntroducerSummary[]>([])
  const [commissionRatesData, setCommissionRatesData] = useState<CommissionRate[]>([])
  const [allCommissionData, setAllCommissionData] = useState<CustomerCommissionData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedIntroducer, setSelectedIntroducer] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const router = useRouter()

  // PDF生成函數
  const generatePDF = () => {
    try {
      // 按月份分組數據
      const monthlyData = new Map<string, CustomerCommissionData[]>()
      filteredCommissionData.forEach(item => {
        if (!monthlyData.has(item.service_month)) {
          monthlyData.set(item.service_month, [])
        }
        monthlyData.get(item.service_month)!.push(item)
      })

      const sortedMonths = Array.from(monthlyData.keys()).sort()
      
      // 總計數據
      let totalServiceFee = 0
      let totalServiceHours = 0
      let totalQualifiedCustomers = 0
      let totalCommission = 0

      // 為每個月計算統計並按介紹人分組
      const monthlyStats = sortedMonths.map(month => {
        const monthData = monthlyData.get(month)!
        const [year, monthNum] = month.split('-')
        
        // 按介紹人分組
        const introducerGroups = new Map<string, CustomerCommissionData[]>()
        monthData.forEach(item => {
          if (!introducerGroups.has(item.introducer)) {
            introducerGroups.set(item.introducer, [])
          }
          introducerGroups.get(item.introducer)!.push(item)
        })

        // 計算月統計
        const monthServiceFee = monthData.reduce((sum, item) => sum + item.monthly_fee, 0)
        const monthServiceHours = monthData.reduce((sum, item) => sum + item.monthly_hours, 0)
        const monthQualifiedCount = monthData.filter(item => item.is_qualified).length
        const monthCommission = monthData.reduce((sum, item) => sum + item.commission_amount, 0)

        // 累加到總計
        totalServiceFee += monthServiceFee
        totalServiceHours += monthServiceHours
        totalQualifiedCustomers += monthQualifiedCount
        totalCommission += monthCommission

        // 計算介紹人佣金
        const introducerCommissions = Array.from(introducerGroups.entries()).map(([introducerName, customers]) => {
          const qualifiedCustomers = customers.filter(c => c.is_qualified)
          const totalFee = qualifiedCustomers.reduce((sum, c) => sum + c.monthly_fee, 0)
          const commissionAmount = qualifiedCustomers.reduce((sum, c) => sum + c.commission_amount, 0)
          
          // 獲取佣金率
          const commissionRate = commissionRatesData.find(r => r.introducer === introducerName)?.first_month_commission || 0
          
          return {
            introducerName,
            rate: commissionRate,
            qualifiedCustomers: qualifiedCustomers.length,
            totalFee,
            amount: commissionAmount
          }
        }).filter(commission => commission.rate > 0) // 只顯示有設定佣金率的介紹人

        return {
          year,
          month: monthNum,
          qualifiedCustomers: monthQualifiedCount,
          totalHours: monthServiceHours,
          totalFee: monthServiceFee,
          totalCommission: monthCommission,
          commissions: introducerCommissions
        }
      })

      // 創建 HTML 內容
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>佣金計算報告</title>
          <style>
            body {
              font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif;
              margin: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #428bca;
              padding-bottom: 15px;
            }
            
            .header h1 {
              color: #428bca;
              margin: 0;
              font-size: 24px;
            }
            
            .date-range {
              color: #666;
              margin-top: 10px;
              font-size: 14px;
            }
            
            .filters {
              margin-top: 10px;
              font-size: 12px;
              color: #888;
            }
            
            .month-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            
            .month-header {
              background-color: #f8f9fa;
              padding: 10px;
              border-left: 4px solid #428bca;
              margin-bottom: 15px;
            }
            
            .month-title {
              font-size: 16px;
              font-weight: bold;
              color: #428bca;
              margin: 0;
            }
            
            .month-summary {
              display: flex;
              justify-content: space-around;
              background-color: #e7f3ff;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
            }
            
            .summary-item {
              text-align: center;
            }
            
            .summary-label {
              font-weight: bold;
              color: #428bca;
              display: block;
              font-size: 11px;
            }
            
            .summary-value {
              font-size: 14px;
              font-weight: bold;
              color: #333;
            }
            
            .commissions-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            
            .commissions-table th,
            .commissions-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            .commissions-table th {
              background-color: #428bca;
              color: white;
              font-weight: bold;
            }
            
            .commissions-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .number {
              text-align: right;
            }
            
            .overall-summary {
              margin-top: 40px;
              padding: 20px;
              border: 2px solid #428bca;
              background-color: #f8f9fa;
              page-break-inside: avoid;
            }
            
            .overall-summary h2 {
              text-align: center;
              color: #428bca;
              margin-bottom: 20px;
            }
            
            .total-stats {
              display: flex;
              justify-content: space-around;
              margin-top: 15px;
            }
            
            .total-stat {
              text-align: center;
            }
            
            .total-stat-label {
              font-weight: bold;
              color: #428bca;
              display: block;
              margin-bottom: 5px;
            }
            
            .total-stat-value {
              font-size: 18px;
              font-weight: bold;
              color: #333;
            }
            
            @media print {
              body { margin: 15px; }
              .month-section { page-break-inside: avoid; }
              .overall-summary { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>佣金計算報告</h1>
            <div class="date-range">
              生成日期: ${new Date().toLocaleDateString('zh-TW')}
            </div>
            <div class="filters">
              ${selectedIntroducer !== 'all' ? `介紹人: ${selectedIntroducer} | ` : ''}${selectedYear !== 'all' ? `年份: ${selectedYear} | ` : ''}${selectedMonth !== 'all' ? `月份: ${selectedMonth}` : ''}
            </div>
          </div>
          
          ${monthlyStats.map(monthData => `
            <div class="month-section">
              <div class="month-header">
                <h3 class="month-title">${monthData.year}年${monthData.month}月 佣金統計</h3>
              </div>
              
              <div class="month-summary">
                <div class="summary-item">
                  <span class="summary-label">達標客戶</span>
                  <span class="summary-value">${monthData.qualifiedCustomers}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">總服務時數</span>
                  <span class="summary-value">${monthData.totalHours.toFixed(1)}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">總服務金額</span>
                  <span class="summary-value">$${monthData.totalFee.toLocaleString()}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">總佣金</span>
                  <span class="summary-value">$${monthData.totalCommission.toLocaleString()}</span>
                </div>
              </div>
              
              ${monthData.commissions.length > 0 ? `
                <table class="commissions-table">
                  <thead>
                    <tr>
                      <th>介紹人</th>
                      <th>佣金率</th>
                      <th>達標客戶</th>
                      <th>總服務金額</th>
                      <th>佣金金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${monthData.commissions.map(commission => `
                      <tr>
                        <td>${commission.introducerName}</td>
                        <td class="number">${(commission.rate * 100).toFixed(1)}%</td>
                        <td class="number">${commission.qualifiedCustomers}</td>
                        <td class="number">$${commission.totalFee.toLocaleString()}</td>
                        <td class="number">$${commission.amount.toLocaleString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="text-align: center; color: #666; font-style: italic;">本月無佣金記錄</p>'}
            </div>
          `).join('')}
          
          <div class="overall-summary">
            <h2>總結報告</h2>
            <div class="total-stats">
              <div class="total-stat">
                <span class="total-stat-label">總達標客戶</span>
                <span class="total-stat-value">${totalQualifiedCustomers}</span>
              </div>
              <div class="total-stat">
                <span class="total-stat-label">總服務時數</span>
                <span class="total-stat-value">${totalServiceHours.toFixed(1)}</span>
              </div>
              <div class="total-stat">
                <span class="total-stat-label">總服務金額</span>
                <span class="total-stat-value">$${totalServiceFee.toLocaleString()}</span>
              </div>
              <div class="total-stat">
                <span class="total-stat-label">總佣金</span>
                <span class="total-stat-value">$${totalCommission.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
      
      // 創建並下載 HTML 文件
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      const today = new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')
      const fileName = `佣金報告_${today}.html`
      
      link.href = url
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('已下載HTML文件，請在瀏覽器中打開後列印或儲存為PDF')
      
    } catch (error) {
      console.error('PDF導出錯誤:', error)
      alert('PDF導出失敗，請稍後再試')
    }
  }

  useEffect(() => {
    const getUser = async () => {
      console.log('開始獲取用戶...')
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('用戶數據:', user, '錯誤:', error)
      
      if (user) {
        setUser(user)
        console.log('開始獲取佣金數據...')
        await fetchCommissionData()
      } else {
        console.log('沒有用戶，重定向到首頁')
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  const fetchCommissionData = async () => {
    try {
      setError(null)
      console.log('開始獲取佣金率數據...')

    // 取得佣金率設定
    const { data: commissionRates, error: commissionError } = await supabase
      .from('commission_rate_introducer')
      .select('*')
      
    console.log('佣金率數據:', commissionRates, '錯誤:', commissionError)
    
    // 儲存佣金率數據
    if (commissionRates) {
      setCommissionRatesData(commissionRates)
    }
    
    if (commissionError) {
      console.error('佣金率錯誤:', commissionError)
      // 如果表格不存在，使用默認數據繼續
      if (commissionError.code === 'PGRST116' || commissionError.message.includes('does not exist')) {
        console.log('佣金率表格不存在，使用默認數據')
        // 繼續處理，不拋出錯誤
      } else {
        throw commissionError
      }
    }

      // 獲取符合條件的客戶和服務數據
      const { data: customerData, error: customerError } = await supabase
        .from('customer_personal_data')
        .select(`
          customer_id,
          customer_name,
          introducer,
          customer_type
        `)
        .eq('customer_type', '社區券客戶')

      if (customerError) throw customerError

      const { data: billingData, error: billingError } = await supabase
        .from('billing_salary_data')
        .select(`
          customer_id,
          service_date,
          service_hours,
          service_fee,
          project_category
        `)
        .not('project_category', 'in', '("MC街客","Steven140")')

      if (billingError) throw billingError

      // 在前端處理數據分組和計算
      const monthlyStats = new Map()

      // 合併客戶和服務數據，同時過濾掉沒有佣金率設定的介紹人
      const qualifiedCustomers = customerData.filter(customer => {
        const hasCommissionRate = commissionRates?.some(rate => rate.introducer === customer.introducer)
        const hasBillingData = billingData.some(billing => billing.customer_id === customer.customer_id)
        return hasCommissionRate && hasBillingData
      })

      qualifiedCustomers.forEach(customer => {
        const customerBilling = billingData.filter(b => b.customer_id === customer.customer_id)
        
        customerBilling.forEach(billing => {
          const serviceMonth = new Date(billing.service_date).toISOString().substring(0, 7)
          const key = `${customer.customer_id}-${serviceMonth}`

          if (!monthlyStats.has(key)) {
            monthlyStats.set(key, {
              customer_id: customer.customer_id,
              customer_name: customer.customer_name,
              introducer: customer.introducer,
              service_month: serviceMonth,
              monthly_hours: 0,
              monthly_fee: 0,
              first_service_date: billing.service_date
            })
          }

          const existing = monthlyStats.get(key)
          existing.monthly_hours += Number(billing.service_hours) || 0
          existing.monthly_fee += Number(billing.service_fee) || 0
          
          if (billing.service_date < existing.first_service_date) {
            existing.first_service_date = billing.service_date
          }
        })
      })

      // 計算佣金 - 包含達標和不達標的記錄
      const allResults: CustomerCommissionData[] = []
      const customerMonthSequence = new Map()

      Array.from(monthlyStats.values())
        .sort((a, b) => a.service_month.localeCompare(b.service_month))
        .forEach(monthData => {
          // 修改達標條件：只計算服務費用，超過$6000就有佣金
          const isQualified = monthData.monthly_fee >= 6000
          
          let commissionAmount = 0
          let monthSequence = 0

          if (isQualified) {
            const customerKey = monthData.customer_id
            const currentSequence = (customerMonthSequence.get(customerKey) || 0) + 1
            customerMonthSequence.set(customerKey, currentSequence)
            monthSequence = currentSequence

            const commissionRate = commissionRates?.find(rate => rate.introducer === monthData.introducer)

            if (commissionRate) {
              commissionAmount = currentSequence === 1 
                ? commissionRate.first_month_commission 
                : commissionRate.subsequent_month_commission
            }
          }

          // 添加所有記錄（達標和不達標）
          allResults.push({
            ...monthData,
            is_qualified: isQualified,
            month_sequence: monthSequence,
            commission_amount: commissionAmount
          })
        })

      // 儲存所有數據用於篩選
      setAllCommissionData(allResults)

      // 按介紹人分組（只計算達標的佣金）
      const groupedByIntroducer = new Map<string, IntroducerSummary>()

      allResults.forEach(result => {
        if (!groupedByIntroducer.has(result.introducer)) {
          groupedByIntroducer.set(result.introducer, {
            introducer: result.introducer,
            total_commission: 0,
            first_month_count: 0,
            subsequent_month_count: 0,
            customers: []
          })
        }

        const summary = groupedByIntroducer.get(result.introducer)!
        summary.customers.push(result)
        
        // 只計算達標的佣金
        if (result.is_qualified) {
          summary.total_commission += result.commission_amount
          if (result.month_sequence === 1) {
            summary.first_month_count++
          } else {
            summary.subsequent_month_count++
          }
        }

        if (result.month_sequence === 1) {
          summary.first_month_count++
        } else {
          summary.subsequent_month_count++
        }
      })

      setCommissionData(Array.from(groupedByIntroducer.values()))
    } catch (err: any) {
      console.error('獲取佣金數據時發生錯誤:', err)
      setError(err.message || '獲取數據失敗')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return `${year}年${month}月`
  }

  // 篩選邏輯
  const getFilteredData = () => {
    let filtered = allCommissionData

    // 按介紹人篩選
    if (selectedIntroducer !== 'all') {
      filtered = filtered.filter(item => item.introducer === selectedIntroducer)
    }

    // 按年份篩選
    if (selectedYear !== 'all') {
      filtered = filtered.filter(item => item.service_month.startsWith(selectedYear))
    }

    // 按月份篩選
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(item => item.service_month.endsWith(`-${selectedMonth.padStart(2, '0')}`))
    }

    return filtered
  }

  const filteredCommissionData = getFilteredData()

  // 獲取可用的年份和月份選項
  const availableYears = Array.from(new Set(allCommissionData.map(item => item.service_month.split('-')[0]))).sort()
  const availableMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

  // 按介紹人重新分組已篩選的數據
  const filteredGroupedData = new Map<string, IntroducerSummary>()
  filteredCommissionData.forEach(result => {
    if (!filteredGroupedData.has(result.introducer)) {
      filteredGroupedData.set(result.introducer, {
        introducer: result.introducer,
        total_commission: 0,
        first_month_count: 0,
        subsequent_month_count: 0,
        customers: []
      })
    }

    const summary = filteredGroupedData.get(result.introducer)!
    summary.customers.push(result)
    
    if (result.is_qualified) {
      summary.total_commission += result.commission_amount
      if (result.month_sequence === 1) {
        summary.first_month_count++
      } else {
        summary.subsequent_month_count++
      }
    }
  })

  const filteredData = Array.from(filteredGroupedData.values())
  const totalCommission = filteredData.reduce((sum, item) => sum + item.total_commission, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
          <p className="text-apple-body text-text-secondary mt-4">載入佣金數據中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center card-apple max-w-md mx-4">
          <div className="card-apple-content">
            <h2 className="text-lg font-semibold text-red-600 mb-4">載入數據時發生錯誤</h2>
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              onClick={fetchCommissionData}
              className="btn-apple-primary"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="card-apple border-b border-border-light fade-in-apple sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6 lg:py-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary mb-1 truncate">佣金計算</h1>
              <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">計算業務佣金、獎金及績效獎勵</p>
              <p className="text-xs text-orange-600 mt-1">達標條件：每月服務費用 ≥ $6,000</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-apple-secondary text-xs px-3 py-2 ml-3 flex-shrink-0"
            >
              返回
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* 篩選器 */}
        <div className="card-apple fade-in-apple mb-6">
          <div className="card-apple-content">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">介紹人篩選：</label>
                <select
                  value={selectedIntroducer}
                  onChange={(e) => setSelectedIntroducer(e.target.value)}
                  className="form-input-apple w-full"
                >
                  <option value="all">全部介紹人</option>
                  {Array.from(new Set(allCommissionData.map(item => item.introducer))).map(introducer => (
                    <option key={introducer} value={introducer}>
                      {introducer}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">年份篩選：</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="form-input-apple w-full"
                >
                  <option value="all">全部年份</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">月份篩選：</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-input-apple w-full"
                >
                  <option value="all">全部月份</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {month}月
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-2 flex items-end space-x-2">
                <button
                  onClick={() => {
                    setSelectedIntroducer('all')
                    setSelectedYear('all')
                    setSelectedMonth('all')
                  }}
                  className="btn-apple-secondary flex-1"
                >
                  清除篩選
                </button>
                <button
                  onClick={fetchCommissionData}
                  className="btn-apple-primary flex-1"
                >
                  重新載入
                </button>
                <button
                  onClick={generatePDF}
                  className="btn-apple-primary flex-1 bg-green-600 hover:bg-green-700"
                >
                  📄 導出PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 總覽統計 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-apple fade-in-apple" style={{ animationDelay: '0.1s' }}>
            <div className="card-apple-content text-center">
              <h3 className="text-sm font-medium text-text-secondary mb-2">總佣金</h3>
              <p className="text-xl font-bold text-mingcare-green">{formatCurrency(totalCommission)}</p>
            </div>
          </div>
          <div className="card-apple fade-in-apple" style={{ animationDelay: '0.2s' }}>
            <div className="card-apple-content text-center">
              <h3 className="text-sm font-medium text-text-secondary mb-2">介紹人數量</h3>
              <p className="text-xl font-bold text-mingcare-blue">{filteredData.length}</p>
            </div>
          </div>
          <div className="card-apple fade-in-apple" style={{ animationDelay: '0.3s' }}>
            <div className="card-apple-content text-center">
              <h3 className="text-sm font-medium text-text-secondary mb-2">首月佣金</h3>
              <p className="text-xl font-bold text-mingcare-purple">
                {filteredData.reduce((sum, item) => sum + item.first_month_count, 0)}
              </p>
            </div>
          </div>
          <div className="card-apple fade-in-apple" style={{ animationDelay: '0.4s' }}>
            <div className="card-apple-content text-center">
              <h3 className="text-sm font-medium text-text-secondary mb-2">後續月份</h3>
              <p className="text-xl font-bold text-mingcare-orange">
                {filteredData.reduce((sum, item) => sum + item.subsequent_month_count, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* 佣金明細 */}
        <div className="space-y-6">
          {filteredData.map((introducerData, index) => (
            <div key={introducerData.introducer} className="card-apple fade-in-apple" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
              <div className="bg-bg-secondary px-6 py-4 border-b border-border-light rounded-t-apple">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div className="mb-2 sm:mb-0">
                    <h2 className="text-lg font-semibold text-text-primary mb-1">
                      介紹人：{introducerData.introducer}
                    </h2>
                    {(() => {
                      const rate = commissionRatesData.find(r => r.introducer === introducerData.introducer)
                      return rate ? (
                        <div className="text-sm text-text-secondary">
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                            首月: {formatCurrency(rate.first_month_commission)}
                          </span>
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                            後續: {formatCurrency(rate.subsequent_month_commission)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
                          未設定佣金率
                        </div>
                      )
                    })()}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-mingcare-green">
                      總佣金：{formatCurrency(introducerData.total_commission)}
                    </p>
                    <p className="text-sm text-text-secondary">
                      首月：{introducerData.first_month_count} | 後續：{introducerData.subsequent_month_count}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">客戶編號</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">客戶姓名</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">服務月份</th>
                      <th className="px-4 py-3 text-right font-medium text-text-secondary">服務時數</th>
                      <th className="px-4 py-3 text-right font-medium text-text-secondary">服務費用</th>
                      <th className="px-4 py-3 text-center font-medium text-text-secondary">月份序號</th>
                      <th className="px-4 py-3 text-right font-medium text-text-secondary">佣金金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {introducerData.customers.map((customer, customerIndex) => (
                      <tr key={`${customer.customer_id}-${customer.service_month}`} className="hover:bg-bg-secondary transition-colors">
                        <td className="px-4 py-3 text-text-primary">{customer.customer_id}</td>
                        <td className="px-4 py-3 text-text-primary">{customer.customer_name}</td>
                        <td className="px-4 py-3 text-text-secondary">{formatMonth(customer.service_month)}</td>
                        <td className="px-4 py-3 text-right text-text-secondary">{customer.monthly_hours.toFixed(1)}h</td>
                        <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(customer.monthly_fee)}</td>
                        <td className="px-4 py-3 text-center">
                          {customer.is_qualified ? (
                            <span className={`px-2 py-1 rounded-apple-sm text-xs font-medium ${
                              customer.month_sequence === 1 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {customer.month_sequence === 1 ? '首月' : `第${customer.month_sequence}月`}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-apple-sm text-xs font-medium bg-red-100 text-red-800">
                              不達標
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {customer.is_qualified ? (
                            <span className="text-mingcare-green">
                              {formatCurrency(customer.commission_amount)}
                            </span>
                          ) : (
                            <span className="text-red-600">
                              不達標
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content text-center py-12">
              <div className="mx-auto w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">暫無符合條件的佣金數據</h3>
              <p className="text-text-secondary">請檢查是否有符合計算條件的客戶和服務記錄</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
