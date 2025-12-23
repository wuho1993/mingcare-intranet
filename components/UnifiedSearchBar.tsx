'use client'

import React, { useRef, useState, useEffect } from 'react'

interface UnifiedSearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch?: () => void
  onClear?: () => void
  placeholder?: string
  className?: string
  showSuggestions?: boolean
  suggestions?: Array<{ id: string; label: string; subtitle?: string }>
  onSuggestionSelect?: (suggestion: any) => void
  loading?: boolean
}

export default function UnifiedSearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "搜尋...",
  className = "",
  showSuggestions = false,
  suggestions = [],
  onSuggestionSelect,
  loading = false
}: UnifiedSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    onChange('')
    if (onClear) onClear()
    inputRef.current?.focus()
  }

  const handleSearch = () => {
    if (onSearch) onSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={placeholder}
          className="w-full pl-10 sm:pl-12 pr-20 sm:pr-24 py-2 sm:py-3 bg-bg-secondary border-transparent focus:bg-white focus:border-primary focus:shadow-apple-focus rounded-apple-sm text-sm transition-all duration-200"
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Right side controls */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 space-x-1 sm:space-x-2">
          {/* Loading indicator */}
          {loading && (
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-primary border-t-transparent"></div>
          )}
          
          {/* Clear button */}
          {value && (
            <button
              onClick={handleClear}
              className="text-text-tertiary hover:text-text-secondary transition-colors p-1"
              type="button"
            >
              <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Search button */}
          <button
            onClick={handleSearch}
            className="btn-apple-primary py-1 px-2 sm:px-3 text-xs"
            type="button"
          >
            <span className="hidden sm:inline">搜尋</span>
            <span className="sm:hidden">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </button>
        </div>
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && isFocused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-light rounded-apple-sm shadow-apple-card max-h-60 overflow-y-auto z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => {
                if (onSuggestionSelect) onSuggestionSelect(suggestion)
              }}
              className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-bg-secondary transition-colors border-b border-border-light last:border-b-0"
            >
              <div className="text-sm font-medium text-text-primary">{suggestion.label}</div>
              {suggestion.subtitle && (
                <div className="text-xs text-text-secondary mt-1">{suggestion.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}