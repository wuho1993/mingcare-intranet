import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Debug logging
    console.log('API received data:', JSON.stringify(body, null, 2))
    
    const {
      customer_id,
      care_staff_name,
      service_date,
      start_time,
      end_time,
      service_type,
      service_address,
      hourly_rate,
      service_fee,
      staff_salary,
      phone,
      customer_name,
      service_hours,
      hourly_salary,
      project_category,
      project_manager,
      // Legacy field names for backward compatibility
      date,
      staff_name,
      start_time1,
      end_time1,
      start_time2,
      end_time2
    } = body

    // Use the correct field names based on what's being sent
    const finalData = {
      service_date: service_date || date,
      care_staff_name: care_staff_name || staff_name,
      start_time: start_time || start_time1,
      end_time: end_time || end_time1,
      staff_salary: staff_salary,
      phone: phone,
      customer_name: customer_name,
      service_hours: service_hours,
      hourly_salary: hourly_salary || hourly_rate,
      project_category: project_category,
      project_manager: project_manager,
      // Additional fields from the new structure
      customer_id: customer_id,
      service_type: service_type,
      service_address: service_address,
      service_fee: service_fee,
      hourly_rate: hourly_rate
    }

    console.log('Final data after mapping:', JSON.stringify(finalData, null, 2))

    // Validate required fields
    if (!finalData.service_date || !finalData.care_staff_name || !finalData.customer_name) {
      const missingFields = []
      if (!finalData.service_date) missingFields.push('服務日期')
      if (!finalData.care_staff_name) missingFields.push('護理人員姓名')
      if (!finalData.customer_name) missingFields.push('客戶姓名')
      
      console.log('Missing required fields:', { 
        service_date: finalData.service_date, 
        care_staff_name: finalData.care_staff_name, 
        customer_name: finalData.customer_name 
      })
      console.log('Source fields:', { 
        service_date, 
        care_staff_name, 
        customer_name 
      })
      return NextResponse.json(
        { success: false, error: `缺少必要欄位: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Insert into billing_salary_data table
    const { data, error } = await supabase
      .from('billing_salary_data')
      .insert(finalData)
      .select()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      })
      return NextResponse.json(
        { success: false, error: `資料庫錯誤: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
