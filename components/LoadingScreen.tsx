'use client'

import React from 'react'
import Image from 'next/image'
import { getAssetPath } from '@/utils/asset-path'

interface LoadingScreenProps {
  message?: string
  showProgress?: boolean
}

export default function LoadingScreen({ 
  message = '載入中...', 
  showProgress = true 
}: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      {/* 背景光暈效果 */}
      <div className="loading-bg-glow loading-bg-glow-1" />
      <div className="loading-bg-glow loading-bg-glow-2" />
      <div className="loading-bg-glow loading-bg-glow-3" />
      
      {/* Logo 容器 */}
      <div className="loading-logo-container">
        {/* Logo 外圈動畫 */}
        <div className="loading-ring loading-ring-outer" />
        <div className="loading-ring loading-ring-middle" />
        <div className="loading-ring loading-ring-inner" />
        
        {/* Logo */}
        <div className="loading-logo">
          <Image
            src={getAssetPath('images/mingcare-logo.png')}
            alt="明家護理服務"
            width={120}
            height={120}
            className="loading-logo-image"
            priority
          />
        </div>
        
        {/* 脈動光暈 */}
        <div className="loading-pulse" />
      </div>
      
      {/* 文字 */}
      <div className="loading-text-container">
        <h2 className="loading-title">明家護理服務</h2>
        <p className="loading-subtitle">MingCare Intranet</p>
        
        {showProgress && (
          <div className="loading-progress">
            <div className="loading-progress-bar">
              <div className="loading-progress-fill" />
            </div>
            <p className="loading-message">{message}</p>
          </div>
        )}
      </div>
      
      {/* 底部裝飾點 */}
      <div className="loading-dots">
        <span className="loading-dot" style={{ animationDelay: '0s' }} />
        <span className="loading-dot" style={{ animationDelay: '0.2s' }} />
        <span className="loading-dot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}

// 簡化版 Loading 組件（用於小區域）
export function LoadingSpinner({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`}>
      <div className="loading-spinner-ring" />
    </div>
  )
}

// Logo Loading 組件（用於按鈕等）
export function LoadingLogo({ 
  size = 40,
  className = '' 
}: { 
  size?: number
  className?: string 
}) {
  return (
    <div className={`loading-logo-mini ${className}`} style={{ width: size, height: size }}>
      <Image
        src={getAssetPath('images/mingcare-logo.png')}
        alt="載入中"
        width={size}
        height={size}
        className="loading-logo-mini-image"
      />
      <div className="loading-logo-mini-ring" />
    </div>
  )
}
