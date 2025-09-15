'use client'

import { useState, useRef, useEffect } from 'react'
import Tesseract from 'tesseract.js'

interface HKIDScanResult {
  name: string
  hkid: string
  dob: string
}

interface HKIDScannerProps {
  onScanResult: (result: HKIDScanResult) => void
  onError?: (error: string) => void
}

export default function HKIDScanner({ onScanResult, onError }: HKIDScannerProps) {
  const [showCamera, setShowCamera] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    hkid: '',
    dob: ''
  })

  // 清理相機資源
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  // 組件卸載時清理資源
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // 啟動相機
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 優先使用後置相機
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      setShowCamera(true)
      onError?.('') // 清除之前的錯誤信息
    } catch (error) {
      console.error('相機啟動失敗:', error)
      onError?.('無法啟動相機，請檢查相機權限或使用手動輸入')
    }
  }

  // 拍照並進行OCR識別
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsScanning(true)
    setScanProgress(0)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')!

      // 設置畫布尺寸
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // 拍攝照片
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // 將畫布轉換為圖片
      const imageDataUrl = canvas.toDataURL('image/png')

      // 使用 Tesseract.js 進行 OCR 識別
      const { data: { text } } = await Tesseract.recognize(
        imageDataUrl,
        'chi_tra+eng', // 繁體中文 + 英文
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setScanProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      // 解析OCR結果
      const result = parseHKIDText(text)
      
      if (result) {
        onScanResult(result)
        stopCamera()
      } else {
        onError?.('未能識別身份證資訊，請確保身份證清晰可見或使用手動輸入')
      }
    } catch (error) {
      console.error('OCR識別失敗:', error)
      onError?.('身份證識別失敗，請重新拍攝或使用手動輸入')
    } finally {
      setIsScanning(false)
      setScanProgress(0)
    }
  }

  // 解析OCR文本，提取身份證信息
  const parseHKIDText = (text: string): HKIDScanResult | null => {
    console.log('OCR識別文本:', text)
    
    // 身份證號碼正則表達式
    const hkidRegex = /[A-Z]{1,2}\d{6}\([0-9A]\)/g
    const hkidMatch = text.match(hkidRegex)
    
    // 出生日期正則表達式 (各種格式)
    const dobRegex = /(\d{2}[-\/]\d{2}[-\/]\d{4}|\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}-\d{2}-\d{2})/g
    const dobMatch = text.match(dobRegex)
    
    // 中文姓名正則表達式
    const nameRegex = /([一-龯]{2,4})/g
    const nameMatches = text.match(nameRegex)
    
    if (!hkidMatch) {
      return null
    }

    let name = ''
    let dob = ''
    
    // 提取姓名（通常是較長的中文字符串）
    if (nameMatches) {
      // 選擇最可能的姓名（通常是2-4個中文字符）
      name = nameMatches.find(match => match.length >= 2 && match.length <= 8) || nameMatches[0]
    }
    
    // 提取出生日期並格式化
    if (dobMatch) {
      const dobStr = dobMatch[0]
      dob = formatDate(dobStr)
    }

    return {
      name: name || '',
      hkid: hkidMatch[0],
      dob: dob || ''
    }
  }

  // 格式化日期為 YYYY-MM-DD
  const formatDate = (dateStr: string): string => {
    try {
      // 處理各種日期格式
      let parts: string[]
      
      if (dateStr.includes('-')) {
        parts = dateStr.split('-')
      } else if (dateStr.includes('/')) {
        parts = dateStr.split('/')
      } else {
        return ''
      }

      if (parts.length !== 3) return ''

      let year: string, month: string, day: string

      // 判斷日期格式
      if (parts[0].length === 4) {
        // YYYY-MM-DD 格式
        [year, month, day] = parts
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY 或 MM-DD-YYYY 格式
        [day, month, year] = parts
      } else {
        // 兩位數年份，假設是21世紀
        if (parseInt(parts[2]) < 50) {
          year = '20' + parts[2]
        } else {
          year = '19' + parts[2]
        }
        [day, month] = parts
      }

      // 確保月份和日期是兩位數
      month = month.padStart(2, '0')
      day = day.padStart(2, '0')

      return `${year}-${month}-${day}`
    } catch {
      return ''
    }
  }

  const handleManualSubmit = () => {
    if (!formData.name || !formData.hkid || !formData.dob) {
      onError?.('請填寫所有必要欄位')
      return
    }

    // 驗證香港身份證格式
    const hkidRegex = /^[A-Z]{1,2}\d{6}\([0-9A]\)$/
    if (!hkidRegex.test(formData.hkid)) {
      onError?.('請輸入正確的香港身份證格式，例如：A123456(7)')
      return
    }

    onScanResult({
      name: formData.name,
      hkid: formData.hkid,
      dob: formData.dob
    })
  }

  return (
    <div className="space-y-4">
      {!showCamera && !showManualInput ? (
        // 主選擇界面
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={startCamera}
              className="btn-apple-primary w-full flex items-center justify-center space-x-2 py-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-lg font-medium">📷 相機掃描身份證</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="btn-apple-secondary w-full flex items-center justify-center space-x-2 py-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-lg font-medium">✍️ 手動輸入資料</span>
            </button>
          </div>
          
          <div className="bg-info-light border border-info rounded-apple-sm p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-apple-caption font-medium text-info">使用提示</p>
                <p className="text-apple-caption text-info mt-1">
                  • 相機掃描：自動識別身份證上的姓名、號碼和出生日期<br />
                  • 手動輸入：如掃描失敗，可手動輸入相關資料<br />
                  • 請確保身份證放置平整，光線充足
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : showCamera ? (
        // 相機掃描界面
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-apple-body font-medium text-text-primary">身份證掃描</h4>
            <button
              type="button"
              onClick={stopCamera}
              className="text-text-secondary hover:text-text-primary"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative bg-black rounded-apple-sm overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-80 object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* 掃描框覆蓋層 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-4 border-primary border-dashed rounded-apple-sm w-4/5 h-3/5 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white text-sm font-medium mb-2">請將身份證放在框內</p>
                  <div className="bg-black bg-opacity-50 rounded px-3 py-1">
                    <p className="text-white text-xs">確保身份證清晰可見</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 掃描進度 */}
          {isScanning && (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-apple-body text-primary font-medium">
                  正在識別身份證... {scanProgress}%
                </span>
              </div>
              <div className="w-full bg-bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 拍照按鈕 */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={stopCamera}
              className="btn-apple-secondary flex-1"
              disabled={isScanning}
            >
              取消
            </button>
            <button
              type="button"
              onClick={captureAndScan}
              disabled={isScanning}
              className="btn-apple-primary flex-1 disabled:opacity-50"
            >
              {isScanning ? '識別中...' : '📸 拍照並識別'}
            </button>
          </div>

          {/* 使用說明 */}
          <div className="bg-warning-light border border-warning rounded-apple-sm p-3">
            <p className="text-apple-caption text-warning font-medium mb-1">拍照提示</p>
            <ul className="text-apple-caption text-warning space-y-1">
              <li>• 請將身份證水平放置在掃描框內</li>
              <li>• 確保光線充足，避免反光</li>
              <li>• 身份證資訊清晰可見</li>
              <li>• 如識別失敗，可重新拍照或使用手動輸入</li>
            </ul>
          </div>

          {/* 隱藏的canvas用於拍照 */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : (
        // 手動輸入界面
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-apple-body font-medium text-text-primary">手動輸入身份證資訊</h4>
            <button
              type="button"
              onClick={() => setShowManualInput(false)}
              className="text-text-secondary hover:text-text-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-apple-caption font-medium text-text-primary mb-2">
                客戶姓名 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="form-input-apple"
                placeholder="請輸入客戶姓名"
              />
            </div>

            <div>
              <label className="block text-apple-caption font-medium text-text-primary mb-2">
                身份證號碼 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.hkid}
                onChange={(e) => setFormData(prev => ({ ...prev, hkid: e.target.value.toUpperCase() }))}
                className="form-input-apple"
                placeholder="例如：A123456(7)"
              />
              <p className="text-apple-caption text-text-secondary mt-1">
                請輸入完整的香港身份證號碼，包括括號內的校驗位
              </p>
            </div>

            <div>
              <label className="block text-apple-caption font-medium text-text-primary mb-2">
                出生日期 <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                className="form-input-apple"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="btn-apple-secondary flex-1"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                className="btn-apple-primary flex-1"
              >
                確認輸入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
