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
    if (!lastUpdateTime) {
      setIsVisible(false)
      return
    }

    setIsVisible(true)

    const updateTimeAgo = () => {
      const now = new Date()
      const diffInMs = now.getTime() - lastUpdateTime.getTime()
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

      // 30分鐘後隱藏提示
      if (diffInMinutes >= 30) {
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
    }

    // 立即更新一次
    updateTimeAgo()

    // 每分鐘更新時間顯示
    const interval = setInterval(updateTimeAgo, 60000)

    return () => clearInterval(interval)
  }, [lastUpdateTime])

  if (!isVisible) return null

  return (
    <div className={`absolute -top-1 -right-1 inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg border-2 border-white z-50 animate-bounce ${className}`}>
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      <span className="font-medium">更新 {timeAgo}</span>
    </div>
  )
}