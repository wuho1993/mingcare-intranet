import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { searchTerm } = await req.json()
    
    if (!searchTerm || typeof searchTerm !== 'string') {
      return NextResponse.json(
        { success: false, error: '搜尋關鍵字無效' },
        { status: 400 }
      )
    }

    if (searchTerm.trim().length < 1) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // 直接查詢 customer_personal_data 資料表
    const { data, error } = await supabase
      .from('customer_personal_data')
      .select('customer_id, customer_name, phone, service_address')
      .or(`customer_name.ilike.%${searchTerm.trim()}%,phone.ilike.%${searchTerm.trim()}%,customer_id.ilike.%${searchTerm.trim()}%`)
      .limit(10)

    if (error) {
      console.error('搜尋客戶錯誤:', error)
      return NextResponse.json(
        { success: false, error: `資料庫錯誤: ${error.message}` },
        { status: 500 }
      )
    }

    const results = (data || []).map(item => ({
      customer_id: item.customer_id || '',
      customer_name: item.customer_name || '',
      phone: item.phone || '',
      service_address: item.service_address || ''
    }))

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('客戶搜尋 API 錯誤:', error)
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
