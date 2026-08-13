import { BASE_URL } from './config';

export interface OfferItem {
  id: string | number;
  title: string;
  brandName: string;
  modelGroupName: string;
  stateName: string;
  offerType: string;
  fromDate: string;
  toDate: string;
  discount?: string;
  description?: string;
  terms?: string;
  status?: 'active' | 'expired' | string;
  [key: string]: any;
}

export interface OfferFilterParams {
  brand_name?: string;
  model_group_name?: string;
  state_name?: string;
  offer_type?: string;
  from_date?: string;
  to_date?: string;
  [key: string]: any;
}

const getVal = (obj: any, ...keys: string[]): any => {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      return obj[k];
    }
  }
  return undefined;
};

const extractArray = (obj: any): any[] => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.offers)) return obj.offers;
  if (Array.isArray(obj.result)) return obj.result;
  if (Array.isArray(obj.data?.offers)) return obj.data.offers;
  return [];
};

/**
  * Fetch Offers API
  * GET http://localhost:5005/api/offers/all
  */
export const fetchOffersApi = async (
  token?: string | null,
  filters?: OfferFilterParams
): Promise<OfferItem[]> => {
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
    if (filters) {
      if (filters.brand_name) {
        queryParts.push(`brand_name=${encodeURIComponent(filters.brand_name)}`);
      }
      if (filters.model_group_name) {
        queryParts.push(`model_group_name=${encodeURIComponent(filters.model_group_name)}`);
      }
      if (filters.state_name) {
        queryParts.push(`state_name=${encodeURIComponent(filters.state_name)}`);
      }
      if (filters.offer_type) {
        queryParts.push(`offer_type=${encodeURIComponent(filters.offer_type)}`);
      }
      if (filters.from_date) {
        queryParts.push(`from_date=${encodeURIComponent(filters.from_date)}`);
      }
      if (filters.to_date) {
        queryParts.push(`to_date=${encodeURIComponent(filters.to_date)}`);
      }
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await fetch(`${BASE_URL}/offers/all${queryString}`, {
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
      const title =
        getVal(item, 'title', 'offer_title', 'name', 'offer_name', 'scheme_name') ||
        `Offer ${index + 1}`;

      const brandName =
        getVal(item, 'brandName', 'brand_name', 'Brand_name', 'brand', 'Brand') ||
        'All Brands';

      const modelGroupName =
        getVal(
          item,
          'modelGroupName',
          'model_group_name',
          'model_group',
          'modelGroups',
          'modelGroup'
        ) || 'All Models';

      const stateName =
        getVal(item, 'stateName', 'state_name', 'state', 'State') || 'All States';

      const offerType =
        getVal(item, 'offerType', 'offer_type', 'type', 'OfferType') ||
        'Discount';

      const fromDate =
        getVal(item, 'fromDate', 'from_date', 'start_date', 'FromDate') ||
        '2026-08-01';

      const toDate =
        getVal(item, 'toDate', 'to_date', 'end_date', 'ToDate') || '2026-08-31';

      const discount =
        getVal(item, 'discount', 'discount_percentage', 'amount', 'value', 'cashback') ||
        '10% OFF';

      const description =
        getVal(item, 'description', 'desc', 'details', 'summary') || '';

      const terms =
        getVal(item, 'terms', 'terms_and_conditions', 't_and_c') ||
        'Valid until stocks last. Standard terms apply.';

      const rawStatus = getVal(item, 'status', 'state', 'is_active');
      let status: 'active' | 'expired' = 'active';
      if (rawStatus === 'expired' || rawStatus === false || rawStatus === 0) {
        status = 'expired';
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        if (toDate && toDate < todayStr) {
          status = 'expired';
        }
      }

      return {
        id: item.id || item._id || index + 1,
        title,
        brandName,
        modelGroupName,
        stateName,
        offerType,
        fromDate,
        toDate,
        discount,
        description,
        terms,
        status,
        rawItem: item,
      };
    });
  } catch (error: any) {
    console.warn('fetchOffersApi error:', error.message || error);
    return [];
  }
};
