/**
 * 簡化的文件顯示組件
 * - 有URL：顯示連結（title: "點擊查看"）
 * - NULL：顯示上載按鈕
 * - 不需替換和移除功能
 */

import React, { useState, useRef } from 'react'
import { FileUploadService, FileUploadProgress } from '../services/file-upload'

interface SimpleFileDisplayProps {
  label: string
  fieldName: string
  staffId: string
  currentUrl?: string | null
  onUploadSuccess: (url: string) => void
  disabled?: boolean
}

export function SimpleFileDisplay({
  label,
  fieldName,
  staffId,
  currentUrl,
  onUploadSuccess,
  disabled = false
}: SimpleFileDisplayProps) {
  const [progress, setProgress] = useState<FileUploadProgress | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isUploading = progress?.status === 'uploading'
  const hasFile = !!currentUrl

  // 處理檔案選擇
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // 初次上載
      const result = await FileUploadService.uploadFile(
        file,
        staffId,
        fieldName,
        setProgress
      )
      
      if (result.success && result.url) {
        onUploadSuccess(result.url)
      }
    } catch (error) {
      console.error('File upload error:', error)
    } finally {
      // 清空 input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 處理上載按鈕點擊
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 獲取檔案名稱
  const getFileName = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const pathSegments = urlObj.pathname.split('/')
      return pathSegments[pathSegments.length - 1] || '檔案'
    } catch {
      return '檔案'
    }
  }

  return (
    <div className="form-group-apple">
      <label className="form-label-apple">{label}</label>
      
      <div className="mt-2">
        {hasFile ? (
          /* 已有檔案 - 顯示連結 */
          <div className="border border-border-light rounded-apple-sm p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* 檔案圖示 */}
                <div className="w-8 h-8 bg-mingcare-blue bg-opacity-10 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-mingcare-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <div>
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="點擊查看"
                    className="text-sm font-medium text-mingcare-blue hover:text-blue-700 hover:underline"
                  >
                    {getFileName(currentUrl)}
                  </a>
                  <p className="text-xs text-text-tertiary">已上載</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 未有檔案 - 顯示上載區域 */
          <div className="border-2 border-dashed border-border-light rounded-apple-sm p-4 text-center hover:border-mingcare-blue transition-colors">
            <svg className="mx-auto h-8 w-8 text-text-tertiary" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <div className="mt-2">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={disabled || isUploading}
                className="px-3 py-1 bg-mingcare-blue text-white rounded-apple-sm text-xs hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? '上載中...' : '上載檔案'}
              </button>
              <p className="mt-1 text-xs text-text-tertiary">
                JPG, PNG, PDF (最大 10MB)
              </p>
            </div>
            
            {/* 進度條 */}
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className="bg-mingcare-blue h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress?.progress || 0}%` }}
                />
              </div>
            )}
            
            {/* 錯誤訊息 */}
            {progress?.status === 'error' && (
              <p className="text-red-600 text-xs mt-2">{progress.error}</p>
            )}
          </div>
        )}
      </div>

      {/* 隱藏的文件輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
