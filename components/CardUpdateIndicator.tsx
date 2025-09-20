'use client'

import { useState, useEffect } from 'react'

interface CardUpdateIndicatorProps {
  lastUpdateTime: Date | null
  className?: string
}

export default function CardUpdateIndicator({ lastUpdateTime, className = '' }: CardUpdateIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    console.log('🏷️ CardUpdateIndicator 接收到 lastUpdateTime:', lastUpdateTime)
    
    if (!lastUpdateTime) {
      console.log('❌ lastUpdateTime 為空，隱藏提示')
      setIsVisible(false)
      return
    }

    console.log('✅ lastUpdateTime 有值，顯示提示')
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

      if (diffInMinutes < 1) {
        setTimeAgo('剛剛')
      } else if (diffInMinutes === 1) {
        setTimeAgo('1分鐘前')
      } else {
        setTimeAgo(`${diffInMinutes}分鐘前`)
      }
      
      console.log('📝 設置時間顯示:', timeAgo)
    }

    // 立即更新一次
    updateTimeAgo()

    // 每分鐘更新時間顯示
    const interval = setInterval(updateTimeAgo, 60000)

    return () => clearInterval(interval)
  }, [lastUpdateTime])

  if (!isVisible) return null

  return (
    <div className={`absolute -top-3 -right-3 inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-xl border-2 border-white z-50 animate-pulse ${className}`} style={{zIndex: 9999}}>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
      <span className="font-bold">更新 {timeAgo}</span>
    </div>
  )
}