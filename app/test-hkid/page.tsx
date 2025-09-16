'use client'

import { useState } from 'react'
import HKIDScanner from '../../components/HKIDScanner'

interface HKIDResult {
  name: string
  hkid: string
  dob: string
}

export default function HKIDTestPage() {
  const [result, setResult] = useState<HKIDResult | null>(null)
  const [error, setError] = useState<string>('')

  const handleScanResult = (scanResult: HKIDResult) => {
    setResult(scanResult)
    setError('')
    console.log('掃描結果:', scanResult)
  }

  const handleError = (errorMsg: string) => {
    setError(errorMsg)
    console.error('掃描錯誤:', errorMsg)
  }

  const resetTest = () => {
    setResult(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-apple-title1 font-bold text-text-primary mb-4">
              香港身份證掃描器測試
            </h1>
            <p className="text-apple-body text-text-secondary">
              測試改進版的身份證掃描功能
            </p>
          </div>

          {/* 掃描器組件 */}
          <div className="bg-bg-secondary rounded-apple-lg p-6 mb-6">
            <HKIDScanner 
              onScanResult={handleScanResult}
              onError={handleError}
            />
          </div>

          {/* 錯誤顯示 */}
          {error && (
            <div className="bg-danger-light border border-danger rounded-apple-sm p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-danger mb-1">掃描錯誤</h3>
                  <p className="text-apple-caption text-danger">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 結果顯示 */}
          {result && (
            <div className="bg-success-light border border-success rounded-apple-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-apple-headline font-medium text-success">掃描結果</h3>
                <button
                  onClick={resetTest}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="border-l-4 border-primary pl-4">
                  <label className="block text-apple-caption font-medium text-text-secondary mb-1">
                    客戶姓名
                  </label>
                  <p className="text-apple-body text-text-primary font-medium">
                    {result.name || '(未識別)'}
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <label className="block text-apple-caption font-medium text-text-secondary mb-1">
                    身份證號碼
                  </label>
                  <p className="text-apple-body text-text-primary font-mono">
                    {result.hkid || '(未識別)'}
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <label className="block text-apple-caption font-medium text-text-secondary mb-1">
                    出生日期
                  </label>
                  <p className="text-apple-body text-text-primary">
                    {result.dob || '(未識別)'}
                  </p>
                </div>
              </div>

              {/* JSON 原始數據 */}
              <details className="mt-4">
                <summary className="cursor-pointer text-apple-caption text-text-secondary hover:text-text-primary">
                  查看原始數據
                </summary>
                <pre className="mt-2 p-3 bg-bg-primary rounded text-apple-caption font-mono text-text-secondary overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* 使用說明 */}
          <div className="bg-info-light border border-info rounded-apple-sm p-6">
            <h3 className="text-apple-headline font-medium text-info mb-3">使用說明</h3>
            <div className="space-y-2 text-apple-body text-info">
              <p>• 點擊「相機掃描身份證」啟動相機功能</p>
              <p>• 將身份證水平放置在掃描框內</p>
              <p>• 確保光線充足，避免反光</p>
              <p>• 點擊「拍照並識別」進行完整掃描</p>
              <p>• 如掃描失敗，可嘗試「快速識別」或「手動輸入」</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
