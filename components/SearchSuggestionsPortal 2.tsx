'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SearchSuggestion } from '@/types/customer-management'

interface SearchSuggestionsPortalProps {
  isVisible: boolean
  suggestions: SearchSuggestion[]
  onSelectSuggestion: (suggestion: SearchSuggestion) => void
  onClose: () => void
  targetRef: React.RefObject<HTMLInputElement>
}

export default function SearchSuggestionsPortal({
  isVisible,
  suggestions,
  onSelectSuggestion,
  onClose,
  targetRef
}: SearchSuggestionsPortalProps) {
  const portalRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)

  // 確保只在客戶端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 計算搜尋建議位置
  const updatePosition = () => {
    if (!targetRef.current) return

    const rect = targetRef.current.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    setPosition({
      top: rect.bottom + scrollY + 2,
      left: rect.left + scrollX,
      width: rect.width
    })
  }

  // 監聽位置變化
  useEffect(() => {
    if (!isVisible) return

    updatePosition()

    const handleScroll = () => updatePosition()
    const handleResize = () => updatePosition()

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible, targetRef])

  // 點擊外部關閉
  useEffect(() => {
    if (!isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // 檢查是否點擊在搜尋框或建議框內
      if (
        targetRef.current?.contains(target) ||
        portalRef.current?.contains(target)
      ) {
        return
      }
      
      onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVisible, onClose, targetRef])

  // ESC 鍵關閉
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, onClose])

  if (!mounted || !isVisible || suggestions.length === 0) {
    return null
  }

  const portalContent = (
    <div
      ref={portalRef}
      className="fixed bg-white border border-border-light rounded-apple-lg shadow-apple-lg max-h-64 overflow-y-auto z-[9999]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        minWidth: '300px'
      }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.id}-${index}`}
          onClick={() => onSelectSuggestion(suggestion)}
          className="px-4 py-3 hover:bg-bg-secondary cursor-pointer border-b border-border-light last:border-b-0 transition-colors duration-150"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="font-medium text-text-primary">
                    {suggestion.customer_name}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {suggestion.customer_id}
                  </div>
                </div>
              </div>
              <div className="text-xs text-text-tertiary mt-1">
                {suggestion.phone && (
                  <span className="mr-3">📞 {suggestion.phone}</span>
                )}
                <span className="text-xs text-text-tertiary">
                  {suggestion.display_text}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // 使用 Portal 渲染到 body
  return createPortal(portalContent, document.body)
}
