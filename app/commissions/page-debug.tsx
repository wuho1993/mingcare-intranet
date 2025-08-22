'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function CommissionsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const router = useRouter()

  const addDebugInfo = (info: string) => {
    console.log(info)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        addDebugInfo('開始獲取用戶...')
        const { data: { user }, error } = await supabase.auth.getUser()
        addDebugInfo(`用戶數據: ${user ? user.email : '無用戶'}, 錯誤: ${error ? error.message : '無錯誤'}`)
        
        if (user) {
          setUser(user)
          addDebugInfo('設置用戶成功')
          await testDatabaseConnection()
        } else {
          addDebugInfo('沒有用戶，重定向到首頁')
          router.push('/')
        }
      } catch (err: any) {
        addDebugInfo(`用戶獲取錯誤: ${err.message}`)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  const testDatabaseConnection = async () => {
    try {
      addDebugInfo('測試客戶數據表格...')
      const { data: customerData, error: customerError } = await supabase
        .from('customer_personal_data')
        .select('customer_id, customer_name')
        .limit(5)
      
      addDebugInfo(`客戶數據: ${customerData?.length || 0} 筆, 錯誤: ${customerError ? customerError.message : '無錯誤'}`)

      addDebugInfo('測試服務數據表格...')
      const { data: billingData, error: billingError } = await supabase
        .from('billing_salary_data')
        .select('customer_id, service_date')
        .limit(5)
      
      addDebugInfo(`服務數據: ${billingData?.length || 0} 筆, 錯誤: ${billingError ? billingError.message : '無錯誤'}`)

      addDebugInfo('測試佣金率表格...')
      const { data: commissionRates, error: commissionError } = await supabase
        .from('commission_rate_introducer')
        .select('*')
      
      addDebugInfo(`佣金率數據: ${commissionRates?.length || 0} 筆, 錯誤: ${commissionError ? commissionError.message : '無錯誤'}`)

    } catch (err: any) {
      addDebugInfo(`數據庫測試錯誤: ${err.message}`)
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 mt-4">載入佣金數據中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">佣金計算 - 調試模式</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">錯誤:</h3>
            <p>{error}</p>
          </div>
        )}

        {user && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">用戶已登入:</h3>
            <p>Email: {user.email}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">調試信息:</h2>
          <div className="space-y-2">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                {info}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
