import { BASE_URL } from './config';

export interface CashDepositAbmItem {
  id?: string | number;
  abmName: string;
  stateName?: string;
  openingCash: number | string;
  cashDeposit: number | string;
  pendingCashDeposit: number | string;
  pendingDepositPercentage: number | string;
  [key: string]: any;
}

export interface BrandWiseSaleItem {
  id?: string | number;
  srNo?: number | string;
  brandName: string;
  ftdQty: number | string;
  ftdValue: number | string;
  lmftdQty: number | string;
  lmftdValue: number | string;
  mtdQty: number | string;
  mtdValue: number | string;
  lmtdQty: number | string;
  lmtdValue: number | string;
  growthQtyPercentage?: number | string;
  growthValuePercentage?: number | string;
  [key: string]: any;
}

export interface BrandWiseSalesTotals {
  brandName?: string;
  ftdQty: number;
  ftdValue: number;
  lmftdQty: number;
  lmftdValue: number;
  mtdQty: number;
  mtdValue: number;
  lmtdQty: number;
  lmtdValue: number;
  growthQtyPercentage?: number;
  growthValuePercentage?: number;
  [key: string]: any;
}

/**
 * Format currency in Indian Rupees format (e.g. ₹ 1,91,93,074.00)
 */
export const formatCurrency = (val: any): string => {
  if (val === undefined || val === null || val === '') return '₹ 0.00';
  if (typeof val === 'string' && val.trim().startsWith('₹')) return val.trim();
  const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return `₹ ${val}`;
  return `₹ ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format Quantity with commas (e.g. 1,116)
 */
export const formatQuantity = (val: any): string => {
  if (val === undefined || val === null || val === '') return '0';
  const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return String(val);
  return num.toLocaleString('en-IN');
};

/**
 * Format Percentage (e.g. 0.00%)
 */
export const formatPercent = (val: any): string => {
  if (val === undefined || val === null || val === '') return '0.00%';
  if (typeof val === 'string' && val.includes('%')) return val.trim();
  const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return `${val}%`;
  return `${num.toFixed(2)}%`;
};

/**
 * Helper to safely extract an array from arbitrary backend response wrapper
 */
const extractArray = (obj: any): any[] => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.rows)) return obj.rows;
  if (Array.isArray(obj.result)) return obj.result;
  if (Array.isArray(obj.records)) return obj.records;
  if (Array.isArray(obj.sales)) return obj.sales;
  if (Array.isArray(obj.brandSales)) return obj.brandSales;
  if (Array.isArray(obj.brandWiseSales)) return obj.brandWiseSales;
  if (Array.isArray(obj.brand_sales)) return obj.brand_sales;
  if (Array.isArray(obj.brand_wise_sales)) return obj.brand_wise_sales;
  if (Array.isArray(obj.list)) return obj.list;
  if (Array.isArray(obj.data?.data)) return obj.data.data;
  if (Array.isArray(obj.data?.rows)) return obj.data.rows;
  if (Array.isArray(obj.data?.records)) return obj.data.records;
  if (Array.isArray(obj.data?.brandSales)) return obj.data.brandSales;
  if (Array.isArray(obj.data?.brandWiseSales)) return obj.data.brandWiseSales;
  if (Array.isArray(obj.data?.brand_sales)) return obj.data.brand_sales;
  if (Array.isArray(obj.data?.brand_wise_sales)) return obj.data.brand_wise_sales;
  if (Array.isArray(obj.data?.result)) return obj.data.result;

  if (typeof obj.data === 'object' && obj.data !== null) {
    for (const key of Object.keys(obj.data)) {
      if (Array.isArray(obj.data[key])) return obj.data[key];
    }
  }
  for (const key of Object.keys(obj)) {
    if (Array.isArray(obj[key])) return obj[key];
  }
  return [];
};

/**
 * Helper to extract field value case-insensitively with flexible aliases
 */
const getVal = (item: any, ...keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined;
  for (const k of keys) {
    if (item[k] !== undefined && item[k] !== null) return item[k];
  }
  const itemKeys = Object.keys(item);
  for (const target of keys) {
    const normalizedTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = itemKeys.find(
      (ik) => ik.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedTarget
    );
    if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) {
      return item[foundKey];
    }
  }
  return undefined;
};

/**
 * 1) Fetch Stock Cash Deposit (ABM Wise)
 * GET http://localhost:5005/api/stock-cash-deposit/abm-wise
 */
export const fetchStockCashDepositAbmWiseApi = async (
  token?: string | null,
  stateName?: string
): Promise<CashDepositAbmItem[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers['x-access-token'] = token;
    }

    const query =
      stateName && stateName.trim() && stateName !== 'All States'
        ? `?state=${encodeURIComponent(stateName.trim())}`
        : '';

    const response = await fetch(`${BASE_URL}/stock-cash-deposit/abm-wise${query}`, {
      method: 'GET',
      headers,
    });

    const text = await response.text();
    let json: any = {};
    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { data: [] };
      }
    }

    if (!response.ok) {
      throw new Error(
        json.message || json.error || `Server error: ${response.status}`
      );
    }

    const rawList = extractArray(json);

    return rawList.map((item: any, index: number) => ({
      id: item.id || item._id || index,
      abmName:
        getVal(
          item,
          'abmName',
          'abm_name',
          'ABM_NAME',
          'AbmName',
          'abm',
          'name',
          'user_name'
        ) || 'Unknown ABM',
      stateName:
        getVal(
          item,
          'stateName',
          'state_name',
          'STATE_NAME',
          'state',
          'State'
        ) || '',
      openingCash:
        getVal(
          item,
          'openingCash',
          'opening_cash',
          'OPENING_CASH',
          'OpeningCash',
          'opening',
          'opening_amount'
        ) ?? 0,
      cashDeposit:
        getVal(
          item,
          'cashDeposit',
          'cash_deposit',
          'CASH_DEPOSIT',
          'CashDeposit',
          'deposit',
          'deposit_amount'
        ) ?? 0,
      pendingCashDeposit:
        getVal(
          item,
          'pendingCashDeposit',
          'pending_cash_deposit',
          'PENDING_CASH_DEPOSIT',
          'PendingCashDeposit',
          'pending_deposit',
          'pendingCash',
          'pending_amount',
          'pending'
        ) ?? 0,
      pendingDepositPercentage:
        getVal(
          item,
          'pendingDepositPercentage',
          'pending_deposit_percentage',
          'PENDING_DEPOSIT_PERCENTAGE',
          'pending_deposit_percent',
          'pendingDepositPercent',
          'pending_percent',
          'percentage',
          'percent'
        ) ?? 0,
      ...item,
    }));
  } catch (error: any) {
    console.warn('fetchStockCashDepositAbmWiseApi error:', error);
    throw error;
  }
};

export interface BrandWiseSalesFilterParams {
  brandName?: string;
  state?: string;
  date?: string;
}

/**
 * 2) Fetch Brand Wise Sales Data
 * GET http://localhost:5005/api/brand-wise-sales/data?date=2026-08-10&state=Gujarat
 */
export const fetchBrandWiseSalesDataApi = async (
  token?: string | null,
  filter?: BrandWiseSalesFilterParams | string
): Promise<BrandWiseSaleItem[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers['x-access-token'] = token;
    }

    const queryParts: string[] = [];

    if (typeof filter === 'string') {
      if (filter.trim()) {
        queryParts.push(`brand_name=${encodeURIComponent(filter.trim())}`);
      }
    } else if (filter && typeof filter === 'object') {
      if (filter.date && filter.date.trim()) {
        queryParts.push(`date=${encodeURIComponent(filter.date.trim())}`);
      }
      if (filter.state && filter.state.trim() && filter.state !== 'All States') {
        queryParts.push(`state=${encodeURIComponent(filter.state.trim())}`);
      }
      if (filter.brandName && filter.brandName.trim()) {
        queryParts.push(`brand_name=${encodeURIComponent(filter.brandName.trim())}`);
      }
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await fetch(`${BASE_URL}/brand-wise-sales/data${queryString}`, {
      method: 'GET',
      headers,
    });

    const text = await response.text();
    let json: any = {};
    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { data: [] };
      }
    }

    if (!response.ok) {
      throw new Error(
        json.message || json.error || `Server error: ${response.status}`
      );
    }

    const rawList = extractArray(json);

    return rawList.map((item: any, index: number) => {
      const brandName =
        getVal(
          item,
          'brandName',
          'brand_name',
          'BRAND_NAME',
          'BrandName',
          'Brand',
          'brand',
          'name',
          'item_brand',
          'brand_name_ach'
        ) || 'Others';

      const srNo =
        getVal(
          item,
          'srNo',
          'sr_no',
          'SR_NO',
          'sr',
          's_no',
          'sno',
          'id',
          'index'
        ) ?? (index + 1);

      const ftdQty =
        getVal(
          item,
          'ftdQty',
          'ftd_qty',
          'FTD_QTY',
          'ftdQuantity',
          'ftd_quantity',
          'ftd_count',
          'ftd',
          'ftd_qty_ach'
        ) ?? 0;

      const ftdValue =
        getVal(
          item,
          'ftdValue',
          'ftd_value',
          'FTD_VALUE',
          'ftdVal',
          'ftd_val',
          'ftdAmount',
          'ftd_amount',
          'ftd_total',
          'ftdTotal',
          'ftd_value_ach'
        ) ?? 0;

      const lmftdQty =
        getVal(
          item,
          'lmftdQty',
          'lmftd_qty',
          'LMFTD_QTY',
          'lmftdQuantity',
          'lm_ftd_qty',
          'lm_ftd_quantity',
          'lmftd',
          'lmftd_qty_ach'
        ) ?? 0;

      const lmftdValue =
        getVal(
          item,
          'lmftdValue',
          'lmftd_value',
          'LMFTD_VALUE',
          'lmftdVal',
          'lmftd_val',
          'lmftdAmount',
          'lm_ftd_value',
          'lm_ftd_val',
          'lmftd_amount',
          'lmftd_value_ach'
        ) ?? 0;

      const mtdQty =
        getVal(
          item,
          'mtdQty',
          'mtd_qty',
          'MTD_QTY',
          'mtdQuantity',
          'mtd_quantity',
          'mtd_count',
          'mtd',
          'mtd_qty_ach'
        ) ?? 0;

      const mtdValue =
        getVal(
          item,
          'mtdValue',
          'mtd_value',
          'MTD_VALUE',
          'mtdVal',
          'mtd_val',
          'mtdAmount',
          'mtd_amount',
          'mtd_total',
          'mtdTotal',
          'mtd_value_ach'
        ) ?? 0;

      const lmtdQty =
        getVal(
          item,
          'lmtdQty',
          'lmtd_qty',
          'LMTD_QTY',
          'lmtdQuantity',
          'lm_mtd_qty',
          'lm_mtd_quantity',
          'lmtd',
          'lmtd_qty_ach'
        ) ?? 0;

      const lmtdValue =
        getVal(
          item,
          'lmtdValue',
          'lmtd_value',
          'LMTD_VALUE',
          'lmtdVal',
          'lmtd_val',
          'lmtdAmount',
          'lm_mtd_value',
          'lm_mtd_val',
          'lmtd_amount',
          'lmtd_value_ach'
        ) ?? 0;

      const growthQtyPercentage =
        getVal(
          item,
          'growthQtyPercentage',
          'growth_qty_percentage',
          'GROWTH_QTY_PERCENTAGE',
          'growth_qty_percent',
          'growthQtyPct'
        ) ?? 0;

      const growthValuePercentage =
        getVal(
          item,
          'growthValuePercentage',
          'growth_value_percentage',
          'GROWTH_VALUE_PERCENTAGE',
          'growth_value_percent',
          'growthValuePct'
        ) ?? 0;

      return {
        id: item.id || item._id || index,
        srNo,
        brandName,
        ftdQty,
        ftdValue,
        lmftdQty,
        lmftdValue,
        mtdQty,
        mtdValue,
        lmtdQty,
        lmtdValue,
        growthQtyPercentage,
        growthValuePercentage,
        ...item,
      };
    });
  } catch (error: any) {
    console.warn('fetchBrandWiseSalesDataApi error:', error);
    throw error;
  }
};

/**
 * 2b) Fetch Brand Wise Sales Totals (Total All Data)
 * GET https://interlink.jasminmobile.com/api/brand-wise-sales/totals?date=2026-08-10&state=Gujarat
 */
export const fetchBrandWiseSalesTotalsApi = async (
  token?: string | null,
  filter?: BrandWiseSalesFilterParams | string
): Promise<BrandWiseSalesTotals | null> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers['x-access-token'] = token;
    }

    const queryParts: string[] = [];

    if (typeof filter === 'string') {
      if (filter.trim()) {
        queryParts.push(`brand_name=${encodeURIComponent(filter.trim())}`);
      }
    } else if (filter && typeof filter === 'object') {
      if (filter.date && filter.date.trim()) {
        queryParts.push(`date=${encodeURIComponent(filter.date.trim())}`);
      }
      if (filter.state && filter.state.trim() && filter.state !== 'All States') {
        queryParts.push(`state=${encodeURIComponent(filter.state.trim())}`);
      }
      if (filter.brandName && filter.brandName.trim()) {
        queryParts.push(`brand_name=${encodeURIComponent(filter.brandName.trim())}`);
      }
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await fetch(`${BASE_URL}/brand-wise-sales/totals${queryString}`, {
      method: 'GET',
      headers,
    });

    const text = await response.text();
    let json: any = {};
    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
      } catch {
        json = {};
      }
    }

    if (!response.ok) {
      throw new Error(
        json.message || json.error || `Server error: ${response.status}`
      );
    }

    const raw =
      json.totals ||
      json.data?.totals ||
      json.data ||
      json.results ||
      json.result ||
      json;
    const item = Array.isArray(raw) ? (raw[0] || {}) : raw;

    const brandName =
      getVal(
        item,
        'brand_name',
        'brandName',
        'BRAND_NAME',
        'BrandName',
        'Brand',
        'brand'
      ) || 'Total';

    const ftdQty = Number(
      getVal(
        item,
        'ftd_qty_ach',
        'ftdQty',
        'ftd_qty',
        'FTD_QTY',
        'ftdQuantity',
        'ftd_quantity',
        'ftd_count',
        'ftd'
      ) ?? 0
    );
    const ftdValue = Number(
      getVal(
        item,
        'ftd_value_ach',
        'ftdValue',
        'ftd_value',
        'FTD_VALUE',
        'ftdVal',
        'ftd_val',
        'ftdAmount',
        'ftd_amount',
        'ftd_total',
        'ftdTotal'
      ) ?? 0
    );
    const lmftdQty = Number(
      getVal(
        item,
        'lmftd_qty_ach',
        'lmftdQty',
        'lmftd_qty',
        'LMFTD_QTY',
        'lmftdQuantity',
        'lm_ftd_qty',
        'lmftd'
      ) ?? 0
    );
    const lmftdValue = Number(
      getVal(
        item,
        'lmftd_value_ach',
        'lmftdValue',
        'lmftd_value',
        'LMFTD_VALUE',
        'lmftdVal',
        'lmftd_val',
        'lmftdAmount',
        'lm_ftd_value',
        'lm_ftd_val'
      ) ?? 0
    );
    const mtdQty = Number(
      getVal(
        item,
        'mtd_qty_ach',
        'mtdQty',
        'mtd_qty',
        'MTD_QTY',
        'mtdQuantity',
        'mtd_quantity',
        'mtd_count',
        'mtd'
      ) ?? 0
    );
    const mtdValue = Number(
      getVal(
        item,
        'mtd_value_ach',
        'mtdValue',
        'mtd_value',
        'MTD_VALUE',
        'mtdVal',
        'mtd_val',
        'mtdAmount',
        'mtd_amount',
        'mtd_total',
        'mtdTotal'
      ) ?? 0
    );
    const lmtdQty = Number(
      getVal(
        item,
        'lmtd_qty_ach',
        'lmtdQty',
        'lmtd_qty',
        'LMTD_QTY',
        'lmtdQuantity',
        'lm_mtd_qty',
        'lmtd'
      ) ?? 0
    );
    const lmtdValue = Number(
      getVal(
        item,
        'lmtd_value_ach',
        'lmtdValue',
        'lmtd_value',
        'LMTD_VALUE',
        'lmtdVal',
        'lmtd_val',
        'lmtdAmount',
        'lm_mtd_value',
        'lm_mtd_val'
      ) ?? 0
    );

    const growthQtyPercentage =
      getVal(
        item,
        'growth_qty_percentage',
        'growthQtyPercentage',
        'growth_qty',
        'growth_quantity_percentage'
      ) ??
      (lmftdQty > 0 ? (((ftdQty - lmftdQty) / lmftdQty) * 100).toFixed(2) : 0);

    const growthValuePercentage =
      getVal(
        item,
        'growth_value_percentage',
        'growthValuePercentage',
        'growth_value',
        'growth_val'
      ) ??
      (lmftdValue > 0 ? (((ftdValue - lmftdValue) / lmftdValue) * 100).toFixed(2) : 0);

    return {
      brandName,
      ftdQty,
      ftdValue,
      lmftdQty,
      lmftdValue,
      mtdQty,
      mtdValue,
      lmtdQty,
      lmtdValue,
      growthQtyPercentage: Number(growthQtyPercentage) || 0,
      growthValuePercentage: Number(growthValuePercentage) || 0,
      ...item,
    };
  } catch (error: any) {
    console.warn('[Dashboard API] fetchBrandWiseSalesTotalsApi error:', error.message);
    return null;
  }
};

/**
 * 3) Fetch All States List
 * GET http://localhost:5005/api/states/all
 */
export const fetchAllStatesApi = async (
  token?: string | null
): Promise<string[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers['x-access-token'] = token;
    }

    const response = await fetch(`${BASE_URL}/states/all`, {
      method: 'GET',
      headers,
    });

    const text = await response.text();
    let json: any = {};
    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { data: [] };
      }
    }

    if (!response.ok) {
      throw new Error(
        json.message || json.error || `Server error: ${response.status}`
      );
    }

    const rawList = extractArray(json);
    const stateSet = new Set<string>();

    rawList.forEach((item: any) => {
      let stName = '';
      if (typeof item === 'string') {
        stName = item;
      } else if (item && typeof item === 'object') {
        stName =
          getVal(item, 'stateName', 'state_name', 'STATE_NAME', 'state', 'State', 'name', 'title') || '';
      }
      if (stName && String(stName).trim().length > 0) {
        stateSet.add(String(stName).trim());
      }
    });

    return Array.from(stateSet);
  } catch (error: any) {
    console.warn('fetchAllStatesApi error:', error);
    return [];
  }
};
