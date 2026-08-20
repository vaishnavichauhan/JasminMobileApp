import { API_ENDPOINTS } from './config';
import { fetchWithAuth } from './apiClient';

export interface FinanceBrandItem {
  id: number | string;
  mobile_brand: string;
  [key: string]: any;
}

export interface FinanceMachineItem {
  id: number | string;
  machine_name: string;
  [key: string]: any;
}

export interface FinanceCompanyItem {
  id: number | string;
  bank_card_name: string;
  [key: string]: any;
}

export interface MachineDetail {
  tid?: string | number;
  pos_id?: string | number;
  serial_no?: string | number;
  [key: string]: any;
}

export interface FinanceBrandRow {
  branch_id?: number | string;
  branch_name: string;
  branch_code?: string;
  state_id?: number | string;
  state_name?: string;
  brand_codes?: Record<string, string | number>;
  mapped_brands?: any[];
  qr_code_id_password?: string;
  machine_details?: Record<string, MachineDetail>;
  company_codes?: Record<string, string | number>;
  mapped_companies?: any[];
  remarks?: string;
  [key: string]: any;
}

export interface FinanceBrandReportData {
  brands: FinanceBrandItem[];
  machines: FinanceMachineItem[];
  companies: FinanceCompanyItem[];
  rows: FinanceBrandRow[];
}

export interface FinanceBrandReportResponse {
  success?: boolean;
  data?: FinanceBrandReportData;
  message?: string;
  [key: string]: any;
}

/**
 * Fetch Finance & Brand Report API
 * GET http://localhost:5005/api/reports/finance-brand-report
 */
export const fetchFinanceBrandReportApi = async (
  token?: string | null,
  stateName?: string
): Promise<FinanceBrandReportData> => {
  let query = '';
  if (stateName && stateName !== 'All States') {
    const trimmed = stateName.trim();
    if (trimmed.length > 0) {
      query = `?state=${encodeURIComponent(trimmed)}&state_name=${encodeURIComponent(trimmed)}`;
    }
  }

  const url = `${API_ENDPOINTS.REPORTS.FINANCE_BRAND}${query}`;
  console.log('[Finance & Brand Report API] Request URL:', url);

  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errorMessage =
      errorJson.message ||
      errorJson.error ||
      (response.status === 403
        ? 'Access Denied. Insufficient permissions for finance_brand_report (read)'
        : `Failed to fetch Finance & Brand report: ${response.status}`);
    const err: any = new Error(errorMessage);
    err.status = response.status;
    err.statusCode = response.status;
    throw err;
  }

  const json = await response.json();

  if (json?.data && typeof json.data === 'object') {
    return {
      brands: Array.isArray(json.data.brands) ? json.data.brands : [],
      machines: Array.isArray(json.data.machines) ? json.data.machines : [],
      companies: Array.isArray(json.data.companies) ? json.data.companies : [],
      rows: Array.isArray(json.data.rows) ? json.data.rows : [],
    };
  }

  if (json?.rows && Array.isArray(json.rows)) {
    return {
      brands: Array.isArray(json.brands) ? json.brands : [],
      machines: Array.isArray(json.machines) ? json.machines : [],
      companies: Array.isArray(json.companies) ? json.companies : [],
      rows: json.rows,
    };
  }

  return { brands: [], machines: [], companies: [], rows: [] };
};
