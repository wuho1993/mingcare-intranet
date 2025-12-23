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
  const [currentTime, setCurrentTime] = useState(new Date())
  const [greeting, setGreeting] = useState('')
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

  // 實時時鐘
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 問候語
  useEffect(() => {
    const hour = currentTime.getHours()
    if (hour < 12) setGreeting('早安')
    else if (hour < 18) setGreeting('午安')
    else setGreeting('晚安')
  }, [currentTime])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-white/60 text-sm">載入中...</p>
        </div>
      </div>
    )
  }

  const navigationItems = [
    {
      title: '客戶管理',
      subtitle: 'Customer Management',
      description: '管理客戶資料與服務記錄',
      href: '/clients',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: '#3b82f6',
      stats: { label: '活躍客戶', value: '—' }
    },
    {
      title: '護理服務',
      subtitle: 'Care Services',
      description: '服務排程與記錄管理',
      href: '/services',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      color: '#10b981',
      stats: { label: '本月服務', value: '—' }
    },
    {
      title: '護理人員',
      subtitle: 'Care Staff',
      description: '人員資料與排班管理',
      href: '/care-staff',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      color: '#8b5cf6',
      stats: { label: '在職人員', value: '—' }
    },
    {
      title: '佣金計算',
      subtitle: 'Commission',
      description: '佣金與績效獎勵計算',
      href: '/commissions',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      color: '#f59e0b',
      stats: { label: '本月佣金', value: '—' }
    },
    {
      title: '打卡記錄',
      subtitle: 'Clock Records',
      description: '員工出勤與位置記錄',
      href: '/clock-records',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#ec4899',
      stats: { label: '今日打卡', value: '—' }
    },
    {
      title: '系統通知',
      subtitle: 'Notifications',
      description: '通知與公告訊息管理',
      href: '/notifications',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
      color: '#6366f1',
      stats: { label: '未讀通知', value: '—' }
    }
  ]

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* 動態背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* 網格背景 */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        {/* 光暈效果 */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[200px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 sm:w-36 sm:h-36 -my-6">
                <Image 
                  src={getAssetPath("images/mingcare-logo.png")}
                  alt="明家護理服務" 
                  width={512}
                  height={512}
                  className="w-full h-full object-contain drop-shadow-2xl"
                  priority
                  quality={100}
                  unoptimized
                />
              </div>
            </div>

            {/* 右側操作區 */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* 時間顯示 - 桌面 */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-2xl font-light tracking-wider text-white/90 font-mono">
                  {formatTime(currentTime)}
                </span>
                <span className="text-xs text-white/40">
                  {formatDate(currentTime)}
                </span>
              </div>

              <div className="w-px h-8 bg-white/10 hidden md:block" />

              {/* 用戶資訊 */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-primary text-sm font-medium">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-white/40">{greeting}</p>
                  <p className="text-sm text-white/80 max-w-[150px] truncate">{user?.email}</p>
                </div>
              </div>

              {/* 登出按鈕 */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <span className="hidden sm:inline">登出</span>
                <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 歡迎區域 */}
        <div className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400/80 uppercase tracking-widest">系統運作中</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            管理控制台
          </h1>
          <p className="text-white/40 text-base sm:text-lg">
            選擇模組開始管理您的護理服務業務
          </p>
        </div>

        {/* 快速統計 - 時間顯示 (移動端) */}
        <div className="md:hidden mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="text-center">
            <span className="text-3xl font-light tracking-wider text-white/90 font-mono">
              {formatTime(currentTime)}
            </span>
            <p className="text-xs text-white/40 mt-1">{formatDate(currentTime)}</p>
          </div>
        </div>

        {/* 導航卡片網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {navigationItems.map((item, index) => (
            <div
              key={item.href}
              onClick={() => router.push(item.href)}
              className="group relative cursor-pointer"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {/* 卡片主體 */}
              <div className="relative h-full p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.04] overflow-hidden">
                {/* 頂部裝飾線 */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }}
                />
                
                {/* 背景光暈 */}
                <div 
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-700 blur-3xl"
                  style={{ backgroundColor: item.color }}
                />

                {/* 圖標 */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ 
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                    boxShadow: `0 0 20px ${item.color}10`
                  }}
                >
                  {item.icon}
                </div>

                {/* 標題 */}
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-white transition-colors">
                  {item.title}
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-medium">
                  {item.subtitle}
                </p>

                {/* 描述 */}
                <p className="text-sm text-white/40 mb-5 leading-relaxed">
                  {item.description}
                </p>

                {/* 底部統計 */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/30">{item.stats.label}</p>
                    <p className="text-lg font-semibold" style={{ color: item.color }}>{item.stats.value}</p>
                  </div>
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                    style={{ backgroundColor: `${item.color}10` }}
                  >
                    <svg className="w-4 h-4" style={{ color: item.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部資訊 */}
        <div className="mt-16 sm:mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/30">
              © 2025 明家居家護理服務有限公司
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
