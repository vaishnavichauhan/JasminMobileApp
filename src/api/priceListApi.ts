import { BASE_URL } from './config';

export interface VariationItem {
  id?: number | string;
  format_name?: string;
  formatName?: string;
  [key: string]: any;
}

export const fetchVariationsAllApi = async (token?: string | null): Promise<VariationItem[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/variations/all`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn('[Variations API] Response not OK:', response.status);
      return [];
    }

    const json = await response.json();

    if (Array.isArray(json)) return json;
    if (json?.data && Array.isArray(json.data)) return json.data;
    if (json?.results && Array.isArray(json.results)) return json.results;
    return [];
  } catch (error) {
    console.warn('[Variations API] Fetch error:', error);
    return [];
  }
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
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let query = '';
    if (date) {
      query = `?date=${encodeURIComponent(date)}`;
    }

    const response = await fetch(`${BASE_URL}/price-lists/report/${variationId}${query}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn('[PriceList Report API] Response not OK:', response.status);
      return null;
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.warn('[PriceList Report API] Fetch error:', error);
    return null;
  }
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const query = `?modelGroup=${encodeURIComponent(modelGroup)}&sync=${sync ? 'true' : 'false'}`;
    const url = `${BASE_URL}/price-lists/stock-info${query}`;
    console.log('[Stock Info API] Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn('[Stock Info API] Response not OK:', response.status);
      return null;
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.warn('[Stock Info API] Fetch error:', error);
    return null;
  }
};

