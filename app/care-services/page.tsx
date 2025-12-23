'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getAssetPath } from '../../utils/asset-path'
import type { User } from '@supabase/supabase-js'

export default function CareServicesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('detailed-reports')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center fade-in-apple">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">載入中...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'detailed-reports', name: '詳細報表', icon: '📊' },
    { id: 'voucher-calculator', name: '社區券計數機', icon: '🧮' },
    { id: 'schedule-management', name: '排程管理', icon: '📅' },
    { id: 'business-overview', name: '業務概覽', icon: '📈' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'detailed-reports':
        return <DetailedReportsComponent />
      case 'voucher-calculator':
        return <VoucherCalculatorComponent />
      case 'schedule-management':
        return <ScheduleManagementComponent />
      case 'business-overview':
        return <BusinessOverviewComponent />
      default:
        return <DetailedReportsComponent />
    }
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <div className="card-apple border-b border-border-light rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  className="h-8 w-auto" 
                  src={getAssetPath("images/mingcare-logo.png")} 
                  alt="MingCare" 
                />
              </div>
              <div className="ml-4">
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">護理服務管理</h1>
                <p className="text-sm text-text-secondary hidden sm:block">Care Service Management System</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-apple-secondary"
            >
              ← 返回儀表板
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-bg-primary shadow-sm border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide py-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                } whitespace-nowrap py-3 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center gap-2 rounded-t-lg transition-all duration-200`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderTabContent()}
      </div>
    </div>
  )
}

// Component for 詳細報表 (Detailed Reports)
function DetailedReportsComponent() {
  return (
    <div className="space-y-6 fade-in-apple">
      {/* Header Actions */}
      <div className="card-apple">
        <div className="card-apple-content">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-text-primary">詳細報表</h2>
            <div className="flex flex-wrap gap-3">
              <button className="btn-apple-secondary text-sm">
                <span className="mr-2">📄</span>
                匯出報表
              </button>
              <button className="btn-apple-primary text-sm">
                <span className="mr-2">🔍</span>
                進階篩選
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card-apple" style={{ animationDelay: '0.1s' }}>
        <div className="card-apple-content">
          <h3 className="text-sm font-semibold text-text-primary mb-4">篩選條件</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">服務日期</label>
              <input
                type="date"
                className="form-input-apple w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">客戶姓名</label>
              <input
                type="text"
                placeholder="搜尋客戶"
                className="form-input-apple w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">護理人員</label>
              <select className="form-select-apple w-full text-sm">
                <option value="">全部</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">服務類型</label>
              <select className="form-select-apple w-full text-sm">
                <option value="">全部</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn-apple-primary w-full text-sm">
                🔍 搜尋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ animationDelay: '0.2s' }}>
        <div className="card-apple card-hover-float bg-primary/5">
          <div className="card-apple-content">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white text-lg sm:text-xl">👥</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-text-secondary">總服務次數</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-apple card-hover-float bg-success/5">
          <div className="card-apple-content">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success rounded-xl flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl">⏰</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-text-secondary">總服務時數</p>
                <p className="text-xl sm:text-2xl font-bold text-success">0 小時</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-apple card-hover-float bg-warning/5">
          <div className="card-apple-content">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning rounded-xl flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl">💰</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-text-secondary">總服務費用</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">$0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-apple card-hover-float bg-purple-500/5">
          <div className="card-apple-content">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl">👨‍⚕️</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-text-secondary">活躍護理人員</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card-apple" style={{ animationDelay: '0.3s' }}>
        <div className="card-apple-header border-b border-border-light">
          <h3 className="text-lg font-semibold text-text-primary">服務記錄詳細列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-2026 w-full">
            <thead>
              <tr>
                <th className="text-left">服務日期</th>
                <th className="text-left">客戶姓名</th>
                <th className="text-left hidden sm:table-cell">護理人員</th>
                <th className="text-left hidden md:table-cell">服務類型</th>
                <th className="text-left hidden lg:table-cell">服務時數</th>
                <th className="text-left hidden lg:table-cell">服務費用</th>
                <th className="text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center text-text-tertiary">
                    <span className="text-5xl mb-4 opacity-50">📋</span>
                    <p className="text-lg font-medium mb-1">暫無服務記錄</p>
                    <p className="text-sm">請調整篩選條件或添加新的服務記錄</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Placeholder components for other tabs
function VoucherCalculatorComponent() {
  return (
    <div className="card-apple fade-in-apple">
      <div className="card-apple-content text-center py-16">
        <span className="text-6xl mb-6 block">🧮</span>
        <h2 className="text-2xl font-bold text-text-primary mb-2">社區券計數機</h2>
        <p className="text-text-secondary">功能開發中，敬請期待...</p>
      </div>
    </div>
  )
}

function ScheduleManagementComponent() {
  return (
    <div className="card-apple fade-in-apple">
      <div className="card-apple-content text-center py-16">
        <span className="text-6xl mb-6 block">📅</span>
        <h2 className="text-2xl font-bold text-text-primary mb-2">排程管理</h2>
        <p className="text-text-secondary">功能開發中，敬請期待...</p>
      </div>
    </div>
  )
}

function BusinessOverviewComponent() {
  return (
    <div className="card-apple fade-in-apple">
      <div className="card-apple-content text-center py-16">
        <span className="text-6xl mb-6 block">📈</span>
        <h2 className="text-2xl font-bold text-text-primary mb-2">業務概覽</h2>
        <p className="text-text-secondary">功能開發中，敬請期待...</p>
      </div>
    </div>
  )
}
