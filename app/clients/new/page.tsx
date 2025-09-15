'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { CustomerManagementService } from '../../../services/customer-management'
import HKIDScanner from '../../../components/HKIDScanner'
import type { 
  CustomerFormData,
  CustomerType,
  District,
  HealthStatus,
  Introducer,
  VoucherApplicationStatus,
  LdsStatus,
  HomeVisitStatus,
  StaffOwner,
  CopayLevel
} from '../../../types/database'

interface User {
  id: string
  email?: string
}

export default function NewCustomerPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [generatedCustomerId, setGeneratedCustomerId] = useState<string>('')
  
  // HKID 掃描功能
  const [showHKIDScanner, setShowHKIDScanner] = useState(false)
  
  // 兩階段表單狀態
  const [formStage, setFormStage] = useState<'initial' | 'expanded'>('initial')
  
  // 家訪客戶引導式流程狀態
  const [homeVisitStage, setHomeVisitStage] = useState<'basic' | 'address' | 'details' | 'complete'>('basic')
  
  // 地理位置相關狀態
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string>('')
  
  // VISE 系統整合相關狀態
  const [viseSystemUrl, setViseSystemUrl] = useState('https://example.com/vise-system')
  const [showViseGuide, setShowViseGuide] = useState(false)
  
  const [formData, setFormData] = useState<CustomerFormData>({
    customer_type: '社區券客戶',
    customer_name: '',
    service_address: '',
    charity_support: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
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

  // 生成客戶編號 - 使用 Supabase RPC（並發安全）
  const generateCustomerId = async () => {
    try {
      // 僅在符合條件時生成編號 - 家訪客戶不生成編號
      const shouldGenerate = formData.customer_type === '明家街客' || 
        (formData.customer_type === '社區券客戶' && formData.voucher_application_status === '已經持有')
      
      if (!shouldGenerate) {
        setGeneratedCustomerId('')
        return
      }

      const customerId = await CustomerManagementService.generateNextCustomerId(
        formData.customer_type,
        formData.introducer
      )
      setGeneratedCustomerId(customerId)
      setErrors(prev => ({ ...prev, general: '' }))
    } catch (error: any) {
      console.error('生成客戶編號失敗:', error)
      setErrors(prev => ({ ...prev, general: error.message || '生成客戶編號失敗，請稍後再試' }))
    }
  }

  // 當客戶類型、介紹人或申請狀況改變時重新生成編號
  useEffect(() => {
    if (formData.customer_type && formData.introducer) {
      generateCustomerId()
    }
  }, [formData.customer_type, formData.introducer, formData.voucher_application_status])

  // 檢查是否可以展開第二階段 - 自動展開邏輯
  useEffect(() => {
    const canExpand = formData.customer_type && formData.introducer
    if (canExpand && formStage === 'initial') {
      // 添加短暫延遲，然後自動展開第二階段
      const timer = setTimeout(() => {
        setFormStage('expanded')
      }, 500) // 500ms 延遲，讓用戶看到客戶編號生成
      
      return () => clearTimeout(timer)
    }
  }, [formData.customer_type, formData.introducer, formStage])

  // 自動計算年齡
  const calculateAge = (dob: string): number | undefined => {
    if (!dob) return undefined
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? age : undefined
  }

  // 自動設置 LDS 狀況
  const autoSetLdsStatus = (voucherStatus: VoucherApplicationStatus | undefined) => {
    if (voucherStatus === '已經持有') {
      return '已經持有' as LdsStatus
    }
    return undefined
  }

  // 處理客戶類型變更（新增頁面不需要警告）
  const handleCustomerTypeChange = (newType: CustomerType) => {
    // 新增客戶頁面直接更新，不需要警告
    updateFormData('customer_type', newType)
  }

  // 處理 HKID 掃描結果
  const handleHKIDScanResult = (result: { name: string; hkid: string; dob: string }) => {
    updateFormData('customer_name', result.name)
    updateFormData('hkid', result.hkid)
    updateFormData('dob', result.dob)
    setShowHKIDScanner(false)
    
    // 顯示成功提示
    setErrors(prev => ({ 
      ...prev, 
      general: '', 
      success: '身份證資訊已成功識別並填入' 
    }))
  }

  // 處理 HKID 掃描錯誤
  const handleHKIDScanError = (error: string) => {
    setErrors(prev => ({ ...prev, general: error }))
  }

  // 地理位置服務功能
  const getCurrentLocation = () => {
    setGettingLocation(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError('您的瀏覽器不支援地理位置功能')
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // 使用逆向地址解析獲取真實地址名稱
          const address = await reverseGeocode(latitude, longitude)
          updateFormData('service_address', address)
          
          // 自動檢測區域
          const detectedDistrict = await detectDistrictFromCoordinates(latitude, longitude)
          if (detectedDistrict) {
            updateFormData('district', detectedDistrict)
          }
          
          setGettingLocation(false)
          setErrors(prev => ({ 
            ...prev, 
            general: '', 
            success: '已成功獲取您的位置並自動填入服務地址' 
          }))
        } catch (error) {
          console.error('地理位置轉換失敗:', error)
          // 如果地址解析失敗，至少提供座標資訊
          const fallbackAddress = `座標: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          updateFormData('service_address', fallbackAddress)
          setLocationError('無法解析完整地址，已填入座標資訊，請手動修正地址')
          setGettingLocation(false)
        }
      },
      (error) => {
        let errorMessage = '無法獲取地理位置'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '地理位置存取被拒絕，請在瀏覽器設定中允許位置存取'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '無法確定您的位置，請檢查GPS或網路連接'
            break
          case error.TIMEOUT:
            errorMessage = '獲取位置請求超時，請稍後再試'
            break
        }
        
        setLocationError(errorMessage)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  // 逆向地址解析 - 將座標轉換為地址名稱
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // 方法一：使用免費的 Nominatim OpenStreetMap API
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW,zh-CN,zh`,
        {
          headers: {
            'User-Agent': 'MingCare-Intranet/1.0'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Nominatim API 請求失敗')
      }
      
      const data = await response.json()
      
      if (data.display_name) {
        // 解析並重組地址為香港格式
        const address = formatHongKongAddress(data)
        return address
      }
      
      throw new Error('無法獲取地址資訊')
    } catch (error) {
      console.error('Nominatim API 失敗:', error)
      
      // 方法二：備用 - 使用瀏覽器內建的地理編碼（如果可用）
      try {
        // 嘗試使用更簡單的方式
        return await fallbackGeocode(lat, lng)
      } catch (fallbackError) {
        console.error('備用地址解析也失敗:', fallbackError)
        throw new Error('所有地址解析方法都失敗')
      }
    }
  }

  // 格式化香港地址
  const formatHongKongAddress = (nominatimData: any): string => {
    const addr = nominatimData.address || {}
    
    // 提取地址組件
    const houseNumber = addr.house_number || ''
    const road = addr.road || addr.street || ''
    const suburb = addr.suburb || addr.neighbourhood || ''
    const district = addr.city_district || addr.district || addr.county || ''
    const city = addr.city || addr.town || ''
    const region = addr.state || addr.region || ''
    
    // 按香港地址格式組合
    let addressParts: string[] = []
    
    // 添加區域/地區
    if (region && region.includes('Hong Kong')) {
      // 跳過，不需要顯示 "Hong Kong"
    } else if (city && city !== district) {
      addressParts.push(city)
    }
    
    if (district) {
      addressParts.push(district)
    }
    
    if (suburb && suburb !== district && suburb !== road) {
      addressParts.push(suburb)
    }
    
    if (road) {
      const roadPart = houseNumber ? `${road}${houseNumber}號` : road
      addressParts.push(roadPart)
    }
    
    // 組合最終地址，優先顯示最具體的位置
    const formattedAddress = addressParts.reverse().join(', ')
    
    return formattedAddress || nominatimData.display_name || `座標: ${nominatimData.lat}, ${nominatimData.lon}`
  }

  // 備用地址解析方法
  const fallbackGeocode = async (lat: number, lng: number): Promise<string> => {
    // 如果主要 API 失敗，提供基於已知香港地標的近似地址
    const knownLocations = [
      { name: '香港島中環', lat: 22.2783, lng: 114.1747, radius: 0.01 },
      { name: '香港島銅鑼灣', lat: 22.2789, lng: 114.1859, radius: 0.01 },
      { name: '九龍尖沙咀', lat: 22.2976, lng: 114.1722, radius: 0.01 },
      { name: '九龍旺角', lat: 22.3193, lng: 114.1694, radius: 0.01 },
      { name: '新界沙田', lat: 22.3818, lng: 114.1878, radius: 0.02 },
      { name: '新界荃灣', lat: 22.3748, lng: 114.1169, radius: 0.02 },
    ]
    
    for (const location of knownLocations) {
      const distance = Math.sqrt(
        Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2)
      )
      
      if (distance <= location.radius) {
        return `${location.name}附近 (座標: ${lat.toFixed(4)}, ${lng.toFixed(4)})`
      }
    }
    
    // 如果沒有匹配的已知位置，返回座標
    return `座標: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  // 自動檢測區域（改進版：基於座標和地址名稱）
  const detectDistrictFromCoordinates = async (lat: number, lng: number): Promise<District | null> => {
    // 方法一：使用精確的座標邊界檢測
    const districtBounds: Record<District, { north: number, south: number, east: number, west: number }> = {
      '中西區': { north: 22.2950, south: 22.2700, east: 114.1750, west: 114.1250 },
      '灣仔區': { north: 22.2900, south: 22.2650, east: 114.1950, west: 114.1650 },
      '東區': { north: 22.3100, south: 22.2500, east: 114.2500, west: 114.1850 },
      '南區': { north: 22.2700, south: 22.2000, east: 114.2200, west: 114.1200 },
      '油尖旺區': { north: 22.3200, south: 22.2950, east: 114.1800, west: 114.1550 },
      '深水埗區': { north: 22.3450, south: 22.3150, east: 114.1750, west: 114.1450 },
      '九龍城區': { north: 22.3300, south: 22.3000, east: 114.2000, west: 114.1700 },
      '黃大仙區': { north: 22.3500, south: 22.3200, east: 114.2200, west: 114.1850 },
      '觀塘區': { north: 22.3400, south: 22.2900, east: 114.2600, west: 114.2100 },
      '荃灣區': { north: 22.3900, south: 22.3600, east: 114.1300, west: 114.1000 },
      '屯門區': { north: 22.4300, south: 22.3800, east: 114.0300, west: 113.9500 },
      '元朗區': { north: 22.4800, south: 22.4300, east: 114.0800, west: 113.9800 },
      '北區': { north: 22.5300, south: 22.4700, east: 114.1800, west: 114.1200 },
      '大埔區': { north: 22.4800, south: 22.4200, east: 114.1900, west: 114.1400 },
      '沙田區': { north: 22.4200, south: 22.3500, east: 114.2200, west: 114.1600 },
      '西貢區': { north: 22.4000, south: 22.2500, east: 114.3500, west: 114.2000 },
      '葵青區': { north: 22.3700, south: 22.3300, east: 114.1500, west: 114.1100 },
      '離島區': { north: 22.3500, south: 22.1500, east: 114.3000, west: 113.8500 },
      '未分類（醫院,院舍)': { north: 0, south: 0, east: 0, west: 0 }
    }

    // 首先嘗試座標檢測
    for (const [district, bounds] of Object.entries(districtBounds)) {
      if (district === '未分類（醫院,院舍)') continue
      
      if (lat >= bounds.south && lat <= bounds.north && 
          lng >= bounds.west && lng <= bounds.east) {
        return district as District
      }
    }

    // 方法二：如果座標檢測失敗，嘗試從地址名稱推斷
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MingCare-Intranet/1.0'
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        const addressText = data.display_name || ''
        
        // 從地址文本中檢測區域關鍵詞
        const districtKeywords: Record<string, District> = {
          '中西區': '中西區',
          '中環': '中西區',
          '上環': '中西區',
          '西環': '中西區',
          '金鐘': '中西區',
          '灣仔': '灣仔區',
          '銅鑼灣': '灣仔區',
          '跑馬地': '灣仔區',
          '東區': '東區',
          '北角': '東區',
          '鰂魚涌': '東區',
          '太古': '東區',
          '筲箕灣': '東區',
          '柴灣': '東區',
          '南區': '南區',
          '香港仔': '南區',
          '黃竹坑': '南區',
          '赤柱': '南區',
          '薄扶林': '南區',
          '油尖旺': '油尖旺區',
          '尖沙咀': '油尖旺區',
          '油麻地': '油尖旺區',
          '旺角': '油尖旺區',
          '佐敦': '油尖旺區',
          '深水埗': '深水埗區',
          '長沙灣': '深水埗區',
          '荔枝角': '深水埗區',
          '九龍城': '九龍城區',
          '紅磡': '九龍城區',
          '土瓜灣': '九龍城區',
          '何文田': '九龍城區',
          '黃大仙': '黃大仙區',
          '鑽石山': '黃大仙區',
          '新蒲崗': '黃大仙區',
          '觀塘': '觀塘區',
          '牛頭角': '觀塘區',
          '九龍灣': '觀塘區',
          '藍田': '觀塘區',
          '荃灣': '荃灣區',
          '屯門': '屯門區',
          '元朗': '元朗區',
          '天水圍': '元朗區',
          '北區': '北區',
          '上水': '北區',
          '粉嶺': '北區',
          '大埔': '大埔區',
          '沙田': '沙田區',
          '馬鞍山': '沙田區',
          '西貢': '西貢區',
          '將軍澳': '西貢區',
          '葵青': '葵青區',
          '葵涌': '葵青區',
          '青衣': '葵青區',
          '離島': '離島區',
          '大嶼山': '離島區',
          '長洲': '離島區',
          '南丫島': '離島區'
        }
        
        // 檢查地址文本中是否包含區域關鍵詞
        for (const [keyword, district] of Object.entries(districtKeywords)) {
          if (addressText.includes(keyword)) {
            return district
          }
        }
      }
    } catch (error) {
      console.error('地址解析檢測區域失敗:', error)
    }

    return null
  }

  // VISE 系統相關功能
  const copyHKIDToClipboard = async () => {
    if (!formData.hkid) {
      setErrors(prev => ({ ...prev, general: '請先輸入身份證號碼' }))
      return
    }

    try {
      await navigator.clipboard.writeText(formData.hkid)
      setErrors(prev => ({ 
        ...prev, 
        general: '', 
        success: `已複製身份證號碼 ${formData.hkid} 到剪貼簿` 
      }))
    } catch (error) {
      console.error('複製到剪貼簿失敗:', error)
      setErrors(prev => ({ ...prev, general: '複製失敗，請手動複製身份證號碼' }))
    }
  }

  const openViseSystem = () => {
    // 先複製HKID到剪貼簿
    copyHKIDToClipboard()
    
    // 打開VISE系統
    window.open(viseSystemUrl, '_blank', 'noopener,noreferrer')
    
    // 顯示使用指南
    setShowViseGuide(true)
  }

  // 更新表單數據，包含自動邏輯
  const updateFormData = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // 自動計算年齡
      if (field === 'dob') {
        updated.age = calculateAge(value)
      }

      // 處理客戶類型變化
      if (field === 'customer_type') {
        if (value === '明家街客') {
          // 切換到明家街客時，重置狀態
          setFormData({
            ...formData,
            customer_type: value,
            voucher_application_status: undefined,
            lds_status: undefined
          })
        } else if (value === '家訪客戶') {
          // 切換到家訪客戶時，重置狀態
          setFormData({
            ...formData,
            customer_type: value,
            voucher_application_status: undefined,
            lds_status: undefined
          })
        } else if (value === '社區券客戶') {
          // 切換到社區券客戶時，只保留基本狀態
          updated.voucher_application_status = undefined
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          updated.lds_status = undefined
          updated.home_visit_status = undefined
        }
      }

      // 處理社區券申請狀況變化
      if (field === 'voucher_application_status') {
        if (value === '已經持有') {
          // 自動設置 LDS 狀況為「已經持有」
          updated.lds_status = '已經持有'
        } else if (value === '申請中') {
          // 清除只有"已經持有"才顯示的欄位
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          // LDS 狀況可以自由選擇
          updated.lds_status = undefined
        } else {
          // 未選擇申請狀況時清空所有相關欄位
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          updated.lds_status = undefined
          updated.home_visit_status = undefined
        }
      }

      // 處理自付比例等級變化
      if (field === 'copay_level') {
        if (value !== '5%') {
          // 清除慈善支援欄位
          updated.charity_support = undefined
        }
      }

      return updated
    })

    // 清除相關錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // 表單驗證 - 按照完整規格實施
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 必填基本資料驗證
    if (!formData.customer_name?.trim()) {
      newErrors.customer_name = '請輸入客戶姓名'
    }

    if (!formData.service_address?.trim()) {
      newErrors.service_address = '請輸入服務地址'
    }

    // 社區券客戶的條件式驗證
    if (formData.customer_type === '社區券客戶') {
      if (!formData.voucher_application_status) {
        newErrors.voucher_application_status = '請選擇社區券申請狀況'
      }

      // 申請狀況為「已經持有」時的必填驗證
      if (formData.voucher_application_status === '已經持有') {
        if (!formData.voucher_number?.trim()) {
          newErrors.voucher_number = '請輸入社區券號碼'
        }

        if (!formData.copay_level) {
          newErrors.copay_level = '請選擇自付比例等級'
        }

        if (formData.copay_level === '5%' && formData.charity_support === undefined) {
          newErrors.charity_support = '請選擇是否需要慈善機構贊助'
        }
      }

      // 有選擇申請狀況時的 LDS 和家訪驗證
      if (formData.voucher_application_status === '申請中' || formData.voucher_application_status === '已經持有') {
        if (!formData.lds_status) {
          newErrors.lds_status = '請選擇LDS狀況'
        }

        if (!formData.home_visit_status) {
          newErrors.home_visit_status = '請選擇家訪狀況'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表單 - 按照完整規格實施
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // 計算年齡
      let calculatedAge: number | undefined
      if (formData.dob) {
        const birthDate = new Date(formData.dob)
        const today = new Date()
        calculatedAge = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--
        }
      }

      // 準備提交數據 - 僅包含目前可見且符合條件的欄位
      const submissionData: CustomerFormData = {
        customer_type: formData.customer_type,
        customer_name: formData.customer_name,
        service_address: formData.service_address,
        phone: formData.phone || undefined,
        hkid: formData.hkid || undefined,
        dob: formData.dob || undefined,
        age: calculatedAge || undefined,
        district: formData.district || undefined,
        health_status: formData.health_status || undefined,
        introducer: formData.introducer || undefined,
        staff_owner: formData.staff_owner || undefined,
        charity_support: false // 預設值
      }

      // 僅在社區券客戶且有申請狀況時添加相關欄位
      if (formData.customer_type === '社區券客戶' && formData.voucher_application_status) {
        submissionData.voucher_application_status = formData.voucher_application_status
        
        // LDS 和家訪狀況在有申請狀況時都可能存在
        if (formData.lds_status) {
          submissionData.lds_status = formData.lds_status
        }
        if (formData.home_visit_status) {
          submissionData.home_visit_status = formData.home_visit_status
        }

        // 僅在「已經持有」時添加這些欄位
        if (formData.voucher_application_status === '已經持有') {
          if (formData.voucher_number) {
            submissionData.voucher_number = formData.voucher_number
          }
          if (formData.copay_level) {
            submissionData.copay_level = formData.copay_level
          }
          // 僅在自付比例為5%時添加慈善支援
          if (formData.copay_level === '5%' && formData.charity_support !== undefined) {
            submissionData.charity_support = formData.charity_support
          }
        }
      }

      // 調用服務層
      const result = await CustomerManagementService.createCustomer(submissionData)
      
      if (result.success) {
        router.push('/clients')
      } else {
        setErrors({ general: result.error || '新增客戶失敗' })
      }
    } catch (error: any) {
      console.error('新增客戶失敗:', error)
      setErrors({ general: error.message || '新增客戶失敗，請稍後再試' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"></div>
          <p className="text-apple-body text-text-secondary mt-4">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-apple-title text-text-primary mb-2">新增客戶</h1>
              <p className="text-apple-body text-text-secondary">建立新的客戶資料</p>
            </div>
            <button
              onClick={() => router.push('/clients')}
              className="btn-apple-secondary"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回客戶列表
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto py-8 px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 錯誤訊息 */}
          {errors.general && (
            <div className="card-apple border-danger bg-danger-light fade-in-apple">
              <div className="card-apple-content">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-danger mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-apple-body text-danger">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          {/* 第一階段：基礎選擇 */}
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content">
              <h2 className="text-apple-heading text-text-primary mb-6">基礎資訊</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 客戶類型 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    客戶類型 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => handleCustomerTypeChange(e.target.value as CustomerType)}
                    className="form-input-apple"
                    required
                  >
                    <option value="社區券客戶">社區券客戶</option>
                    <option value="明家街客">明家街客</option>
                    <option value="家訪客戶">家訪客戶</option>
                  </select>
                </div>

                {/* 介紹人 */}
                <div>
                  <label className="block text-apple-body font-medium text-text-primary mb-2">
                    介紹人 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.introducer || ''}
                    onChange={(e) => updateFormData('introducer', e.target.value as Introducer)}
                    className="form-input-apple"
                    required
                  >
                    <option value="">請選擇介紹人</option>
                    <option value="Kanas Leung">Kanas Leung</option>
                    <option value="Joe Cheung">Joe Cheung</option>
                    <option value="Candy Ho">Candy Ho</option>
                    <option value="Steven Kwok">Steven Kwok</option>
                    <option value="Dr.Lee">Dr.Lee</option>
                    <option value="Annie">Annie</option>
                    <option value="Janet">Janet</option>
                    <option value="陸sir">陸sir</option>
                    <option value="吳翹政">吳翹政</option>
                    <option value="余翠英">余翠英</option>
                    <option value="陳小姐MC01">陳小姐MC01</option>
                    <option value="曾先生">曾先生</option>
                  </select>
                </div>
              </div>

              {/* 社區券資訊 - 在基礎資訊中條件顯示 */}
              {formData.customer_type === '社區券客戶' && (
                <div className="mt-6 pt-6 border-t border-border-primary">
                  <h3 className="text-apple-body font-semibold text-text-primary mb-4">社區券資訊</h3>
                  
                  <div className="space-y-4">
                    {/* 社區券申請狀況 */}
                    <div>
                      <label className="block text-apple-caption font-medium text-text-primary mb-2">
                        申請狀況 <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formData.voucher_application_status || ''}
                        onChange={(e) => updateFormData('voucher_application_status', e.target.value as VoucherApplicationStatus)}
                        className={`form-input-apple ${errors.voucher_application_status ? 'border-danger' : ''}`}
                        required
                      >
                        <option value="">請選擇申請狀況</option>
                        <option value="已經持有">已經持有</option>
                        <option value="申請中">申請中</option>
                      </select>
                      {errors.voucher_application_status && (
                        <p className="text-apple-caption text-danger mt-1">{errors.voucher_application_status}</p>
                      )}
                    </div>

                    {/* 當有申請狀況時顯示 LDS 和家訪狀況 */}
                    {(formData.voucher_application_status === '申請中' || formData.voucher_application_status === '已經持有') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* LDS 狀態 */}
                        <div>
                          <label className="block text-apple-caption font-medium text-text-primary mb-2">
                            LDS 狀態 <span className="text-danger">*</span>
                          </label>
                          <select
                            value={formData.lds_status || ''}
                            onChange={(e) => updateFormData('lds_status', e.target.value as LdsStatus)}
                            className={`form-input-apple ${errors.lds_status ? 'border-danger' : ''}`}
                            disabled={formData.voucher_application_status === '已經持有'}
                            required
                          >
                            <option value="">請選擇 LDS 狀態</option>
                            <option value="已完成評估">已完成評估</option>
                            <option value="已經持有">已經持有</option>
                            <option value="待社工評估">待社工評估</option>
                          </select>
                          {formData.voucher_application_status === '已經持有' && (
                            <p className="text-apple-caption text-text-secondary mt-1">
                              已自動設為「已經持有」
                            </p>
                          )}
                          {errors.lds_status && (
                            <p className="text-apple-caption text-danger mt-1">{errors.lds_status}</p>
                          )}
                        </div>

                        {/* 家訪狀況 */}
                        <div>
                          <label className="block text-apple-caption font-medium text-text-primary mb-2">
                            家訪狀況 <span className="text-danger">*</span>
                          </label>
                          <select
                            value={formData.home_visit_status || ''}
                            onChange={(e) => updateFormData('home_visit_status', e.target.value as HomeVisitStatus)}
                            className={`form-input-apple ${errors.home_visit_status ? 'border-danger' : ''}`}
                            required
                          >
                            <option value="">請選擇家訪狀況</option>
                            <option value="已完成">已完成</option>
                            <option value="未完成">未完成</option>
                          </select>
                          {errors.home_visit_status && (
                            <p className="text-apple-caption text-danger mt-1">{errors.home_visit_status}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 當申請狀況為「已經持有」時顯示額外欄位 */}
                    {formData.voucher_application_status === '已經持有' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 社區券號碼 */}
                          <div>
                            <label className="block text-apple-caption font-medium text-text-primary mb-2">
                              社區券號碼 <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.voucher_number || ''}
                              onChange={(e) => updateFormData('voucher_number', e.target.value)}
                              className={`form-input-apple ${errors.voucher_number ? 'border-danger' : ''}`}
                              placeholder="請輸入社區券號碼"
                              required
                            />
                            {errors.voucher_number && (
                              <p className="text-apple-caption text-danger mt-1">{errors.voucher_number}</p>
                            )}
                          </div>

                          {/* 自付額等級 */}
                          <div>
                            <label className="block text-apple-caption font-medium text-text-primary mb-2">
                              自付額 <span className="text-danger">*</span>
                            </label>
                            <select
                              value={formData.copay_level || ''}
                              onChange={(e) => updateFormData('copay_level', e.target.value as CopayLevel)}
                              className={`form-input-apple ${errors.copay_level ? 'border-danger' : ''}`}
                              required
                            >
                              <option value="">請選擇自付額</option>
                              <option value="5%">5%</option>
                              <option value="8%">8%</option>
                              <option value="12%">12%</option>
                              <option value="16%">16%</option>
                              <option value="25%">25%</option>
                              <option value="40%">40%</option>
                            </select>
                            {errors.copay_level && (
                              <p className="text-apple-caption text-danger mt-1">{errors.copay_level}</p>
                            )}
                          </div>
                        </div>

                        {/* 慈善補助 - 僅在自付額為5%時顯示 */}
                        {formData.copay_level === '5%' && (
                          <div>
                            <label className="block text-apple-caption font-medium text-text-primary mb-2">
                              慈善補助 <span className="text-danger">*</span>
                            </label>
                            <div className="flex space-x-4 mt-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="charity_support"
                                  value="true"
                                  checked={formData.charity_support === true}
                                  onChange={(e) => updateFormData('charity_support', e.target.value === 'true')}
                                  className="w-4 h-4 text-mingcare-blue focus:ring-mingcare-blue"
                                />
                                <span className="ml-2 text-apple-caption">是</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="charity_support"
                                  value="false"
                                  checked={formData.charity_support === false}
                                  onChange={(e) => updateFormData('charity_support', e.target.value === 'false')}
                                  className="w-4 h-4 text-mingcare-blue focus:ring-mingcare-blue"
                                />
                                <span className="ml-2 text-apple-caption">否</span>
                              </label>
                            </div>
                            {errors.charity_support && (
                              <p className="text-apple-caption text-danger mt-1">{errors.charity_support}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 家訪客戶資訊 - 引導式流程 */}
              {formData.customer_type === '家訪客戶' && (
                <div className="mt-6 pt-6 border-t border-border-primary">
                  <h3 className="text-apple-body font-semibold text-text-primary mb-4">家訪客戶專用流程</h3>
                  
                  {/* 身份證快速錄入 */}
                  <div className="space-y-6">
                    <div className="bg-bg-secondary rounded-apple-sm p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-apple-body font-medium text-text-primary">身份證智能識別</p>
                          <p className="text-apple-caption text-text-secondary mt-1">
                            使用相機掃描或手動輸入身份證資訊，自動填入客戶基本資料。
                          </p>
                        </div>
                      </div>
                      
                      {!showHKIDScanner ? (
                        <button
                          type="button"
                          onClick={() => setShowHKIDScanner(true)}
                          className="btn-apple-primary w-full flex items-center justify-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>開始身份證識別</span>
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-apple-body font-medium text-text-primary">身份證識別</h4>
                            <button
                              type="button"
                              onClick={() => setShowHKIDScanner(false)}
                              className="text-text-secondary hover:text-text-primary"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <HKIDScanner
                            onScanResult={handleHKIDScanResult}
                            onError={handleHKIDScanError}
                          />
                        </div>
                      )}
                    </div>

                    {/* VISE 系統整合 */}
                    {formData.hkid && (
                      <div className="bg-bg-secondary rounded-apple-sm p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-apple-body font-medium text-text-primary">VISE 系統快速存取</p>
                            <p className="text-apple-caption text-text-secondary mt-1">
                              自動複製身份證號碼到剪貼簿並開啟 VISE 系統，讓您快速完成外部系統登記。
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={copyHKIDToClipboard}
                            className="btn-apple-secondary flex-1 flex items-center justify-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>複製身份證號碼</span>
                          </button>
                          <button
                            type="button"
                            onClick={openViseSystem}
                            className="btn-apple-primary flex-1 flex items-center justify-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>開啟 VISE 系統</span>
                          </button>
                        </div>
                        
                        {/* VISE 系統使用指南 */}
                        {showViseGuide && (
                          <div className="mt-4 p-4 bg-info-light border border-info rounded-apple-xs">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="text-apple-caption font-semibold text-info mb-2">VISE 系統使用指南</h5>
                                <ol className="text-apple-caption text-info space-y-1 list-decimal list-inside">
                                  <li>VISE 系統將在新分頁中開啟</li>
                                  <li>身份證號碼 <strong>{formData.hkid}</strong> 已複製到剪貼簿</li>
                                  <li>在 VISE 系統中貼上身份證號碼（Ctrl+V 或 Cmd+V）</li>
                                  <li>完成 VISE 系統的相關登記程序</li>
                                  <li>返回此頁面繼續完成客戶資料輸入</li>
                                </ol>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowViseGuide(false)}
                                className="ml-3 text-info hover:text-info-dark"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 客戶編號預覽 - 家訪客戶不顯示編號 */}
              {formData.customer_type && formData.introducer && formData.customer_type !== '家訪客戶' && (
                <div className="mt-6 bg-bg-tertiary rounded-apple-sm p-4 fade-in-apple">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-mingcare-blue rounded-full flex items-center justify-center mr-4">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-apple-caption text-text-secondary">客戶編號</p>
                      <p className="text-apple-heading text-text-primary font-mono">
                        {generatedCustomerId || (
                          formData.customer_type === '社區券客戶' && formData.voucher_application_status === '申請中' 
                            ? '申請中不生成編號' 
                            : '生成中...'
                        )}
                      </p>
                      {formData.customer_type === '社區券客戶' && formData.voucher_application_status === '申請中' && (
                        <p className="text-apple-caption text-text-secondary mt-1">
                          客戶編號將在申請狀況變更為「已經持有」後生成
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 家訪客戶說明 */}
              {formData.customer_type === '家訪客戶' && formData.introducer && (
                <div className="mt-6 bg-bg-tertiary rounded-apple-sm p-4 fade-in-apple">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mr-4">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-apple-caption text-text-secondary">家訪客戶</p>
                      <p className="text-apple-body text-text-primary">
                        家訪客戶不需要客戶編號
                      </p>
                      <p className="text-apple-caption text-text-secondary mt-1">
                        請直接填寫客戶的基本資料即可
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 第二階段：詳細表單 (條件顯示 + 滑下動畫) */}
          <div 
            className={`overflow-hidden transition-all duration-700 ease-in-out ${
              formStage === 'expanded' 
                ? 'max-h-screen opacity-100 transform translate-y-0' 
                : 'max-h-0 opacity-0 transform -translate-y-4'
            }`}
          >
            <div className="space-y-8">
              {/* 基本資料 */}
              <div className="card-apple">
                <div className="card-apple-content">
                  <h2 className="text-apple-heading text-text-primary mb-6">基本資料</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 客戶姓名 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        客戶姓名 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => updateFormData('customer_name', e.target.value)}
                        className={`form-input-apple ${errors.customer_name ? 'border-danger' : ''}`}
                        placeholder="請輸入客戶姓名"
                        required
                      />
                      {errors.customer_name && (
                        <p className="text-apple-caption text-danger mt-2">{errors.customer_name}</p>
                      )}
                    </div>

                    {/* 服務地址 */}
                    <div className="md:col-span-2">
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        服務地址 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.service_address}
                        onChange={(e) => updateFormData('service_address', e.target.value)}
                        className={`form-input-apple ${errors.service_address ? 'border-danger' : ''}`}
                        placeholder="請輸入服務地址"
                        required
                      />
                      {errors.service_address && (
                        <p className="text-apple-caption text-danger mt-2">{errors.service_address}</p>
                      )}
                    </div>

                    {/* 電話號碼 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        電話號碼
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className={`form-input-apple ${errors.phone ? 'border-danger' : ''}`}
                        placeholder="請輸入電話號碼"
                      />
                      {errors.phone && (
                        <p className="text-apple-caption text-danger mt-2">{errors.phone}</p>
                      )}
                    </div>

                    {/* 身份證號碼 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        身份證號碼
                      </label>
                      <input
                        type="text"
                        value={formData.hkid || ''}
                        onChange={(e) => updateFormData('hkid', e.target.value.toUpperCase())}
                        className={`form-input-apple ${errors.hkid ? 'border-danger' : ''}`}
                        placeholder="例: A123456(7)"
                      />
                      {errors.hkid && (
                        <p className="text-apple-caption text-danger mt-2">{errors.hkid}</p>
                      )}
                    </div>

                    {/* 出生日期 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        出生日期
                      </label>
                      <input
                        type="date"
                        value={formData.dob || ''}
                        onChange={(e) => updateFormData('dob', e.target.value)}
                        className="form-input-apple"
                      />
                    </div>

                    {/* 年齡 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        年齡
                      </label>
                      <input
                        type="text"
                        value={formData.age ? `${formData.age} 歲` : ''}
                        readOnly
                        disabled
                        className="form-input-apple bg-bg-secondary text-text-secondary"
                        placeholder="自動計算"
                      />
                      <p className="text-apple-caption text-text-secondary mt-1">
                        年齡將根據出生日期自動計算
                      </p>
                    </div>

                    {/* 客戶地區 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        客戶地區
                      </label>
                      <select
                        value={formData.district || ''}
                        onChange={(e) => updateFormData('district', e.target.value as District)}
                        className="form-input-apple"
                      >
                        <option value="">請選擇地區</option>
                        <option value="中西區">中西區</option>
                        <option value="九龍城區">九龍城區</option>
                        <option value="元朗區">元朗區</option>
                        <option value="北區">北區</option>
                        <option value="南區">南區</option>
                        <option value="大埔區">大埔區</option>
                        <option value="屯門區">屯門區</option>
                        <option value="東區">東區</option>
                        <option value="沙田區">沙田區</option>
                        <option value="油尖旺區">油尖旺區</option>
                        <option value="深水埗區">深水埗區</option>
                        <option value="灣仔區">灣仔區</option>
                        <option value="荃灣區">荃灣區</option>
                        <option value="葵青區">葵青區</option>
                        <option value="西貢區">西貢區</option>
                        <option value="觀塘區">觀塘區</option>
                        <option value="離島區">離島區</option>
                        <option value="黃大仙區">黃大仙區</option>
                        <option value="未分類（醫院,院舍)">未分類（醫院,院舍)</option>
                      </select>
                    </div>

                    {/* 項目經理 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        項目經理
                      </label>
                      <select
                        value={formData.staff_owner || ''}
                        onChange={(e) => updateFormData('staff_owner', e.target.value as StaffOwner)}
                        className="form-input-apple"
                      >
                        <option value="">請選擇項目經理</option>
                        <option value="Kanas Leung">Kanas Leung</option>
                        <option value="Joe Cheung">Joe Cheung</option>
                        <option value="Candy Ho">Candy Ho</option>
                      </select>
                    </div>

                    {/* 身體狀況 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        身體狀況
                      </label>
                      <select
                        value={formData.health_status || ''}
                        onChange={(e) => updateFormData('health_status', e.target.value as HealthStatus)}
                        className="form-input-apple"
                      >
                        <option value="">請選擇身體狀況</option>
                        <option value="良好">良好</option>
                        <option value="中風">中風</option>
                        <option value="需協助">需協助</option>
                        <option value="長期病患">長期病患</option>
                        <option value="認知障礙">認知障礙</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 提交按鈕 */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/clients')}
                  className="btn-apple-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-apple-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '新增中...' : '新增客戶'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
