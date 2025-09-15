/**
 * 文件上載服務
 * 用於護理人員檔案上載到 Supabase Storage
 */

import { supabase } from '../lib/supabase'

export interface FileUploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface FileUploadProgress {
  progress: number
  status: 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

export class FileUploadService {
  private static readonly BUCKET_NAME = 'care-staff-files'
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
  private static readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']

  /**
   * 驗證檔案
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // 檢查檔案大小
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: '檔案太大，請選擇小於 10MB'
      }
    }

    // 檢查檔案類型
    const fileName = file.name.toLowerCase()
    const hasValidExtension = this.ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
    const hasValidType = this.ALLOWED_TYPES.includes(file.type)

    if (!hasValidExtension || !hasValidType) {
      return {
        valid: false,
        error: '不支援的格式（僅限 JPG/PNG/PDF）'
      }
    }

    return { valid: true }
  }

  /**
   * 生成檔案路徑
   * 格式：care-staff/{staff_id}/{staff_id}_{field_name}_{timestamp}.{ext}
   */
  static generateFilePath(staffId: string, fieldName: string, fileName: string): string {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) // yyyyMMddTHHmmss
    const extension = fileName.substring(fileName.lastIndexOf('.'))
    return `care-staff/${staffId}/${staffId}_${fieldName}_${timestamp}${extension}`
  }

  /**
   * 上載檔案到 Supabase Storage
   */
  static async uploadFile(
    file: File,
    staffId: string,
    fieldName: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    try {
      // 驗證檔案
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // 生成檔案路徑
      const filePath = this.generateFilePath(staffId, fieldName, file.name)

      // 開始上載
      onProgress?.({
        progress: 0,
        status: 'uploading'
      })

      // 上載到 Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // 不覆蓋現有檔案
        })

      if (error) {
        console.error('Storage upload error:', error)
        onProgress?.({
          progress: 0,
          status: 'error',
          error: '上載失敗，請稍後再試'
        })
        return {
          success: false,
          error: '上載失敗，請稍後再試'
        }
      }

      // 獲取公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath)

      onProgress?.({
        progress: 100,
        status: 'success',
        url: publicUrl
      })

      return {
        success: true,
        url: publicUrl
      }

    } catch (error) {
      console.error('File upload error:', error)
      const errorMessage = '上載失敗，請稍後再試'
      
      onProgress?.({
        progress: 0,
        status: 'error',
        error: errorMessage
      })

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * 刪除檔案
   */
  static async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath])

      if (error) {
        console.error('Storage delete error:', error)
        return {
          success: false,
          error: '刪除檔案失敗'
        }
      }

      return { success: true }
    } catch (error) {
      console.error('File delete error:', error)
      return {
        success: false,
        error: '刪除檔案失敗'
      }
    }
  }

  /**
   * 從 URL 中提取檔案路徑
   */
  static extractFilePathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url)
      const pathSegments = urlObj.pathname.split('/')
      const objectIndex = pathSegments.findIndex(segment => segment === 'object')
      
      if (objectIndex !== -1 && pathSegments[objectIndex + 1] === 'public') {
        return pathSegments.slice(objectIndex + 3).join('/')
      }
      
      return null
    } catch {
      return null
    }
  }

  /**
   * 替換檔案（刪除舊檔案並上載新檔案）
   */
  static async replaceFile(
    file: File,
    staffId: string,
    fieldName: string,
    oldUrl: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    try {
      // 先上載新檔案
      const uploadResult = await this.uploadFile(file, staffId, fieldName, onProgress)
      
      if (!uploadResult.success) {
        return uploadResult
      }

      // 刪除舊檔案
      const oldFilePath = this.extractFilePathFromUrl(oldUrl)
      if (oldFilePath) {
        await this.deleteFile(oldFilePath) // 不管刪除是否成功，都繼續
      }

      return uploadResult
    } catch (error) {
      console.error('File replace error:', error)
      return {
        success: false,
        error: '替換檔案失敗'
      }
    }
  }
}
