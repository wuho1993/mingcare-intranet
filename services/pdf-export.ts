import { supabase } from '../lib/supabase'

interface CustomerData {
  customer_id?: string
  customer_name?: string
  customer_type?: string
  phone?: string
  service_address?: string
  voucher_application_status?: string
  lds_status?: string
  home_visit_status?: string
  created_at?: string
}

export interface CustomerListItem {
  customer_id: string
  customer_name: string
  customer_type: string
  phone?: string
  service_address?: string
  voucher_application_status?: string
  lds_status?: string
  home_visit_status?: string
  created_at: string
  hasServiceThisMonth?: boolean
}

export interface PDFExportOptions {
  customerType: 'all' | 'mingcare-street' | 'voucher' | 'home-visit'
  dateRange?: {
    startDate: string
    endDate: string
  }
  includeStats?: boolean
}

export interface PDFExportData {
  customers: CustomerListItem[]
  summary: {
    totalCount: number
    dateRange?: string
    customerType: string
  }
  voucherStats?: {
    statusStats: Record<string, number>
    ldsStats: Record<string, number>
    monthlyServiceUsage: any[]
    introducerStats: Record<string, Record<string, number>>
  }
}

// 根據客戶類型獲取篩選後的客戶數據
export async function getCustomersForExport(options: PDFExportOptions): Promise<PDFExportData> {
  try {
    // 先從 customer_personal_data 找到指定類型的客戶
    let customerQuery = supabase
      .from('customer_personal_data')
      .select(`
        customer_id,
        customer_name,
        customer_type,
        phone,
        service_address,
        voucher_application_status,
        lds_status,
        home_visit_status,
        created_at
      `)

    // 根據客戶類型篩選
    switch (options.customerType) {
      case 'mingcare-street':
        customerQuery = customerQuery.eq('customer_type', '明家街客')
        break
      case 'voucher':
        customerQuery = customerQuery.eq('customer_type', '社區券客戶')
        break
      case 'home-visit':
        customerQuery = customerQuery.eq('customer_type', '家訪客戶')
        break
      // 'all' 不需要額外篩選
    }

    console.log('執行客戶數據查詢...')
    
    // 分批獲取所有客戶記錄，避免 Supabase 1000 條限制
    let customers: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      const from = page * pageSize
      const to = from + pageSize - 1
      
      const { data: pageData, error: pageError } = await customerQuery
        .order('customer_id', { ascending: true })
        .range(from, to)
      
      if (pageError) {
        console.error('客戶數據查詢錯誤:', pageError)
        throw pageError
      }
      
      if (pageData && pageData.length > 0) {
        customers = customers.concat(pageData)
        hasMore = pageData.length === pageSize
        page++
        console.log(`已獲取 ${customers.length} 條客戶記錄...`)
      } else {
        hasMore = false
      }
    }

    console.log('查詢到客戶數量:', customers?.length || 0)

    if (!customers || customers.length === 0) {
      return {
        customers: [],
        voucherStats: {
          statusStats: {},
          ldsStats: {},
          monthlyServiceUsage: [],
          introducerStats: {}
        },
        summary: {
          totalCount: 0,
          customerType: options.customerType,
          dateRange: options.dateRange ? `${options.dateRange.startDate} 至 ${options.dateRange.endDate}` : undefined
        }
      }
    }

    // 如果有日期範圍，查詢客戶本月是否有服務記錄
    if (options.dateRange) {
      console.log('查詢客戶本月服務狀況...')
      console.log('選定的日期範圍:', options.dateRange)
      
      // 計算當前月份的日期範圍（用於本月服務檢查）
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1 // JavaScript月份從0開始
      const currentMonthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
      const currentMonthEnd = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`
      
      console.log('本月服務檢查範圍:', currentMonthStart, '至', currentMonthEnd)
      
      // 準備查詢條件：同時使用客戶名稱和客戶ID
      const customerNames = customers.map(c => c.customer_name).filter(Boolean)
      const customerIds = customers.map(c => c.customer_id).filter(Boolean)
      
      console.log('查詢的客戶名稱數量:', customerNames.length)
      console.log('查詢的客戶ID數量:', customerIds.length)
      
      // 分別查詢名稱和ID匹配的記錄，然後合併
      let serviceRecords: any[] = []
      let serviceError = null
      
      try {
        // 社區券客戶需要篩選項目類別，排除 MC街客
        const shouldFilterProjectCategory = options.customerType === 'voucher'
        const allowedProjectCategories = ['MC社區券(醫點）', 'Steven140', 'Steven200', 'Steven醫點']
        
        // 查詢名稱匹配的記錄（使用當前月份範圍）- 分頁獲取所有記錄
        if (customerNames.length > 0) {
          let page = 0
          const pageSize = 1000
          let hasMore = true
          
          while (hasMore) {
            const from = page * pageSize
            const to = from + pageSize - 1
            
            let nameQuery = supabase
              .from('billing_salary_data')
              .select('customer_name, customer_id, project_category')
              .in('customer_name', customerNames)
              .gte('service_date', currentMonthStart)
              .lt('service_date', currentMonthEnd)
              .range(from, to)
            
            // 社區券報表需要篩選項目類別
            if (shouldFilterProjectCategory) {
              nameQuery = nameQuery.in('project_category', allowedProjectCategories)
            }
            
            const { data: nameRecords, error: nameError } = await nameQuery
            
            if (nameError) throw nameError
            
            if (nameRecords && nameRecords.length > 0) {
              serviceRecords = [...serviceRecords, ...nameRecords]
              hasMore = nameRecords.length === pageSize
              page++
            } else {
              hasMore = false
            }
          }
        }

        // 查詢ID匹配的記錄（使用當前月份範圍）- 分頁獲取所有記錄
        if (customerIds.length > 0) {
          let page = 0
          const pageSize = 1000
          let hasMore = true
          
          while (hasMore) {
            const from = page * pageSize
            const to = from + pageSize - 1
            
            let idQuery = supabase
              .from('billing_salary_data')
              .select('customer_name, customer_id, project_category')
              .in('customer_id', customerIds)
              .gte('service_date', currentMonthStart)
              .lt('service_date', currentMonthEnd)
              .range(from, to)
            
            // 社區券報表需要篩選項目類別
            if (shouldFilterProjectCategory) {
              idQuery = idQuery.in('project_category', allowedProjectCategories)
            }
            
            const { data: idRecords, error: idError } = await idQuery
            
            if (idError) throw idError
            
            if (idRecords && idRecords.length > 0) {
              serviceRecords = [...serviceRecords, ...idRecords]
              hasMore = idRecords.length === pageSize
              page++
            } else {
              hasMore = false
            }
          }
        }        // 去重（因為可能同一條記錄被兩個查詢都找到）
        const uniqueRecords = serviceRecords.filter((record, index, self) => 
          index === self.findIndex(r => r.customer_name === record.customer_name && r.customer_id === record.customer_id)
        )
        serviceRecords = uniqueRecords
        
        console.log(`項目類別篩選: ${shouldFilterProjectCategory ? '已啟用' : '未啟用'}`)
        if (shouldFilterProjectCategory) {
          console.log('允許的項目類別:', allowedProjectCategories)
        }
        
      } catch (error) {
        serviceError = error
      }

      console.log('服務記錄查詢結果:', serviceRecords?.length || 0, '條記錄')

      if (!serviceError && serviceRecords) {
        // 建立服務記錄的名稱和ID集合
        const servedCustomerNames = new Set(serviceRecords.map(r => r.customer_name).filter(Boolean))
        const servedCustomerIds = new Set(serviceRecords.map(r => r.customer_id).filter(Boolean))
        
        console.log('有服務的客戶名稱數量:', servedCustomerNames.size)
        console.log('有服務的客戶ID數量:', servedCustomerIds.size)
        
        customers = customers.map(customer => {
          // 同時檢查名稱和ID匹配
          const nameMatch = customer.customer_name && servedCustomerNames.has(customer.customer_name)
          const idMatch = customer.customer_id && servedCustomerIds.has(customer.customer_id)
          const hasService = nameMatch || idMatch
          
          return {
            ...customer,
            hasServiceThisMonth: hasService
          }
        })
        
        // 統計匹配結果
        let nameMatches = 0
        let idMatches = 0
        let bothMatches = 0
        let noMatches = 0
        
        customers.forEach(customer => {
          const nameMatch = customer.customer_name && servedCustomerNames.has(customer.customer_name)
          const idMatch = customer.customer_id && servedCustomerIds.has(customer.customer_id)
          
          if (nameMatch && idMatch) bothMatches++
          else if (nameMatch) nameMatches++
          else if (idMatch) idMatches++
          else noMatches++
        })
        
        console.log('匹配統計:')
        console.log('  名稱+ID都匹配:', bothMatches)
        console.log('  僅名稱匹配:', nameMatches)
        console.log('  僅ID匹配:', idMatches)
        console.log('  無匹配:', noMatches)
        
        // 特別檢查黃容智
        const huangRongzhi = customers.find(c => c.customer_name === '黃容智')
        if (huangRongzhi) {
          console.log('黃容智客戶狀態:', {
            name: huangRongzhi.customer_name,
            id: huangRongzhi.customer_id,
            hasService: (huangRongzhi as any).hasServiceThisMonth,
            nameInSet: servedCustomerNames.has(huangRongzhi.customer_name),
            idInSet: huangRongzhi.customer_id ? servedCustomerIds.has(huangRongzhi.customer_id) : false
          })
        }
        
      } else if (serviceError) {
        console.error('服務記錄查詢錯誤:', serviceError)
      }
    }

    // 按客戶編號排序客戶列表
    if (customers && customers.length > 0) {
      customers.sort((a, b) => {
        const idA = a.customer_id || ''
        const idB = b.customer_id || ''
        
        // 解析客戶ID的前綴和數字部分
        const parseCustomerId = (id: string) => {
          // 使用正則表達式分離字母前綴和數字後綴
          const match = id.match(/^([A-Za-z-]+)(\d+)$/)
          if (match) {
            return {
              prefix: match[1].toLowerCase(), // 轉小寫統一比較
              number: parseInt(match[2], 10)
            }
          }
          // 如果不符合格式，返回原字符串
          return {
            prefix: id.toLowerCase(),
            number: 0
          }
        }
        
        const parsedA = parseCustomerId(idA)
        const parsedB = parseCustomerId(idB)
        
        // 先按前綴排序，再按數字排序
        if (parsedA.prefix !== parsedB.prefix) {
          return parsedA.prefix.localeCompare(parsedB.prefix)
        } else {
          return parsedA.number - parsedB.number
        }
      })
      
      console.log('客戶列表已按編號排序（前綴+數字順序）')
    }

    const exportData: PDFExportData = {
      customers: customers || [], // 顯示所有客戶（已排序）
      summary: {
        totalCount: customers?.length || 0,
        customerType: getCustomerTypeLabel(options.customerType),
        dateRange: options.dateRange 
          ? `${options.dateRange.startDate} 至 ${options.dateRange.endDate}`
          : undefined
      }
    }

    // 如果是社區券客戶，獲取詳細統計數據（使用日期篩選來計算統計）
    if (options.customerType === 'voucher' && options.includeStats) {
      console.log('獲取社區券統計數據...')
      exportData.voucherStats = await getVoucherStatsForExport(customers || [], options.dateRange)
    }

    return exportData
  } catch (error) {
    console.error('獲取導出數據時發生錯誤:', error)
    throw error
  }
}

// 獲取社區券統計數據
async function getVoucherStatsForExport(customers: CustomerListItem[], dateRange?: { startDate: string; endDate: string }) {
  try {
    console.log('計算狀態統計...')
    // 計算狀態統計（針對所有客戶）
    const statusStats = customers.reduce((acc, customer) => {
      const status = customer.voucher_application_status
      if (status && status.trim()) {
        acc[status] = (acc[status] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    console.log('計算 LDS 狀態統計...')
    // 計算 LDS 狀態統計（申請中客戶）
    const ldsStats = customers
      .filter(customer => customer.voucher_application_status === '申請中')
      .reduce((acc, customer) => {
        const status = customer.lds_status
        if (status && status.trim()) {
          acc[status] = (acc[status] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

    console.log('獲取月度服務使用數據...')
    // 獲取月度服務使用數據（如果有日期範圍）
    let monthlyServiceUsage: Array<{ month: number; year: number; data: Array<{ project_category: string; service_count: number; customers: string[] }> }> = []
    
    if (dateRange) {
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      
      // 計算需要統計的月份範圍
      const months = []
      let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      
      while (currentDate <= endMonth) {
        months.push({
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1
        })
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
      
      console.log('需要統計的月份:', months)
      
      // 為每個月份分別查詢數據
      for (const monthInfo of months) {
        const monthStart = `${monthInfo.year}-${String(monthInfo.month).padStart(2, '0')}-01`
        // 使用本地日期格式避免時區問題
        const lastDayOfMonth = new Date(monthInfo.year, monthInfo.month, 0).getDate()
        const monthEnd = `${monthInfo.year}-${String(monthInfo.month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`
        
        // 分批獲取該月所有服務記錄
        let serviceUsage: any[] = []
        let page = 0
        const pageSize = 1000
        let hasMore = true
        
        while (hasMore) {
          const from = page * pageSize
          const to = from + pageSize - 1
          
          const { data: pageData, error } = await supabase
            .from('billing_salary_data')
            .select('project_category, customer_name, service_date')
            .gte('service_date', monthStart)
            .lte('service_date', monthEnd)
            .neq('project_category', 'MC街客')
            .range(from, to)

          if (error) {
            console.error(`${monthInfo.month}月服務使用數據查詢錯誤:`, error)
            break
          }
          
          if (pageData && pageData.length > 0) {
            serviceUsage = serviceUsage.concat(pageData)
            hasMore = pageData.length === pageSize
            page++
          } else {
            hasMore = false
          }
        }
        
        console.log(`${monthInfo.month}月已獲取 ${serviceUsage.length} 條服務記錄`)

        type MonthlyDataItem = { project_category: string; service_count: number; customers: string[] }
        const monthlyData = (serviceUsage || []).reduce((acc, record) => {
          const category = record.project_category
          const existingCategory = acc.find((item: MonthlyDataItem) => item.project_category === category)
          
          if (existingCategory) {
            existingCategory.service_count += 1
            if (!existingCategory.customers.includes(record.customer_name)) {
              existingCategory.customers.push(record.customer_name)
            }
          } else {
            acc.push({
              project_category: category,
              service_count: 1,
              customers: [record.customer_name]
            })
          }
          
          return acc
        }, [] as MonthlyDataItem[])
        
        monthlyServiceUsage.push({
          month: monthInfo.month,
          year: monthInfo.year,
          data: monthlyData
        })
      }
    }

    return {
      statusStats,
      ldsStats,
      monthlyServiceUsage,
      introducerStats: {} // 暫時為空，避免錯誤
    }
  } catch (error) {
    console.error('獲取社區券統計數據時發生錯誤:', error)
    // 返回基本數據，避免完全失敗
    return {
      statusStats: {},
      ldsStats: {},
      monthlyServiceUsage: [],
      introducerStats: {}
    }
  }
}

// 生成 PDF 報表 - 使用瀏覽器打印功能
export async function generateCustomerPDF(options: PDFExportOptions): Promise<void> {
  try {
    console.log('開始生成 PDF，選項:', options)
    
    const data = await getCustomersForExport(options)
    console.log('數據獲取成功:', data)
    
    // 計算用戶選擇的月份
    let selectedMonth = new Date().getMonth() + 1 // 默認當前月份
    if (options.dateRange) {
      const startDate = new Date(options.dateRange.startDate)
      selectedMonth = startDate.getMonth() + 1
    }
    
    // 生成 HTML 內容
    const htmlContent = generatePDFHTML(data, selectedMonth)
    console.log('HTML 內容生成成功')
    
    // 使用新窗口方式打印
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    if (!printWindow) {
      throw new Error('無法打開打印窗口，請檢查瀏覽器是否阻止彈窗')
    }

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // 等待內容加載
    const waitForLoad = () => {
      if (printWindow.document.readyState === 'complete') {
        setTimeout(() => {
          printWindow.focus()
          printWindow.print()
        }, 500)
      } else {
        setTimeout(waitForLoad, 100)
      }
    }
    
    waitForLoad()
    
  } catch (error) {
    console.error('PDF 生成錯誤:', error)
    throw error
  }
}

// 生成 PDF HTML 內容
function generatePDFHTML(data: PDFExportData, selectedMonth?: number): string {
  const currentDate = new Date().toLocaleString('zh-TW')
  const currentMonth = selectedMonth || new Date().getMonth() + 1

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>客戶管理報表 - ${data.summary.customerType}</title>
      <style>
        @media print {
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body { -webkit-print-color-adjust: exact; }
        }
        
        body {
          font-family: 'Microsoft YaHei', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        
        .header {
          margin-bottom: 30px;
          border-bottom: 2px solid #428bca;
          padding-bottom: 15px;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }
        
        .header-left h1 {
          color: #428bca;
          font-size: 24px;
          margin: 0 0 10px 0;
        }
        
        .header-left .info {
          color: #666;
          font-size: 14px;
        }
        
        .header-right {
          display: flex;
          gap: 10px;
        }
        
        .btn-print, .btn-save {
          padding: 8px 16px;
          border: 1px solid #428bca;
          border-radius: 4px;
          background: white;
          color: #428bca;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s;
        }
        
        .btn-print:hover, .btn-save:hover {
          background: #428bca;
          color: white;
        }
        
        @media print {
          .btn-print, .btn-save {
            display: none !important;
          }
        }
        
        .summary-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border: 1px solid #dee2e6;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .summary-item {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }
        
        .summary-item .label {
          display: block;
          font-weight: bold;
          color: #428bca;
          margin-bottom: 8px;
        }
        
        .summary-item .value {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        
        .stats-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .stats-section h3 {
          color: #428bca;
          margin-bottom: 15px;
          font-size: 16px;
          border-bottom: 1px solid #428bca;
          padding-bottom: 5px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .stats-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }
        
        .table-section {
          margin-top: 30px;
        }
        
        .table-section h3 {
          color: #428bca;
          margin-bottom: 15px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #428bca;
          color: white;
          font-weight: bold;
          text-align: center;
        }
        
        .number {
          text-align: right;
        }
        
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <h1>客戶管理報表</h1>
            <div class="info">
              <div>客戶類型: ${data.summary.customerType}</div>
              ${data.summary.dateRange ? `<div>統計期間: ${data.summary.dateRange}</div>` : ''}
              <div>生成時間: ${currentDate}</div>
            </div>
          </div>
          <div class="header-right">
            <button onclick="window.print()" class="btn-print">📄 列印</button>
            <button onclick="savePDF()" class="btn-save">💾 儲存PDF</button>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">總客戶數</span>
            <span class="value">${data.summary.totalCount}</span>
          </div>
        </div>
      </div>

      <!-- 社區券狀態統計放在總客戶數下面 -->
      ${data.voucherStats ? generateVoucherStatsHTML(data.voucherStats) : ''}

      <!-- 客戶列表開新的一頁 -->
      <div class="page-break table-section">
        <h3>客戶列表</h3>
        <table>
          <thead>
            <tr>
              <th>序號</th>
              <th>客戶ID</th>
              <th>客戶姓名</th>
              <th>客戶類型</th>
              <th>聯絡電話</th>
              <th>地址</th>
              <th>社區券狀況</th>
              <th>LDS狀況</th>
              <th>本月服務</th>
            </tr>
          </thead>
          <tbody>
            ${data.customers.map((customer, index) => {
              // 社區券狀況顏色邏輯
              const getVoucherStatusColor = (status: string | undefined): string => {
                switch(status) {
                  case '已經持有': return '#28a745' // 綠色
                  case '申請中': return '#ffc107' // 黃色
                  default: return '#6c757d' // 灰色
                }
              }
              
              // LDS狀況顏色邏輯
              const getLdsStatusColor = (status: string | undefined): string => {
                switch(status) {
                  case '已完成評估': return '#28a745' // 綠色
                  case '已經持有': return '#007bff' // 藍色
                  case '待社工評估': return '#ffc107' // 黃色
                  default: return '#6c757d' // 灰色
                }
              }
              
              // 本月服務顏色邏輯
              const getServiceStatusColor = (hasService: boolean | undefined): string => {
                return hasService ? '#28a745' : '#dc3545' // 綠色：有服務，紅色：無服務
              }
              
              return `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${customer.customer_id || ''}</td>
                <td>${customer.customer_name || ''}</td>
                <td>${customer.customer_type || ''}</td>
                <td>${customer.phone || ''}</td>
                <td>${customer.service_address || ''}</td>
                <td style="color: ${getVoucherStatusColor(customer.voucher_application_status)}; font-weight: bold;">
                  ${customer.voucher_application_status || ''}
                </td>
                <td style="color: ${getLdsStatusColor(customer.lds_status)}; font-weight: bold;">
                  ${customer.lds_status || ''}
                </td>
                <td style="color: ${getServiceStatusColor(customer.hasServiceThisMonth)}; font-weight: bold;">
                  ${customer.hasServiceThisMonth ? '是' : '否'}
                </td>
              </tr>
              `
            }).join('')}
          </tbody>
        </table>
        
        ${data.customers.length > 100 ? `<div style="text-align: center; color: #666; margin-top: 20px;">共 ${data.customers.length} 個客戶</div>` : ''}
      </div>
      
      <script>
        function savePDF() {
          // 隱藏按鈕
          const buttons = document.querySelectorAll('.btn-print, .btn-save');
          buttons.forEach(btn => btn.style.display = 'none');
          
          // 執行列印
          window.print();
          
          // 恢復按鈕
          setTimeout(() => {
            buttons.forEach(btn => btn.style.display = 'inline-block');
          }, 1000);
        }
      </script>
    </body>
    </html>
  `
}

// 生成社區券統計 HTML
function generateVoucherStatsHTML(stats: any, selectedMonth?: number): string {
  return `
    <div class="stats-section">
      <h3>社區券狀態統計</h3>
      <div class="stats-grid">
        ${Object.entries(stats.statusStats).map(([status, count]) => `
          <div class="stats-item">
            <span>${status}</span>
            <span><strong>${count}</strong></span>
          </div>
        `).join('')}
      </div>
      
      ${Object.keys(stats.ldsStats).length > 0 ? `
        <h4 style="color: #666; margin: 15px 0 10px 0;">申請中客戶 LDS 狀態分佈</h4>
        <div class="stats-grid">
          ${Object.entries(stats.ldsStats).map(([status, count]) => `
            <div class="stats-item">
              <span>${status}</span>
              <span><strong>${count}</strong></span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    ${stats.monthlyServiceUsage && stats.monthlyServiceUsage.length > 0 ? 
      stats.monthlyServiceUsage.map((monthData: any, index: number) => {
        const currentMonthTotal = Array.from(new Set(monthData.data.flatMap((item: any) => item.customers))).length
        let growthInfo = ''
        
        // 計算比上月增長
        if (index > 0) {
          const prevMonthData = stats.monthlyServiceUsage[index - 1]
          const prevMonthTotal = Array.from(new Set(prevMonthData.data.flatMap((item: any) => item.customers))).length
          const growth = currentMonthTotal - prevMonthTotal
          const growthPercent = prevMonthTotal > 0 ? ((growth / prevMonthTotal) * 100).toFixed(1) : '0.0'
          
          if (growth > 0) {
            growthInfo = `<div style="margin-top: 8px; color: #28a745; font-size: 11px;">
              ↗ 比上月增長 ${growth}人 (+${growthPercent}%)
            </div>`
          } else if (growth < 0) {
            growthInfo = `<div style="margin-top: 8px; color: #dc3545; font-size: 11px;">
              ↘ 比上月減少 ${Math.abs(growth)}人 (${growthPercent}%)
            </div>`
          } else {
            growthInfo = `<div style="margin-top: 8px; color: #6c757d; font-size: 11px;">
              → 與上月持平 (0人)
            </div>`
          }
        }
        
        return `
        <div class="stats-section">
          <h3>${monthData.month}月社區券服務使用情況（按所屬項目）</h3>
          <div class="stats-grid">
            ${monthData.data.map((item: any) => `
              <div class="stats-item">
                <span>${item.project_category}</span>
                <span><strong>${item.customers.length}人</strong></span>
              </div>
            `).join('')}
          </div>
          
          ${monthData.data.length > 0 ? `
            <div class="summary-row" style="margin-top: 15px; padding: 10px; background: #f0f8ff; border: 1px solid #428bca; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; color: #428bca;">
                <span>總人次</span>
                <span>${currentMonthTotal}人</span>
              </div>
              ${growthInfo}
            </div>
          ` : ''}
        </div>
        `
      }).join('')
    : ''}
  `
}

// 獲取客戶類型標籤
function getCustomerTypeLabel(type: string): string {
  switch (type) {
    case 'all': return '全部客戶'
    case 'mingcare-street': return '明家街客'
    case 'voucher': return '社區券客戶'
    case 'home-visit': return '家訪客戶'
    default: return type
  }
}