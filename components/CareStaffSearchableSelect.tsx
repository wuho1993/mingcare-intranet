import React, { useState, useRef, useEffect } from 'react'

interface CareStaffSearchableSelectProps {
  careStaffList: { name_chinese: string }[]
  value: string
  onChange: (value: string) => void
  loading?: boolean
  placeholder?: string
  className?: string
}

export const CareStaffSearchableSelect: React.FC<CareStaffSearchableSelectProps> = ({
  careStaffList,
  value,
  onChange,
  loading = false,
  placeholder = '選擇護理人員',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayValue, setDisplayValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 過濾護理人員列表
  const filteredStaff = careStaffList.filter(staff =>
    staff.name_chinese.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 處理點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setDisplayValue(value)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  // 更新顯示值
  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    setDisplayValue(newValue)
    setIsOpen(true)
  }

  const handleSelectStaff = (staffName: string) => {
    onChange(staffName)
    setDisplayValue(staffName)
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setDisplayValue('')
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setSearchQuery(displayValue)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={loading ? '載入中...' : placeholder}
          disabled={loading}
          className="w-full px-4 py-2.5 border border-border-light rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-bg-secondary text-sm transition-all duration-300 pr-20"
        />
        
        {/* 清除按鈕 */}
        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* 下拉箭頭 */}
        <svg 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-primary border border-border-light rounded-xl shadow-xl z-[100] max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-text-secondary text-sm">載入中...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="px-4 py-3 text-text-secondary text-sm">
              {searchQuery ? '未找到匹配的護理人員' : '沒有可選的護理人員'}
            </div>
          ) : (
            <>
              {/* 清空選項 */}
              <div
                className="px-4 py-3 cursor-pointer hover:bg-bg-secondary text-text-secondary border-b border-border-light transition-colors text-sm"
                onClick={handleClear}
              >
                <span className="italic">清除選擇</span>
              </div>
              
              {/* 護理人員選項 */}
              {filteredStaff.map((staff, index) => {
                const isSelected = staff.name_chinese === value
                return (
                  <div
                    key={index}
                    className={`px-4 py-3 cursor-pointer hover:bg-bg-secondary flex items-center justify-between transition-colors text-sm ${
                      isSelected ? 'bg-primary/5 text-primary' : 'text-text-primary'
                    }`}
                    onClick={() => handleSelectStaff(staff.name_chinese)}
                  >
                    <span>{staff.name_chinese}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
