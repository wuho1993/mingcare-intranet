'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function CommissionsPage() {
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
              <h1 className="text-apple-title text-text-primary mb-2">佣金計算</h1>
              <p className="text-apple-body text-text-secondary">計算業務佣金、獎金及績效獎勵</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-apple-heading text-text-primary mb-3">佣金計算功能</h3>
            <p className="text-apple-body text-text-secondary mb-8 max-w-md mx-auto">此功能將連接 Supabase 數據庫來計算業務佣金</p>
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
