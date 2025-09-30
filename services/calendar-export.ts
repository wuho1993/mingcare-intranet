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
  format: 'ics' | 'google' | 'outlook'
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

    if (filters.projectCategory) {
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