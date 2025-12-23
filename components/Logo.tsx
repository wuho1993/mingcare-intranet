'use client'

import React from 'react'
import Image from 'next/image'
import { getAssetPath } from '@/utils/asset-path'

interface LogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  priority?: boolean
}

const sizeClasses = {
  xs: 'h-6 w-auto',
  sm: 'h-8 w-auto', 
  md: 'h-10 w-auto',
  lg: 'h-12 w-auto',
  xl: 'h-16 w-auto'
}

export default function Logo({ 
  className = '', 
  size = 'md', 
  showText = false,
  priority = false 
}: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={getAssetPath("images/mingcare-logo.png")}
        alt="明家居家護理服務"
        width={200}
        height={200}
        priority={priority}
        quality={90}
        className={`${sizeClasses[size]} object-contain`}
        style={{ imageRendering: 'crisp-edges' }}
        onError={(e) => {
          console.error('Logo failed to load:', e)
          // 可以設置一個後備方案
          e.currentTarget.style.display = 'none'
        }}
      />
      {showText && (
        <div className="ml-2 sm:ml-3">
          <h1 className="text-lg sm:text-xl font-bold text-text-primary">明家護理</h1>
          <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">居家護理服務</p>
        </div>
      )}
    </div>
  )
}

// 響應式 Logo 組件，會根據螢幕大小調整
export function ResponsiveLogo({ 
  className = '', 
  showText = false,
  priority = false 
}: Omit<LogoProps, 'size'>) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={getAssetPath("images/mingcare-logo.png")}
        alt="明家居家護理服務"
        width={200}
        height={200}
        priority={priority}
        quality={90}
        className="h-6 sm:h-8 lg:h-10 w-auto object-contain"
        style={{ imageRendering: 'crisp-edges' }}
        onError={(e) => {
          console.error('Logo failed to load:', e)
          // 後備顯示文字
          const parent = e.currentTarget.parentElement
          if (parent) {
            parent.innerHTML = '<span class="font-bold text-blue-600">明家護理</span>'
          }
        }}
      />
      {showText && (
        <div className="ml-2 sm:ml-3 min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-text-primary truncate">明家護理</h1>
          <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">居家護理服務</p>
        </div>
      )}
    </div>
  )
}