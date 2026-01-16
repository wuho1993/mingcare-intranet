'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'
import { getAssetPath } from '../../utils/asset-path'
import LoadingScreen from '../../components/LoadingScreen'

interface User {
  id: string
  email?: string
}

type HkoRhrreadResponse = {
  updateTime?: string
  warningMessage?: string[]
  temperature?: {
    data?: Array<{ place?: string; value?: string; unit?: string }>
    recordTime?: string
  }
  humidity?: {
    data?: Array<{ place?: string; value?: string; unit?: string }>
    recordTime?: string
  }
  rainfall?: {
    data?: Array<{ place?: string; max?: string; max1?: string; value?: string; value1?: string; min?: string; min1?: string; unit?: string; unit1?: string }>
    startTime?: string
    endTime?: string
  }
}

type HkoWeatherSnapshot = {
  updatedAt?: string
  temperature?: { place: string; value: string; unit: string }
  humidity?: { place: string; value: string; unit: string }
  rainfall?: { place: string; value: string; unit: string }
  warnings: string[]
}

type HkoFndResponse = {
  updateTime?: string
  weatherForecast?: Array<{
    forecastDate?: string
    week?: string
    forecastWeather?: string
    forecastMaxtemp?: { value?: string; unit?: string }
    forecastMintemp?: { value?: string; unit?: string }
    forecastMaxrh?: { value?: string; unit?: string }
    forecastMinrh?: { value?: string; unit?: string }
    ForecastIcon?: number | string
    PSR?: string
  }>
}

type HkoForecastDay = {
  dateLabel: string
  weekLabel?: string
  iconUrl?: string
  weather?: string
  minTemp?: string
  maxTemp?: string
  psr?: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [hkoStatus, setHkoStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hkoWeather, setHkoWeather] = useState<HkoWeatherSnapshot | null>(null)
  const [hkoForecast, setHkoForecast] = useState<HkoForecastDay[]>([])
  const [expandedForecastIndex, setExpandedForecastIndex] = useState<number | null>(null)
  const [expandedWarningIndex, setExpandedWarningIndex] = useState<number | null>(null)
  const [allHkoData, setAllHkoData] = useState<{
    temperature: Array<{ place: string; value: string; unit: string }>
    humidity: Array<{ place: string; value: string; unit: string }>
    rainfall: Array<{ place: string; value: string; unit: string }>
  } | null>(null)
  const [selectedTempPlace, setSelectedTempPlace] = useState<string>('京士柏')
  const [selectedHumidityPlace, setSelectedHumidityPlace] = useState<string>('香港天文台')
  const [selectedRainfallPlace, setSelectedRainfallPlace] = useState<string>('九龍城')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push('/')
      }
      setLoading(false)
    }
    getUser()
  }, [router])

  // 實時時鐘
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 香港天文台（開放數據）即時天氣
  useEffect(() => {
    const controller = new AbortController()

    const preferredPlaces = ['香港天文台', '京士柏', '香港公園', '黃大仙', '深水埗']

    const pickReading = <T extends { place?: string }>(data?: T[]) => {
      if (!data || data.length === 0) return undefined
      return (
        data.find((row) => row.place && preferredPlaces.includes(row.place)) ??
        data.find((row) => row.place) ??
        data[0]
      )
    }

    const normalizeUnit = (unit?: string) => {
      const u = (unit ?? '').trim().toLowerCase()
      if (u === 'percent' || u === '%' || u === 'percentage') return '%'
      if (u === 'c' || u === '°c') return '°C'
      if (u === 'mm') return 'mm'
      return unit ?? ''
    }

    const hkoForecastIconUrl = (icon?: number | string) => {
      const raw = typeof icon === 'number' ? String(icon) : (icon ?? '').trim()
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) return undefined
      return `https://www.hko.gov.hk/images/HKOWxIconOutline/pic${n}.png`
    }

    const formatYmd = (yyyymmdd?: string) => {
      if (!yyyymmdd || yyyymmdd.length !== 8) return '—'
      const y = Number(yyyymmdd.slice(0, 4))
      const m = Number(yyyymmdd.slice(4, 6))
      const d = Number(yyyymmdd.slice(6, 8))
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return '—'
      const dt = new Date(y, m - 1, d)
      return dt.toLocaleDateString('zh-HK', { month: 'numeric', day: 'numeric' })
    }

    const fetchHko = async () => {
      try {
        setHkoStatus('loading')
        const [rhrRes, fndRes] = await Promise.all([
          fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc', {
            signal: controller.signal,
          }),
          fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc', {
            signal: controller.signal,
          }),
        ])

        if (!rhrRes.ok) throw new Error(`HKO rhrread HTTP ${rhrRes.status}`)
        if (!fndRes.ok) throw new Error(`HKO fnd HTTP ${fndRes.status}`)

        const json = (await rhrRes.json()) as HkoRhrreadResponse
        const fndJson = (await fndRes.json()) as HkoFndResponse

        // Store all location data for picker
        const allTempData = (json.temperature?.data ?? [])
          .filter((d) => d.place && d.value)
          .map((d) => ({ place: d.place!, value: d.value!, unit: normalizeUnit(d.unit) }))
        const allHumidityData = (json.humidity?.data ?? [])
          .filter((d) => d.place && d.value)
          .map((d) => ({ place: d.place!, value: d.value!, unit: normalizeUnit(d.unit) }))
        const allRainfallData = (json.rainfall?.data ?? [])
          .filter((d) => d.place)
          .map((d) => {
            const val = d.max ?? d.max1 ?? d.value ?? d.value1 ?? d.min ?? d.min1 ?? '0'
            return { place: d.place!, value: String(val), unit: normalizeUnit(d.unit ?? d.unit1 ?? 'mm') }
          })

        setAllHkoData({
          temperature: allTempData,
          humidity: allHumidityData,
          rainfall: allRainfallData,
        })

        const temp = pickReading(json.temperature?.data)
        const humidity = pickReading(json.humidity?.data)

        const rainfallRow = pickReading(json.rainfall?.data)
        const rainfallValue =
          rainfallRow?.max ??
          rainfallRow?.max1 ??
          rainfallRow?.value ??
          rainfallRow?.value1 ??
          rainfallRow?.min ??
          rainfallRow?.min1

        const warnings: string[] = Array.isArray(json.warningMessage)
          ? json.warningMessage.filter((m) => typeof m === 'string' && m.trim().length > 0)
          : typeof json.warningMessage === 'string' && (json.warningMessage as string).trim().length > 0
            ? [json.warningMessage as string]
            : []

        const snapshot: HkoWeatherSnapshot = {
          updatedAt: json.updateTime ?? json.temperature?.recordTime ?? json.humidity?.recordTime ?? json.rainfall?.endTime,
          temperature: temp
            ? { place: temp.place ?? '—', value: temp.value ?? '—', unit: normalizeUnit(temp.unit) }
            : undefined,
          humidity: humidity
            ? { place: humidity.place ?? '—', value: humidity.value ?? '—', unit: normalizeUnit(humidity.unit) }
            : undefined,
          rainfall:
            rainfallRow && rainfallValue !== undefined && rainfallValue !== null
              ? {
                  place: rainfallRow.place ?? '—',
                  value: String(rainfallValue),
                  unit: normalizeUnit(rainfallRow.unit ?? rainfallRow.unit1 ?? 'mm'),
                }
              : undefined,
          warnings,
        }

        const forecastDays: HkoForecastDay[] = Array.isArray(fndJson.weatherForecast)
          ? fndJson.weatherForecast.slice(0, 4).map((d) => {
              const minUnit = normalizeUnit(d.forecastMintemp?.unit)
              const maxUnit = normalizeUnit(d.forecastMaxtemp?.unit)
              return {
                dateLabel: formatYmd(d.forecastDate),
                weekLabel: d.week,
                iconUrl: hkoForecastIconUrl(d.ForecastIcon),
                weather: d.forecastWeather,
                minTemp: d.forecastMintemp?.value ? `${d.forecastMintemp.value}${minUnit}` : undefined,
                maxTemp: d.forecastMaxtemp?.value ? `${d.forecastMaxtemp.value}${maxUnit}` : undefined,
                psr: d.PSR,
              }
            })
          : []

        setHkoWeather(snapshot)
        setHkoForecast(forecastDays)
        setHkoStatus('ready')
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return
        console.error('HKO 天氣載入失敗:', err)
        setHkoStatus('error')
      }
    }

    fetchHko()
    const refresh = setInterval(fetchHko, 5 * 60 * 1000)

    return () => {
      controller.abort()
      clearInterval(refresh)
    }
  }, [])

  // （已移除）今日摘要：用戶不需要

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      const shouldClearRemembered = confirm('是否清除記憶的登入信息？')
      if (shouldClearRemembered) {
        localStorage.removeItem('mingcare_email')
        localStorage.removeItem('mingcare_password')
        localStorage.removeItem('mingcare_remember')
      }
      router.push('/')
    } catch (error) {
      console.error('登出錯誤:', error)
      router.push('/')
    }
  }

  if (loading) {
    return <LoadingScreen message="正在載入控制台..." />
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return '早安'
    if (hour < 18) return '午安'
    return '晚安'
  }

  const navigationItems = [
    {
      title: '客戶管理',
      description: '管理客戶資料與服務記錄',
      href: '/clients',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      accent: 'primary',
      layout: 'xl:col-span-7'
    },
    {
      title: '護理服務',
      description: '服務排程與記錄管理',
      href: '/services',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      accent: 'success',
      layout: 'xl:col-span-5'
    },
    {
      title: '護理人員',
      description: '人員資料與排班管理',
      href: '/care-staff',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      accent: 'info',
      layout: 'xl:col-span-4'
    },
    {
      title: '佣金計算',
      description: '佣金與績效獎勵計算',
      href: '/commissions',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      accent: 'warning',
      layout: 'xl:col-span-4'
    },
    {
      title: '打卡記錄',
      description: '員工出勤與位置記錄',
      href: '/clock-records',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'error',
      layout: 'xl:col-span-4'
    },
    {
      title: '系統通知',
      description: '通知與公告訊息管理',
      href: '/notifications',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
      accent: 'primary',
      layout: 'xl:col-span-12'
    }
  ]

  const accentClasses = (accent: string) => {
    switch (accent) {
      case 'success':
        return {
          iconBg: 'bg-success-light',
          iconText: 'text-success',
          ring: 'ring-success/20',
        }
      case 'warning':
        return {
          iconBg: 'bg-warning-light',
          iconText: 'text-warning',
          ring: 'ring-warning/20',
        }
      case 'error':
        return {
          iconBg: 'bg-error-light',
          iconText: 'text-error',
          ring: 'ring-error/20',
        }
      case 'info':
        return {
          iconBg: 'bg-info-light',
          iconText: 'text-info',
          ring: 'ring-info/20',
        }
      case 'primary':
      default:
        return {
          iconBg: 'bg-primary-50',
          iconText: 'text-primary',
          ring: 'ring-primary/20',
        }
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }

  const formatHkoUpdateTime = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatHumidity = (value?: string, unit?: string) => {
    if (!value) return '—'
    const u = (unit ?? '').trim()
    if (u === '%' || u.toLowerCase() === 'percent' || u.toLowerCase() === 'percentage') return `${value}%`
    if (!u) return `${value}%`
    return `${value}${u}`
  }

  const formatTemp = (value?: string, unit?: string) => {
    if (!value) return '—'
    const rawValue = String(value).trim()
    const cleanedValue = rawValue.replace(/\s*°?c\s*$/i, '').trim()
    const u = (unit ?? '').trim()
    if (u === '°C' || u.toLowerCase() === 'c') return `${cleanedValue}°C`
    if (!u) return value
    return `${value}${u}`
  }

  const formatRainfall = (value?: string, unit?: string) => {
    if (!value) return '0mm'
    if (value.trim().toUpperCase() === 'M') return '0mm'
    return `${value}${unit ?? 'mm'}`
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* 背景光暈（不影響白底，但更有質感） */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-24 -right-24 h-72 w-72 rounded-full bg-info/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-success/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-light bg-bg-primary/80 backdrop-blur-glass">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-16 h-16 sm:w-28 md:w-36 sm:h-28 md:h-36 -my-2 sm:-my-6 md:-my-8">
                <Image
                  src={getAssetPath('images/mingcare-logo.png')}
                  alt="明家護理服務"
                  width={256}
                  height={256}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-text-primary leading-tight">管理控制台</div>
                <div className="text-xs text-text-tertiary leading-tight">MingCare Intranet</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-text-tertiary">{getGreeting()}</p>
                  <p className="text-sm text-text-secondary truncate max-w-[220px]">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn-apple-secondary"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 py-6">
        {/* Hero - 2026 Premium Design */}
        <div className="card-apple mb-4 animate-fade-in overflow-hidden relative">
          {/* 背景裝飾 */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-success/20 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="card-apple-content relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-primary text-xs font-semibold">系統運行正常</span>
                </div>
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                  {getGreeting()}，歡迎回來
                </h1>
                <p className="mt-2 text-text-secondary">
                  {formatDate(currentTime)} · <span className="font-mono tabular-nums">{formatTime(currentTime)}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/clients/new')}
                className="btn-apple-primary w-full py-3.5 min-h-[52px] text-sm sm:text-base group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新增客戶
              </button>
              <button
                onClick={() => router.push('/services?tab=schedule')}
                className="btn-apple-secondary w-full py-3.5 min-h-[52px] text-sm sm:text-base group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                新增服務記錄
              </button>
            </div>
          </div>
        </div>

        {/* 香港天文台天氣 */}
        <div className="card-apple mb-4">
          <div className="card-apple-content">
            {hkoStatus === 'loading' && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {hkoStatus === 'error' && (
              <div className="text-center py-8">
                <div className="text-sm text-white/60">暫時無法讀取天文台資料</div>
              </div>
            )}

            {hkoStatus === 'ready' && (
              <div className="space-y-4">
                {/* 頂部：地點 + 今日天氣 */}
                <div className="text-center">
                  <div className="text-lg text-text-primary font-medium">{selectedTempPlace}</div>
                  <div className="text-6xl font-extralight text-text-primary tabular-nums mt-1">
                    {formatTemp(
                      allHkoData?.temperature.find((d) => d.place === selectedTempPlace)?.value ?? hkoWeather?.temperature?.value,
                      allHkoData?.temperature.find((d) => d.place === selectedTempPlace)?.unit ?? hkoWeather?.temperature?.unit
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {hkoForecast[0] && (
                      <>
                        <span className="text-sm text-text-secondary">
                          最高 {hkoForecast[0].maxTemp?.replace('°C', '')}°
                        </span>
                        <span className="text-sm text-text-secondary">
                          最低 {hkoForecast[0].minTemp?.replace('°C', '')}°
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* 天氣警告 - 顯示在今日天氣下面 */}
                  {hkoWeather?.warnings.length ? (
                    <div className="mt-3 px-3 py-2 rounded-xl bg-warning/10 border border-warning/20">
                      <div className="text-xs text-warning line-clamp-1">
                        ⚠️ {hkoWeather.warnings[0]}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 分隔線 */}
                <div className="border-t border-border-light" />

                {/* 未來天氣預報 - iOS 風格 */}
                {hkoForecast.length > 0 && (
                  <div className="space-y-2">
                    {hkoForecast.slice(0, 5).map((d, idx) => {
                      const minTemp = parseInt(d.minTemp?.replace('°C', '') ?? '15');
                      const maxTemp = parseInt(d.maxTemp?.replace('°C', '') ?? '25');
                      // 計算溫度條位置 (假設範圍 10-35°C)
                      const rangeMin = 10;
                      const rangeMax = 35;
                      const leftPercent = ((minTemp - rangeMin) / (rangeMax - rangeMin)) * 100;
                      const widthPercent = ((maxTemp - minTemp) / (rangeMax - rangeMin)) * 100;
                      
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-10 text-sm text-text-secondary">{d.dateLabel}</div>
                          {d.iconUrl && (
                            <img
                              src={d.iconUrl}
                              alt=""
                              className="w-6 h-6 object-contain"
                              loading="lazy"
                            />
                          )}
                          <div className="w-8 text-sm text-text-tertiary tabular-nums text-right">
                            {minTemp}°
                          </div>
                          {/* 溫度條 */}
                          <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full relative overflow-hidden">
                            <div
                              className="absolute h-full rounded-full"
                              style={{
                                left: `${Math.max(0, leftPercent)}%`,
                                width: `${Math.min(100 - leftPercent, widthPercent)}%`,
                                background: 'linear-gradient(to right, #3b82f6, #22c55e, #eab308, #f97316)',
                              }}
                            />
                          </div>
                          <div className="w-8 text-sm text-text-primary tabular-nums">
                            {maxTemp}°
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 快速提示日曆 - 獨立區塊 */}
        <div className="card-apple mb-4">
          <div className="card-apple-content">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-warning/10 ring-1 ring-warning/20 flex items-center justify-center text-warning">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">快速提示</div>
                  <div className="text-xs text-text-tertiary">今日重要事項提醒</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-text-primary">{currentTime.getDate()}</div>
                <div className="text-xs text-text-tertiary">{currentTime.toLocaleDateString('zh-TW', { month: 'short', weekday: 'short' })}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 提示項目 1 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border-light hover:border-warning/30 hover:bg-warning/5 transition-colors cursor-pointer">
                <div className="w-3 h-3 rounded-full bg-error animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">緊急待辦</div>
                  <div className="text-xs text-text-tertiary">點擊設定內容</div>
                </div>
              </div>
              
              {/* 提示項目 2 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border-light hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="w-3 h-3 rounded-full bg-warning flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">今日提醒</div>
                  <div className="text-xs text-text-tertiary">點擊設定內容</div>
                </div>
              </div>
              
              {/* 提示項目 3 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border-light hover:border-success/30 hover:bg-success/5 transition-colors cursor-pointer">
                <div className="w-3 h-3 rounded-full bg-success flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">備忘事項</div>
                  <div className="text-xs text-text-tertiary">點擊設定內容</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Navigation - 2026 Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
          {navigationItems.map((item, index) => {
            const accent = accentClasses(item.accent)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`group ${item.layout} card-apple text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-white hover:shadow-apple-hover transition-all duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="card-apple-content relative overflow-hidden">
                  {/* 背景光效 */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 ${accent.iconBg} rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2`} />
                  </div>
                  
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`w-14 h-14 rounded-2xl ${accent.iconBg} ${accent.iconText} ring-1 ${accent.ring} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                        {item.icon}
                      </div>
                      <h3 className="text-2xl font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-bg-secondary border border-border-light flex items-center justify-center text-text-tertiary group-hover:text-white group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-bg-secondary border border-border-light group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                      快速進入
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-text-tertiary">
            <span className="w-2 h-2 bg-success rounded-full" />
            <span>系統運行正常</span>
            <span className="mx-2">•</span>
            <span>© 2025 明家居家護理服務有限公司</span>
          </div>
        </div>
      </main>
    </div>
  )
}
