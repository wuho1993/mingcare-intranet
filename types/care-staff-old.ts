// 護理人員管理 - TypeScript 類型定義
// 基於 CARE-STAFF-MANAGEMENT-SPECIFICATION.md

// ========================================================================
// 基礎資料類型
// ========================================================================

export interface CareStaffProfile {
  // 系統欄位
  id: string; // UUID
  staff_id: string; // 員工編號（用於 Storage 目錄命名）
  created_at: string;

  // 基本資料
  name_chinese: string;
  name_english?: string;
  phone: string;
  email?: string;
  hkid?: string;
  dob?: string; // 出生日期
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  preferred_area?: string;

  // 聯絡資料
  emergency_contact?: string;
  emergency_contact_phone?: string;

  // 多選欄位
  language?: string[]; // 來自 language_options
  job_position?: string[]; // 來自 job_position_options

  // 工作經驗
  experience_years?: number;
  company_name?: string;
  company_position?: string;
  employment_period?: string;
  main_duties?: string;

  // 狀態
  covid_vaccine?: boolean;
  contract_status?: 'active' | 'inactive' | 'pending' | 'terminated';

  // 文件 URL 欄位
  hkid_copy_url?: string;
  certificate_1?: string;
  certificate_2?: string;
  certificate_3?: string;
  certificate_4?: string;
  certificate_5?: string;
  scrc_status?: string;
}

// ========================================================================
// 表單相關類型
// ========================================================================

export interface CareStaffFormData {
  // 基本資料
  name_chinese: string;
  name_english?: string;
  phone: string;
  email?: string;
  hkid?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  preferred_area?: string;

  // 聯絡資料
  emergency_contact?: string;
  emergency_contact_phone?: string;

  // 多選欄位
  language?: string[];
  job_position?: string[];

  // 工作經驗
  experience_years?: number;
  company_name?: string;
  company_position?: string;
  employment_period?: string;
  main_duties?: string;

  // 狀態
  covid_vaccine?: boolean;
  contract_status?: 'active' | 'inactive' | 'pending' | 'terminated';
}

// ========================================================================
// 列表顯示相關
// ========================================================================

export interface CareStaffListItem {
  id: string;
  staff_id: string;
  name_chinese: string;
  phone: string;
  preferred_area?: string;
  contract_status?: string;
  created_at: string;
}

export interface CareStaffFilters {
  search?: string; // 姓名/電話/員工編號
  gender?: 'male' | 'female' | 'other';
  preferred_area?: string;
  job_position?: string;
}

export type ViewMode = 'list' | 'card';

// ========================================================================
// 搜尋建議
// ========================================================================

export interface CareStaffSearchSuggestion {
  id: string;
  staff_id: string;
  name_chinese: string;
  phone: string;
  display_text: string; // [姓名] - [電話] - [員工編號]
}

export interface CareStaffSearchRequest {
  query: string; // 最少 2 個字元
  limit?: number; // 默認 10
}

// ========================================================================
// 文件上載相關
// ========================================================================

export interface FileUploadField {
  fieldName: keyof Pick<CareStaffProfile, 'hkid_copy_url' | 'certificate_1' | 'certificate_2' | 'certificate_3' | 'certificate_4' | 'certificate_5' | 'scrc_status'>;
  displayName: string;
  currentUrl?: string;
  status: 'empty' | 'uploaded' | 'uploading' | 'error';
}

export interface FileUploadRequest {
  file: File;
  staffId: string;
  fieldName: string;
}

export interface FileUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// ========================================================================
// 選項來源
// ========================================================================

export interface LanguageOption {
  label: string;
}

export interface JobPositionOption {
  label: string;
}

// ========================================================================
// API 回應格式
// ========================================================================

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  totalPages?: number;
  currentPage?: number;
}

// ========================================================================
// 表單驗證
// ========================================================================

export interface CareStaffValidationErrors {
  name_chinese?: string;
  phone?: string;
  email?: string;
  contract_status?: string;
  [key: string]: string | undefined;
}

// ========================================================================
// 文件類型常數
// ========================================================================

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const STORAGE_BUCKET = 'care-staff-files' as const;

// 文件欄位配置
export const FILE_FIELDS: Record<string, string> = {
  hkid_copy_url: '香港身份證副本',
  certificate_1: '證書一',
  certificate_2: '證書二',
  certificate_3: '證書三',
  certificate_4: '證書四',
  certificate_5: '證書五',
  scrc_status: 'SCRC 文件'
} as const;
