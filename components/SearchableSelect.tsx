import React, { useState, useRef, useEffect } from 'react'

interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  loading?: boolean
  className?: string
  disabled?: boolean
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '請選擇...',
  loading = false,
  className = '',
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState<SearchableSelectOption[]>(options)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 當選項改變時，更新過濾的選項
  useEffect(() => {
    setFilteredOptions(options)
  }, [options])

  // 過濾選項
  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [searchTerm, options])

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 獲取顯示標籤
  const getDisplayLabel = () => {
    if (value) {
      const selectedOption = options.find(option => option.value === value)
      return selectedOption?.label || value
    }
    return placeholder
  }

  // 處理選項點擊
  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  // 處理輸入框焦點
  const handleInputFocus = () => {
    setIsOpen(true)
    if (inputRef.current) {
      inputRef.current.select()
    }
  }

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleOptionClick(filteredOptions[0].value)
    }
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* 輸入框 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (value ? getDisplayLabel() : '')}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="w-full px-4 py-3 border border-border-light rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white pr-10 text-text-primary placeholder-text-secondary"
          autoComplete="off"
        />
        
        {/* 下拉箭頭 */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg 
              className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* 下拉選單 */}
      {isOpen && !disabled && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border-light rounded-xl shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <>
              {/* 清除選擇選項 */}
              {value && (
                <button
                  type="button"
                  onClick={() => handleOptionClick('')}
                  className="w-full px-4 py-3 text-left hover:bg-bg-secondary text-text-secondary border-b border-border-light flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>清除選擇</span>
                </button>
              )}
              
              {/* 選項列表 */}
              {filteredOptions.map((option, index) => (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full px-4 py-3 text-left hover:bg-bg-secondary transition-colors duration-200 ${
                    value === option.value 
                      ? 'bg-primary bg-opacity-10 text-primary font-medium' 
                      : 'text-text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-3 text-text-secondary text-center">
              {searchTerm ? '沒有找到匹配的選項' : '沒有可用選項'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
