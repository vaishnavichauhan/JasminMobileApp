import { API_ENDPOINTS } from './config';
import { fetchWithAuth } from './apiClient';

export interface VariationItem {
  id?: number | string;
  format_name?: string;
  formatName?: string;
  [key: string]: any;
}

export const fetchVariationsAllApi = async (token?: string | null): Promise<VariationItem[]> => {
  const response = await fetchWithAuth(API_ENDPOINTS.REPORTS.VARIATIONS_ALL, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const err: any = new Error(
      errorJson.message || errorJson.error || `Failed to fetch variations: ${response.status}`
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

export interface ColumnItem {
  column_name: string;
  key: string;
  not_show_in_report?: boolean | number | string;
}

export interface PriceListReportResponse {
  columns?: ColumnItem[];
  data?: any[];
  results?: any[];
  [key: string]: any;
}

export const fetchPriceListReportApi = async (
  token: string | null,
  variationId: string | number,
  date?: string
): Promise<PriceListReportResponse | null> => {
  let query = '';
  if (date) {
    query = `?date=${encodeURIComponent(date)}`;
  }

  const response = await fetchWithAuth(`${API_ENDPOINTS.REPORTS.PRICE_LIST_REPORT(variationId)}${query}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const err: any = new Error(
      errorJson.message || errorJson.error || `Failed to fetch price list report: ${response.status}`
    );
    err.status = response.status;
    throw err;
  }

  const json = await response.json();
  return json;
};

export interface StockInfoItem {
  branch_name?: string;
  location_name?: string;
  branch_code?: string;
  location_code?: string;
  product_name?: string;
  item_name?: string;
  item_code?: string | number;
  code?: string | number;
  available_stock?: number | string;
  saleable_stock?: number | string;
  stock?: number | string;
  items?: StockInfoItem[];
  [key: string]: any;
}

/**
 * Fetch Stock Info for a specific modelGroup
 * GET /price-lists/stock-info?modelGroup=...&sync=true
 */
export const fetchPriceListStockInfoApi = async (
  token: string | null,
  modelGroup: string,
  sync: boolean = true
): Promise<any> => {
  try {
    const query = `?modelGroup=${encodeURIComponent(modelGroup)}&model_group=${encodeURIComponent(modelGroup)}&sync=${sync ? 'true' : 'false'}`;
    const url = `${API_ENDPOINTS.REPORTS.PRICE_LIST_STOCK_INFO}${query}`;
    console.log('[Stock Info API] Request URL:', url);

    const response = await fetchWithAuth(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn('[Stock Info API] Response not OK:', response.status, errText);
      return null;
    }

    const json = await response.json();
    console.log('[Stock Info API] Received JSON:', json);
    return json;
  } catch (error) {
    console.warn('[Stock Info API] Fetch error:', error);
    return null;
  }
};

