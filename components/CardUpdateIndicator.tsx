'use client'

import { useState, useEffect } from 'react'

interface CardUpdateIndicatorProps {
  lastUpdateTime: Date | null
  className?: string
}

export default function CardUpdateIndicator({ lastUpdateTime, className = '' }: CardUpdateIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)

  console.log('🔥 CardUpdateIndicator 渲染:', { 
    lastUpdateTime: lastUpdateTime?.toISOString() || null, 
    isVisible, 
    timeAgo,
    willRender: !(!isVisible)
  })

  useEffect(() => {
    console.log('🏷️ CardUpdateIndicator useEffect 觸發, lastUpdateTime:', lastUpdateTime)
    
    if (!lastUpdateTime) {
      console.log('❌ lastUpdateTime 為空，隱藏提示')
      setIsVisible(false)
      return
    }

    console.log('✅ lastUpdateTime 有值，設置為顯示')
    setIsVisible(true)

    const updateTimeAgo = () => {
      const now = new Date()
      const diffInMs = now.getTime() - lastUpdateTime.getTime()
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

      console.log('⏰ 時間計算:', {
        now: now.toISOString(),
        lastUpdateTime: lastUpdateTime.toISOString(),
        diffInMinutes
      })

      // 30分鐘後隱藏提示
      if (diffInMinutes >= 30) {
        console.log('⌛ 超過30分鐘，隱藏提示')
        setIsVisible(false)
        return
      }

      let newTimeAgo = ''
      if (diffInMinutes < 1) {
        newTimeAgo = '剛剛'
      } else if (diffInMinutes === 1) {
        newTimeAgo = '1分鐘前'
      } else {
        newTimeAgo = `${diffInMinutes}分鐘前`
      }
      
      console.log('📝 設置時間顯示:', newTimeAgo)
      setTimeAgo(newTimeAgo)
    }

    // 立即更新一次
    updateTimeAgo()

    // 每分鐘更新時間顯示
    const interval = setInterval(updateTimeAgo, 60000)

    return () => clearInterval(interval)
  }, [lastUpdateTime])

  if (!isVisible) {
    console.log('⚠️ CardUpdateIndicator 不渲染: isVisible =', isVisible)
    return null
  }

  console.log('✅ CardUpdateIndicator 即將渲染 DOM，內容:', `更新 ${timeAgo || '剛剛'}`)

  return (
    <div
      className={`absolute top-1 right-1 inline-flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-[11px] sm:text-sm font-bold rounded-full shadow-xl border border-white z-[9999] animate-pulse pointer-events-none ${className}`}
      style={{ position: 'absolute' }}
      aria-label={timeAgo ? `更新 ${timeAgo}` : '最近已更新'}
      role="status"
    >
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-bounce" />
      <span className="font-bold leading-none">更新 {timeAgo || '剛剛'}</span>
    </div>
  )
}