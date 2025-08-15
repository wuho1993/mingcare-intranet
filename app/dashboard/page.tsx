'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface User {
  id: string
  email?: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  const navigationItems = [
    {
      title: '客戶管理中心',
      description: '管理所有客戶資料、聯絡信息及服務記錄',
      href: '/clients',
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      title: '護理服務管理',
      description: '安排護理服務、管理服務排程及記錄',
      href: '/services',
      icon: '🏥',
      color: 'bg-green-500'
    },
    {
      title: '護理人員管理',
      description: '管理護理人員資料、排班及績效',
      href: '/care-staff',
      icon: '👩‍⚕️',
      color: 'bg-purple-500'
    },
    {
      title: '護理人員工資計算',
      description: '計算護理人員薪資、津貼及加班費',
      href: '/payroll',
      icon: '💰',
      color: 'bg-yellow-500'
    },
    {
      title: '佣金計算',
      description: '計算業務佣金、獎金及績效獎勵',
      href: '/commissions',
      icon: '📊',
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-bg-secondary font-apple">
      {/* Apple Style Navigation */}
      <nav className="nav-apple bg-white/80 backdrop-blur-xl border-b border-border-light sticky top-0 z-50">
        <div className="container-apple py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-mingcare-blue rounded-apple-xs flex items-center justify-center">
                <span className="text-white font-bold text-sm">明</span>
              </div>
              <div>
                <h1 className="text-apple-heading text-text-primary">明家居家護理服務</h1>
                <p className="text-xs text-text-secondary">Intranet 管理系統</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-apple-caption text-text-secondary">歡迎，{user?.email}</span>
              <button
                onClick={handleLogout}
                className="btn-apple-secondary text-sm"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container-apple py-8">
        {/* Hero Section */}
        <div className="card-apple mb-8 fade-in-apple">
          <div className="card-apple-content">
            <div className="text-center py-12">
              <h1 className="text-apple-title text-text-primary mb-4">
                歡迎使用明家護理管理系統
              </h1>
              <p className="text-apple-body text-text-secondary max-w-2xl mx-auto">
                全面的居家護理服務管理平台，提供客戶管理、護理人員調度、服務記錄等完整功能，
                讓您的護理服務更加專業高效。
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationItems.map((item, index) => (
            <div 
              key={item.href}
              onClick={() => router.push(item.href)}
              className="card-apple group cursor-pointer fade-in-apple"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="card-apple-content">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 ${item.color.replace('bg-', 'bg-').replace('-500', '-100')} rounded-apple-sm flex items-center justify-center group-hover:${item.color} group-hover:text-white transition-all duration-200`}>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-apple-heading text-text-primary mb-1">{item.title}</h3>
                    <p className="text-apple-caption text-text-secondary">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center text-mingcare-blue group-hover:text-mingcare-blue-hover transition-colors">
                  <span className="text-sm font-medium">進入模組</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-apple-caption text-text-tertiary">
            © 2025 明家居家護理服務有限公司 · 專業護理 · 貼心服務
          </p>
        </div>
      </main>
    </div>
  )
}
