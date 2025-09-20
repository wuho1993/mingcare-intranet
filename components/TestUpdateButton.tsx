'use client'

import { useState } from 'react'

interface TestUpdateButtonProps {
  onTriggerUpdate: () => void
  label: string
}

export default function TestUpdateButton({ onTriggerUpdate, label }: TestUpdateButtonProps) {
  const [isTriggered, setIsTriggered] = useState(false)

  const handleClick = () => {
    onTriggerUpdate()
    setIsTriggered(true)
    setTimeout(() => setIsTriggered(false), 2000) // 2秒後重置
  }

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full font-bold text-white shadow-lg transition-all duration-200 ${
        isTriggered 
          ? 'bg-green-500 scale-110' 
          : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
      }`}
    >
      {isTriggered ? '✅ 已觸發!' : `🧪 測試${label}`}
    </button>
  )
}