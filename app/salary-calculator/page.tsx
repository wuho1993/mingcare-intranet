'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SalaryCalculatorPage() {
  const router = useRouter()
  const [staffData, setStaffData] = useState({
    name: '',
    baseSalary: '',
    overtimeHours: '',
    allowances: '',
    deductions: ''
  })
  const [calculationResult, setCalculationResult] = useState<{
    baseSalary: number;
    overtimePay: number;
    allowances: number;
    deductions: number;
    totalSalary: number;
  } | null>(null)

  const calculateSalary = () => {
    const base = parseFloat(staffData.baseSalary) || 0
    const overtime = parseFloat(staffData.overtimeHours) || 0
    const allowances = parseFloat(staffData.allowances) || 0
    const deductions = parseFloat(staffData.deductions) || 0
    
    const overtimePay = overtime * 200 // 假設每小時加班費200元
    const totalSalary = base + overtimePay + allowances - deductions

    setCalculationResult({
      baseSalary: base,
      overtimePay: overtimePay,
      allowances: allowances,
      deductions: deductions,
      totalSalary: totalSalary
    })
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8 fade-in-apple">
          <button 
            onClick={() => router.push('/dashboard')}
            className="btn-apple-secondary mb-4"
          >
            ← 返回儀表板
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">護理人員工資計算</h1>
          <p className="text-text-secondary mt-2">計算護理人員薪資、加班費及津貼</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="card-apple">
            <div className="card-apple-header">
              <h2 className="text-xl font-semibold">薪資資料輸入</h2>
            </div>
            <div className="card-apple-content">
              <div className="space-y-6">
                <div className="form-group-apple">
                  <label className="form-label-apple">護理人員姓名</label>
                  <input
                    type="text"
                    className="form-input-apple"
                    value={staffData.name}
                    onChange={(e) => setStaffData({...staffData, name: e.target.value})}
                    placeholder="請輸入護理人員姓名"
                  />
                </div>

                <div className="form-group-apple">
                  <label className="form-label-apple">基本薪資 (元)</label>
                  <input
                    type="number"
                    className="form-input-apple"
                    value={staffData.baseSalary}
                    onChange={(e) => setStaffData({...staffData, baseSalary: e.target.value})}
                    placeholder="請輸入基本薪資"
                  />
                </div>

                <div className="form-group-apple">
                  <label className="form-label-apple">加班時數 (小時)</label>
                  <input
                    type="number"
                    className="form-input-apple"
                    value={staffData.overtimeHours}
                    onChange={(e) => setStaffData({...staffData, overtimeHours: e.target.value})}
                    placeholder="請輸入加班時數"
                  />
                </div>

                <div className="form-group-apple">
                  <label className="form-label-apple">津貼補助 (元)</label>
                  <input
                    type="number"
                    className="form-input-apple"
                    value={staffData.allowances}
                    onChange={(e) => setStaffData({...staffData, allowances: e.target.value})}
                    placeholder="請輸入津貼補助金額"
                  />
                </div>

                <div className="form-group-apple">
                  <label className="form-label-apple">扣款項目 (元)</label>
                  <input
                    type="number"
                    className="form-input-apple"
                    value={staffData.deductions}
                    onChange={(e) => setStaffData({...staffData, deductions: e.target.value})}
                    placeholder="請輸入扣款金額"
                  />
                </div>

                <button
                  onClick={calculateSalary}
                  className="btn-apple-primary w-full"
                >
                  🧮 計算薪資
                </button>
              </div>
            </div>
          </div>

          {/* Calculation Result */}
          <div className="card-apple">
            <div className="card-apple-header">
              <h2 className="text-xl font-semibold">薪資計算結果</h2>
            </div>
            <div className="card-apple-content">
              {calculationResult ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      {staffData.name || '護理人員'} 薪資明細
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">基本薪資:</span>
                      <span className="font-semibold">NT$ {calculationResult.baseSalary.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">加班費:</span>
                      <span className="font-semibold">NT$ {calculationResult.overtimePay.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">津貼補助:</span>
                      <span className="font-semibold text-green-600">+ NT$ {calculationResult.allowances.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">扣款項目:</span>
                      <span className="font-semibold text-red-600">- NT$ {calculationResult.deductions.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-3 border-t-2 border-border-medium mt-4">
                      <span className="text-lg font-bold text-gray-900">實領薪資:</span>
                      <span className="text-2xl font-bold text-green-600">
                        NT$ {calculationResult.totalSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button className="btn-apple-primary w-full">
                      📄 生成薪資單
                    </button>
                    <button className="btn-apple-secondary w-full">
                      💾 保存計算記錄
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🧮</div>
                  <p className="text-gray-500">請填寫左側資料並點擊計算</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => router.push('/payroll')}
            className="card-apple hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="card-apple-content text-center">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-semibold">薪資管理</h3>
              <p className="text-sm text-gray-600">查看薪資記錄</p>
            </div>
          </button>

          <button 
            onClick={() => router.push('/care-staff')}
            className="card-apple hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="card-apple-content text-center">
              <div className="text-3xl mb-2">👩‍⚕️</div>
              <h3 className="font-semibold">護理人員</h3>
              <p className="text-sm text-gray-600">管理護理人員資料</p>
            </div>
          </button>

          <button 
            onClick={() => router.push('/commissions')}
            className="card-apple hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="card-apple-content text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold">佣金管理</h3>
              <p className="text-sm text-gray-600">查看佣金統計</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}