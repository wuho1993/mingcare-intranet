'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { BackToHomeButton } from '../../components/BackToHomeButton'

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
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-apple-title text-text-primary mb-2">薪資管理</h1>
              <p className="text-apple-body text-text-secondary">管理員工薪資、計算工時、生成薪資報表</p>
            </div>
            <BackToHomeButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="card-apple">
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h2 className="text-apple-title text-text-primary mb-2">薪資管理系統</h2>
              <p className="text-apple-body text-text-secondary">這個模組將在後續版本開發</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 border border-border-light rounded-xl">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg mb-3 mx-auto flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-apple-subheading text-text-primary mb-2">工時計算</h3>
                <p className="text-apple-caption text-text-secondary">自動計算員工工時和加班費</p>
              </div>
              
              <div className="p-6 border border-border-light rounded-xl">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg mb-3 mx-auto flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-apple-subheading text-text-primary mb-2">薪資結算</h3>
                <p className="text-apple-caption text-text-secondary">月度薪資計算和發放管理</p>
              </div>
              
              <div className="p-6 border border-border-light rounded-xl">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg mb-3 mx-auto flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-apple-subheading text-text-primary mb-2">薪資報表</h3>
                <p className="text-apple-caption text-text-secondary">生成詳細的薪資分析報表</p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-yellow-800 font-medium">開發說明</h4>
              </div>
              <p className="text-yellow-700 text-sm">
                薪資管理模組將包含：工時記錄、薪資計算、報表生成、員工管理等功能。
                目前護理服務管理的功能已正確移動到「護理服務管理」頁面。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
