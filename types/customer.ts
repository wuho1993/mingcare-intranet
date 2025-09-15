// 客戶管理相關的 TypeScript 類型定義
// 基於客戶管理中心需求

export interface SearchSuggestion {
  type: 'name' | 'phone' | 'id';
  label: string;
  subtitle: string;
  value: string; // customer_id
}

export interface CustomerSearchFilters {
  search?: string;
  customer_type?: string;
  district?: string;
  introducer?: string;
  project_manager?: string;
}

export interface CustomerListItem {
  customer_id: string;
  customer_name: string;
  phone: string;
  district: string;
  project_manager: string;
  created_at: string;
}

export interface CustomerFormStep1 {
  customer_type: '社區券客戶' | '明家街客' | '家訪客戶';
  voucher_application_status?: '申請中' | '已經持有';
  voucher_number?: string;
  copay_level?: '5%' | '8%' | '12%' | '16%' | '25%' | '40%';
  charity_support?: boolean;
  lds_status?: '已完成評估' | '已經持有' | '待社工評估';
  home_visit_status?: '已完成' | '未完成';
}

export interface CustomerFormData extends CustomerFormStep1 {
  customer_name: string;
  phone: string;
  district: string;
  service_address: string;
  hkid: string;
  dob: string;
  health_status: string;
  introducer: string;
  project_manager: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export type ViewMode = 'card' | 'list';
