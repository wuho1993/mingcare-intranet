'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'
import { getAssetPath } from '../../utils/asset-path'

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
    try {
      await supabase.auth.signOut()
      
      // 提供選項清除記憶的登入信息
      const shouldClearRemembered = confirm('是否清除記憶的登入信息？')
      if (shouldClearRemembered) {
        localStorage.removeItem('mingcare_email')
        localStorage.removeItem('mingcare_password')
        localStorage.removeItem('mingcare_remember')
      }
      
      router.push('/')
    } catch (error) {
      console.error('登出錯誤:', error)
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  const navigationItems = [
    {
      title: '客戶管理中心',
      description: '管理客戶資料、聯絡信息及服務記錄',
      href: '/clients',
      iconType: 'users',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600'
    },
    {
      title: '護理服務管理',
      description: '安排護理服務、管理服務排程及記錄',
      href: '/services',
      iconType: 'medical',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      textColor: 'text-emerald-600'
    },
    {
      title: '護理人員管理',
      description: '管理護理人員資料、排班及績效',
      href: '/care-staff',
      iconType: 'staff',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-600'
    },
    {
      title: '佣金計算',
      description: '計算業務佣金、獎金及績效獎勵',
      href: '/commissions',
      iconType: 'chart',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-600'
    },
    {
      title: '員工打卡記錄',
      description: '查看員工打卡記錄、位置及客戶狀態',
      href: '/clock-records',
      iconType: 'clockRecord',
      gradient: 'from-pink-500 to-pink-600',
      bgGradient: 'from-pink-50 to-pink-100',
      textColor: 'text-pink-600'
    },
    {
      title: '應用程式通知訊息',
      description: '管理系統通知、提醒及公告訊息',
      href: '/notifications',
      iconType: 'notification',
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      textColor: 'text-indigo-600'
    }
  ]

  const quickActions = [
    {
      title: '新增客戶',
      description: '快速新增客戶資料',
      href: '/clients/new',
      iconType: 'plus',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: '今日排程',
      description: '查看今日服務安排',
      href: '/services?tab=reports&date=today',
      iconType: 'calendar',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      title: '員工排班',
      description: '管理護理人員排班',
      href: '/services?tab=schedule',
      iconType: 'clock',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: '財務報表',
      description: '查看業務概覽與財務統計',
      href: '/services?tab=overview',
      iconType: 'trending',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ]

  const getIcon = (type: string) => {
    const iconClass = "w-6 h-6"
    
    switch (type) {
      case 'users':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        )
      case 'medical':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        )
      case 'staff':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      case 'chart':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'plus':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
      case 'calendar':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'clock':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'trending':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'clockRecord':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      case 'notification':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple sticky top-0 z-50 h-16 sm:h-20">
        <div className="px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-40 h-40 sm:w-40 sm:h-40 lg:w-48 lg:h-48 -my-10 sm:-my-10 lg:-my-14">
                <Image 
                  src={getAssetPath("images/mingcare-logo.png")}
                  alt="明家護理服務" 
                  width={1024}
                  height={1024}
                  className="w-full h-full object-contain"
                  priority
                  quality={100}
                  unoptimized
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm text-gray-500">歡迎回來</p>
                <p className="font-medium text-gray-900 text-sm">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:scale-105 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">登出</span>
                <span className="sm:hidden">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 主要模組 */}
        <div className="card-apple p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 fade-in-apple hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">主要模組</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {navigationItems.map((item, index) => (
              <div 
                key={item.href}
                onClick={() => router.push(item.href)}
                className="group p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border-2 border-gray-100 hover:border-transparent cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] lg:hover:scale-105 lg:hover:-translate-y-2 relative overflow-hidden transform lg:hover:rotate-1 card-hover-float pulse-glow active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${item.bgGradient.replace('from-', '').replace(' to-', ', ')})`,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 lg:group-hover:scale-125 lg:group-hover:rotate-12 transition-all duration-300 icon-bounce ${item.textColor}`}>
                      {getIcon(item.iconType)}
                    </div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-gray-700 transition-colors duration-300 line-clamp-2">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed group-hover:text-gray-500 transition-colors duration-300 line-clamp-3">{item.description}</p>
                  
                  <div className={`flex items-center ${item.textColor} group-hover:translate-x-2 lg:group-hover:translate-x-4 transition-all duration-300`}>
                    <span className="font-semibold text-sm sm:text-base">進入模組</span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                
                {/* 裝飾性背景元素 */}
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-10 transform rotate-45 translate-x-12 sm:translate-x-16 -translate-y-12 sm:-translate-y-16 group-hover:scale-125 group-hover:opacity-20 transition-all duration-500">
                  <div className={`w-full h-full ${item.textColor.replace('text-', 'bg-')}`}></div>
                </div>
                
                {/* 閃爍效果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse transition-opacity duration-300 rounded-2xl sm:rounded-3xl"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="card-apple p-4 sm:p-6 lg:p-8 fade-in-apple" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">快速操作</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {quickActions.map((action, index) => (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className={`p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-gray-200 transition-all duration-300 text-left group hover:scale-[1.02] lg:hover:scale-105 hover:shadow-lg active:scale-95 ${action.bgColor}`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform shadow-md ${action.iconColor}`}>
                  {getIcon(action.iconType)}
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2">{action.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 hidden sm:block">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500">
            © 2025 明家居家護理服務有限公司 · 專業護理 · 貼心服務
          </p>
        </div>
      </main>
    </div>
  )
}
