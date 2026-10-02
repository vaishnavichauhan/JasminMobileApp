import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { usePriceListStore } from '../../../store';
import {
  fetchPriceListStockInfoApi,
  fetchMobileBrandsAllApi,
  fetchItemCategoriesAllApi,
} from '../../../api/priceListApi';
import { colors, fontFamily, borderRadius, fontSize } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OFFER_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);
const OFFER_SNAP_INTERVAL = OFFER_CARD_WIDTH + 14;

export interface NormalizedOffer {
  id: string | number;
  title: string;
  offerType?: string;
  discount?: string;
  description?: string;
  terms?: string;
  validFrom?: string;
  validTo?: string;
  couponCode?: string;
  brand?: string;
  state?: string;
  // Transaction fields
  offerTypeValue?: string;
  offerText?: string;
  transactionType?: string;
  uptoValue?: string;
  valueType?: string;
  raw?: any;
}

export const parseItemOffers = (raw: any): NormalizedOffer[] => {
  if (!raw) return [];

  // Helper to extract transaction fields from an object
  const extractTxFields = (obj: any) => {
    if (!obj || typeof obj !== 'object') return {};
    const offerTypeValue =
      obj.offer_type_value ??
      obj.offerTypeValue ??
      obj.offer_value ??
      obj.offerValue ??
      obj.type_value ??
      undefined;
    const offerText =
      obj.offer_text ??
      obj.offerText ??
      obj.text ??
      obj.offer_title ??
      obj.offerTitle ??
      obj.title ??
      undefined;
    const transactionType =
      obj.transction_type ??
      obj.transaction_type ??
      obj.transctionType ??
      obj.transactionType ??
      obj.txn_type ??
      obj.type ??
      undefined;
    const uptoValue =
      obj.upto_value ??
      obj.uptoValue ??
      obj.upto ??
      obj.up_to_value ??
      obj.up_to ??
      obj.max_value ??
      obj.max_discount ??
      undefined;
    const valueType =
      obj.value_type ??
      obj.valueType ??
      obj.val_type ??
      obj.discount_type ??
      undefined;

    return {
      offerTypeValue: offerTypeValue !== undefined && offerTypeValue !== null ? String(offerTypeValue) : undefined,
      offerText: offerText !== undefined && offerText !== null ? String(offerText) : undefined,
      transactionType: transactionType !== undefined && transactionType !== null ? String(transactionType) : undefined,
      uptoValue: uptoValue !== undefined && uptoValue !== null ? String(uptoValue) : undefined,
      valueType: valueType !== undefined && valueType !== null ? String(valueType) : undefined,
    };
  };

  // Helper to extract transactions/transctions array
  const getSubTransactions = (obj: any): any[] => {
    if (!obj || typeof obj !== 'object') return [];
    const t =
      obj.transctions ??
      obj.transactions ??
      obj.Transctions ??
      obj.Transactions ??
      obj.transction ??
      obj.transaction ??
      obj.txns ??
      obj.tx;
    if (Array.isArray(t)) return t;
    if (t && typeof t === 'object') return [t];
    return [];
  };

  // Handle case where raw is stringified JSON or plain text
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '—' || trimmed === '-' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return [];
    }
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseItemOffers(parsed);
      } catch (e) {
        // Not valid JSON, proceed as string
      }
    }

    // Split by newlines, pipes, or semicolons if multiple
    const lines = trimmed
      .split(/\r?\n|;|\|/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s !== '—');

    if (lines.length > 1) {
      return lines.map((line, idx) => ({
        id: `offer-str-${idx}`,
        title: line,
        offerText: line,
      }));
    }

    return [
      {
        id: 'offer-str-0',
        title: trimmed,
        offerText: trimmed,
      },
    ];
  }

  // Handle case where raw is an Array
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    const list: NormalizedOffer[] = [];

    raw.forEach((item, index) => {
      if (!item) return;

      if (typeof item === 'string') {
        const t = item.trim();
        if (t && t !== '—') {
          list.push({
            id: `offer-arr-${index}`,
            title: t,
            offerText: t,
          });
        }
        return;
      }

      if (typeof item === 'object') {
        const subTxns = getSubTransactions(item);

        if (subTxns.length > 0) {
          // Flatten sub-transactions into dedicated cards
          subTxns.forEach((tx, txIdx) => {
            const txFields = extractTxFields(tx);
            const parentTxFields = extractTxFields(item);

            const offerTypeValue = txFields.offerTypeValue || parentTxFields.offerTypeValue;
            const offerText = txFields.offerText || parentTxFields.offerText || item.title || item.offer_name || item.name || '';
            const transactionType = txFields.transactionType || parentTxFields.transactionType || item.offer_type || item.offerType || '';
            const uptoValue = txFields.uptoValue || parentTxFields.uptoValue;
            const valueType = txFields.valueType || parentTxFields.valueType;

            const title = offerText || item.title || item.offer_title || item.offer_name || item.name || '';

            list.push({
              id: `${item.id || item._id || index}-tx-${txIdx}`,
              title: String(title),
              offerText: offerText ? String(offerText) : undefined,
              offerTypeValue: offerTypeValue ? String(offerTypeValue) : undefined,
              transactionType: transactionType ? String(transactionType) : undefined,
              uptoValue: uptoValue ? String(uptoValue) : undefined,
              valueType: valueType ? String(valueType) : undefined,
              offerType: transactionType ? String(transactionType) : (item.offer_type || item.offerType ? String(item.offer_type || item.offerType) : undefined),
              discount: offerTypeValue
                ? `${offerTypeValue}${valueType ? ` (${valueType})` : ''}`
                : (item.discount || item.discount_amount ? String(item.discount || item.discount_amount) : undefined),
              description: item.description || item.desc || item.details || undefined,
              terms: item.terms || item.terms_and_conditions || item.conditions || undefined,
              validFrom: item.from_date || item.fromDate || item.start_date || undefined,
              validTo: item.to_date || item.toDate || item.end_date || item.expiry_date || undefined,
              couponCode: item.coupon_code || item.couponCode || item.code || undefined,
              brand: item.brand || item.brand_name || undefined,
              state: item.state || item.state_name || undefined,
              raw: { ...item, ...tx },
            });
          });
        } else {
          // Direct fields on item
          const txFields = extractTxFields(item);
          const title =
            txFields.offerText ||
            item.title ||
            item.offer_title ||
            item.offerTitle ||
            item.offer_name ||
            item.offerName ||
            item.name ||
            item.scheme_name ||
            item.schemeName ||
            item.heading ||
            item.offer ||
            item.label ||
            item.description ||
            '';

          const offerType =
            txFields.transactionType ||
            item.offer_type ||
            item.offerType ||
            item.type ||
            item.scheme_type ||
            item.category ||
            '';

          const discount =
            txFields.offerTypeValue
              ? `${txFields.offerTypeValue}${txFields.valueType ? ` (${txFields.valueType})` : ''}`
              : (item.discount ||
                item.discount_amount ||
                item.discountAmount ||
                item.discount_percentage ||
                item.discountPercentage ||
                item.cashback ||
                item.amount ||
                item.value ||
                '');

          const description =
            item.description ||
            item.desc ||
            item.details ||
            item.summary ||
            item.offer_details ||
            '';

          const terms =
            item.terms ||
            item.terms_and_conditions ||
            item.termsAndConditions ||
            item.conditions ||
            item.t_and_c ||
            '';

          const validFrom =
            item.from_date ||
            item.fromDate ||
            item.start_date ||
            item.startDate ||
            item.valid_from ||
            item.validFrom ||
            '';

          const validTo =
            item.to_date ||
            item.toDate ||
            item.end_date ||
            item.endDate ||
            item.valid_to ||
            item.validTo ||
            item.valid_till ||
            item.validTill ||
            item.expiry_date ||
            '';

          const couponCode =
            item.coupon_code ||
            item.couponCode ||
            item.promo_code ||
            item.promoCode ||
            item.code ||
            '';

          const brand =
            item.brand ||
            item.brand_name ||
            item.brandName ||
            '';

          const state =
            item.state ||
            item.state_name ||
            item.stateName ||
            '';

          list.push({
            id: item.id || item._id || `offer-${index}`,
            title: String(title),
            offerText: txFields.offerText,
            offerTypeValue: txFields.offerTypeValue,
            transactionType: txFields.transactionType,
            uptoValue: txFields.uptoValue,
            valueType: txFields.valueType,
            offerType: offerType ? String(offerType) : undefined,
            discount: discount ? String(discount) : undefined,
            description: description ? String(description) : undefined,
            terms: terms ? String(terms) : undefined,
            validFrom: validFrom ? String(validFrom) : undefined,
            validTo: validTo ? String(validTo) : undefined,
            couponCode: couponCode ? String(couponCode) : undefined,
            brand: brand ? String(brand) : undefined,
            state: state ? String(state) : undefined,
            raw: item,
          });
        }
      }
    });

    return list;
  }

  // Handle case where raw is a single Object
  if (typeof raw === 'object') {
    const subTxns = getSubTransactions(raw);

    if (subTxns.length > 0) {
      return subTxns.map((tx, txIdx) => {
        const txFields = extractTxFields(tx);
        const parentTxFields = extractTxFields(raw);

        const offerTypeValue = txFields.offerTypeValue || parentTxFields.offerTypeValue;
        const offerText = txFields.offerText || parentTxFields.offerText || raw.title || raw.offer_name || raw.name || '';
        const transactionType = txFields.transactionType || parentTxFields.transactionType || raw.offer_type || raw.offerType || '';
        const uptoValue = txFields.uptoValue || parentTxFields.uptoValue;
        const valueType = txFields.valueType || parentTxFields.valueType;

        const title = offerText || raw.title || raw.offer_title || raw.offer_name || raw.name || '';

        return {
          id: `${raw.id || raw._id || 'offer'}-tx-${txIdx}`,
          title: String(title),
          offerText: offerText ? String(offerText) : undefined,
          offerTypeValue: offerTypeValue ? String(offerTypeValue) : undefined,
          transactionType: transactionType ? String(transactionType) : undefined,
          uptoValue: uptoValue ? String(uptoValue) : undefined,
          valueType: valueType ? String(valueType) : undefined,
          offerType: transactionType ? String(transactionType) : (raw.offer_type || raw.offerType ? String(raw.offer_type || raw.offerType) : undefined),
          discount: offerTypeValue ? `${offerTypeValue}${valueType ? ` (${valueType})` : ''}` : (raw.discount ? String(raw.discount) : undefined),
          description: raw.description || raw.desc || undefined,
          terms: raw.terms || raw.terms_and_conditions || undefined,
          validFrom: raw.from_date || raw.fromDate || undefined,
          validTo: raw.to_date || raw.toDate || undefined,
          couponCode: raw.coupon_code || raw.couponCode || undefined,
          brand: raw.brand || raw.brand_name || undefined,
          state: raw.state || raw.state_name || undefined,
          raw: { ...raw, ...tx },
        };
      });
    }

    const txFields = extractTxFields(raw);
    const title =
      txFields.offerText ||
      raw.title ||
      raw.offer_title ||
      raw.offerTitle ||
      raw.offer_name ||
      raw.offerName ||
      raw.name ||
      raw.scheme_name ||
      raw.heading ||
      raw.offer ||
      '';

    const offerType =
      txFields.transactionType ||
      raw.offer_type ||
      raw.offerType ||
      raw.type ||
      raw.scheme_type ||
      raw.category ||
      '';

    const discount =
      txFields.offerTypeValue
        ? `${txFields.offerTypeValue}${txFields.valueType ? ` (${txFields.valueType})` : ''}`
        : (raw.discount ||
          raw.discount_amount ||
          raw.discount_percentage ||
          raw.cashback ||
          raw.amount ||
          raw.value ||
          '');

    const description =
      raw.description ||
      raw.desc ||
      raw.details ||
      raw.summary ||
      '';

    const terms =
      raw.terms ||
      raw.terms_and_conditions ||
      raw.termsAndConditions ||
      raw.conditions ||
      '';

    const validFrom =
      raw.from_date ||
      raw.fromDate ||
      raw.start_date ||
      raw.startDate ||
      raw.valid_from ||
      '';

    const validTo =
      raw.to_date ||
      raw.toDate ||
      raw.end_date ||
      raw.endDate ||
      raw.valid_to ||
      raw.valid_till ||
      '';

    const couponCode =
      raw.coupon_code ||
      raw.couponCode ||
      raw.promo_code ||
      raw.code ||
      '';

    return [
      {
        id: raw.id || raw._id || 'offer-single-0',
        title: String(title),
        offerText: txFields.offerText,
        offerTypeValue: txFields.offerTypeValue,
        transactionType: txFields.transactionType,
        uptoValue: txFields.uptoValue,
        valueType: txFields.valueType,
        offerType: offerType ? String(offerType) : undefined,
        discount: discount ? String(discount) : undefined,
        description: description ? String(description) : undefined,
        terms: terms ? String(terms) : undefined,
        validFrom: validFrom ? String(validFrom) : undefined,
        validTo: validTo ? String(validTo) : undefined,
        couponCode: couponCode ? String(couponCode) : undefined,
        brand: raw.brand || raw.brand_name ? String(raw.brand || raw.brand_name) : undefined,
        state: raw.state || raw.state_name ? String(raw.state || raw.state_name) : undefined,
        raw,
      },
    ];
  }

  return [];
};

const formatOfferDate = (dateStr: any): string => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  if (str.includes('-') || str.includes('T')) {
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4) {
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
  }
  return str;
};

const renderStringValue = (val: any): string => {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'string') {
    // If the string looks like a decimal number, format it to 2 decimal places
    const num = parseFloat(val);
    if (!isNaN(num) && val.trim() !== '' && String(num) === val.trim() && val.includes('.')) {
      return num.toFixed(2);
    }
    return val;
  }
  if (typeof val === 'number') {
    // Format decimal numbers to 2 decimal places; keep integers as-is
    return Number.isInteger(val) ? String(val) : val.toFixed(2);
  }
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (val.length === 0) return '—';
      return val.map((x) => renderStringValue(x)).join(', ');
    }
    return val.offer_type || val.title || val.offerType || val.brand_name || val.name || val.label || JSON.stringify(val);
  }
  return String(val);
};

const formatTimestamp = (val: any): string => {
  if (!val || val === '—') return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
  } catch {
    return String(val);
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface PriceListItemCardProps {
  item: any;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isReportDetail: boolean;
  visibleColumns: any[];
  timestamp?: string | null;
  onFetchStockInfo: (item: any) => void;
  onOpenOfferModal: (item: any, offers: NormalizedOffer[]) => void;
}

export const PriceListItemCard = React.memo<PriceListItemCardProps>(({
  item,
  isExpanded,
  onToggleExpand,
  isReportDetail,
  visibleColumns,
  timestamp,
  onFetchStockInfo,
  onOpenOfferModal,
}) => {
  // Standard keys safely rendered
  const brand = renderStringValue(
    item.Brand ||
    item.brand ||
    item.brand_name ||
    item.brandName ||
    item.Mobile_Brand
  );
  const productName = renderStringValue(
    item.product_name ||
    item.productName ||
    item.model_name ||
    item.modelName ||
    item.item_name ||
    item.name ||
    item.model
  );
  const modelGroup = renderStringValue(item.model_group_name || item.modelGroupName);
  const rawTimestamp =
    item.timestamp ??
    item.Timestamp ??
    item.TIMESTAMP ??
    item.time_stamp ??
    item.created_at ??
    item.createdAt ??
    timestamp ??
    '';
  const formattedDateTime = formatTimestamp(rawTimestamp);

  const rawOffers =
    item.active_offers ??
    item.activeOffers ??
    item.Active_Offers ??
    item['Active Offers'] ??
    item['active_offers'] ??
    item['active_offer'] ??
    item.active_offer ??
    item.activeOffer ??
    item.offers ??
    item.Offers ??
    item.offer ??
    item.Offer;

  const parsedOffers = useMemo(() => parseItemOffers(rawOffers), [rawOffers]);
  const hasOffers = parsedOffers.length > 0;

  // Hide "View Stock" button when GeneralmodelGroup is "*General"
  const generalModelGroupVal = String(
    item.GeneralmodelGroup ??
    item['GeneralmodelGroup'] ??
    item['General Model Group'] ??
    item.general_model_group ??
    item.generalModelGroup ??
    item['General_model_group'] ??
    item.model_group_name ??
    item.modelGroupName ??
    item['Model Group'] ??
    ''
  ).trim();

  const isGeneral =
    generalModelGroupVal === '*General' ||
    generalModelGroupVal.toLowerCase() === '*general' ||
    generalModelGroupVal.toLowerCase().includes('*general') ||
    generalModelGroupVal === '* General' ||
    generalModelGroupVal.toLowerCase() === '* general';

  const showViewStock = !isReportDetail && !isGeneral;

  const productCategory = renderStringValue(
    item.ProductName ||
    item['Product Name'] ||
    item['ProductName'] ||
    item.product_name ||
    item.productName ||
    item.product_category ||
    item.productCategory ||
    item['Product Category'] ||
    item.category ||
    item.Category ||
    item.model_name ||
    item.modelName ||
    item.item_name ||
    item.name ||
    item.model
  );

  // Filter other dynamic columns: exclude date/timestamp, model group, brand, product category, offer, and internal IDs
  const otherColumns = useMemo(() => {
    const candidateKeys: string[] =
      visibleColumns && visibleColumns.length > 0
        ? visibleColumns.map((col) => col.column_name)
        : Object.keys(item);

    return candidateKeys.filter((key) => {
      if (!key) return false;
      const normalized = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');

      // 1) Exclude Date / Timestamp / CreatedAt (shown in Header)
      if (
        normalized === 'timestamp' ||
        normalized === 'createdat' ||
        normalized === 'lastupdateddate' ||
        normalized === 'updatedat' ||
        normalized === 'time' ||
        normalized === 'date'
      ) {
        return false;
      }

      // 2) Exclude Model Group (shown as field #1)
      if (
        normalized === 'modelgroup' ||
        normalized === 'modelgroupname' ||
        normalized === 'generalmodelgroup' ||
        normalized === 'generalmodelgroupname'
      ) {
        return false;
      }

      // 3) Exclude Brand (shown as field #2)
      if (
        normalized === 'brand' ||
        normalized === 'brandname' ||
        normalized === 'mobilebrand' ||
        normalized === 'itembrand'
      ) {
        return false;
      }

      // 4) Exclude Product Category (shown as field #3)
      if (
        normalized === 'productname' ||
        normalized === 'productcategory' ||
        normalized === 'category'
      ) {
        return false;
      }

      // 5) Exclude Offer (shown as field #4)
      if (
        normalized === 'activeoffers' ||
        normalized === 'activeoffer' ||
        normalized === 'offer' ||
        normalized === 'offers'
      ) {
        return false;
      }

      // 6) Exclude internal IDs / indices
      if (
        normalized === 'id' ||
        normalized === '_id' ||
        normalized === 'variationid' ||
        normalized === 'variation_id' ||
        normalized === 'srno' ||
        normalized === 'sr_no' ||
        normalized === 'sno' ||
        normalized === 'index' ||
        normalized === 'key'
      ) {
        return false;
      }

      return true;
    });
  }, [visibleColumns, item]);

  const firstThreeOtherColumns = otherColumns.slice(0, 3);
  const remainingOtherColumns = otherColumns.slice(3);
  const hasMoreData = remainingOtherColumns.length > 0;

  return (
    <View style={styles.card}>
      {/* 1) Top Header: Last Updated date (Left) + Down Arrow (Right) */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTopMetaRow}>
          {formattedDateTime !== '—' ? (
            <View style={styles.dateBadge}>
              <Image
                source={Images.calendar}
                style={styles.cardCalendarIcon}
                resizeMode="contain"
              />
              <Text style={styles.dateLabel}>Last Updated: </Text>
              <Text style={styles.dateText}>{formattedDateTime}</Text>
            </View>
          ) : (
            <View />
          )}

          {/* Down Arrow / Expand Toggle Button for remaining data */}
          {hasMoreData && (
            <TouchableOpacity
              style={[
                styles.expandToggleBtn,
                isExpanded && styles.expandToggleBtnActive,
              ]}
              onPress={onToggleExpand}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={Images.down}
                style={[
                  styles.expandToggleIcon,
                  isExpanded && styles.expandToggleIconRotated,
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Details List */}
      <View style={styles.detailsContent}>
        {/* 1) Model Group (Highlighted) */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Model Group</Text>
          <View style={styles.modelGroupBadgeWrapper}>
            <Text style={styles.modelGroupValue} numberOfLines={2}>
              {modelGroup || '—'}
            </Text>
          </View>
        </View>

        {/* 2) Brand */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Brand</Text>
          <View style={styles.brandBadgeWrapper}>
            <Text style={styles.brandBadgeText}>{brand || '—'}</Text>
          </View>
        </View>

        {/* 3) Product Category (Highlighted) */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Product Category</Text>
          <View style={styles.productCategoryBadgeWrapper}>
            <Text style={styles.productCategoryBadgeText} numberOfLines={2}>
              {productCategory || '—'}
            </Text>
          </View>
        </View>

        {/* 4) Offer (View Offer button if available, else '—') */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Offer</Text>
          {hasOffers ? (
            <TouchableOpacity
              style={styles.viewOfferRowBadge}
              activeOpacity={0.7}
              onPress={() => onOpenOfferModal(item, parsedOffers)}
            >
              <Image source={Images.offer} style={styles.viewOfferRowIcon} resizeMode="contain" />
              <Text style={styles.viewOfferRowText}>
                {parsedOffers.length > 1 ? `View ${parsedOffers.length} Offers` : 'View Offer'}
              </Text>
              <Text style={styles.viewOfferArrow}>›</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.offerBadgeWrapper, styles.offerBadgeEmpty]}>
              <Text style={[styles.activeOffersText, styles.activeOffersTextEmpty]}>
                —
              </Text>
            </View>
          )}
        </View>

        {/* 5) Other data - First 3 items always visible */}
        {firstThreeOtherColumns.map((colKey) => {
          const val = item[colKey];
          return (
            <View key={colKey} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{colKey}</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={2}
              >
                {renderStringValue(val)}
              </Text>
            </View>
          );
        })}

        {/* Other data - Remaining items hidden with down arrow */}
        {isExpanded && hasMoreData && (
          <View style={styles.expandedDetailsSection}>
            {remainingOtherColumns.map((colKey) => {
              const val = item[colKey];
              return (
                <View key={colKey} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{colKey}</Text>
                  <Text
                    style={styles.infoValue}
                    numberOfLines={2}
                  >
                    {renderStringValue(val)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Bottom Footer: View Stock Button */}
      {showViewStock && (
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.stockBtnBottom}
            onPress={() => onFetchStockInfo(item)}
            activeOpacity={0.7}
          >
            <Image
              source={Images.product}
              style={styles.stockBtnIcon}
              resizeMode="contain"
            />
            <Text style={styles.stockBtnText}>View Stock</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export const PriceListDetailScreen: React.FC<{ route: any; navigation?: any }> = ({
  route,
  navigation,
}) => {
  const { variationId, formatName } = route.params || {};
  const { token } = useAuth();
  const {
    reportDetails,
    detailsLoading,
    detailsError,
    loadReportDetails,
    selectedDate,
    setSelectedDate,
  } = usePriceListStore();

  const [selectedStockItem, setSelectedStockItem] = useState<any>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockInfoData, setStockInfoData] = useState<any>(null);
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Offer modal states
  const [selectedOfferItem, setSelectedOfferItem] = useState<any>(null);
  const [selectedOffersList, setSelectedOffersList] = useState<NormalizedOffer[]>([]);
  const [activeOfferCardIndex, setActiveOfferCardIndex] = useState(0);

  const handleOpenOfferModal = (item: any, offers: NormalizedOffer[]) => {
    setSelectedOfferItem(item);
    setSelectedOffersList(offers);
    setActiveOfferCardIndex(0);
  };

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // API Mobile Brands
  const [apiBrands, setApiBrands] = useState<string[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  // API Item Categories
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    setBrandsLoading(true);
    fetchMobileBrandsAllApi(token)
      .then((brands) => {
        if (Array.isArray(brands) && brands.length > 0) {
          setApiBrands(brands);
        }
      })
      .finally(() => {
        setBrandsLoading(false);
      });

    setCategoriesLoading(true);
    fetchItemCategoriesAllApi(token)
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setApiCategories(cats);
        }
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, [token]);



  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['All Brands']);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['All Categories']);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | number | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Debounce search query to provide smooth typing and loading indicator
  useEffect(() => {
    if (!searchQuery.replace(/\*/g, ' ').trim()) {
      setDebouncedSearchQuery('');
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isReportDetail = route.name === 'PriceListReportDetailScreen';

  console.log("reportDetails",reportDetails);
  
  const handleFetchStockInfo = async (item: any, sync: boolean = false) => {
    setSelectedStockItem(item);
    setStockSearchQuery('');
    setStockLoading(true);
    setStockError(null);

    // Robust extraction of Model Group from item keys
    const modelGroup =
      item['GeneralmodelGroup'] ||
      item['General Model Group'] ||
      item['GeneralModelGroup'] ||
      item['general_model_group'] ||
      item['generalModelGroup'] ||
      item['Model Group'] ||
      item['model_group_name'] ||
      item['modelGroupName'] ||
      item['model_group'] ||
      item['ModelGroup'] ||
      item['MODEL GROUP'] ||
      item['Model_Group'] ||
      item['modelGroup'] ||
      item['Model Group Name'] ||
      item['MODEL_GROUP'] ||
      item['Product Name'] ||
      item['product_name'] ||
      item['productName'] ||
      item['ProductName'] ||
      item['Item Name'] ||
      item['item_name'] ||
      item['model_name'] ||
      item['modelName'] ||
      '';

    console.log('[handleFetchStockInfo] Triggered for item:', item);
    console.log('[handleFetchStockInfo] Extracted modelGroup:', modelGroup);

    try {
      const res = await fetchPriceListStockInfoApi(token, modelGroup, sync);
      console.log('[PriceListDetailScreen] Stock API Response:', res);
      setStockInfoData(res);
      if (!res) {
        setStockError('No response from stock API. Please try again.');
      }
    } catch (err: any) {
      console.warn('[PriceListDetailScreen] Stock API Error:', err);
      setStockError(err?.message || 'Failed to fetch live stock information');
    } finally {
      setStockLoading(false);
    }
  };

  // Helper to extract numeric stock value from any object
  const getObjectStockValue = (obj: any): number => {
    if (!obj || typeof obj !== 'object') return 0;
    const val =
      obj.SALEABLE_STOCK ??
      obj.SALABLE_STOCK ??
      obj['Saleable Stock'] ??
      obj['Salable Stock'] ??
      obj.saleable_stock ??
      obj.salable_stock ??
      obj.saleableStock ??
      obj.salableStock ??
      obj.AVAILABLE_STOCK ??
      obj.available_stock ??
      obj.availableStock ??
      obj.TOTAL_STOCK ??
      obj.total_stock ??
      obj.totalStock ??
      obj.CURRENT_STOCK ??
      obj.current_stock ??
      obj.currentStock ??
      obj.stock ??
      obj.STOCK ??
      obj.qty ??
      obj.QTY ??
      obj.quantity ??
      obj.QUANTITY ??
      obj.balance_stock ??
      obj.balance ??
      obj.count ??
      undefined;

    if (val !== undefined && val !== null) {
      const num = Number(val);
      if (!isNaN(num)) return num;
    }

    // Check sub-items if present
    const subList = obj.items || obj.products || obj.devices || obj.records;
    if (Array.isArray(subList) && subList.length > 0) {
      return subList.reduce((acc, sub) => acc + getObjectStockValue(sub), 0);
    }

    return 0;
  };

  // Normalized location list from stock API
  const rawLocations: any[] = useMemo(() => {
    if (!stockInfoData) return [];
    if (Array.isArray(stockInfoData)) return stockInfoData;
    if (Array.isArray(stockInfoData.data?.locations)) return stockInfoData.data.locations;
    if (Array.isArray(stockInfoData.locations)) return stockInfoData.locations;
    if (Array.isArray(stockInfoData.data?.branches)) return stockInfoData.data.branches;
    if (Array.isArray(stockInfoData.branches)) return stockInfoData.branches;
    if (Array.isArray(stockInfoData.data?.stockDetails)) return stockInfoData.data.stockDetails;
    if (Array.isArray(stockInfoData.stockDetails)) return stockInfoData.stockDetails;
    if (Array.isArray(stockInfoData.data?.stock_details)) return stockInfoData.data.stock_details;
    if (Array.isArray(stockInfoData.stock_details)) return stockInfoData.stock_details;
    if (Array.isArray(stockInfoData.data?.rows)) return stockInfoData.data.rows;
    if (Array.isArray(stockInfoData.rows)) return stockInfoData.rows;
    if (Array.isArray(stockInfoData.data?.items)) return stockInfoData.data.items;
    if (Array.isArray(stockInfoData.items)) return stockInfoData.items;
    if (Array.isArray(stockInfoData.data?.list)) return stockInfoData.data.list;
    if (Array.isArray(stockInfoData.list)) return stockInfoData.list;
    if (Array.isArray(stockInfoData.data?.records)) return stockInfoData.data.records;
    if (Array.isArray(stockInfoData.records)) return stockInfoData.records;
    if (Array.isArray(stockInfoData.data?.stock_info)) return stockInfoData.data.stock_info;
    if (Array.isArray(stockInfoData.stock_info)) return stockInfoData.stock_info;
    if (Array.isArray(stockInfoData.data?.data)) return stockInfoData.data.data;
    if (Array.isArray(stockInfoData.data?.results)) return stockInfoData.data.results;
    if (Array.isArray(stockInfoData.data)) return stockInfoData.data;
    if (Array.isArray(stockInfoData.results)) return stockInfoData.results;
    return [];
  }, [stockInfoData]);

  // Total saleable stock calculation (from API totalStock or locations sum)
  const totalStockCount = useMemo(() => {
    if (stockInfoData?.totalStock !== undefined && stockInfoData.totalStock !== null) {
      const n = Number(stockInfoData.totalStock);
      if (!isNaN(n)) return n;
    }
    if (stockInfoData?.data?.totalStock !== undefined && stockInfoData.data.totalStock !== null) {
      const n = Number(stockInfoData.data.totalStock);
      if (!isNaN(n)) return n;
    }
    if (stockInfoData?.data?.total_stock !== undefined && stockInfoData.data.total_stock !== null) {
      const n = Number(stockInfoData.data.total_stock);
      if (!isNaN(n)) return n;
    }
    if (stockInfoData?.data?.SALEABLE_STOCK !== undefined) return Number(stockInfoData.data.SALEABLE_STOCK);
    if (stockInfoData?.data?.totalSaleableStock !== undefined) return Number(stockInfoData.data.totalSaleableStock);
    if (stockInfoData?.data?.total_saleable_stock !== undefined) return Number(stockInfoData.data.total_saleable_stock);
    if (stockInfoData?.SALEABLE_STOCK !== undefined) return Number(stockInfoData.SALEABLE_STOCK);
    if (stockInfoData?.totalSaleableStock !== undefined) return Number(stockInfoData.totalSaleableStock);
    if (stockInfoData?.total_saleable_stock !== undefined) return Number(stockInfoData.total_saleable_stock);

    return rawLocations.reduce((acc, loc) => acc + getObjectStockValue(loc), 0);
  }, [stockInfoData, rawLocations]);

  // Helper to extract branch name from any location object
  const getBranchNameFromLoc = (loc: any): string => {
    if (!loc || typeof loc !== 'object') return '';
    return String(
      loc.BRANCH_NAME ||
      loc['Branch Name'] ||
      loc.branch_name ||
      loc.branchName ||
      loc.BRANCH ||
      loc.branch ||
      loc.location_name ||
      loc.locationName ||
      loc.location ||
      loc.place ||
      loc.store_name ||
      loc.name ||
      ''
    ).trim();
  };

  // Filtered and sorted (A-Z sequence by branch name) locations inside the stock modal
  const filteredStockLocations = useMemo(() => {
    // Attempt filtering for stock > 0
    let list = (rawLocations || []).filter((loc) => {
      const stock = getObjectStockValue(loc);
      return stock > 0;
    });

    // If filtering by stock > 0 yielded nothing but rawLocations has items, fallback to rawLocations
    if (list.length === 0 && rawLocations.length > 0) {
      list = rawLocations;
    }

    const cleanedStockQuery = stockSearchQuery.replace(/\*/g, ' ');
    if (cleanedStockQuery.trim()) {
      const q = cleanedStockQuery.toLowerCase().trim();
      list = list.filter((loc) => {
        const branchName = getBranchNameFromLoc(loc).toLowerCase();
        const branchCode = String(
          loc.BRANCH_CODE || loc['Branch Code'] || loc.branch_code || loc.branchCode || loc.location_code || loc.locationCode || loc.code || ''
        ).toLowerCase();
        const prodName = String(
          loc.PRODUCT_NAME || loc['Product Name'] || loc.product_name || loc.productName || loc.item_name || loc.itemName || ''
        ).toLowerCase();
        const itemCode = String(loc.ITEM_CODE || loc['Item Code'] || loc.item_code || loc.itemCode || loc.code || '').toLowerCase();

        const matchesHeader =
          branchName.includes(q) ||
          branchCode.includes(q) ||
          prodName.includes(q) ||
          itemCode.includes(q);

        if (matchesHeader) return true;

        const subList = loc.items || loc.products || loc.devices;
        if (Array.isArray(subList)) {
          return subList.some((sub: any) => {
            const subName = String(sub.PRODUCT_NAME || sub['Product Name'] || sub.product_name || sub.productName || sub.item_name || sub.itemName || '').toLowerCase();
            const subCode = String(sub.ITEM_CODE || sub['Item Code'] || sub.item_code || sub.itemCode || sub.code || '').toLowerCase();
            return subName.includes(q) || subCode.includes(q);
          });
        }

        return false;
      });
    }

    // Sort alphabetically (A-Z) by branch name
    return list.slice().sort((a, b) => {
      const nameA = getBranchNameFromLoc(a);
      const nameB = getBranchNameFromLoc(b);
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
    });
  }, [rawLocations, stockSearchQuery]);

  // Total locations available count (from API totalLocations or list length)
  const totalLocationsCount = useMemo(() => {
    if (stockInfoData?.totalLocations !== undefined && stockInfoData.totalLocations !== null) {
      const n = Number(stockInfoData.totalLocations);
      if (!isNaN(n)) return n;
    }
    if (stockInfoData?.data?.totalLocations !== undefined && stockInfoData.data.totalLocations !== null) {
      const n = Number(stockInfoData.data.totalLocations);
      if (!isNaN(n)) return n;
    }
    if (stockInfoData?.data?.total_locations !== undefined && stockInfoData.data.total_locations !== null) {
      const n = Number(stockInfoData.data.total_locations);
      if (!isNaN(n)) return n;
    }
    if (stockInfoData?.total_locations !== undefined && stockInfoData.total_locations !== null) {
      const n = Number(stockInfoData.total_locations);
      if (!isNaN(n)) return n;
    }
    return (filteredStockLocations || []).length;
  }, [stockInfoData, filteredStockLocations]);

  // Formatted updatedAt date for Stock Modal
  const stockUpdatedAt = useMemo(() => {
    const raw =
      stockInfoData?.updatedAt ||
      stockInfoData?.data?.updatedAt ||
      stockInfoData?.data?.updated_at ||
      stockInfoData?.updated_at ||
      stockInfoData?.timestamp ||
      stockInfoData?.data?.timestamp ||
      '';
    if (!raw) return '';
    return formatTimestamp(raw);
  }, [stockInfoData]);

  useEffect(() => {
    if (variationId) {
      if (isReportDetail) {
        const targetDate = selectedDate || getTodayDateString();
        if (!selectedDate) {
          setSelectedDate(targetDate);
        }
        loadReportDetails(token, variationId, targetDate);
      } else {
        loadReportDetails(token, variationId, '');
      }
    }
  }, [token, variationId, loadReportDetails, selectedDate, isReportDetail]);

  const visibleColumns = useMemo(() => {
    if (!reportDetails?.columns) return [];
    return reportDetails.columns.filter(
      (col) =>
        col.not_show_in_report !== true &&
        col.not_show_in_report !== 'true' &&
        col.not_show_in_report !== 1
    );
  }, [reportDetails]);

  // Brands directly sourced from /mobilebrands/all API (with instant fallback if API is empty)
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    set.add('All Brands');
    if (apiBrands.length > 0) {
      apiBrands.forEach((b) => set.add(b));
    } else if (Array.isArray(reportDetails?.data)) {
      reportDetails.data.forEach((item: any) => {
        const b = item.Brand || item.brand || item.brand_name || item.brandName || item.Mobile_Brand;
        if (b && typeof b === 'string' && b.trim().length > 0 && b !== '—') {
          set.add(b.trim());
        }
      });
    }
    return Array.from(set);
  }, [apiBrands, reportDetails?.data]);

  // Categories directly sourced from /settings/icat API (with instant fallback if API is empty)
  const availableProducts = useMemo(() => {
    const set = new Set<string>();
    set.add('All Categories');
    if (apiCategories.length > 0) {
      apiCategories.forEach((c) => set.add(c));
    } else if (Array.isArray(reportDetails?.data)) {
      reportDetails.data.forEach((item: any) => {
        const p =
          item.ProductName ||
          item['Product Name'] ||
          item['ProductName'] ||
          item.product_name ||
          item.productName ||
          item.product_category ||
          item.productCategory ||
          item['Product Category'] ||
          item.category ||
          item.Category ||
          item.model_name ||
          item.modelName ||
          item.item_name ||
          item.name;
        if (p && typeof p === 'string' && p.trim().length > 0 && p !== '—') {
          set.add(p.trim());
        }
      });
    }
    return Array.from(set);
  }, [apiCategories, reportDetails?.data]);

  const filteredAvailableBrands = useMemo(() => {
    const cleaned = brandSearchQuery.replace(/\*/g, ' ');
    if (!cleaned.trim()) return availableBrands;
    const q = cleaned.toLowerCase().trim();
    return availableBrands.filter((b) => b.toLowerCase().includes(q));
  }, [availableBrands, brandSearchQuery]);

  const filteredAvailableProducts = useMemo(() => {
    const cleaned = productSearchQuery.replace(/\*/g, ' ');
    if (!cleaned.trim()) return availableProducts;
    const q = cleaned.toLowerCase().trim();
    return availableProducts.filter((p) => p.toLowerCase().includes(q));
  }, [availableProducts, productSearchQuery]);

  const activeBrands = useMemo(() => {
    return (selectedBrands || []).filter((b) => b && b !== 'All Brands');
  }, [selectedBrands]);

  const activeProducts = useMemo(() => {
    return (selectedProducts || []).filter(
      (p) => p && p !== 'All Categories' && p !== 'All Products'
    );
  }, [selectedProducts]);

  const brandDropdownLabel = useMemo(() => {
    if (activeBrands.length === 0) return 'All Brands';
    if (activeBrands.length === 1) return activeBrands[0];
    if (activeBrands.length === 2) return `${activeBrands[0]}, ${activeBrands[1]}`;
    return `${activeBrands.length} Brands`;
  }, [activeBrands]);

  const productDropdownLabel = useMemo(() => {
    if (activeProducts.length === 0) return 'All Categories';
    if (activeProducts.length === 1) return activeProducts[0];
    if (activeProducts.length === 2) return `${activeProducts[0]}, ${activeProducts[1]}`;
    return `${activeProducts.length} Categories`;
  }, [activeProducts]);

  const handleToggleBrand = (b: string) => {
    if (b === 'All Brands') {
      setSelectedBrands(['All Brands']);
      return;
    }
    const withoutAll = selectedBrands.filter((item) => item !== 'All Brands');
    let next: string[];
    if (withoutAll.includes(b)) {
      next = withoutAll.filter((item) => item !== b);
    } else {
      next = [...withoutAll, b];
    }
    setSelectedBrands(next.length === 0 ? ['All Brands'] : next);
  };

  const handleToggleProduct = (p: string) => {
    if (p === 'All Categories' || p === 'All Products') {
      setSelectedProducts(['All Categories']);
      return;
    }
    const withoutAll = selectedProducts.filter(
      (item) => item !== 'All Categories' && item !== 'All Products'
    );
    let next: string[];
    if (withoutAll.includes(p)) {
      next = withoutAll.filter((item) => item !== p);
    } else {
      next = [...withoutAll, p];
    }
    setSelectedProducts(next.length === 0 ? ['All Categories'] : next);
  };

  // Filter data by search query (deep normalized & tokenized search), brand, and product category
  const filteredData = useMemo(() => {
    if (!reportDetails?.data) return [];

    // Consider '*' as space so searches like "iphone*15" match "iphone 15"
    const cleanedQuery = debouncedSearchQuery.replace(/\*/g, ' ');
    const query = cleanedQuery.trim().toLowerCase();
    const normalizedQuery = query.replace(/[^a-z0-9]/g, '');
    const queryTokens = query
      .split(/[\s\-_()+/,.*]+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    return reportDetails.data.filter((item: any) => {
      // 1. Brand extraction
      const brand = renderStringValue(
        item.Brand || item.brand || item.brand_name || item.brandName || item.Mobile_Brand
      );

      // 2. Product category extraction
      const productCategory = renderStringValue(
        item.ProductName ||
        item['Product Name'] ||
        item['ProductName'] ||
        item.product_name ||
        item.productName ||
        item.product_category ||
        item.productCategory ||
        item['Product Category'] ||
        item.category ||
        item.Category ||
        item.model_name ||
        item.modelName ||
        item.item_name ||
        item.name ||
        item.model
      );

      // 3. Model group extraction
      const modelGroup = renderStringValue(
        item['Model Group'] ||
        item.model_group_name ||
        item.modelGroupName ||
        item.model_group ||
        item.ModelGroup ||
        item.GeneralmodelGroup ||
        item['General Model Group'] ||
        item.general_model_group ||
        item['GeneralmodelGroup'] ||
        item.model_name ||
        item.modelName ||
        item.product_name ||
        item['Product Name'] ||
        item.item_name ||
        item['Item Name']
      );

      // 4. Search Query Check (Search strictly only Model Group, Brand, and Product Category / Product Name)
      if (query.length > 0) {
        const brandText = brand !== '—' ? brand : '';
        const categoryText = productCategory !== '—' ? productCategory : '';
        const modelGroupText = modelGroup !== '—' ? modelGroup : '';

        const searchableText = `${brandText} ${categoryText} ${modelGroupText}`.toLowerCase().trim();
        const normalizedSearchable = searchableText.replace(/[^a-z0-9]/g, '');

        // A: Direct substring match
        const directMatch = searchableText.includes(query);

        // B: Normalized match (strips hyphens, brackets, spaces, pluses, etc.)
        const normalizedMatch =
          normalizedQuery.length > 0 &&
          normalizedSearchable.includes(normalizedQuery);

        // C: All tokens match
        const tokenMatch =
          queryTokens.length > 0 &&
          queryTokens.every((token) => {
            const normToken = token.replace(/[^a-z0-9]/g, '');
            return (
              searchableText.includes(token) ||
              (normToken.length > 0 && normalizedSearchable.includes(normToken))
            );
          });

        if (!directMatch && !normalizedMatch && !tokenMatch) {
          return false;
        }
      }

      // 5. Multiple Brand Filter
      if (activeBrands.length > 0) {
        const brandLower = brand.toLowerCase().trim();
        const isBrandMatch = activeBrands.some((b) => {
          const target = b.toLowerCase().trim();
          return brandLower.includes(target) || target.includes(brandLower);
        });
        if (!isBrandMatch) return false;
      }

      // 6. Multiple Product Category Filter
      if (activeProducts.length > 0) {
        const catLower = productCategory.toLowerCase().trim();
        const isCategoryMatch = activeProducts.some((p) => {
          const target = p.toLowerCase().trim();
          return catLower.includes(target) || target.includes(catLower);
        });
        if (!isCategoryMatch) return false;
      }

      return true;
    });
  }, [reportDetails?.data, debouncedSearchQuery, activeBrands, activeProducts]);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const itemKey = item.id ?? item._id ?? index;
      const isExpanded = expandedItemId === itemKey;

      return (
        <PriceListItemCard
          item={item}
          index={index}
          isExpanded={isExpanded}
          onToggleExpand={() =>
            setExpandedItemId((prev) => (prev === itemKey ? null : itemKey))
          }
          isReportDetail={isReportDetail}
          visibleColumns={visibleColumns}
          timestamp={reportDetails?.timestamp}
          onFetchStockInfo={(it) => handleFetchStockInfo(it, false)}
          onOpenOfferModal={handleOpenOfferModal}
        />
      );
    },
    [expandedItemId, isReportDetail, visibleColumns, reportDetails?.timestamp]
  );

  if (detailsError && isAccessDeniedError(detailsError)) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title={formatName || 'Price List Details'}
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <AccessDenied
          message={detailsError}
          onRetry={() => loadReportDetails(token, variationId)}
          onGoBack={() => navigation?.goBack()}
        />
      </View>
    );
  }

  const stockModalCategory =
    selectedStockItem?.ProductName ||
    selectedStockItem?.['Product Name'] ||
    selectedStockItem?.['ProductName'] ||
    selectedStockItem?.product_name ||
    selectedStockItem?.productName ||
    selectedStockItem?.product_category ||
    selectedStockItem?.productCategory ||
    selectedStockItem?.['Product Category'] ||
    selectedStockItem?.category ||
    selectedStockItem?.Category ||
    selectedStockItem?.item_category ||
    selectedStockItem?.itemCategory ||
    stockInfoData?.data?.category ||
    stockInfoData?.category ||
    '';

  const stockModalTitle =
    selectedStockItem?.['Model Group'] ||
    selectedStockItem?.['model_group_name'] ||
    selectedStockItem?.['modelGroupName'] ||
    selectedStockItem?.model_group_name ||
    selectedStockItem?.modelGroupName ||
    selectedStockItem?.model_group ||
    selectedStockItem?.ModelGroup ||
    selectedStockItem?.['MODEL GROUP'] ||
    selectedStockItem?.['Product Name'] ||
    selectedStockItem?.product_name ||
    selectedStockItem?.model_name ||
    stockInfoData?.data?.modelGroup ||
    stockInfoData?.modelGroup ||
    'Stock Details';

  const offerModalBrand =
    selectedOfferItem?.['Brand Name'] ||
    selectedOfferItem?.['Brand'] ||
    selectedOfferItem?.brand ||
    selectedOfferItem?.Brand ||
    selectedOfferItem?.brand_name ||
    selectedOfferItem?.brandName ||
    selectedOfferItem?.Mobile_Brand ||
    '';

  const offerModalTitle =
    selectedOfferItem?.['Model Group'] ||
    selectedOfferItem?.['model_group_name'] ||
    selectedOfferItem?.['modelGroupName'] ||
    selectedOfferItem?.model_group_name ||
    selectedOfferItem?.modelGroupName ||
    selectedOfferItem?.model_group ||
    selectedOfferItem?.ModelGroup ||
    selectedOfferItem?.['MODEL GROUP'] ||
    selectedOfferItem?.['Product Name'] ||
    selectedOfferItem?.product_name ||
    selectedOfferItem?.model_name ||
    'Offer Details';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header showing the formatName of the variation */}
      <Header
        title={formatName || 'Price List Details'}
        showBack={true}
        onBackPress={() => navigation?.goBack()}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Date Filter Bar */}
      {isReportDetail && (
        <View style={styles.filterBar}>
          <View style={styles.dateField}>
            <Image source={Images.calendar} style={styles.calendarIcon} resizeMode="contain" />
            <Text style={styles.dateText}>
              {selectedDate ? selectedDate : 'No date selected'}
            </Text>
          </View>
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.changeDateBtn}
              onPress={() => setIsDateModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.changeDateBtnText}>Select Date</Text>
            </TouchableOpacity>
            {!!selectedDate && (
              <TouchableOpacity
                style={styles.clearDateBtn}
                onPress={() => {
                  setSelectedDate('');
                  loadReportDetails(token, variationId, '');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearDateBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── Search & Filter Controls Row ── */}
      <View style={styles.topControlsContainer}>
        {/* Search Bar */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => searchInputRef.current?.focus()}
          style={styles.searchContainer}
        >
          <Image
            source={Images.filter}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search brand, category, or model..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {/* Dropdown Filters Row */}
        <View style={styles.dropdownRow}>
          {/* Brand Dropdown Button */}
          <TouchableOpacity
            style={[
              styles.filterDropdownBtn,
              activeBrands.length > 0 && styles.filterDropdownBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setIsBrandModalOpen(true)}
          >
            {brandsLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', flex: 1 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.filterDropdownText} numberOfLines={1}>
                  Loading Brands...
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={[
                    styles.filterDropdownText,
                    activeBrands.length > 0 && styles.filterDropdownTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {brandDropdownLabel}
                </Text>
                <Image
                  source={Images.down}
                  style={[
                    styles.filterDropdownIcon,
                    activeBrands.length > 0 && styles.filterDropdownIconActive,
                  ]}
                  resizeMode="contain"
                />
              </>
            )}
          </TouchableOpacity>

          {/* Product/Category Dropdown Button */}
          <TouchableOpacity
            style={[
              styles.filterDropdownBtn,
              activeProducts.length > 0 && styles.filterDropdownBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setIsProductModalOpen(true)}
          >
            {categoriesLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', flex: 1 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.filterDropdownText} numberOfLines={1}>
                  Loading Categories...
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={[
                    styles.filterDropdownText,
                    activeProducts.length > 0 && styles.filterDropdownTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {productDropdownLabel}
                </Text>
                <Image
                  source={Images.down}
                  style={[
                    styles.filterDropdownIcon,
                    activeProducts.length > 0 && styles.filterDropdownIconActive,
                  ]}
                  resizeMode="contain"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {detailsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Loading data…</Text>
          </View>
        ) : detailsError ? (
          <View style={styles.center}>
            <Text style={styles.stateIcon}>⚠️</Text>
            <Text style={[styles.stateText, { color: '#DC2626' }]}>{detailsError}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => loadReportDetails(token, variationId)}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            extraData={expandedItemId}
            keyExtractor={(item, idx) => String(item.id || item._id || idx)}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              filteredData.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            updateCellsBatchingPeriod={50}
            refreshControl={
              <RefreshControl
                refreshing={detailsLoading}
                onRefresh={() => loadReportDetails(token, variationId, selectedDate)}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              isSearching ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.stateText}>Searching products...</Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.stateIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No matching records found</Text>
                  <Text style={styles.stateText}>
                    {searchQuery.trim()
                      ? `No products found matching "${searchQuery}"`
                      : 'No price list data available for the selected filters'}
                  </Text>
                  {(!!searchQuery.trim() || activeBrands.length > 0 || activeProducts.length > 0) && (
                    <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={() => {
                        setSearchQuery('');
                        setSelectedBrands(['All Brands']);
                        setSelectedProducts(['All Categories']);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.retryText}>Clear Filters & Search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            }
          />
        )}
      </View>

      {/* ── Multi-Brand Selection Modal ── */}
      <Modal
        visible={isBrandModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsBrandModalOpen(false);
          setBrandSearchQuery('');
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsBrandModalOpen(false);
            setBrandSearchQuery('');
          }}
        >
          <View style={styles.selectModalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Select Brands</Text>
                <Text style={styles.modalSubtitle}>
                  {activeBrands.length > 0
                    ? `${activeBrands.length} brand(s) selected`
                    : 'Showing all brands'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {activeBrands.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSelectedBrands(['All Brands'])}
                    style={styles.modalResetBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalResetText}>Reset</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setIsBrandModalOpen(false);
                    setBrandSearchQuery('');
                  }}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Brand Search Bar */}
            <View style={styles.modalSearchBox}>
              <Image source={Images.filter} style={styles.modalSearchIcon} resizeMode="contain" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search brand..."
                placeholderTextColor="#94A3B8"
                value={brandSearchQuery}
                onChangeText={setBrandSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {brandSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setBrandSearchQuery('')}
                  style={styles.modalSearchClearBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalSearchClearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {brandsLoading ? (
                <View style={{ paddingVertical: 30, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.stateText, { marginTop: 8 }]}>Loading brands...</Text>
                </View>
              ) : filteredAvailableBrands.length === 0 ? (
                <Text style={styles.modalEmptyText}>No brands found</Text>
              ) : (
                filteredAvailableBrands.map((b) => {
                  const isAllOption = b === 'All Brands';
                  const isSelected = isAllOption
                    ? activeBrands.length === 0
                    : selectedBrands.includes(b);

                  return (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.stateOptionItem,
                        isSelected && styles.stateOptionItemActive,
                      ]}
                      onPress={() => handleToggleBrand(b)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.stateOptionText,
                          isSelected && styles.stateOptionTextActive,
                        ]}
                      >
                        {b}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkmarkBadge}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={() => {
                setIsBrandModalOpen(false);
                setBrandSearchQuery('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalApplyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Multi-Product Selection Modal ── */}
      <Modal
        visible={isProductModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsProductModalOpen(false);
          setProductSearchQuery('');
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsProductModalOpen(false);
            setProductSearchQuery('');
          }}
        >
          <View style={styles.selectModalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Select Product Category</Text>
                <Text style={styles.modalSubtitle}>
                  {activeProducts.length > 0
                    ? `${activeProducts.length} category(ies) selected`
                    : 'Showing all categories'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {activeProducts.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSelectedProducts(['All Categories'])}
                    style={styles.modalResetBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalResetText}>Reset</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setIsProductModalOpen(false);
                    setProductSearchQuery('');
                  }}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Search Bar */}
            <View style={styles.modalSearchBox}>
              <Image source={Images.filter} style={styles.modalSearchIcon} resizeMode="contain" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search category..."
                placeholderTextColor="#94A3B8"
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {productSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setProductSearchQuery('')}
                  style={styles.modalSearchClearBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalSearchClearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {categoriesLoading ? (
                <View style={{ paddingVertical: 30, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.stateText, { marginTop: 8 }]}>Loading categories...</Text>
                </View>
              ) : filteredAvailableProducts.length === 0 ? (
                <Text style={styles.modalEmptyText}>No categories found</Text>
              ) : (
                filteredAvailableProducts.map((p) => {
                  const isAllOption = p === 'All Categories' || p === 'All Products';
                  const isSelected = isAllOption
                    ? activeProducts.length === 0
                    : selectedProducts.includes(p);

                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.stateOptionItem,
                        isSelected && styles.stateOptionItemActive,
                      ]}
                      onPress={() => handleToggleProduct(p)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.stateOptionText,
                          isSelected && styles.stateOptionTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {p}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkmarkBadge}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={() => {
                setIsProductModalOpen(false);
                setProductSearchQuery('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalApplyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Date Calendar Picker Modal ── */}
      {isReportDetail && (
        <Modal
          visible={isDateModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDateModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDateModalOpen(false)}
          >
            <View style={styles.calendarCard} onStartShouldSetResponder={() => true}>
              {/* Header: Month & Year Navigator */}
              <View style={styles.calendarNavRow}>
                <TouchableOpacity
                  style={styles.calendarNavBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear((y) => y - 1);
                    } else {
                      setCalendarMonth((m) => m - 1);
                    }
                  }}
                >
                  <Text style={styles.calendarNavBtnText}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.calendarMonthText}>
                  {MONTH_NAMES[calendarMonth]} {calendarYear}
                </Text>

                <TouchableOpacity
                  style={styles.calendarNavBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear((y) => y + 1);
                    } else {
                      setCalendarMonth((m) => m + 1);
                    }
                  }}
                >
                  <Text style={styles.calendarNavBtnText}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Weekday Headers */}
              <View style={styles.calendarWeekHeader}>
                {WEEK_DAYS.map((day) => (
                  <Text key={day} style={styles.calendarWeekDayText}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.calendarGrid}>
                {(() => {
                  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
                  const cells = [];

                  // Empty padding cells before 1st day of month
                  for (let i = 0; i < firstDayOfWeek; i++) {
                    cells.push(
                      <View key={`empty-${i}`} style={styles.calendarDayCell}>
                        <Text style={styles.calendarDayTextDisabled}> </Text>
                      </View>
                    );
                  }

                  // Days of current month
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dayStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isSelected = selectedDate === dayStr;
                    const isToday = getTodayDateString() === dayStr;
                    const isFuture = dayStr > getTodayDateString();

                    cells.push(
                      <TouchableOpacity
                        key={`day-${d}`}
                        style={[
                          styles.calendarDayCell,
                          isSelected && styles.calendarDayCellSelected,
                          isToday && !isSelected && styles.calendarDayCellToday,
                        ]}
                        activeOpacity={isFuture ? 1 : 0.7}
                        disabled={isFuture}
                        onPress={() => {
                          setSelectedDate(dayStr);
                          setIsDateModalOpen(false);
                          loadReportDetails(token, variationId, dayStr);
                        }}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            isSelected && styles.calendarDayTextSelected,
                            isToday && !isSelected && styles.calendarDayTextToday,
                            isFuture && styles.calendarDayTextDisabled,
                          ]}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  return cells;
                })()}
              </View>

              {/* Calendar Bottom Actions */}
              <View style={styles.calendarActionsRow}>
                <TouchableOpacity
                  style={styles.calendarActionBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedDate('');
                    setIsDateModalOpen(false);
                    loadReportDetails(token, variationId, '');
                  }}
                >
                  <Text style={styles.calendarActionBtnText}>Clear Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calendarActionBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.7}
                  onPress={() => setIsDateModalOpen(false)}
                >
                  <Text style={[styles.calendarActionBtnText, { color: '#fff' }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── Live Stock Info Detail Modal (Live Synced APX Inventory) ── */}
      <Modal
        visible={selectedStockItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStockItem(null)}
      >
        <View style={styles.stockModalOverlay}>
          {/* Backdrop Tap to Close */}
          <TouchableOpacity
           
            activeOpacity={1}
            onPress={() => setSelectedStockItem(null)}
          />

          <View style={styles.stockModalCard}>
            {/* Modal Top Header */}
            <View style={styles.stockModalHeader}>
              {/* Top Action Bar: Sync Apx button (sync = true) + Close button */}
              <View style={styles.stockModalTopActionBar}>
                <TouchableOpacity
                  style={styles.stockSyncBtn}
                  activeOpacity={0.7}
                  disabled={stockLoading}
                  onPress={() => handleFetchStockInfo(selectedStockItem, true)}
                >
                  {stockLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.stockSyncBtnIcon}>⚡</Text>
                      <Text style={styles.stockSyncBtnText}>Sync Apx</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedStockItem(null)}
                  style={styles.stockModalCloseBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.stockModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Title Section: Icon, Model Title, Category Pill, and Last Synced */}
              <View style={styles.stockModalTitleRow}>
                <View style={styles.stockIconCircle}>
                  <Text style={styles.stockIconEmoji}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={styles.stockModalTitle} numberOfLines={3}>
                      {stockModalTitle}
                    </Text>
                    
                  </View>
                  {!!stockModalCategory && (
                      <View style={styles.stockCategoryPill}>
                        <Text style={styles.stockCategoryText}>{stockModalCategory}</Text>
                      </View>
                    )}
                  {!!stockUpdatedAt && stockUpdatedAt !== '—' && (
                    <Text style={styles.stockLastSyncedText}>
                      Last Synced: {stockUpdatedAt}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Modal Controls: Search & Summary Badges */}
            <View style={styles.stockControlsRow}>
              <View style={styles.stockSearchBox}>
                <Image source={Images.filter} style={styles.stockSearchIcon} resizeMode="contain" />
                <TextInput
                  style={styles.stockSearchInput}
                  placeholder="Search place, device or code..."
                  placeholderTextColor="#94A3B8"
                  value={stockSearchQuery}
                  onChangeText={setStockSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {stockSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setStockSearchQuery('')} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 13, color: '#94A3B8', fontFamily: fontFamily.bold }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.stockSummaryBadgesRow}>
                <View style={styles.stockLocationsBadge}>
                  <Text style={styles.stockLocationsBadgeText}>
                    Locations Available: <Text style={{ fontFamily: fontFamily.bold, color: '#047857' }}>{totalLocationsCount}</Text>
                  </Text>
                </View>
                <View style={styles.stockTotalBadge}>
                  <Text style={styles.stockTotalBadgeText}>
                    Total Saleable Stock: <Text style={{ fontFamily: fontFamily.bold, color: '#fff' }}>{totalStockCount}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.stockRefreshIconBtn}
                  activeOpacity={0.7}
                  disabled={stockLoading}
                  onPress={() => handleFetchStockInfo(selectedStockItem, false)}
                >
                  <Text style={styles.stockRefreshIconEmoji}>🔄</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Content: Location Cards List */}
            {stockLoading ? (
              <View style={styles.stockModalLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.stockModalLoadingText}>Fetching live inventory from APX…</Text>
              </View>
            ) : stockError ? (
              <View style={styles.stockModalLoadingContainer}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>⚠️</Text>
                <Text style={{ color: '#DC2626', fontFamily: fontFamily.medium, fontSize: 13 }}>{stockError}</Text>
                <TouchableOpacity
                  style={[styles.retryBtn, { marginTop: 14 }]}
                  onPress={() => handleFetchStockInfo(selectedStockItem, true)}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.stockListFlexContainer}>
                <FlatList
                  data={filteredStockLocations}
                  keyExtractor={(loc, idx) => String(loc.branch_id || loc.id || loc.branch_code || loc.location_code || idx)}
                  contentContainerStyle={styles.stockLocationListContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                  refreshControl={
                    <RefreshControl
                      refreshing={stockLoading}
                      onRefresh={() => handleFetchStockInfo(selectedStockItem, false)}
                      colors={[colors.primary]}
                      tintColor={colors.primary}
                    />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.stateIcon}>📦</Text>
                      <Text style={styles.stateText}>No stock locations found</Text>
                    </View>
                  }
                  renderItem={({ item: loc, index: locIdx }) => {
                    const branchName =
                      loc.BRANCH_NAME ||
                      loc['Branch Name'] ||
                      loc.branch_name ||
                      loc.branchName ||
                      loc.BRANCH ||
                      loc.branch ||
                      loc.location_name ||
                      loc.locationName ||
                      loc.location ||
                      loc.place ||
                      loc.store_name ||
                      loc.name ||
                      `Branch ${locIdx + 1}`;
                    const branchCode =
                      loc.BRANCH_CODE ||
                      loc['Branch Code'] ||
                      loc.branch_code ||
                      loc.branchCode ||
                      loc.location_code ||
                      loc.locationCode ||
                      loc.CODE ||
                      loc.code ||
                      '';
                    const availableStock = getObjectStockValue(loc);

                    const subItems: any[] =
                      Array.isArray(loc.items) && loc.items.length > 0
                        ? loc.items
                        : Array.isArray(loc.products) && loc.products.length > 0
                        ? loc.products
                        : Array.isArray(loc.devices) && loc.devices.length > 0
                        ? loc.devices
                        : [
                            {
                              product_name:
                                loc.PRODUCT_NAME ||
                                loc['Product Name'] ||
                                loc.product_name ||
                                loc.productName ||
                                loc.ITEM_NAME ||
                                loc.item_name ||
                                loc.itemName ||
                                loc.device_name ||
                                loc.deviceName ||
                                loc.model_name ||
                                loc.modelName ||
                                stockModalTitle,
                              item_code:
                                loc.ITEM_CODE ||
                                loc['Item Code'] ||
                                loc.item_code ||
                                loc.itemCode ||
                                loc.product_code ||
                                loc.productCode ||
                                loc.CODE ||
                                loc.code ||
                                loc.id ||
                                '',
                              saleable_stock: availableStock,
                            },
                          ];

                    return (
                      <View style={styles.locationCard}>
                        {/* Location Header Row */}
                        <View style={styles.locationCardHeader}>
                          <View style={styles.locationBadgeNum}>
                            <Text style={styles.locationBadgeNumText}>
                              {locIdx + 1}
                            </Text>
                          </View>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.locationPinEmoji}>📍</Text>
                            <Text style={styles.locationTitleText} numberOfLines={1}>
                              {branchName} {branchCode ? `(${branchCode})` : ''}
                            </Text>
                          </View>
                          <View style={styles.locationAvailBadge}>
                            <Text style={styles.locationAvailText}>
                              Available Stock: <Text style={styles.locationAvailBold}>{String(availableStock)}</Text>
                            </Text>
                          </View>
                        </View>

                        {/* Device Sub Items */}
                        <View style={styles.locationSubItemsContainer}>
                          {subItems
                            .filter((device) => {
                              if (subItems.length === 1) return true;
                              const devStock = getObjectStockValue(device);
                              return devStock > 0 || availableStock > 0;
                            })
                            .map((device, devIdx) => {
                            const devName =
                              device.PRODUCT_NAME ||
                              device['Product Name'] ||
                              device.product_name ||
                              device.productName ||
                              device.ITEM_NAME ||
                              device.item_name ||
                              device.itemName ||
                              device.device_name ||
                              stockModalTitle;
                            const devCode =
                              device.ITEM_CODE ||
                              device['Item Code'] ||
                              device.item_code ||
                              device.itemCode ||
                              device.product_code ||
                              device.CODE ||
                              device.code ||
                              '';
                            const devStock = getObjectStockValue(device) || availableStock;

                            return (
                              <View key={devIdx} style={styles.deviceRow}>
                                <View style={styles.deviceIconBox}>
                                  <Text style={{ fontSize: 13 }}>📱</Text>
                                </View>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                  <Text style={styles.deviceNameText} numberOfLines={1}>
                                    {devName}
                                  </Text>
                                  {!!devCode && (
                                    <Text style={styles.deviceCodeText}>Code: {devCode}</Text>
                                  )}
                                </View>
                                <View style={styles.saleableStockBadge}>
                                  <Text style={styles.saleableStockBadgeText}>
                                    {String(devStock)} Saleable Stock
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  }}
                />
              </View>
            )}

            {/* Modal Bottom Footer */}
            <View style={styles.stockModalFooter}>
              <Text style={styles.stockModalSourceText}>Source: Live APX Inventory Sync</Text>
              <TouchableOpacity
                style={styles.stockModalCloseBtnBottom}
                onPress={() => setSelectedStockItem(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.stockModalCloseBtnBottomText}>Close Stock View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Active Offers Horizontal Scroll Modal ── */}
      <Modal
        visible={selectedOfferItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOfferItem(null)}
      >
        <View style={styles.offerModalOverlay}>
          {/* Backdrop Tap to Close */}
          <TouchableOpacity
            style={styles.offerModalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedOfferItem(null)}
          />

          <View style={styles.offerModalCard}>
            {/* Modal Header */}
            <View style={styles.offerModalHeader}>
              <View style={styles.offerModalTitleRow}>
                <View style={styles.offerIconCircle}>
                  <Image source={Images.offer} style={styles.offerModalHeaderIcon} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={styles.offerModalTitle} numberOfLines={1}>
                      {offerModalTitle}
                    </Text>
                    {!!offerModalBrand && (
                      <View style={styles.offerCategoryPill}>
                        <Text style={styles.offerCategoryText}>{offerModalBrand}</Text>
                      </View>
                    )}
                    <View style={styles.offerCountPill}>
                      <Text style={styles.offerCountPillText}>
                        {selectedOffersList.length} {selectedOffersList.length === 1 ? 'Offer' : 'Offers'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.offerModalSubText}>
                    Active promotional schemes & discounts
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedOfferItem(null)}
                style={styles.offerModalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.offerModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Body: Horizontal Scroll Cards */}
            <View style={styles.offerListFlexContainer}>
              <FlatList
                data={selectedOffersList}
                keyExtractor={(off, idx) => String(off.id || idx)}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.offerCardsListContent}
                snapToInterval={OFFER_SNAP_INTERVAL}
                decelerationRate="fast"
                snapToAlignment="start"
                pagingEnabled={false}
                nestedScrollEnabled={true}
                onMomentumScrollEnd={(e) => {
                  const offset = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(offset / OFFER_SNAP_INTERVAL);
                  setActiveOfferCardIndex(Math.max(0, Math.min(idx, selectedOffersList.length - 1)));
                }}
                renderItem={({ item: offer, index: offIdx }) => {
                  const formattedFrom = formatOfferDate(offer.validFrom);
                  const formattedTo = formatOfferDate(offer.validTo);
                  const validityText =
                    formattedFrom && formattedTo
                      ? `${formattedFrom} – ${formattedTo}`
                      : formattedTo
                      ? `Valid till ${formattedTo}`
                      : formattedFrom
                      ? `From ${formattedFrom}`
                      : '';

                  return (
                    <View style={[styles.offerCardItem, { width: OFFER_CARD_WIDTH }]}>
                      <ScrollView
                        style={styles.offerCardInnerScroll}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                      >
                        {/* Top Badges */}
                        <View style={styles.offerCardTopRow}>
                          {!!(offer.transactionType || offer.offerType) ? (
                            <View style={styles.offerTypeBadge}>
                              <Image source={Images.tag} style={styles.offerTypeTagIcon} resizeMode="contain" />
                              <Text style={styles.offerTypeBadgeText}>
                                {offer.transactionType || offer.offerType}
                              </Text>
                            </View>
                          ) : (
                            <View />
                          )}
                          {selectedOffersList.length > 1 && (
                            <View style={styles.offerIndexBadge}>
                              <Text style={styles.offerIndexBadgeText}>
                                {offIdx + 1} of {selectedOffersList.length}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* ── Date on Top ── */}
                        {!!validityText && (
                          <View style={styles.validityRowTop}>
                            <Image source={Images.calendar} style={styles.validityCalendarIcon} resizeMode="contain" />
                            <Text style={styles.validityText}>{validityText}</Text>
                          </View>
                        )}

                        {/* ── Transaction Keys Section (Offer Type Value, Value Type, Upto Value, Transaction Type) ── */}
                        {(!!offer.offerTypeValue || !!offer.transactionType || !!offer.uptoValue || !!offer.valueType) && (
                          <View style={styles.txnDetailsCard}>
                            {/* Offer Type Value */}
                            {!!offer.offerTypeValue && (
                              <View style={styles.txnDetailRow}>
                                <Text style={styles.txnDetailLabel}>Offer Type Value</Text>
                                <View style={styles.txnValuePill}>
                                  <Text style={styles.txnValuePillText}>{offer.offerTypeValue}</Text>
                                </View>
                              </View>
                            )}

                            {/* Value Type */}
                            {!!offer.valueType && (
                              <View style={styles.txnDetailRow}>
                                <Text style={styles.txnDetailLabel}>Value Type</Text>
                                <Text style={styles.txnDetailValue}>{offer.valueType}</Text>
                              </View>
                            )}

                            {/* Upto Value */}
                            {!!offer.uptoValue && (
                              <View style={styles.txnDetailRow}>
                                <Text style={styles.txnDetailLabel}>Upto Value</Text>
                                <Text style={styles.txnDetailValueHighlight}>{offer.uptoValue}</Text>
                              </View>
                            )}

                            {/* Transaction Type */}
                            {!!offer.transactionType && (
                              <View style={styles.txnDetailRow}>
                                <Text style={styles.txnDetailLabel}>Transaction Type</Text>
                                <Text style={styles.txnDetailValue}>{offer.transactionType}</Text>
                              </View>
                            )}
                          </View>
                        )}

                        {/* Discount / Benefit Highlight Banner (if separate discount value available) */}
                        {!!offer.discount && !offer.offerTypeValue && (
                          <View style={styles.discountBannerBox}>
                            <Text style={styles.discountBannerEmoji}>🎁</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.discountBannerLabel}>Discount / Benefit</Text>
                              <Text style={styles.discountBannerValue}>{offer.discount}</Text>
                            </View>
                          </View>
                        )}

                        {/* Coupon / Promo Code Box */}
                        {!!offer.couponCode && (
                          <View style={styles.couponCodeBox}>
                            <Text style={styles.couponCodeLabel}>COUPON / SCHEME CODE</Text>
                            <Text style={styles.couponCodeValue}>{offer.couponCode}</Text>
                          </View>
                        )}

                        {/* ── Offer Text at Bottom ── */}
                        {!!(offer.offerText || offer.title) && (
                          <View style={styles.offerTextBox}>
                            <Text style={styles.offerTextHeader}>Offer Text</Text>
                            <Text style={styles.offerItemTitleBottom}>{offer.offerText || offer.title}</Text>
                          </View>
                        )}

                        {/* Description Details */}
                        {!!offer.description && (
                          <View style={styles.offerDescriptionBox}>
                            <Text style={styles.offerSectionHeader}>Offer Details</Text>
                            <Text style={styles.offerDescriptionText}>{offer.description}</Text>
                          </View>
                        )}

                        {/* Terms & Conditions */}
                        {!!offer.terms && (
                          <View style={styles.offerTermsBox}>
                            <Text style={styles.offerTermsHeader}>Terms & Conditions</Text>
                            <Text style={styles.offerTermsText}>{offer.terms}</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  );
                }}
              />

              {/* Pagination Dots (if multiple offers) */}
              {selectedOffersList.length > 1 && (
                <View style={styles.offerPaginationContainer}>
                  <View style={styles.offerDotsRow}>
                    {selectedOffersList.map((_, dotIdx) => (
                      <View
                        key={dotIdx}
                        style={[
                          styles.offerDot,
                          activeOfferCardIndex === dotIdx && styles.offerDotActive,
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.offerSwipeHint}>
                    Swipe for more offers ({activeOfferCardIndex + 1}/{selectedOffersList.length})
                  </Text>
                </View>
              )}
            </View>

            {/* Modal Bottom Footer */}
            <View style={styles.offerModalFooter}>
              <Text style={styles.offerModalSourceText}>
                {selectedOffersList.length} Active {selectedOffersList.length === 1 ? 'Scheme' : 'Schemes'} Available
              </Text>
              <TouchableOpacity
                style={styles.offerModalCloseBtnBottom}
                onPress={() => setSelectedOfferItem(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.offerModalCloseBtnBottomText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  headerStyle: {
    backgroundColor: colors.primary,
    borderBottomWidth: 0,
  },
  headerTitleStyle: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fontFamily.bold,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    // borderTopLeftRadius: borderRadius.cardRadius || 24,
    // borderTopRightRadius: borderRadius.cardRadius || 24,
    overflow: 'hidden',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  cardTopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    gap: 4,
  },
  cardCalendarIcon: {
    width: 11,
    height: 11,
    tintColor: '#64748B',
  },
  dateLabel: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#64748B',
  },
  dateText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#334155',
  },
  modelGroupBadgeWrapper: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    alignSelf: 'flex-end',
    maxWidth: '70%',
  },
  modelGroupValue: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    textAlign: 'right',
  },
  brandBadgeWrapper: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    alignSelf: 'flex-end',
  },
  brandBadgeText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  productCategoryBadgeWrapper: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-end',
    maxWidth: '70%',
  },
  productCategoryBadgeText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#1D4ED8',
    textAlign: 'right',
  },
  offerBadgeWrapper: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    alignSelf: 'flex-end',
    maxWidth: '70%',
  },
  offerBadgeEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  activeOffersText: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
    fontSize: 12,
    textAlign: 'right',
  },
  activeOffersTextEmpty: {
    color: '#94A3B8',
    fontFamily: fontFamily.regular,
  },
  viewOfferRowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
    alignSelf: 'flex-end',
  },
  viewOfferRowIcon: {
    width: 13,
    height: 13,
    tintColor: colors.primary,
  },
  viewOfferRowText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  viewOfferArrow: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    marginTop: -1,
  },
  productNameValue: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  titleInfoLabel: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  productNameText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    flex: 1,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  brandText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  stockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    borderWidth: 1,
    borderColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  stockBtnIcon: {
    width: 12,
    height: 12,
    tintColor: '#FFFFFF',
  },
  stockBtnText: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  offerBtnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#6D28D9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1.5,
  },
  offerBtnIcon: {
    width: 13,
    height: 13,
    tintColor: '#FFFFFF',
  },
  offerBtnText: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  stockBtnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderWidth: 1,
    borderColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandToggleBtnActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#DDD6FE',
  },
  expandToggleIcon: {
    width: 12,
    height: 12,
    tintColor: colors.primary,
  },
  expandToggleIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  expandedDetailsSection: {
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailsContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#1E293B',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  retryText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },
  modalScroll: {
    paddingBottom: 10,
  },
  stockItemName: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginBottom: 14,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  stockValue: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIcon: {
    width: 16,
    height: 16,
    tintColor: colors.primary,
  },
  
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeDateBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeDateBtnText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  clearDateBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearDateBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    marginTop: -1,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calendarNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavBtnText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#334155',
  },
  calendarMonthText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarWeekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  calendarDayCellSelected: {
    backgroundColor: colors.primary,
  },
  calendarDayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  calendarDayText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#1E293B',
  },
  calendarDayTextSelected: {
    color: colors.white,
    fontFamily: fontFamily.bold,
  },
  calendarDayTextToday: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  calendarDayTextDisabled: {
    color: '#CBD5E1',
  },
  calendarActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calendarActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  calendarActionBtnText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },

  /* Top Filter Controls */
  topControlsContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    width: 15,
    height: 15,
    tintColor: '#94A3B8',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterDropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 10,
    height: 38,
  },
  filterDropdownBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterDropdownText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    flex: 1,
    marginRight: 4,
  },
  filterDropdownTextActive: {
    color: colors.white,
  },
  filterDropdownIcon: {
    width: 10,
    height: 10,
    tintColor: colors.primary,
  },
  filterDropdownIconActive: {
    tintColor: colors.white,
  },

  /* Multi-Select Modals */
  selectModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  modalResetBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  modalResetText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 15,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },
  stateOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  stateOptionItemActive: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  stateOptionText: {
    fontSize: 12.5,
    fontFamily: fontFamily.medium,
    color: '#334155',
    flex: 1,
    marginRight: 6,
  },
  stateOptionTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  checkmarkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
  modalApplyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 12,
  },
  modalApplyBtnText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fontFamily.bold,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  modalSearchIcon: {
    width: 13,
    height: 13,
    tintColor: '#94A3B8',
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    paddingVertical: 0,
  },
  modalSearchClearBtn: {
    padding: 4,
  },
  modalSearchClearText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },
  modalEmptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12.5,
    fontFamily: fontFamily.medium,
    paddingVertical: 20,
  },

  /* ── Live Stock Modal Styles ── */
  stockModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'android' ? 64 : 20,
  },
  stockModalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  stockListFlexContainer: {
    flex: 1,
  },
  stockModalHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stockModalTopActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  stockModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stockIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockIconEmoji: {
    fontSize: 18,
  },
  stockModalTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  stockCategoryPill: {
    paddingVertical: 2
  },
  stockCategoryText: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: '#475569',
    textTransform: 'uppercase',
  },
  stockLivePill: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockLiveText: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  stockLastSyncedText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    marginTop: 3,
  },
  stockRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 6.5,
    borderRadius: 10,
    gap: 4,
  },
  stockRefreshBtnIcon: {
    fontSize: 11,
  },
  stockRefreshBtnText: {
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    color: '#334155',
  },
  stockSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  stockSyncBtnIcon: {
    fontSize: 11,
    color: '#fff',
  },
  stockSyncBtnText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
  stockModalCloseBtn: {
    padding: 6,
  },
  stockModalCloseText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },

  /* Controls (Search & Badges) */
  stockControlsRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  stockSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
  },
  stockSearchIcon: {
    width: 14,
    height: 14,
    tintColor: '#94A3B8',
    marginRight: 8,
  },
  stockSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    paddingVertical: 0,
  },
  stockSummaryBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stockLocationsBadge: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  stockLocationsBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#065F46',
  },
  stockTotalBadge: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  stockTotalBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#fff',
  },
  stockRefreshIconBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    width: 32,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockRefreshIconEmoji: {
    fontSize: 13,
  },

  /* Location Cards Content */
  stockModalLoadingContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockModalLoadingText: {
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    marginTop: 10,
  },
  stockLocationListContent: {
    padding: 14,
    paddingBottom: 20,
    gap: 10,
  },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  locationBadgeNum: {
    minWidth: 26,
    height: 24,
    paddingHorizontal: 5,
    borderRadius: 6,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBadgeNumText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  locationPinEmoji: {
    fontSize: 13,
  },
  locationTitleText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    flex: 1,
  },
  locationAvailBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationAvailText: {
    fontSize: 10.5,
    fontFamily: fontFamily.medium,
    color: '#065F46',
  },
  locationAvailBold: {
    fontFamily: fontFamily.bold,
    color: '#047857',
  },

  /* Device Rows */
  locationSubItemsContainer: {
    padding: 10,
    gap: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  deviceIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceNameText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#334155',
  },
  deviceCodeText: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    marginTop: 1,
  },
  saleableStockBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saleableStockBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#15803D',
  },

  /* Footer */
  stockModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: colors.white,
  },
  stockModalSourceText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  stockModalCloseBtnBottom: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stockModalCloseBtnBottomText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },

  /* ── Active Offers Modal Styles ── */
  offerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'android' ? 64 : 20,
  },
  offerModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  offerModalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  offerModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: colors.white,
  },
  offerModalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginRight: 8,
  },
  offerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerModalHeaderIcon: {
    width: 20,
    height: 20,
    tintColor: colors.primary,
  },
  offerModalTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  offerCategoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offerCategoryText: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: '#475569',
    textTransform: 'uppercase',
  },
  offerCountPill: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offerCountPillText: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  offerModalSubText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    marginTop: 3,
  },
  offerModalCloseBtn: {
    padding: 6,
  },
  offerModalCloseText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },

  /* Offer Cards List Container */
  offerListFlexContainer: {
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
  },
  offerCardsListContent: {
    paddingHorizontal: 16,
    gap: 14,
    alignItems: 'stretch',
  },
  offerCardItem: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    maxHeight: 380,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  offerCardInnerScroll: {
    flexGrow: 0,
  },
  offerCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  offerTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  offerTypeTagIcon: {
    width: 10,
    height: 10,
    tintColor: colors.primary,
  },
  offerTypeBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  offerIndexBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  offerIndexBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  offerItemTitle: {
    fontSize: 14.5,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 8,
  },
  /* Transaction Details Card in Offer Card */
  txnDetailsCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 10,
    marginBottom: 8,
    gap: 7,
  },
  txnDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    gap: 8,
  },
  txnDetailLabel: {
    fontSize: 11.5,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  txnDetailValue: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    textAlign: 'right',
    flex: 1,
  },
  txnDetailValueHighlight: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#059669',
    textAlign: 'right',
    flex: 1,
  },
  txnValuePill: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    alignSelf: 'flex-end',
  },
  txnValuePillText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  discountBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 8,
  },
  discountBannerEmoji: {
    fontSize: 18,
  },
  discountBannerLabel: {
    fontSize: 10.5,
    fontFamily: fontFamily.medium,
    color: '#065F46',
  },
  discountBannerValue: {
    fontSize: 13.5,
    fontFamily: fontFamily.bold,
    color: '#047857',
    marginTop: 1,
  },
  couponCodeBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  couponCodeLabel: {
    fontSize: 9.5,
    fontFamily: fontFamily.bold,
    color: '#B45309',
    letterSpacing: 0.5,
  },
  couponCodeValue: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#92400E',
    marginTop: 2,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 6,
    marginBottom: 8,
  },
  validityRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 10,
  },
  validityCalendarIcon: {
    width: 11,
    height: 11,
    tintColor: '#64748B',
  },
  validityText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#475569',
  },
  offerTextBox: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  offerTextHeader: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  offerItemTitleBottom: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#1E293B',
    lineHeight: 18,
  },
  offerDescriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 9,
    marginBottom: 6,
  },
  offerSectionHeader: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  offerDescriptionText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#334155',
    lineHeight: 17,
  },
  offerTermsBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 8,
    marginTop: 2,
  },
  offerTermsHeader: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  offerTermsText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    lineHeight: 15,
  },

  /* Pagination Dots */
  offerPaginationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 4,
  },
  offerDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  offerDotActive: {
    width: 18,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  offerSwipeHint: {
    fontSize: 10.5,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
  },

  /* Modal Footer */
  offerModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: colors.white,
  },
  offerModalSourceText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
  },
  offerModalCloseBtnBottom: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  offerModalCloseBtnBottomText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
});

export default PriceListDetailScreen;
