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
    <div className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full shadow-sm backdrop-blur-sm z-10 ${className}`}>
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      <span className="font-medium">{timeAgo}</span>
    </div>
  )
}