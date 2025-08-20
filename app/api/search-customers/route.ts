import { NextRequest, NextResponse } from 'next/server'
import { searchCustomers } from '../../../services/billing-salary-management'

export async function POST(req: NextRequest) {
  try {
    const { searchTerm } = await req.json()
    
    if (!searchTerm || typeof searchTerm !== 'string') {
      return NextResponse.json(
        { success: false, error: '搜尋關鍵字無效' },
        { status: 400 }
      )
    }

    const result = await searchCustomers(searchTerm)
    return NextResponse.json(result)
  } catch (error) {
    console.error('客戶搜尋 API 錯誤:', error)
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
