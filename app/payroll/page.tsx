'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function PayrollPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
          <p className="text-apple-body text-text-secondary mt-4">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-apple-title text-text-primary mb-2">護理人員工資計算</h1>
              <p className="text-apple-body text-text-secondary">計算護理人員薪資、津貼及加班費</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-apple-secondary"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回主頁
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.1s' }}>
          <div className="card-apple-content text-center py-24">
            <div className="mx-auto w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-apple-heading text-text-primary mb-3">工資計算功能</h3>
            <p className="text-apple-body text-text-secondary mb-8 max-w-md mx-auto">此功能將連接 Supabase 數據庫來計算護理人員工資</p>
            <div className="inline-flex items-center px-4 py-2 bg-bg-tertiary rounded-apple-sm">
              <svg className="h-4 w-4 text-text-tertiary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-apple-caption text-text-tertiary">等待數據庫結構信息以完成開發</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
