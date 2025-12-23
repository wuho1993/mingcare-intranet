/**
 * 文件上載組件
 * 支援 NULL → 上載、非 NULL → 顯示連結（30分鐘有效期）
 */

import React, { useState, useRef } from 'react'
import { FileUploadService, FileUploadProgress } from '../services/file-upload'
import { supabase } from '../lib/supabase'

interface FileUploadCardProps {
  label: string
  fieldName: string
  staffId: string
  currentUrl?: string | null
  onUploadSuccess: (url: string) => void
  onRemove: () => void
  disabled?: boolean
}

export function FileUploadCard({
  label,
  fieldName,
  staffId,
  currentUrl,
  onUploadSuccess,
  onRemove,
  disabled = false
}: FileUploadCardProps) {
  const [progress, setProgress] = useState<FileUploadProgress | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isUploading = progress?.status === 'uploading'
  const hasFile = !!currentUrl

  // 處理檔案選擇（僅上載）
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // 僅支援新檔案上載
      const result = await FileUploadService.uploadFile(
        file,
        staffId,
        fieldName,
        setProgress
      )

      if (result.success && result.url) {
        onUploadSuccess(result.url)
        // 重置 input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        alert(result.error || '上載失敗')
      }
    } catch (error) {
      console.error('檔案上載失敗:', error)
      alert('檔案上載失敗，請稍後再試')
    } finally {
      setProgress(null)
    }
  }

  // 觸發檔案選擇
  const handleUploadClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  // 生成臨時簽名 URL（30分鐘有效期）
  const generateSignedUrl = async () => {
    if (!currentUrl) return

    setIsGeneratingLink(true)
    try {
      console.log('原始 URL:', currentUrl)
      
      let filePath = ''
      
      // 方法1: 如果 URL 包含 storage/v1/object/public/
      if (currentUrl.includes('/storage/v1/object/public/')) {
        const url = new URL(currentUrl)
        const pathSegments = url.pathname.split('/')
        const publicIndex = pathSegments.findIndex(segment => segment === 'public')
        const bucketIndex = pathSegments.findIndex(segment => segment === 'care-staff-files')
        
        if (publicIndex !== -1 && bucketIndex !== -1 && bucketIndex > publicIndex) {
          filePath = pathSegments.slice(bucketIndex + 1).join('/')
        }
      }
      
      // 方法2: 如果是相對路徑或其他格式
      if (!filePath && currentUrl.includes('care-staff-files/')) {
        const parts = currentUrl.split('care-staff-files/')
        if (parts.length > 1) {
          filePath = parts[1]
        }
      }
      
      // 方法3: 如果是純檔案路徑（以 care-staff/ 開頭）
      if (!filePath && currentUrl.includes('care-staff/')) {
        const parts = currentUrl.split('care-staff/')
        if (parts.length > 1) {
          filePath = 'care-staff/' + parts[1]
        }
      }
      
      console.log('解析的檔案路徑:', filePath)
      
      if (!filePath) {
        throw new Error('無法解析檔案路徑，URL格式不正確')
      }
      
      // 生成簽名 URL（30分鐘有效期）
      const { data, error } = await supabase.storage
        .from('care-staff-files')
        .createSignedUrl(filePath, 1800) // 1800 秒 = 30 分鐘

      if (error) {
        console.error('生成簽名 URL 失敗:', error)
        
        // 嘗試直接使用原始 URL（如果是公開存取）
        console.log('嘗試直接打開原始 URL...')
        window.open(currentUrl, '_blank')
        return
      }

      if (data?.signedUrl) {
        console.log('成功生成簽名 URL:', data.signedUrl)
        // 在新視窗打開檔案
        window.open(data.signedUrl, '_blank')
      } else {
        console.log('無簽名 URL，嘗試原始 URL...')
        window.open(currentUrl, '_blank')
      }
    } catch (error) {
      console.error('生成檔案連結失敗:', error)
      
      // 備用方案：直接嘗試打開原始 URL
      try {
        console.log('使用備用方案打開原始 URL...')
        window.open(currentUrl, '_blank')
      } catch (fallbackError) {
        console.error('備用方案也失敗:', fallbackError)
        alert('無法打開檔案，請檢查檔案是否存在或聯絡管理員')
      }
    } finally {
      setIsGeneratingLink(false)
    }
  }

  return (
    <div className="form-group-apple">
      <label className="form-label-apple">{label}</label>
      
      {/* 檔案狀態顯示 */}
      <div className="mt-2">
        {hasFile ? (
          /* 已有檔案 - 顯示連結 */
          <div className="border border-border-light rounded-apple-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* 檔案圖示 */}
                <div className="w-10 h-10 bg-bg-tertiary rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {label}
                  </p>
                  <p className="text-xs text-text-tertiary">已上載</p>
                </div>
              </div>
              
              {/* 點擊查看連結（30分鐘有效期） */}
              <button
                type="button"
                onClick={generateSignedUrl}
                disabled={isGeneratingLink}
                className="px-4 py-2 text-sm bg-primary text-white rounded-apple-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isGeneratingLink ? '生成中...' : '點擊查看'}
              </button>
            </div>
            
            {/* 提示訊息 */}
            <div className="mt-2 text-xs text-text-tertiary">
              💡 點擊「點擊查看」會生成30分鐘有效的安全連結
            </div>
          </div>
        ) : (
          /* 未有檔案 - 顯示上載區域 */
          <div className="border-2 border-dashed border-border-light rounded-apple-sm p-6 text-center hover:border-primary transition-colors">
            <svg className="mx-auto h-12 w-12 text-text-tertiary" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <div className="mt-4">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={disabled || isUploading}
                className="px-4 py-2 bg-primary text-white rounded-apple-sm text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? '上載中...' : '上載檔案'}
              </button>
              <p className="mt-2 text-xs text-text-tertiary">
                JPG, PNG, PDF (最大 10MB)
              </p>
            </div>
            
            {/* 進度條 */}
            {isUploading && (
              <div className="w-full bg-bg-tertiary rounded-full h-2 mt-4">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
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
