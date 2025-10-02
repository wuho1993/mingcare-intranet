// 📅 日曆導出服務
// Calendar Export Service

import { BillingSalaryRecord, BillingSalaryFilters } from '../types/billing-salary'
import { supabase } from '../lib/supabase'

// =============================================================================
// 類型定義
// =============================================================================

export interface CalendarEvent {
  uid: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  location?: string
  categories?: string[]
  organizer?: string
  attendees?: string[]
}

export interface CalendarExportOptions {
  format: 'ics' | 'google' | 'outlook' | 'pdf'
  filters: BillingSalaryFilters
  includeStaffDetails?: boolean
  includeCustomerDetails?: boolean
  timezone?: string
}

export interface CalendarExportResult {
  success: boolean
  data?: string | URL
  filename?: string
  error?: string
}

// =============================================================================
// 主要導出功能
// =============================================================================

/**
 * 導出日曆數據
 */
export async function exportCalendar(options: CalendarExportOptions): Promise<CalendarExportResult> {
  try {
    console.log('🚀 開始導出日曆，選項:', options)

    // 1. 獲取排班數據
    const scheduleData = await getScheduleDataForExport(options.filters)
    if (!scheduleData.success || !scheduleData.data) {
      return {
        success: false,
        error: scheduleData.error || '無法獲取排班數據'
      }
    }

    // 2. 轉換為日曆事件
    const events = convertToCalendarEvents(scheduleData.data, options)

    // 3. 根據格式導出
    switch (options.format) {
      case 'ics':
        return await exportToICS(events, options)
      case 'google':
        return await exportToGoogleCalendar(events, options)
      case 'outlook':
        return await exportToOutlook(events, options)
      case 'pdf':
        return exportToPDF(events, scheduleData.data, options)
      default:
        return {
          success: false,
          error: '不支援的導出格式'
        }
    }

  } catch (error) {
    console.error('❌ 日曆導出失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '導出失敗'
    }
  }
}

// =============================================================================
// 數據獲取
// =============================================================================

/**
 * 獲取排班數據用於導出
 */
async function getScheduleDataForExport(filters: BillingSalaryFilters) {
  try {
    let query = supabase
      .from('billing_salary_data')
      .select('*')
      .order('service_date', { ascending: true })

    // 應用篩選條件
    if (filters.dateRange.start && filters.dateRange.end) {
      query = query
        .gte('service_date', filters.dateRange.start)
        .lte('service_date', filters.dateRange.end)
    }

    if (filters.serviceType) {
      query = query.eq('service_type', filters.serviceType)
    }

    if (Array.isArray(filters.projectCategory)) {
      const categories = filters.projectCategory.filter(category => !!category)
      if (categories.length > 0) {
        query = query.in('project_category', categories)
      }
    } else if (filters.projectCategory) {
      query = query.eq('project_category', filters.projectCategory)
    }

    if (filters.projectManager) {
      query = query.eq('project_manager', filters.projectManager)
    }

    if (filters.careStaffName) {
      query = query.ilike('care_staff_name', `%${filters.careStaffName}%`)
    }

    // 注意：BillingSalaryFilters 可能沒有 customerName 欄位，使用 customer_name 替代
    // if (filters.customerName) {
    //   query = query.ilike('customer_name', `%${filters.customerName}%`)
    // }

    const { data, error } = await query

    if (error) {
      console.error('數據庫查詢錯誤:', error)
      return {
        success: false,
        error: `數據庫錯誤: ${error.message}`
      }
    }

    return {
      success: true,
      data: data || []
    }

  } catch (error) {
    console.error('獲取排班數據錯誤:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取數據失敗'
    }
  }
}

// =============================================================================
// 事件轉換
// =============================================================================

/**
 * 將排班數據轉換為日曆事件
 */
function convertToCalendarEvents(
  records: BillingSalaryRecord[],
  options: CalendarExportOptions
): CalendarEvent[] {
  return records.map((record, index) => {
    // 建立事件時間
    const serviceDate = new Date(record.service_date)
    const startTime = record.start_time || '09:00'
    const endTime = record.end_time || '17:00'

    const startDate = new Date(serviceDate)
    const [startHour, startMinute] = startTime.split(':').map(Number)
    startDate.setHours(startHour, startMinute, 0, 0)

    const endDate = new Date(serviceDate)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    endDate.setHours(endHour, endMinute, 0, 0)

    // 建立事件標題
    let title = `${record.customer_name} - ${record.service_type}`
    if (options.includeStaffDetails && record.care_staff_name) {
      title += ` (${record.care_staff_name})`
    }

    // 建立事件描述
    let description = `服務類型: ${record.service_type}\n`
    description += `客戶: ${record.customer_name}\n`
    
    if (options.includeStaffDetails && record.care_staff_name) {
      description += `護理員: ${record.care_staff_name}\n`
    }
    
    if (options.includeCustomerDetails) {
      if (record.customer_id) description += `客戶編號: ${record.customer_id}\n`
      if (record.phone) description += `聯絡電話: ${record.phone}\n`
    }
    
    if (record.service_hours) description += `服務時數: ${record.service_hours} 小時\n`
    if (record.project_category) description += `所屬項目: ${record.project_category}\n`
    if (record.project_manager) description += `項目經理: ${record.project_manager}\n`

    return {
      uid: `mingcare-${record.id || index}-${Date.now()}@mingcarehome.com`,
      title,
      description: description.trim(),
      startDate,
      endDate,
      location: record.service_address || undefined,
      categories: [record.project_category || '護理服務', record.service_type || '一般服務'],
      organizer: record.project_manager || 'MingCare',
      attendees: record.care_staff_name ? [record.care_staff_name] : undefined
    }
  })
}

// =============================================================================
// ICS 格式導出
// =============================================================================

/**
 * 導出為 ICS (iCal) 格式
 */
async function exportToICS(events: CalendarEvent[], options: CalendarExportOptions): Promise<CalendarExportResult> {
  try {
    const timezone = options.timezone || 'Asia/Hong_Kong'
    
    // ICS 文件頭
    let icsContent = 'BEGIN:VCALENDAR\r\n'
    icsContent += 'VERSION:2.0\r\n'
    icsContent += 'PRODID:-//MingCare//MingCare Intranet//EN\r\n'
    icsContent += 'CALSCALE:GREGORIAN\r\n'
    icsContent += 'METHOD:PUBLISH\r\n'
    icsContent += `X-WR-TIMEZONE:${timezone}\r\n`
    icsContent += 'X-WR-CALNAME:MingCare 排班表\r\n'
    icsContent += 'X-WR-CALDESC:MingCare 護理服務排班日曆\r\n'

    // 添加時區資訊
    icsContent += 'BEGIN:VTIMEZONE\r\n'
    icsContent += `TZID:${timezone}\r\n`
    icsContent += 'BEGIN:STANDARD\r\n'
    icsContent += 'DTSTART:20231029T030000\r\n'
    icsContent += 'TZOFFSETFROM:+0800\r\n'
    icsContent += 'TZOFFSETTO:+0800\r\n'
    icsContent += 'TZNAME:HKT\r\n'
    icsContent += 'END:STANDARD\r\n'
    icsContent += 'END:VTIMEZONE\r\n'

    // 添加事件
    events.forEach(event => {
      icsContent += 'BEGIN:VEVENT\r\n'
      icsContent += `UID:${event.uid}\r\n`
      icsContent += `DTSTAMP:${formatICSDateTime(new Date())}\r\n`
      icsContent += `DTSTART;TZID=${timezone}:${formatICSDateTime(event.startDate)}\r\n`
      icsContent += `DTEND;TZID=${timezone}:${formatICSDateTime(event.endDate)}\r\n`
      icsContent += `SUMMARY:${escapeICSText(event.title)}\r\n`
      icsContent += `DESCRIPTION:${escapeICSText(event.description)}\r\n`
      
      if (event.location) {
        icsContent += `LOCATION:${escapeICSText(event.location)}\r\n`
      }
      
      if (event.categories && event.categories.length > 0) {
        icsContent += `CATEGORIES:${event.categories.map(escapeICSText).join(',')}\r\n`
      }
      
      if (event.organizer) {
        icsContent += `ORGANIZER;CN=${escapeICSText(event.organizer)}:MAILTO:info@mingcarehome.com\r\n`
      }

      icsContent += 'STATUS:CONFIRMED\r\n'
      icsContent += 'TRANSP:OPAQUE\r\n'
      icsContent += 'END:VEVENT\r\n'
    })

    icsContent += 'END:VCALENDAR\r\n'

    // 生成檔案名稱
    const dateRange = options.filters.dateRange
    const filename = `mingcare_schedule_${dateRange.start}_${dateRange.end}.ics`

    return {
      success: true,
      data: icsContent,
      filename
    }

  } catch (error) {
    console.error('ICS 導出錯誤:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ICS 導出失敗'
    }
  }
}

// =============================================================================
// Google Calendar 導出
// =============================================================================

/**
 * 導出到 Google Calendar
 */
async function exportToGoogleCalendar(events: CalendarEvent[], options: CalendarExportOptions): Promise<CalendarExportResult> {
  try {
    // 建立 Google Calendar URL
    if (events.length === 0) {
      return {
        success: false,
        error: '沒有事件可導出'
      }
    }

    // 對於多個事件，我們可以:
    // 1. 生成 ICS 文件並提示用戶匯入 Google Calendar
    // 2. 生成 Google Calendar 連結讓用戶逐一添加
    
    const icsResult = await exportToICS(events, options)
    if (!icsResult.success) {
      return icsResult
    }

    // 提供 ICS 文件和 Google Calendar 匯入說明
    return {
      success: true,
      data: icsResult.data,
      filename: icsResult.filename?.replace('.ics', '_google.ics'),
    }

  } catch (error) {
    console.error('Google Calendar 導出錯誤:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google Calendar 導出失敗'
    }
  }
}

// =============================================================================
// Outlook 導出
// =============================================================================

/**
 * 導出到 Outlook
 */
async function exportToOutlook(events: CalendarEvent[], options: CalendarExportOptions): Promise<CalendarExportResult> {
  try {
    // Outlook 也支援 ICS 格式
    const icsResult = await exportToICS(events, options)
    if (!icsResult.success) {
      return icsResult
    }

    return {
      success: true,
      data: icsResult.data,
      filename: icsResult.filename?.replace('.ics', '_outlook.ics'),
    }

  } catch (error) {
    console.error('Outlook 導出錯誤:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Outlook 導出失敗'
    }
  }
}

// =============================================================================
// PDF 導出
// =============================================================================

function exportToPDF(
  events: CalendarEvent[],
  records: BillingSalaryRecord[],
  options: CalendarExportOptions
): CalendarExportResult {
  try {
    const sortedRecords = [...records].sort((a, b) => {
      const dateDiff = new Date(a.service_date).getTime() - new Date(b.service_date).getTime()
      if (dateDiff !== 0) return dateDiff
      const startA = (a.start_time || '').localeCompare(b.start_time || '')
      if (startA !== 0) return startA
      return (a.customer_name || '').localeCompare(b.customer_name || '')
    })

    const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
    })

    const timeFormatter = (time?: string) => {
      if (!time) return '—'
      const [hour, minute] = time.split(':')
      return `${hour}:${minute}`
    }

    const filters = options.filters
    const rangeLabel = filters.dateRange?.start && filters.dateRange?.end
      ? `${filters.dateRange.start} 至 ${filters.dateRange.end}`
      : '未指定日期範圍'

    const monthLabel = (() => {
      if (!filters.dateRange?.start) return '未指定月份'
      const date = new Date(filters.dateRange.start)
      if (Number.isNaN(date.getTime())) return '未指定月份'
      return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`
    })()

    const uniqueCustomers = Array.from(
      new Set(sortedRecords.map(record => record.customer_name).filter((name): name is string => Boolean(name)))
    )

    const customerLabel = uniqueCustomers.length === 0
      ? '全部客戶'
      : uniqueCustomers.length === 1
        ? uniqueCustomers[0]
        : `${uniqueCustomers[0]} 等 ${uniqueCustomers.length} 位客戶`

    const totalHours = sortedRecords.reduce((sum, record) => sum + (record.service_hours || 0), 0)

    const recordsByDate = sortedRecords.reduce<Record<string, BillingSalaryRecord[]>>((acc, record) => {
      const key = record.service_date
      acc[key] = acc[key] || []
      acc[key].push(record)
      return acc
    }, {})

    const dateSections = Object.entries(recordsByDate)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, dayRecords]) => {
        const formattedDate = dateFormatter.format(new Date(date))
        const rows = dayRecords.map(record => {
          return `
            <tr>
              <td>${escapeHtml(formattedDate)}</td>
              <td>${escapeHtml(`${timeFormatter(record.start_time)} ~ ${timeFormatter(record.end_time)}`)}</td>
              <td>${escapeHtml(record.customer_name || '—')}</td>
              <td>${escapeHtml(record.service_type || '—')}</td>
              <td>${escapeHtml(record.care_staff_name || '—')}</td>
              <td>${escapeHtml(record.project_category || '—')}</td>
              <td>${escapeHtml(record.service_address || '—')}</td>
              <td class="number">${record.service_hours ? record.service_hours.toFixed(1) : '—'}</td>
              <td>${escapeHtml(record.project_manager || '—')}</td>
            </tr>
          `
        }).join('')

        return `
          <h2 class="date-heading">${escapeHtml(formattedDate)}</h2>
          <table class="schedule-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>時間</th>
                <th>客戶</th>
                <th>服務類型</th>
                <th>護理人員</th>
                <th>所屬項目</th>
                <th>服務地址</th>
                <th>服務時數</th>
                <th>項目經理</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        `
      }).join('\n')

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh-HK">
      <head>
        <meta charset="UTF-8" />
        <title>MingCare 排班日曆</title>
        <style>
          :root {
            color-scheme: light;
          }
          body {
            font-family: "PingFang TC", "Microsoft JhengHei", "SimSun", sans-serif;
            margin: 0;
            padding: 24px;
            background: #f8fafc;
            color: #1f2933;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 24px;
          }
          .header-main h1 {
            margin: 0;
            font-size: 26px;
            color: #0f172a;
          }
          .header-sub {
            margin: 6px 0 0;
            font-size: 16px;
            color: #475569;
            letter-spacing: 0.08em;
          }
          .header-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            min-width: 240px;
          }
          .info-item {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 14px;
          }
          .info-label {
            display: block;
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
          }
          .info-value {
            display: block;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            word-break: break-word;
          }
          h1 {
            margin: 0 0 4px 0;
            font-size: 24px;
          }
          h2.date-heading {
            margin: 32px 0 12px;
            font-size: 18px;
            color: #2563eb;
            border-left: 4px solid #2563eb;
            padding-left: 12px;
          }
          .summary {
            margin-bottom: 24px;
            padding: 16px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
          }
          .summary-item {
            min-width: 160px;
          }
          .summary-label {
            display: block;
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .summary-value {
            font-size: 18px;
            font-weight: 600;
          }
          table.schedule-table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          }
          table.schedule-table th,
          table.schedule-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
            vertical-align: top;
          }
          table.schedule-table th {
            background: #f1f5f9;
            text-align: left;
            font-weight: 600;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          table.schedule-table tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          table.schedule-table tbody tr:hover {
            background: #f1f5f9;
          }
          td.number {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }
          .footer-note {
            margin-top: 40px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
          }
          @media print {
            body {
              background: transparent;
              padding: 0 16px;
            }
            table.schedule-table {
              box-shadow: none;
            }
            h2.date-heading {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <header class="header">
          <div class="header-main">
            <h1>明家居家護理服務</h1>
            <p class="header-sub">排班月曆報表</p>
          </div>
          <div class="header-info">
            <div class="info-item">
              <span class="info-label">月份</span>
              <span class="info-value">${escapeHtml(monthLabel)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">客戶</span>
              <span class="info-value">${escapeHtml(customerLabel)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">日期範圍</span>
              <span class="info-value">${escapeHtml(rangeLabel)}</span>
            </div>
            ${filters.careStaffName ? `
              <div class="info-item">
                <span class="info-label">護理人員</span>
                <span class="info-value">${escapeHtml(filters.careStaffName)}</span>
              </div>
            ` : ''}
          </div>
        </header>
        <section class="summary">
          <div class="summary-item">
            <span class="summary-label">排班數量</span>
            <span class="summary-value">${events.length}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">總服務時數</span>
            <span class="summary-value">${totalHours.toFixed(1)} 小時</span>
          </div>
          ${filters.careStaffName ? `
            <div class="summary-item">
              <span class="summary-label">護理人員</span>
              <span class="summary-value">${escapeHtml(filters.careStaffName)}</span>
            </div>
          ` : ''}
          ${filters.projectCategory ? `
            <div class="summary-item">
              <span class="summary-label">所屬項目</span>
              <span class="summary-value">${Array.isArray(filters.projectCategory)
                ? filters.projectCategory.map(escapeHtml).join(', ')
                : escapeHtml(filters.projectCategory)}</span>
            </div>
          ` : ''}
        </section>
        ${dateSections || '<p>沒有排班資料。</p>'}
        <p class="footer-note">此文件由 MingCare Intranet 於 ${escapeHtml(new Date().toLocaleString('zh-TW'))} 生成。列印或另存為 PDF 以與團隊分享。</p>
      </body>
      </html>
    `

    return {
      success: true,
      data: htmlContent,
      filename: `mingcare_schedule_${options.filters.dateRange?.start || 'start'}_${options.filters.dateRange?.end || 'end'}.pdf`
    }
  } catch (error) {
    console.error('PDF 導出錯誤:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF 導出失敗'
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// =============================================================================
// 輔助函數
// =============================================================================

/**
 * 格式化 ICS 日期時間
 */
function formatICSDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * 逸出 ICS 文字
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

// =============================================================================
// 快速導出功能
// =============================================================================

/**
 * 快速導出當月排班為 ICS
 */
export async function exportCurrentMonthSchedule(): Promise<CalendarExportResult> {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const filters: BillingSalaryFilters = {
    dateRange: {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    }
  }

  return exportCalendar({
    format: 'ics',
    filters,
    includeStaffDetails: true,
    includeCustomerDetails: false,
    timezone: 'Asia/Hong_Kong'
  })
}

/**
 * 快速導出指定護理員的排班
 */
export async function exportStaffSchedule(
  staffName: string,
  startDate: string,
  endDate: string
): Promise<CalendarExportResult> {
  const filters: BillingSalaryFilters = {
    dateRange: { start: startDate, end: endDate },
    careStaffName: staffName
  }

  return exportCalendar({
    format: 'ics',
    filters,
    includeStaffDetails: true,
    includeCustomerDetails: true,
    timezone: 'Asia/Hong_Kong'
  })
}
