import { API_ENDPOINTS } from './config';
import { fetchWithAuth } from './apiClient';

export interface SpecialTvaItem {
  id?: number | string;
  title: string;
  start_date?: string;
  end_date?: string;
  table_name?: string;
  status?: string;
  added_by?: number | string;
  added_by_name?: string;
  branch_count?: number;
  total_target?: number;
  [key: string]: any;
}

export const fetchSpecialTvaAllApi = async (
  _token?: string | null
): Promise<SpecialTvaItem[]> => {
  const url =
    API_ENDPOINTS.SPECIAL_TVA?.ALL ||
    API_ENDPOINTS.REPORTS.SPECIAL_TVA_ALL ||
    `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/special-tva/all`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const err: any = new Error(
      errorJson.message ||
        errorJson.error ||
        `Failed to fetch Special TVA reports: ${response.status}`
    );
    err.status = response.status;
    throw err;
  }

  const json = await response.json();

  if (Array.isArray(json)) return json;
  if (json?.data && Array.isArray(json.data)) return json.data;
  if (json?.results && Array.isArray(json.results)) return json.results;
  return [];
};

export interface SpecialTvaRecordItem {
  s_no?: number | string;
  branch_code?: string;
  party_name: string;
  type?: string;
  state?: string;
  zone?: string;
  mf?: string;
  period_target?: number;
  brand_targets?: Record<string, number>;
  achievement_qty?: Record<string, number>;
  achievement_pct?: Record<string, number>;
  [key: string]: any;
}

export interface SpecialTvaMasterInfo {
  id?: number | string;
  title: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

export interface SpecialTvaAbmRecordItem {
  id?: string | number;
  s_no?: number | string;
  abm_name: string;
  branch_count: number;
  state?: string;
  zone?: string;
  period_target?: number;
  brand_targets?: Record<string, number>;
  achievement_qty?: Record<string, number>;
  achievement_pct?: Record<string, number>;
  [key: string]: any;
}

export interface SpecialTvaUserContext {
  is_admin?: boolean;
  is_abm?: boolean;
  can_view_abm_tab?: boolean;
  user_name?: string;
  abm_name?: string | null;
  [key: string]: any;
}

export interface SpecialTvaReportData {
  master?: SpecialTvaMasterInfo;
  brand_headers?: string[];
  individual_brands?: Array<{
    brand_name: string;
    share_percentage?: number;
    [key: string]: any;
  }>;
  records?: SpecialTvaRecordItem[];
  totals?: {
    target?: number;
    period_target?: number;
    brand_targets?: Record<string, number>;
    achievement_qty?: Record<string, number>;
    achievement_pct?: Record<string, number>;
    [key: string]: any;
  };
  abm_records?: SpecialTvaAbmRecordItem[];
  abm_totals?: {
    branch_count?: number;
    period_target?: number;
    brand_targets?: Record<string, number>;
    achievement_qty?: Record<string, number>;
    achievement_pct?: Record<string, number>;
    [key: string]: any;
  };
  user_context?: SpecialTvaUserContext;
  [key: string]: any;
}

export const fetchSpecialTvaReportApi = async (
  id: string | number,
  _token?: string | null
): Promise<SpecialTvaReportData | null> => {
  const url =
    API_ENDPOINTS.SPECIAL_TVA?.REPORT?.(id) ||
    `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/special-tva/report/${id}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const err: any = new Error(
      errorJson.message ||
        errorJson.error ||
        `Failed to fetch Special TVA report: ${response.status}`
    );
    err.status = response.status;
    throw err;
  }

  const json = await response.json();
  if (json?.data) return json.data;
  return json;
};

