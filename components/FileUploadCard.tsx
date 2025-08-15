/**
 * 文件上載組件
 * 支援 NULL → 上載、非 NULL → 預覽/替換/移除
 */

import React, { useState, useRef } from 'react'
import { FileUploadService, FileUploadProgress } from '../services/file-upload'

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
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isUploading = progress?.status === 'uploading'
  const hasFile = !!currentUrl

  // 處理檔案選擇
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      if (hasFile) {
        // 替換檔案
        const result = await FileUploadService.replaceFile(
          file,
          staffId,
          fieldName,
          currentUrl!,
          setProgress
        )
        
        if (result.success && result.url) {
          onUploadSuccess(result.url)
          setShowReplaceConfirm(false)
        }
      } else {
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
    if (hasFile) {
      setShowReplaceConfirm(true)
    } else {
      fileInputRef.current?.click()
    }
  }

  // 確認替換
  const confirmReplace = () => {
    setShowReplaceConfirm(false)
    fileInputRef.current?.click()
  }

  // 確認移除
  const confirmRemove = () => {
    onRemove()
    setShowRemoveConfirm(false)
  }

  // 獲取檔案名稱
  const getFileName = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const pathSegments = urlObj.pathname.split('/')
      return pathSegments[pathSegments.length - 1] || '未知檔案'
    } catch {
      return '未知檔案'
    }
  }

  // 檢查是否為圖片
  const isImage = (url: string): boolean => {
    const fileName = getFileName(url).toLowerCase()
    return fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')
  }

  return (
    <div className="form-group-apple">
      <label className="form-label-apple">{label}</label>
      
      {/* 檔案狀態顯示 */}
      <div className="mt-2">
        {hasFile ? (
          /* 已有檔案 - 顯示預覽和操作按鈕 */
          <div className="border border-border-light rounded-apple-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {isImage(currentUrl!) ? (
                  /* 圖片預覽 */
                  <img
                    src={currentUrl!}
                    alt={label}
                    className="w-12 h-12 object-cover rounded border"
                  />
                ) : (
                  /* PDF 圖示 */
                  <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {getFileName(currentUrl!)}
                  </p>
                  <p className="text-xs text-text-tertiary">已上載</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* 預覽/下載 */}
                <a
                  href={currentUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {isImage(currentUrl!) ? '預覽' : '下載'}
                </a>
                
                {/* 替換 */}
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={disabled || isUploading}
                  className="px-3 py-1 text-xs bg-mingcare-blue text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  替換
                </button>
                
                {/* 移除 */}
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={disabled || isUploading}
                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  移除
                </button>
              </div>
            </div>
            
            {/* 進度條 */}
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-mingcare-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress?.progress || 0}%` }}
                />
              </div>
            )}
            
            {/* 錯誤訊息 */}
            {progress?.status === 'error' && (
              <p className="text-red-600 text-xs mt-2">{progress.error}</p>
            )}
          </div>
        ) : (
          /* 未有檔案 - 顯示上載區域 */
          <div className="border-2 border-dashed border-border-light rounded-apple-sm p-6 text-center hover:border-mingcare-blue transition-colors">
            <svg className="mx-auto h-12 w-12 text-text-tertiary" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <div className="mt-4">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={disabled || isUploading}
                className="px-4 py-2 bg-mingcare-blue text-white rounded-apple-sm text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? '上載中...' : '上載檔案'}
              </button>
              <p className="mt-2 text-xs text-text-tertiary">
                JPG, PNG, PDF (最大 10MB)
              </p>
            </div>
            
            {/* 進度條 */}
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-mingcare-blue h-2 rounded-full transition-all duration-300"
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

      {/* 替換確認對話框 */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-apple-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              確認替換檔案
            </h3>
            <p className="text-text-secondary mb-4">
              這會覆蓋現有的檔案。此操作無法復原，確定要繼續嗎？
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReplaceConfirm(false)}
                className="px-4 py-2 border border-border-light rounded-apple-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmReplace}
                className="px-4 py-2 bg-mingcare-blue text-white rounded-apple-sm hover:bg-blue-600 transition-colors"
              >
                確認替換
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 移除確認對話框 */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-apple-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              確認移除檔案
            </h3>
            <p className="text-text-secondary mb-4">
              這會移除檔案連結，但不會刪除實際檔案。確定要繼續嗎？
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-2 border border-border-light rounded-apple-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmRemove}
                className="px-4 py-2 bg-red-500 text-white rounded-apple-sm hover:bg-red-600 transition-colors"
              >
                確認移除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
