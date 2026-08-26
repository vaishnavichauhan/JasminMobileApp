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
  sync: boolean = false
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
      // If live sync fails or times out, auto-fallback to cached database stock
      if (sync) {
        console.log('[Stock Info API] Live sync failed, falling back to cached stock without sync...');
        return fetchPriceListStockInfoApi(token, modelGroup, false);
      }
      return null;
    }

    const json = await response.json();
    console.log('[Stock Info API] Received JSON:', json);
    return json;
  } catch (error) {
    console.warn('[Stock Info API] Fetch error:', error);
    if (sync) {
      console.log('[Stock Info API] Live sync exception, falling back to cached stock without sync...');
      return fetchPriceListStockInfoApi(token, modelGroup, false);
    }
    return null;
  }
};

/**
 * Fetch All Mobile Brands API
 * GET /mobilebrands/all
 */
export const fetchMobileBrandsAllApi = async (token?: string | null): Promise<string[]> => {
  try {
    const response = await fetchWithAuth(API_ENDPOINTS.REPORTS.MOBILE_BRANDS_ALL, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('[Mobile Brands API] Response not OK:', response.status);
      return [];
    }

    const json = await response.json();
    console.log('[Mobile Brands API] Received JSON:', json);

    const list = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.results)
      ? json.results
      : Array.isArray(json?.brands)
      ? json.brands
      : Array.isArray(json?.mobilebrands)
      ? json.mobilebrands
      : Array.isArray(json?.mobileBrands)
      ? json.mobileBrands
      : Array.isArray(json?.data?.brands)
      ? json.data.brands
      : Array.isArray(json?.data?.mobilebrands)
      ? json.data.mobilebrands
      : Array.isArray(json?.data?.mobileBrands)
      ? json.data.mobileBrands
      : [];

    return list
      .map((item: any) => {
        if (typeof item === 'string') return item.trim();
        return (
          item?.brand_name ||
          item?.brandName ||
          item?.Brand_Name ||
          item?.BRAND_NAME ||
          item?.name ||
          item?.Name ||
          item?.brand ||
          item?.Brand ||
          item?.Mobile_Brand ||
          item?.mobile_brand ||
          item?.mobileBrand ||
          item?.title ||
          item?.Title ||
          item?.label ||
          item?.Label ||
          ''
        ).trim();
      })
      .filter((b: string) => b.length > 0 && b !== '—');
  } catch (error) {
    console.warn('[Mobile Brands API] Fetch error:', error);
    return [];
  }
};

/**
 * Fetch All Item Categories API
 * GET /settings/icat
 */
export const fetchItemCategoriesAllApi = async (token?: string | null): Promise<string[]> => {
  try {
    const response = await fetchWithAuth(API_ENDPOINTS.REPORTS.SETTINGS_ICAT, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('[Categories API] Response not OK:', response.status);
      return [];
    }

    const json = await response.json();
    const list = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.results)
      ? json.results
      : Array.isArray(json?.categories)
      ? json.categories
      : Array.isArray(json?.icats)
      ? json.icats
      : [];

    return list
      .map((item: any) => {
        if (typeof item === 'string') return item.trim();
        return (
          item?.category_name ||
          item?.categoryName ||
          item?.name ||
          item?.item_category ||
          item?.itemCategory ||
          item?.icat ||
          item?.category ||
          item?.ProductName ||
          item?.product_name ||
          ''
        ).trim();
      })
      .filter((c: string) => c.length > 0 && c !== '—');
  } catch (error) {
    console.warn('[Categories API] Fetch error:', error);
    return [];
  }
};


