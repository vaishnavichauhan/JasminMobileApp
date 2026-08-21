import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { usePriceListStore } from '../../../store';
import { fetchPriceListStockInfoApi } from '../../../api/priceListApi';
import { colors, fontFamily, borderRadius, fontSize } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';

const renderStringValue = (val: any): string => {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
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

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

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
    if (!searchQuery.trim()) {
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
  
  const handleFetchStockInfo = async (item: any, sync: boolean = true) => {
    setSelectedStockItem(item);
    setStockSearchQuery('');
    setStockLoading(true);
    setStockError(null);

    // Robust extraction of Model Group from item keys (e.g. 'Model Group', 'model_group_name', etc.)
    const modelGroup =
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
      item['Item Name'] ||
      item['item_name'] ||
      item['model_name'] ||
      item['modelName'] ||
      '';

    

    try {
      const res = await fetchPriceListStockInfoApi(token, modelGroup, sync);
      console.log('[PriceListDetailScreen] Stock API Response:', res);
      setStockInfoData(res);
    } catch (err: any) {
      console.warn('[PriceListDetailScreen] Stock API Error:', err);
      setStockError('Failed to fetch live stock information');
    } finally {
      setStockLoading(false);
    }
  };

  // Normalized location list from stock API
  const rawLocations: any[] = useMemo(() => {
    if (!stockInfoData) return [];
    if (Array.isArray(stockInfoData.data?.locations)) return stockInfoData.data.locations;
    if (Array.isArray(stockInfoData.locations)) return stockInfoData.locations;
    if (Array.isArray(stockInfoData.data?.branches)) return stockInfoData.data.branches;
    if (Array.isArray(stockInfoData.branches)) return stockInfoData.branches;
    if (Array.isArray(stockInfoData.data?.stockDetails)) return stockInfoData.data.stockDetails;
    if (Array.isArray(stockInfoData.stockDetails)) return stockInfoData.stockDetails;
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
    if (Array.isArray(stockInfoData.data)) return stockInfoData.data;
    if (Array.isArray(stockInfoData.results)) return stockInfoData.results;
    if (Array.isArray(stockInfoData)) return stockInfoData;
    return [];
  }, [stockInfoData]);

  // Total saleable stock calculation
  const totalStockCount = useMemo(() => {
    if (stockInfoData?.data?.SALEABLE_STOCK !== undefined) return stockInfoData.data.SALEABLE_STOCK;
    if (stockInfoData?.data?.totalStock !== undefined) return stockInfoData.data.totalStock;
    if (stockInfoData?.data?.totalSaleableStock !== undefined) return stockInfoData.data.totalSaleableStock;
    if (stockInfoData?.data?.total_saleable_stock !== undefined) return stockInfoData.data.total_saleable_stock;
    if (stockInfoData?.data?.total_stock !== undefined) return stockInfoData.data.total_stock;
    if (stockInfoData?.SALEABLE_STOCK !== undefined) return stockInfoData.SALEABLE_STOCK;
    if (stockInfoData?.totalStock !== undefined) return stockInfoData.totalStock;
    if (stockInfoData?.totalSaleableStock !== undefined) return stockInfoData.totalSaleableStock;
    if (stockInfoData?.total_saleable_stock !== undefined) return stockInfoData.total_saleable_stock;

    return rawLocations.reduce((acc, loc) => {
      const val = Number(
        loc.SALEABLE_STOCK ??
        loc['Saleable Stock'] ??
        loc.saleable_stock ??
        loc.saleableStock ??
        loc.AVAILABLE_STOCK ??
        loc.available_stock ??
        loc.availableStock ??
        loc.total_stock ??
        loc.stock ??
        loc.qty ??
        0
      );
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [stockInfoData, rawLocations]);

  // Filtered locations inside the stock modal (only show if SALEABLE_STOCK > 0)
  const filteredStockLocations = useMemo(() => {
    const list = (rawLocations || []).filter((loc) => {
      // Location must have saleable stock > 0
      const stock = Number(
        loc.SALEABLE_STOCK ??
        loc['Saleable Stock'] ??
        loc.saleable_stock ??
        loc.saleableStock ??
        loc.AVAILABLE_STOCK ??
        loc.available_stock ??
        loc.availableStock ??
        loc.stock ??
        loc.qty ??
        0
      );
      return stock > 0;
    });

    if (!stockSearchQuery.trim()) return list;
    const q = stockSearchQuery.toLowerCase().trim();

    return list.filter((loc) => {
      const branchName = String(
        loc.BRANCH_NAME || loc['Branch Name'] || loc.branch_name || loc.branchName || loc.location_name || loc.locationName || loc.branch || loc.location || ''
      ).toLowerCase();
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

      if (Array.isArray(loc.items)) {
        return loc.items.some((sub: any) => {
          const subName = String(sub.PRODUCT_NAME || sub['Product Name'] || sub.product_name || sub.productName || sub.item_name || sub.itemName || '').toLowerCase();
          const subCode = String(sub.ITEM_CODE || sub['Item Code'] || sub.item_code || sub.itemCode || sub.code || '').toLowerCase();
          return subName.includes(q) || subCode.includes(q);
        });
      }

      return false;
    });
  }, [rawLocations, stockSearchQuery]);

  // Total locations available count
  const totalLocationsCount = useMemo(() => {
    return (filteredStockLocations || []).length;
  }, [filteredStockLocations]);

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

  // Extract unique brands dynamically
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    set.add('All Brands');
    if (Array.isArray(reportDetails?.data)) {
      reportDetails.data.forEach((item: any) => {
        const b = item.Brand || item.brand || item.brand_name || item.brandName || item.Mobile_Brand;
        if (b && typeof b === 'string' && b.trim().length > 0) {
          set.add(b.trim());
        }
      });
    }
    return Array.from(set);
  }, [reportDetails?.data]);

  // Extract unique product categories dynamically
  const availableProducts = useMemo(() => {
    const set = new Set<string>();
    set.add('All Categories');
    if (Array.isArray(reportDetails?.data)) {
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
        if (p && typeof p === 'string' && p.trim().length > 0) {
          set.add(p.trim());
        }
      });
    }
    return Array.from(set);
  }, [reportDetails?.data]);

  const filteredAvailableBrands = useMemo(() => {
    if (!brandSearchQuery.trim()) return availableBrands;
    const q = brandSearchQuery.toLowerCase().trim();
    return availableBrands.filter((b) => b.toLowerCase().includes(q));
  }, [availableBrands, brandSearchQuery]);

  const filteredAvailableProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return availableProducts;
    const q = productSearchQuery.toLowerCase().trim();
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

    const query = debouncedSearchQuery.trim().toLowerCase();
    const normalizedQuery = query.replace(/[^a-z0-9]/g, '');
    const queryTokens = query
      .split(/[\s\-_()+/,.]+/)
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

      // 4. Search Query Check
      if (query.length > 0) {
        // Collect all text from all properties in item
        const itemValues = Object.values(item)
          .map((v) => (typeof v === 'object' && v !== null ? Object.values(v).join(' ') : String(v || '')))
          .join(' ');

        const searchableText = `${brand} ${productCategory} ${modelGroup} ${itemValues}`.toLowerCase();
        const normalizedSearchable = searchableText.replace(/[^a-z0-9]/g, '');

        // A: Direct substring match
        const directMatch = searchableText.includes(query);

        // B: Normalized match (strips hyphens, brackets, spaces, pluses, etc.)
        const normalizedMatch =
          normalizedQuery.length > 0 &&
          (normalizedSearchable.includes(normalizedQuery) || normalizedQuery.includes(normalizedSearchable));

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

  const PriceListItemCard: React.FC<{
    item: any;
    index: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    isReportDetail: boolean;
    visibleColumns: any[];
    onFetchStockInfo: (item: any) => void;
  }> = ({
    item,
    isExpanded,
    onToggleExpand,
    isReportDetail,
    visibleColumns,
    onFetchStockInfo,
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
      reportDetails?.timestamp ??
      '';
    const formattedDateTime = formatTimestamp(rawTimestamp);

    const activeOffers = renderStringValue(
      item.active_offers ??
      item.activeOffers ??
      item.Active_Offers ??
      item['Active Offers'] ??
      item.offer ??
      item.offers ??
      item.Offer ??
      item.Offers
    );

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

          {/* 4) Offer */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Offer</Text>
            <View
              style={[
                styles.offerBadgeWrapper,
                (!activeOffers || activeOffers === '—') && styles.offerBadgeEmpty,
              ]}
            >
              <Text
                style={[
                  styles.activeOffersText,
                  (!activeOffers || activeOffers === '—') && styles.activeOffersTextEmpty,
                ]}
                numberOfLines={2}
              >
                {activeOffers || '—'}
              </Text>
            </View>
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
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
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
        onFetchStockInfo={(it) => handleFetchStockInfo(it, true)}
      />
    );
  };

  if (detailsLoading) {
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
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading report details…</Text>
        </View>
      </View>
    );
  }

  if (detailsError) {
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
        {isAccessDeniedError(detailsError) ? (
          <AccessDenied
            message={detailsError}
            onRetry={() => loadReportDetails(token, variationId)}
            onGoBack={() => navigation?.goBack()}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.stateIcon}>⚠️</Text>
            <Text style={[styles.stateText, { color: '#DC2626' }]}>{detailsError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadReportDetails(token, variationId)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  const stockModalBrand =
    selectedStockItem?.['Brand Name'] ||
    selectedStockItem?.['Brand'] ||
    selectedStockItem?.brand ||
    selectedStockItem?.Brand ||
    selectedStockItem?.brand_name ||
    selectedStockItem?.brandName ||
    selectedStockItem?.category ||
    selectedStockItem?.['Category'] ||
    stockInfoData?.data?.brand ||
    stockInfoData?.brand ||
    'ADAPTOR';

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
          </TouchableOpacity>

          {/* Product Dropdown Button */}
          <TouchableOpacity
            style={[
              styles.filterDropdownBtn,
              activeProducts.length > 0 && styles.filterDropdownBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setIsProductModalOpen(true)}
          >
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
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
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
          refreshControl={
            <RefreshControl
              refreshing={detailsLoading}
              onRefresh={() => loadReportDetails(token, variationId, selectedDate)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
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
              {filteredAvailableBrands.length === 0 ? (
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
              {filteredAvailableProducts.length === 0 ? (
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
              <View style={styles.stockModalTitleRow}>
                <View style={styles.stockIconCircle}>
                  <Text style={styles.stockIconEmoji}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={styles.stockModalTitle} numberOfLines={1}>
                      {stockModalTitle}
                    </Text>
                    {!!stockModalBrand && (
                      <View style={styles.stockCategoryPill}>
                        <Text style={styles.stockCategoryText}>{stockModalBrand}</Text>
                      </View>
                    )}
                    <View style={styles.stockLivePill}>
                      <Text style={styles.stockLiveText}>⚡ Live Synced</Text>
                    </View>
                  </View>
                  <Text style={styles.stockLastSyncedText}>
                    Last Synced: {new Date().toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                      <Text style={styles.stockSyncBtnIcon}>🔄</Text>
                      <Text style={styles.stockSyncBtnText}>Sync Live Stock</Text>
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
                    const availableStock =
                      loc.SALEABLE_STOCK ??
                      loc['Saleable Stock'] ??
                      loc.saleable_stock ??
                      loc.saleableStock ??
                      loc.AVAILABLE_STOCK ??
                      loc.available_stock ??
                      loc.availableStock ??
                      loc.total_stock ??
                      loc.totalStock ??
                      loc.stock ??
                      loc.qty ??
                      loc.quantity ??
                      0;

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
                                '12448',
                              saleable_stock:
                                loc.SALEABLE_STOCK ??
                                loc['Saleable Stock'] ??
                                loc.saleable_stock ??
                                loc.saleableStock ??
                                loc.AVAILABLE_STOCK ??
                                loc.available_stock ??
                                loc.availableStock ??
                                loc.stock ??
                                availableStock,
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
                              const devStock = Number(
                                device.SALEABLE_STOCK ??
                                device['Saleable Stock'] ??
                                device.saleable_stock ??
                                device.saleableStock ??
                                device.AVAILABLE_STOCK ??
                                device.available_stock ??
                                device.stock ??
                                availableStock
                              );
                              return devStock > 0;
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
                            const devStock =
                              device.SALEABLE_STOCK ??
                              device['Saleable Stock'] ??
                              device.saleable_stock ??
                              device.saleableStock ??
                              device.AVAILABLE_STOCK ??
                              device.available_stock ??
                              device.stock ??
                              availableStock;

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
    paddingVertical: 20,
  },
  stockModalCard: {
    width: '100%',
    height: '88%',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stockModalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginRight: 8,
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
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
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
});

export default PriceListDetailScreen;
