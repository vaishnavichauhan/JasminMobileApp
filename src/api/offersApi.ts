import { API_ENDPOINTS } from './config';
import { fetchWithAuth } from './apiClient';

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
  if (Array.isArray(obj.data?.data)) return obj.data.data;
  if (Array.isArray(obj.data?.rows)) return obj.data.rows;
  if (Array.isArray(obj.data?.offers)) return obj.data.offers;
  if (Array.isArray(obj.data?.list)) return obj.data.list;
  if (Array.isArray(obj.data?.records)) return obj.data.records;
  if (Array.isArray(obj.data?.items)) return obj.data.items;
  if (Array.isArray(obj.offers)) return obj.offers;
  if (Array.isArray(obj.rows)) return obj.rows;
  if (Array.isArray(obj.result)) return obj.result;
  if (Array.isArray(obj.records)) return obj.records;
  if (Array.isArray(obj.items)) return obj.items;
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
  const response = await fetchWithAuth(`${API_ENDPOINTS.OFFERS.ALL}${queryString}`, {
    method: 'GET',
  });
console.log("oferRes",response);

    const text = await response.text();
    let json: any = {};
    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
        console.log("oferRes",JSON.parse(text));
      } catch {
        json = { data: [] };
      }
    }

    if (!response.ok) {
      const err: any = new Error(
        json.message || json.error || `Failed to fetch offers: ${response.status}`
      );
      err.status = response.status;
      throw err;
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
        getVal(item, 'fromDate', 'from_date', 'start_date', 'FromDate', 'valid_from', 'validFrom', 'START_DATE', 'FROM_DATE') ||
        '';

      const toDate =
        getVal(item, 'toDate', 'to_date', 'end_date', 'ToDate', 'valid_to', 'validTo', 'expiry_date', 'expiryDate', 'END_DATE', 'TO_DATE') ||
        '';

      const discount =
        getVal(item, 'discount', 'discount_percentage', 'amount', 'value', 'cashback', 'DISCOUNT') ||
        '';

      const description =
        getVal(item, 'description', 'desc', 'details', 'summary', 'DESCRIPTION') || '';

      const terms =
        getVal(item, 'terms', 'terms_and_conditions', 't_and_c', 'TERMS') ||
        'Valid until stocks last. Standard terms apply.';

      const rawStatus = getVal(item, 'status', 'state', 'is_active', 'active', 'STATUS', 'IS_ACTIVE');
      let status: 'active' | 'expired' = 'active';

      if (
        rawStatus === 'expired' ||
        rawStatus === 'Expired' ||
        rawStatus === false ||
        rawStatus === 0 ||
        rawStatus === '0' ||
        rawStatus === 'inactive' ||
        rawStatus === 'Inactive'
      ) {
        status = 'expired';
      } else if (toDate) {
        // Convert toDate to YYYY-MM-DD for accurate comparison
        let compToDate = String(toDate).trim().split('T')[0];
        if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(compToDate)) {
          const parts = compToDate.split(/[\/\-]/);
          compToDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        const todayStr = new Date().toISOString().split('T')[0];
        if (compToDate && compToDate < todayStr) {
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
};
