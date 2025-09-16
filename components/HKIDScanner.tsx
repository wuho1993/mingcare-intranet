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
  const [debugInfo, setDebugInfo] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workerRef = useRef<Tesseract.Worker | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    hkid: '',
    dob: ''
  })

  // 檢查是否為HTTPS環境
  const isHTTPS = () => {
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  }

  // 初始化 Tesseract worker
  const initializeWorker = async () => {
    try {
      if (workerRef.current) return workerRef.current

      // 創建 worker，支持繁體中文和英文
      const worker = await Tesseract.createWorker('eng+chi_tra', 1, {
        logger: (m: any) => {
          console.log('Tesseract Log:', m)
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100))
          }
        },
        errorHandler: (err: any) => {
          console.error('Tesseract Error:', err)
        }
      })
      
      // 設置 OCR 參數，優化身份證識別
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz一二三四五六七八九十百千萬億兆()/-. 年月日',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1'
      })

      workerRef.current = worker
      return worker
    } catch (error) {
      console.error('Worker initialization failed:', error)
      throw error
    }
  }

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
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  // 啟動相機
  const startCamera = async () => {
    try {
      // 檢查HTTPS環境
      if (!isHTTPS()) {
        const httpsWarning = '⚠️  相機功能需要 HTTPS 環境。請使用 https://localhost:3000 或部署到HTTPS服務器'
        setDebugInfo(httpsWarning)
        onError?.(httpsWarning)
        return
      }

      setDebugInfo('正在請求相機權限...')
      
      // 檢查瀏覽器是否支持相機
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('瀏覽器不支持相機功能')
      }

      // 嘗試簡單的相機配置
      const constraints = {
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: { ideal: 'environment' }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      setDebugInfo('相機權限已獲取，正在初始化...')
      streamRef.current = stream
      
      if (videoRef.current) {
        // 先設置srcObject
        videoRef.current.srcObject = stream
        
        // 設置事件處理器
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded')
          setDebugInfo('視頻流已載入')
          
          // 確保視頻播放
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setDebugInfo('相機啟動成功！')
              setTimeout(() => setDebugInfo(''), 2000)
            }).catch(error => {
              console.error('Play error:', error)
              setDebugInfo(`播放錯誤: ${error.message}`)
            })
          }
        }
        
        videoRef.current.onerror = (e) => {
          console.error('視頻元素錯誤:', e)
          setDebugInfo('視頻元素錯誤')
        }
      }
      
      setShowCamera(true)
      onError?.('') // 清除之前的錯誤信息
      
    } catch (error) {
      console.error('相機啟動失敗:', error)
      let errorMessage = '無法啟動相機'
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = '❌ 相機權限被拒絕。請點擊瀏覽器地址欄的相機圖標，選擇"允許"'
            break
          case 'NotFoundError':
            errorMessage = '❌ 找不到相機設備。請確認相機已正確連接'
            break
          case 'NotSupportedError':
            errorMessage = '❌ 瀏覽器不支持相機功能。請使用Chrome、Firefox或Safari'
            break
          case 'NotReadableError':
            errorMessage = '❌ 相機被其他應用占用。請關閉其他相機應用後重試'
            break
          case 'OverconstrainedError':
            errorMessage = '❌ 相機不支持要求的設置。正在嘗試基本設置...'
            // 嘗試基本設置
            setTimeout(() => startBasicCamera(), 1000)
            break
          default:
            errorMessage = `❌ 相機啟動失敗: ${error.message}`
        }
      }
      
      setDebugInfo(errorMessage)
      onError?.(errorMessage)
    }
  }

  // 基本相機啟動（降級方案）
  const startBasicCamera = async () => {
    try {
      setDebugInfo('嘗試基本相機設置...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setDebugInfo('基本相機設置成功！')
        setShowCamera(true)
        setTimeout(() => setDebugInfo(''), 2000)
      }
    } catch (error) {
      console.error('基本相機設置也失敗:', error)
      setDebugInfo('❌ 所有相機設置都失敗。請檢查相機權限和設備連接')
    }
  }

  // 圖像預處理函數
  const preprocessImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const context = canvas.getContext('2d')!
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // 轉換為灰度並增強對比度
    for (let i = 0; i < data.length; i += 4) {
      // 計算灰度值
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      
      // 增強對比度（簡單閾值處理）
      const enhanced = gray > 128 ? 255 : 0
      
      data[i] = enhanced     // R
      data[i + 1] = enhanced // G
      data[i + 2] = enhanced // B
    }

    context.putImageData(imageData, 0, 0)
    return canvas
  }

  // 拍照並進行OCR識別
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsScanning(true)
    setScanProgress(0)
    setDebugInfo('開始拍照...')

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')!

      // 設置畫布尺寸，使用較高解析度
      const scale = 2 // 放大倍數提高OCR精度
      canvas.width = video.videoWidth * scale
      canvas.height = video.videoHeight * scale
      context.scale(scale, scale)

      // 拍攝照片
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
      
      setDebugInfo('處理圖像...')
      
      // 預處理圖像
      const processedCanvas = preprocessImage(canvas)
      const imageDataUrl = processedCanvas.toDataURL('image/png')

      setDebugInfo('初始化OCR引擎...')
      
      // 初始化worker
      const worker = await initializeWorker()

      setDebugInfo('開始識別文字...')

      // 使用 Tesseract.js 進行 OCR 識別
      const { data: { text } } = await worker.recognize(imageDataUrl)
      
      setDebugInfo(`OCR原始結果: ${text}`)

      // 解析OCR結果
      const result = parseHKIDText(text)
      
      if (result) {
        setDebugInfo('識別成功！')
        onScanResult(result)
        stopCamera()
      } else {
        setDebugInfo('未能識別身份證資訊')
        onError?.('未能識別身份證資訊，請確保身份證清晰可見或使用手動輸入')
      }
    } catch (error) {
      console.error('OCR識別失敗:', error)
      setDebugInfo(`識別失敗: ${error}`)
      onError?.('身份證識別失敗，請重新拍攝或使用手動輸入')
    } finally {
      setIsScanning(false)
      setScanProgress(0)
    }
  }

  // 快速掃描（僅識別身份證號碼）
  const quickScan = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsScanning(true)
    setScanProgress(0)
    setDebugInfo('開始快速掃描...')

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')!

      // 使用較小的解析度提升速度
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // 拍攝照片
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      setDebugInfo('快速處理圖像...')
      
      // 簡單的黑白處理
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const val = avg > 128 ? 255 : 0
        data[i] = data[i + 1] = data[i + 2] = val
      }
      
      context.putImageData(imageData, 0, 0)
      const imageDataUrl = canvas.toDataURL('image/png')

      setDebugInfo('使用簡化OCR識別...')

      // 使用基本的 Tesseract 識別，只識別數字和字母
      const { data: { text } } = await Tesseract.recognize(
        imageDataUrl,
        'eng',
        {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setScanProgress(Math.round(m.progress * 100))
            }
          }
        }
      )
      
      setDebugInfo(`快速識別結果: ${text}`)

      // 只提取身份證號碼
      const hkidMatch = text.match(/[A-Z]{1,2}\d{6}[0-9A]/g)
      
      if (hkidMatch) {
        let hkid = hkidMatch[0]
        // 標準化格式
        if (!/\([0-9A]\)$/.test(hkid)) {
          const match = hkid.match(/([A-Z]{1,2}\d{6})([0-9A])/)
          if (match) {
            hkid = `${match[1]}(${match[2]})`
          }
        }
        
        onScanResult({
          name: '', // 快速掃描不提取姓名
          hkid: hkid,
          dob: '' // 快速掃描不提取日期
        })
        stopCamera()
      } else {
        onError?.('未能識別身份證號碼，請使用完整掃描或手動輸入')
      }
    } catch (error) {
      console.error('快速掃描失敗:', error)
      onError?.('快速掃描失敗，請嘗試完整掃描或手動輸入')
    } finally {
      setIsScanning(false)
      setScanProgress(0)
    }
  }

  // 測試相機連接
  const testCamera = async () => {
    setDebugInfo('開始相機診斷測試...')
    
    try {
      // 檢查HTTPS環境
      if (!isHTTPS()) {
        setDebugInfo('❌ 相機功能需要 HTTPS 環境。在非HTTPS環境下，相機可能無法正常工作')
        onError?.('請使用 https://localhost:3000 或將應用部署到HTTPS服務器')
        return
      }

      // 檢查瀏覽器支持
      if (!navigator.mediaDevices) {
        setDebugInfo('❌ 瀏覽器不支持 MediaDevices API')
        onError?.('瀏覽器不支持相機功能，請使用現代瀏覽器')
        return
      }

      if (!navigator.mediaDevices.getUserMedia) {
        setDebugInfo('❌ 瀏覽器不支持 getUserMedia')
        onError?.('瀏覽器不支持相機功能，請更新瀏覽器')
        return
      }

      // 檢查可用設備
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      setDebugInfo(`✅ 找到 ${videoDevices.length} 個視頻設備`)
      
      if (videoDevices.length === 0) {
        setDebugInfo('❌ 找不到相機設備')
        onError?.('系統中沒有找到相機設備')
        return
      }

      // 測試簡單的相機訪問
      setDebugInfo('🔍 測試相機權限...')
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      })
      
      setDebugInfo('✅ 相機權限正常，正在關閉測試流...')
      testStream.getTracks().forEach(track => track.stop())
      
      setTimeout(() => {
        setDebugInfo('✅ 相機診斷完成，可以正常使用相機掃描')
        setTimeout(() => setDebugInfo(''), 3000)
      }, 1000)
      
    } catch (error) {
      console.error('相機測試失敗:', error)
      let message = '相機測試失敗'
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            message = '❌ 相機權限被拒絕，請在瀏覽器設置中允許相機權限'
            break
          case 'NotFoundError':
            message = '❌ 找不到相機設備，請檢查相機是否正確連接'
            break
          case 'NotSupportedError':
            message = '❌ 瀏覽器不支持相機功能'
            break
          case 'NotReadableError':
            message = '❌ 相機被其他應用占用，請關閉其他相機應用'
            break
          default:
            message = `❌ 相機測試失敗: ${error.message}`
        }
      }
      
      setDebugInfo(message)
      onError?.(message)
    }
  }

  // 解析OCR文本，提取身份證信息
  const parseHKIDText = (text: string): HKIDScanResult | null => {
    console.log('OCR識別文本:', text)
    
    // 清理文本，移除多餘空格和換行符
    const cleanText = text.replace(/\s+/g, ' ').trim()
    console.log('清理後文本:', cleanText)
    
    // 身份證號碼正則表達式（更寬鬆的匹配）
    const hkidRegexes = [
      /[A-Z]{1,2}\d{6}\([0-9A]\)/g,  // 標準格式 A123456(7)
      /[A-Z]{1,2}\s?\d{6}\s?\([0-9A]\)/g,  // 有空格的格式
      /[A-Z]{1,2}\d{6}[0-9A]/g,  // 沒有括號的格式
    ]
    
    let hkidMatch = null
    for (const regex of hkidRegexes) {
      hkidMatch = text.match(regex)
      if (hkidMatch) break
    }
    
    // 出生日期正則表達式（各種格式）
    const dobRegexes = [
      /(\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}日?)/g,  // YYYY-MM-DD 或中文格式
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,        // DD-MM-YYYY
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2})/g,        // DD-MM-YY
      /(\d{2}\s?\d{2}\s?\d{4})/g,                 // DDMMYYYY
    ]
    
    let dobMatch = null
    for (const regex of dobRegexes) {
      dobMatch = text.match(regex)
      if (dobMatch) break
    }
    
    // 中文姓名正則表達式（改進版）
    const nameRegexes = [
      /([一-龯]{2,4})/g,  // 2-4個中文字符
      /([A-Z][a-z]+\s?[A-Z][a-z]+)/g,  // 英文姓名格式
    ]
    
    let nameMatches = null
    for (const regex of nameRegexes) {
      nameMatches = text.match(regex)
      if (nameMatches && nameMatches.length > 0) break
    }

    console.log('身份證號碼匹配:', hkidMatch)
    console.log('出生日期匹配:', dobMatch)
    console.log('姓名匹配:', nameMatches)
    
    if (!hkidMatch) {
      return null
    }

    let name = ''
    let dob = ''
    let hkid = hkidMatch[0]
    
    // 標準化身份證號碼格式
    if (!/\([0-9A]\)$/.test(hkid)) {
      // 如果沒有括號，嘗試添加
      const match = hkid.match(/([A-Z]{1,2}\d{6})([0-9A])/)
      if (match) {
        hkid = `${match[1]}(${match[2]})`
      }
    }
    
    // 提取姓名
    if (nameMatches) {
      // 過濾掉可能是其他信息的匹配（如地址、職業等）
      const possibleNames = nameMatches.filter(match => 
        match.length >= 2 && 
        match.length <= 8 &&
        !match.includes('香港') &&
        !match.includes('身份') &&
        !match.includes('證件')
      )
      
      if (possibleNames.length > 0) {
        name = possibleNames[0]
      }
    }
    
    // 提取出生日期並格式化
    if (dobMatch) {
      dob = formatDate(dobMatch[0])
    }

    console.log('最終解析結果:', { name, hkid, dob })

    return {
      name: name || '',
      hkid: hkid || '',
      dob: dob || ''
    }
  }

  // 格式化日期為 YYYY-MM-DD
  const formatDate = (dateStr: string): string => {
    try {
      console.log('格式化日期輸入:', dateStr)
      
      // 移除中文字符
      let cleanDate = dateStr.replace(/[年月日]/g, '-').replace(/--/g, '-').replace(/-$/, '')
      
      let parts: string[] = []
      
      // 處理各種分隔符
      if (cleanDate.includes('-')) {
        parts = cleanDate.split('-')
      } else if (cleanDate.includes('/')) {
        parts = cleanDate.split('/')
      } else if (cleanDate.includes(' ')) {
        parts = cleanDate.split(' ')
      } else if (cleanDate.length === 8) {
        // DDMMYYYY 或 YYYYMMDD 格式
        if (parseInt(cleanDate.substring(0, 4)) > 1900) {
          // YYYYMMDD
          parts = [cleanDate.substring(0, 4), cleanDate.substring(4, 6), cleanDate.substring(6, 8)]
        } else {
          // DDMMYYYY
          parts = [cleanDate.substring(0, 2), cleanDate.substring(2, 4), cleanDate.substring(4, 8)]
        }
      }

      if (parts.length !== 3) return ''

      let year: string, month: string, day: string

      // 判斷日期格式
      if (parts[0].length === 4) {
        // YYYY-MM-DD 格式
        [year, month, day] = parts
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY 格式
        [day, month, year] = parts
      } else {
        // 兩位數年份，假設是21世紀初或20世紀末
        let yearNum = parseInt(parts[2])
        if (yearNum < 50) {
          year = (2000 + yearNum).toString()
        } else {
          year = (1900 + yearNum).toString()
        }
        [day, month] = parts
      }

      // 確保月份和日期是兩位數
      month = month.padStart(2, '0')
      day = day.padStart(2, '0')

      // 驗證日期合理性
      const monthNum = parseInt(month)
      const dayNum = parseInt(day)
      const yearNum = parseInt(year)
      
      if (monthNum < 1 || monthNum > 12) return ''
      if (dayNum < 1 || dayNum > 31) return ''
      if (yearNum < 1900 || yearNum > new Date().getFullYear()) return ''

      const formatted = `${year}-${month}-${day}`
      console.log('格式化日期結果:', formatted)
      return formatted
    } catch (error) {
      console.error('日期格式化錯誤:', error)
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
            
            <button
              type="button"
              onClick={testCamera}
              className="btn-apple-tertiary w-full flex items-center justify-center space-x-2 py-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-base">🔧 測試相機連接</span>
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
                  • 環境檢測：{isHTTPS() ? '✅ HTTPS環境正常' : '❌ 需要HTTPS環境'}<br />
                  • 瀏覽器：{navigator.mediaDevices ? '✅ 支持相機' : '❌ 不支持相機'}<br />
                  • 請確保身份證放置平整，光線充足
                </p>
              </div>
            </div>
          </div>
          
          {/* 調試信息顯示 */}
          {debugInfo && (
            <div className="bg-warning-light border border-warning rounded-apple-sm p-3">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-apple-caption font-medium text-warning">系統信息</p>
                  <p className="text-apple-caption text-warning mt-1 font-mono text-xs break-words">
                    {debugInfo}
                  </p>
                </div>
              </div>
            </div>
          )}
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
              controls={false}
              style={{ 
                background: '#000',
                minHeight: '320px'
              }}
              onLoadStart={() => setDebugInfo('正在載入視頻流...')}
              onLoadedData={() => setDebugInfo('視頻流載入完成')}
              onPlay={() => setDebugInfo('視頻開始播放')}
              onError={(e) => {
                console.error('視頻錯誤:', e)
                setDebugInfo('視頻載入錯誤')
              }}
            />
            
            {/* 載入指示器 */}
            {!debugInfo.includes('視頻開始播放') && showCamera && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                <div className="text-center text-white">
                  <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">正在啟動相機...</p>
                </div>
              </div>
            )}
            
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
              {/* 調試信息 */}
              {debugInfo && (
                <div className="bg-info-light border border-info rounded-apple-sm p-2">
                  <p className="text-apple-caption text-info font-mono text-xs">
                    {debugInfo}
                  </p>
                </div>
              )}
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
          
          {/* 快速識別按鈕（簡化版）*/}
          <div className="border-t border-bg-secondary pt-3">
            <button
              type="button"
              onClick={quickScan}
              disabled={isScanning}
              className="btn-apple-secondary w-full text-sm disabled:opacity-50"
            >
              ⚡ 快速識別（僅識別身份證號）
            </button>
            <p className="text-apple-caption text-text-secondary mt-1 text-center">
              如完整識別失敗，可使用此功能僅識別身份證號碼
            </p>
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
