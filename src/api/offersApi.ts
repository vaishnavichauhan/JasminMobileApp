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
  // Transaction fields
  offerText?: string;
  offerTypeValue?: string;
  transactionType?: string;
  uptoValue?: string;
  valueType?: string;
  rawItem?: any;
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
  * GET /api/offers/all
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
  console.log('[Offers API] Response status:', response.status);

  const text = await response.text();
  let json: any = {};
  if (text && text.trim().length > 0) {
    try {
      json = JSON.parse(text);
      console.log('[Offers API] Response data:', json);
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
  const resultList: OfferItem[] = [];

  rawList.forEach((item: any, index: number) => {
    const getTrans = (obj: any) =>
      obj.transctions || obj.transactions || obj.Transctions || obj.Transactions || obj.transction || obj.transaction || [];
    const subTxns = Array.isArray(getTrans(item))
      ? getTrans(item)
      : (getTrans(item) && typeof getTrans(item) === 'object' ? [getTrans(item)] : []);

    const extractFieldsFromItemOrTx = (baseItem: any, tx?: any): OfferItem => {
      const txObj = tx || {};
      const offerText =
        getVal(txObj, 'offer_text', 'offerText', 'text', 'title') ||
        getVal(baseItem, 'offer_text', 'offerText', 'text', 'title', 'offer_title', 'name', 'offer_name', 'scheme_name') ||
        '';

      const offerTypeValue =
        getVal(txObj, 'offer_type_value', 'offerTypeValue', 'offer_value', 'offerValue', 'type_value') ||
        getVal(baseItem, 'offer_type_value', 'offerTypeValue', 'offer_value', 'offerValue', 'type_value') ||
        '';

      const transactionType =
        getVal(txObj, 'transction_type', 'transaction_type', 'transctionType', 'transactionType', 'txn_type') ||
        getVal(baseItem, 'transction_type', 'transaction_type', 'transctionType', 'transactionType', 'txn_type') ||
        '';

      const uptoValue =
        getVal(txObj, 'upto_value', 'uptoValue', 'upto', 'up_to_value', 'up_to', 'max_value', 'max_discount') ||
        getVal(baseItem, 'upto_value', 'uptoValue', 'upto', 'up_to_value', 'up_to', 'max_value', 'max_discount') ||
        '';

      const valueType =
        getVal(txObj, 'value_type', 'valueType', 'val_type', 'discount_type') ||
        getVal(baseItem, 'value_type', 'valueType', 'val_type', 'discount_type') ||
        '';

      const title =
        offerText ||
        getVal(baseItem, 'title', 'offer_title', 'name', 'offer_name', 'scheme_name') ||
        `Offer ${index + 1}`;

      const brandName =
        getVal(baseItem, 'brandName', 'brand_name', 'Brand_name', 'brand', 'Brand') ||
        'All Brands';

      const modelGroupName =
        getVal(
          baseItem,
          'modelGroupName',
          'model_group_name',
          'model_group',
          'modelGroups',
          'modelGroup',
          'GeneralmodelGroup',
          'General Model Group'
        ) || 'All Models';

      const stateName =
        getVal(baseItem, 'stateName', 'state_name', 'state', 'State') || 'All States';

      const offerType =
        transactionType ||
        getVal(baseItem, 'offerType', 'offer_type', 'type', 'OfferType') ||
        'Discount';

      const fromDate =
        getVal(baseItem, 'fromDate', 'from_date', 'start_date', 'FromDate', 'valid_from', 'validFrom', 'START_DATE', 'FROM_DATE') ||
        '';

      const toDate =
        getVal(baseItem, 'toDate', 'to_date', 'end_date', 'ToDate', 'valid_to', 'validTo', 'expiry_date', 'expiryDate', 'END_DATE', 'TO_DATE') ||
        '';

      const discount =
        offerTypeValue
          ? `${offerTypeValue}${valueType ? ` (${valueType})` : ''}`
          : (getVal(baseItem, 'discount', 'discount_percentage', 'amount', 'value', 'cashback', 'DISCOUNT') || '');

      const description =
        getVal(baseItem, 'description', 'desc', 'details', 'summary', 'DESCRIPTION') || '';

      const terms =
        getVal(baseItem, 'terms', 'terms_and_conditions', 't_and_c', 'TERMS') ||
        'Valid until stocks last. Standard terms apply.';

      const rawStatus = getVal(baseItem, 'status', 'state', 'is_active', 'active', 'STATUS', 'IS_ACTIVE');
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
        id: tx ? `${baseItem.id || baseItem._id || index + 1}-${tx.id || Math.random()}` : (baseItem.id || baseItem._id || index + 1),
        title: String(title),
        brandName: String(brandName),
        modelGroupName: String(modelGroupName),
        stateName: String(stateName),
        offerType: String(offerType),
        fromDate: String(fromDate),
        toDate: String(toDate),
        discount: discount ? String(discount) : undefined,
        description: description ? String(description) : undefined,
        terms: terms ? String(terms) : undefined,
        status,
        offerText: offerText ? String(offerText) : undefined,
        offerTypeValue: offerTypeValue ? String(offerTypeValue) : undefined,
        transactionType: transactionType ? String(transactionType) : undefined,
        uptoValue: uptoValue ? String(uptoValue) : undefined,
        valueType: valueType ? String(valueType) : undefined,
        rawItem: { ...baseItem, ...tx },
      };
    };

    if (subTxns.length > 0) {
      subTxns.forEach((tx: any) => {
        resultList.push(extractFieldsFromItemOrTx(item, tx));
      });
    } else {
      resultList.push(extractFieldsFromItemOrTx(item));
    }
  });

  return resultList;
};
