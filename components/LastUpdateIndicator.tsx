'use client'

import { useState, useEffect } from 'react'

interface LastUpdateIndicatorProps {
  lastUpdateTime: Date | null
  className?: string
}

export default function LastUpdateIndicator({ lastUpdateTime, className = '' }: LastUpdateIndicatorProps) {
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
        setTimeAgo('剛剛更新')
      } else if (diffInMinutes === 1) {
        setTimeAgo('1分鐘前更新')
      } else {
        setTimeAgo(`${diffInMinutes}分鐘前更新`)
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
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-md shadow-sm animate-fade-in ${className}`}>
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      <span className="font-medium">{timeAgo}</span>
    </div>
  )
}