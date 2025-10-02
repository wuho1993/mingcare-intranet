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
  format?: 'pdf'
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
    const format = options.format ?? 'pdf'
    console.log('🚀 開始導出日曆，格式:', format, '選項:', options)

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

    return exportToPDF(events, scheduleData.data, options)

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

    if (filters.selectedCustomerIds && filters.selectedCustomerIds.length > 0) {
      query = query.in('customer_id', filters.selectedCustomerIds)
    } else if (filters.searchTerm && filters.searchTerm.trim().length >= 2) {
      const searchTerm = filters.searchTerm.trim()
      query = query.or(
        `customer_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,customer_id.ilike.%${searchTerm}%`
      )
    }

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

    const timeFormatter = (time?: string) => {
      if (!time) return '—'
      const [hour, minute] = time.split(':')
      return `${hour}:${minute}`
    }

    const filters = options.filters
    const rangeLabel = filters.dateRange?.start && filters.dateRange?.end
      ? `${filters.dateRange.start} 至 ${filters.dateRange.end}`
      : '未指定日期範圍'

    const monthReference = (() => {
      if (filters.dateRange?.start) {
        const date = new Date(filters.dateRange.start)
        if (!Number.isNaN(date.getTime())) return date
      }
      if (sortedRecords.length > 0) {
        const date = new Date(sortedRecords[0].service_date)
        if (!Number.isNaN(date.getTime())) return date
      }
      return new Date()
    })()

    const monthLabel = `${monthReference.getFullYear()}年${String(monthReference.getMonth() + 1).padStart(2, '0')}月`

    const uniqueCustomers = Array.from(
      new Set(sortedRecords.map(record => record.customer_name).filter((name): name is string => Boolean(name)))
    )

    const customerLabel = uniqueCustomers.length === 0
      ? '全部客戶'
      : uniqueCustomers.length === 1
        ? uniqueCustomers[0]
        : `${uniqueCustomers[0]} 等 ${uniqueCustomers.length} 位客戶`

    const primaryRecord = sortedRecords.find(record => record.customer_name) || sortedRecords[0]
    const primaryCustomerName = primaryRecord?.customer_name || '全部客戶'
    const primaryCustomerId = primaryRecord?.customer_id || '無編號'

    const totalHours = sortedRecords.reduce((sum, record) => sum + (record.service_hours || 0), 0)

    const formatDateKey = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const recordsByDate = sortedRecords.reduce<Record<string, BillingSalaryRecord[]>>((acc, record) => {
      const key = record.service_date
      acc[key] = acc[key] || []
      acc[key].push(record)
      return acc
    }, {})

    const year = monthReference.getFullYear()
    const month = monthReference.getMonth()
    const defaultRangeStart = new Date(year, month, 1)
    const defaultRangeEnd = new Date(year, month + 1, 0)
    const rangeStart = filters.dateRange?.start ? parseISODate(filters.dateRange.start) : defaultRangeStart
    const rangeEnd = filters.dateRange?.end ? parseISODate(filters.dateRange.end) : defaultRangeEnd

    const calendarStart = new Date(rangeStart)
    calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay())
    const calendarEnd = new Date(rangeEnd)
    const endOffset = 6 - calendarEnd.getDay()
    calendarEnd.setDate(calendarEnd.getDate() + (endOffset >= 0 ? endOffset : 0))

    const dayMillis = 24 * 60 * 60 * 1000
    const calendarDays: Date[] = []
    for (let time = calendarStart.getTime(); time <= calendarEnd.getTime(); time += dayMillis) {
      calendarDays.push(new Date(time))
    }

    const rangeStartTime = rangeStart.getTime()
    const rangeEndTime = rangeEnd.getTime()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekCount = Math.ceil(calendarDays.length / 7)
    const todayKey = formatDateKey(new Date())

    const calendarRows: string[] = []
    for (let week = 0; week < weekCount; week++) {
      const cells = calendarDays.slice(week * 7, week * 7 + 7).map(date => {
        const dayKey = formatDateKey(date)
        const dayRecords = recordsByDate[dayKey] || []
        const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year
        const isWithinRange = date.getTime() >= rangeStartTime && date.getTime() <= rangeEndTime
        const classes = ['calendar-cell']
        if (!isCurrentMonth) classes.push('other-month')
        if (!isWithinRange) classes.push('out-of-range')
        if (dayKey === todayKey) classes.push('today')
        if (date.getDay() === 0 || date.getDay() === 6) classes.push('weekend')

        const densityClass = isWithinRange && dayRecords.length >= 5
          ? 'density-high'
          : isWithinRange && dayRecords.length >= 3
            ? 'density-medium'
            : 'density-low'

        const eventsHtml = isWithinRange && dayRecords.length > 0
          ? dayRecords.map(record => {
              const timeRange = `${timeFormatter(record.start_time)}${record.end_time ? ` - ${timeFormatter(record.end_time)}` : ''}`
              const metaParts: string[] = []
              if (record.care_staff_name) metaParts.push(escapeHtml(record.care_staff_name))
              if (record.service_type) {
                metaParts.push(escapeHtml(record.service_type))
              }
              if (record.service_hours) metaParts.push(`${record.service_hours.toFixed(1)} 小時`)
              const metaLine = metaParts.length > 0 ? `<div class="event-meta">${metaParts.join(' · ')}</div>` : ''
              const locationLine = record.service_address ? `<div class="event-location">${escapeHtml(record.service_address)}</div>` : ''
              return `
                <div class="event">
                  <div class="event-time">${escapeHtml(timeRange)}</div>
                  <div class="event-title">${escapeHtml(record.customer_name || '未指定客戶')}</div>
                  ${metaLine}
                  ${locationLine}
                </div>
              `
            }).join('')
          : isWithinRange
            ? '<div class="no-events">無排班</div>'
            : ''

        return `
          <td class="${classes.join(' ')}">
            <div class="day-number">${date.getDate()}</div>
            <div class="events ${densityClass}">${eventsHtml}</div>
          </td>
        `
      })
      calendarRows.push(`<tr>${cells.join('')}</tr>`)
    }

    const calendarTable = `
      <table class="calendar-grid">
        <thead>
          <tr>${weekdays.map(weekDay => `<th>${weekDay}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${calendarRows.join('\n')}
        </tbody>
      </table>
    `

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh-HK">
      <head>
        <meta charset="UTF-8" />
        <title>MingCare 排班日曆</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
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
          .download-button {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            border: none;
            color: #fff;
            padding: 10px 18px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .download-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 16px 32px rgba(29, 78, 216, 0.3);
          }
          .download-button:active {
            transform: translateY(0);
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
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
          .calendar-grid {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
            page-break-inside: avoid;
          }
          .calendar-grid th {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #fff;
            padding: 12px 8px;
            font-weight: 600;
            text-align: center;
            font-size: 13px;
            letter-spacing: 0.12em;
          }
          .calendar-grid td {
            width: 14.285%;
            min-height: 150px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
            padding: 10px;
            position: relative;
            background: #fff;
            transition: background 0.2s ease;
          }
          .calendar-cell.other-month {
            background: #f8fafc;
            color: #94a3b8;
          }
          .calendar-cell.out-of-range {
            background: #f1f5f9;
            color: #cbd5f5;
          }
          .calendar-cell.out-of-range .day-number {
            color: #cbd5f5;
          }
          .calendar-cell.weekend {
            background: #fff7ed;
          }
          .calendar-cell.weekend.other-month {
            background: #fff1e6;
          }
          .calendar-cell.today {
            box-shadow: inset 0 0 0 2px #2563eb;
            background: #eff6ff;
          }
          .day-number {
            font-weight: 700;
            font-size: 16px;
            color: #0f172a;
            margin-bottom: 8px;
          }
          .calendar-cell.other-month .day-number {
            color: #94a3b8;
          }
          .events {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .events.density-medium {
            gap: 6px;
          }
          .events.density-high {
            gap: 4px;
          }
          .event {
            border-left: 3px solid #2563eb;
            background: #eef2ff;
            padding: 6px 8px;
            border-radius: 10px;
            box-shadow: 0 10px 18px rgba(37, 99, 235, 0.15);
          }
          .events.density-medium .event {
            padding: 5px 7px;
            border-radius: 8px;
          }
          .events.density-high .event {
            padding: 4px 6px;
            border-radius: 6px;
          }
          .calendar-cell.weekend .event {
            border-left-color: #db2777;
            background: #fce7f3;
          }
          .calendar-cell.today .event {
            border-left-color: #1d4ed8;
          }
          .event-time {
            font-size: 11px;
            color: #1d4ed8;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .events.density-medium .event-time,
          .events.density-medium .event-meta,
          .events.density-medium .event-location {
            font-size: 10.5px;
          }
          .events.density-medium .event-title {
            font-size: 12.5px;
          }
          .events.density-high .event-time,
          .events.density-high .event-meta,
          .events.density-high .event-location {
            font-size: 9.5px;
          }
          .events.density-high .event-title {
            font-size: 11.5px;
          }
          .event-title {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            margin-top: 2px;
          }
          .event-meta {
            font-size: 11px;
            color: #475569;
            margin-top: 2px;
          }
          .event-location {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
            word-break: break-word;
          }
          .no-events {
            font-size: 11px;
            color: #94a3b8;
            font-style: italic;
          }
          .calendar-cell.out-of-range .events {
            display: none;
          }
          .footer-note {
            margin-top: 32px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
          }
          @media print {
            html, body {
              width: 297mm;
              height: 210mm;
              font-size: 12px;
            }
            body {
              background: transparent;
              padding: 6mm 8mm;
            }
            .download-button {
              display: none;
            }
            .header {
              gap: 12px;
            }
            .header-main h1 {
              font-size: 20px;
            }
            .header-sub {
              font-size: 14px;
            }
            .header-info {
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 8px;
            }
            .calendar-grid {
              box-shadow: none;
              border: 1px solid #cbd5f5;
              font-size: 11px;
              page-break-inside: avoid;
            }
            .calendar-grid tr,
            .calendar-grid td {
              page-break-inside: avoid;
            }
            .calendar-grid th {
              background: #1e3a8a;
              -webkit-print-color-adjust: exact;
              padding: 8px 6px;
              font-size: 12px;
            }
            .calendar-cell.weekend {
              background: #fff0f6 !important;
            }
            .calendar-cell.other-month {
              background: #f5f5f5 !important;
            }
            .calendar-cell.out-of-range {
              background: #f8fafc !important;
              color: #d1d5db !important;
            }
            .calendar-cell.out-of-range .day-number {
              color: #d1d5db !important;
            }
            .calendar-grid td {
              min-height: 110px;
              padding: 6px;
            }
            .event {
              border-left-width: 2px;
              padding: 4px 6px;
            }
            .events.density-medium {
              gap: 4px;
            }
            .events.density-high {
              gap: 3px;
            }
            .events.density-medium .event {
              padding: 3px 5px;
            }
            .events.density-high .event {
              padding: 2px 4px;
            }
            .event-time,
            .event-meta,
            .event-location {
              font-size: 10px;
            }
            .events.density-medium .event-time,
            .events.density-medium .event-meta,
            .events.density-medium .event-location {
              font-size: 9.5px;
            }
            .events.density-high .event-time,
            .events.density-high .event-meta,
            .events.density-high .event-location {
              font-size: 9px;
            }
            .event-title {
              font-size: 11px;
            }
            .events.density-medium .event-title {
              font-size: 10.5px;
            }
            .events.density-high .event-title {
              font-size: 10px;
            }
            .event {
              box-shadow: none;
            }
            .calendar-cell.out-of-range .events {
              display: none;
            }
            .footer-note {
              margin-top: 16px;
              font-size: 11px;
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
          <button class="download-button" onclick="window.print()">下載 PDF</button>
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
            <div class="info-item">
              <span class="info-label">排班數量</span>
              <span class="info-value">${events.length}</span>
            </div>
            <div class="info-item">
              <span class="info-label">總服務時數</span>
              <span class="info-value">${totalHours.toFixed(1)} 小時</span>
            </div>
            <div class="info-item">
              <span class="info-label">服務客戶</span>
              <span class="info-value">${uniqueCustomers.length ? `${uniqueCustomers.length} 位` : '0 位'}</span>
            </div>
          </div>
        </header>
        ${calendarTable}
        <p class="footer-note">此文件由 MingCare Intranet 於 ${escapeHtml(new Date().toLocaleString('zh-TW'))} 生成。使用瀏覽器「列印」功能即可匯出為 PDF 並分享。</p>
      </body>
      </html>
    `

    const filenameBase = `${sanitizeForFilename(primaryCustomerName)}${sanitizeForFilename(monthLabel)}更表-${sanitizeForFilename(primaryCustomerId)}-明家居家護理服務.pdf`

    return {
      success: true,
      data: htmlContent,
      filename: filenameBase
    }
  } catch (error) {
    console.error('PDF 導出錯誤:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF 導出失敗'
    }
  }
}

// =============================================================================
// 輔助函數
// =============================================================================

function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeForFilename(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 100)
}
