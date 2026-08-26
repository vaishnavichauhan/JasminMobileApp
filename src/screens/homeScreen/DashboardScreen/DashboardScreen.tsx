import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './DashboardScreenStyles';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';
import { useAuth } from '../../../context/AuthContext';
import { colors, fontFamily } from '../../../styles/variables';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  CashDepositAbmItem,
  BrandWiseSaleItem,
  formatCurrency,
  formatQuantity,
  formatPercent,
} from '../../../api/dashboardApi';
import {
  useDashboardStore,
  DashboardTab,
  getTodayDateString,
} from '../../../store';
import { fetchAlertsApi } from '../../../api/alertsApi';
import type { AlertItem } from '../../../api/alertsApi';
import { fetchOffersApi, OfferItem } from '../../../api/offersApi';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatToDisplayDate = (dateStr: string): string => {
  if (!dateStr) return 'Select Date';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

const formatToDDMMYYYY = (dateStr: any): string => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  if (str.includes('-')) {
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

const formatOfferTickerText = (item: OfferItem, index: number): string => {
  const brand = (
    item.brandName ||
    item.brand_name ||
    item.brand ||
    item.title ||
    'SPECIAL OFFER'
  ).toUpperCase();
  const fromDate = item.fromDate || item.from_date;
  const toDate = item.toDate || item.to_date;

  let dateText = '';
  if (fromDate && toDate) {
    dateText = `${formatToDDMMYYYY(fromDate)} to ${formatToDDMMYYYY(toDate)}`;
  } else if (toDate) {
    dateText = `${formatToDDMMYYYY(toDate)}`;
  } else if (fromDate) {
    dateText = `${formatToDDMMYYYY(fromDate)}`;
  }

  if (dateText) {
    return `Offer ${index + 1} - ${brand} - ${dateText}`;
  }
  return `Offer ${index + 1} - ${brand}`;
};

/* ── 1-Line Horizontal Auto-Scrolling Active Offers Circular Ticker ── */
const ActiveOffersTicker: React.FC<{ token: string | null; navigation?: any }> = ({ token, navigation }) => {
  const [activeOffers, setActiveOffers] = React.useState<OfferItem[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPos = useRef(0);
  const singleLoopWidth = useRef(0);

  const loadOffers = React.useCallback(async () => {
    try {
      const list = await fetchOffersApi(token);
      const active = (list || []).filter(
        (o) => o.status !== 'expired' && String(o.status).toLowerCase() !== 'expired'
      );
      setActiveOffers(active.length > 0 ? active : []);
    } catch {
      setActiveOffers([]);
    }
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      loadOffers();
    }, [loadOffers])
  );

  // Smooth continuous circular (infinite seamless loop) auto-scrolling
  useEffect(() => {
    if (activeOffers.length === 0) return;

    const interval = setInterval(() => {
      if (!scrollViewRef.current || singleLoopWidth.current <= 0) return;

      scrollPos.current += 1.2;
      if (scrollPos.current >= singleLoopWidth.current) {
        scrollPos.current -= singleLoopWidth.current;
      }
      scrollViewRef.current.scrollTo({ x: scrollPos.current, animated: false });
    }, 25);

    return () => clearInterval(interval);
  }, [activeOffers]);

  if (activeOffers.length === 0) return null;

  return (
    <TouchableOpacity
      style={styles.tickerContainer}
      activeOpacity={0.85}
      onPress={() => {
        try {
          navigation?.navigate('Offers');
        } catch {}
      }}
    >
      <View style={styles.tickerBadge}>
        <Text style={styles.tickerBadgeText}>🔥 OFFERS</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        scrollEventThrottle={16}
        style={styles.tickerScroll}
        contentContainerStyle={styles.tickerContent}
      >
        {/* Set 1: Measured loop width */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) {
              singleLoopWidth.current = w;
            }
          }}
        >
          {activeOffers.map((item, idx) => {
            const offerText = formatOfferTickerText(item, idx);
            return (
              <Text key={`offer-set1-${item.id || idx}`} style={styles.tickerText} numberOfLines={1}>
                {offerText}   •   
              </Text>
            );
          })}
        </View>

        {/* Set 2: Duplicate for seamless circular transition */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {activeOffers.map((item, idx) => {
            const offerText = formatOfferTickerText(item, idx);
            return (
              <Text key={`offer-set2-${item.id || idx}`} style={styles.tickerText} numberOfLines={1}>
                {offerText}   •   
              </Text>
            );
          })}
        </View>

        {/* Set 3: Extra padding set to prevent any gaps on wide screens */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {activeOffers.map((item, idx) => {
            const offerText = formatOfferTickerText(item, idx);
            return (
              <Text key={`offer-set3-${item.id || idx}`} style={styles.tickerText} numberOfLines={1}>
                {offerText}   •   
              </Text>
            );
          })}
        </View>
      </ScrollView>
    </TouchableOpacity>
  );
};

/* ── Memoized ABM Deposit Card ── */
const DashboardAbmCard = React.memo<{ item: CashDepositAbmItem; index: number }>(({ item }) => {
  const firstLetter = (item.abmName || 'A').trim().charAt(0).toUpperCase();
  return (
    <View style={styles.abmCard}>
      {/* ABM Card Header: Name + Pending Deposit % Badge */}
      <View style={styles.abmCardHeader}>
        <View style={styles.abmHeaderLeft}>
          <View style={styles.abmAvatarBadge}>
            <Text style={styles.abmAvatarText}>{firstLetter}</Text>
          </View>
          <Text style={styles.abmNameText} numberOfLines={1}>
            {item.abmName}
          </Text>
        </View>

        <View style={styles.abmPercentBadge}>
          <Text style={styles.abmPercentText}>
            {formatPercent(item.pendingDepositPercentage)}
          </Text>
        </View>
      </View>

      {/* 4-Box Metric Grid */}
      <View style={styles.abmStatsGrid}>
        {/* 1. Opening Cash */}
        <View style={styles.abmStatItem}>
          <Text style={styles.abmStatLabel}>Opening Cash</Text>
          <Text style={styles.abmStatValue}>
            {formatCurrency(item.openingCash)}
          </Text>
        </View>

        {/* 2. Cash Deposit */}
        <View style={styles.abmStatItem}>
          <Text style={styles.abmStatLabel}>Cash Deposit</Text>
          <Text style={styles.abmStatValue}>
            {formatCurrency(item.cashDeposit)}
          </Text>
        </View>

        {/* 3. Pending Cash Deposit (Title & Value in RED) */}
        <View style={[styles.abmStatItem, styles.abmStatItemPendingRed]}>
          <Text style={styles.abmStatLabelRed}>
            Pending Cash Deposit
          </Text>
          <Text style={styles.abmStatValueRed}>
            {formatCurrency(item.pendingCashDeposit)}
          </Text>
        </View>

        {/* 4. Pending Deposit */}
        <View style={[styles.abmStatItem, styles.abmStatItemPendingRed]}>
          <Text style={styles.abmStatLabelRed}>
            Pending Deposit
          </Text>
          <Text style={styles.abmStatValueRed}>
            {formatPercent(item.pendingDepositPercentage)}
          </Text>
        </View>
      </View>
    </View>
  );
});

/* ── Memoized Brand Wise Sale Card ── */
const DashboardBrandCard = React.memo<{ item: BrandWiseSaleItem; index: number }>(({ item, index }) => {
  const growthQtyNum = Number(item.growthQtyPercentage) || 0;
  const growthValueNum = Number(item.growthValuePercentage) || 0;

  return (
    <View style={styles.brandCard}>
      {/* Card Header: Brand Name + Sr No Badge */}
      <View style={styles.brandCardHeader}>
        <View style={styles.brandHeaderLeft}>
          <View style={styles.brandIconWrapper}>
            <Image
              source={Images.product}
              style={styles.brandProductIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandHeaderTitleWrap}>
            <Text style={styles.brandNameText} numberOfLines={1}>
              {item.brandName}
            </Text>
            <Text style={styles.brandIndexBadge}>
              #{item.srNo ?? (index + 1)}
            </Text>
          </View>
        </View>
      </View>

      {/* 4-Box Metric Grid (FTD, LMFTD, MTD, LMTD) */}
      <View style={styles.brandStatsGrid}>
        {/* 1. FTD */}
        <View style={styles.brandBox}>
          <View style={styles.brandBoxHeader}>
            <Text style={styles.brandBoxTitle}>FTD</Text>
            <View style={styles.brandBoxQtyBadge}>
              <Text style={styles.brandBoxQtyText}>
                {formatQuantity(item.ftdQty)}
              </Text>
            </View>
          </View>
          <Text style={styles.brandBoxValueText}>
            {formatCurrency(item.ftdValue)}
          </Text>
        </View>

        {/* 2. LMFTD */}
        <View style={styles.brandBox}>
          <View style={styles.brandBoxHeader}>
            <Text style={styles.brandBoxTitle}>LMFTD</Text>
            <View style={styles.brandBoxQtyBadge}>
              <Text style={styles.brandBoxQtyText}>
                {formatQuantity(item.lmftdQty)}
              </Text>
            </View>
          </View>
          <Text style={styles.brandBoxValueText}>
            {formatCurrency(item.lmftdValue)}
          </Text>
        </View>

        {/* 3. MTD (Highlighted in Purple) */}
        <View style={[styles.brandBox, styles.brandBoxMtd]}>
          <View style={styles.brandBoxHeader}>
            <Text style={[styles.brandBoxTitle, styles.brandBoxTitleMtd]}>
              MTD
            </Text>
            <View style={[styles.brandBoxQtyBadge, styles.brandBoxQtyBadgeMtd]}>
              <Text style={[styles.brandBoxQtyText, styles.brandBoxQtyTextMtd]}>
                {formatQuantity(item.mtdQty)}
              </Text>
            </View>
          </View>
          <Text style={[styles.brandBoxValueText, styles.brandBoxValueTextMtd]}>
            {formatCurrency(item.mtdValue)}
          </Text>
        </View>

        {/* 4. LMTD */}
        <View style={styles.brandBox}>
          <View style={styles.brandBoxHeader}>
            <Text style={styles.brandBoxTitle}>LMTD</Text>
            <View style={styles.brandBoxQtyBadge}>
              <Text style={styles.brandBoxQtyText}>
                {formatQuantity(item.lmtdQty)}
              </Text>
            </View>
          </View>
          <Text style={styles.brandBoxValueText}>
            {formatCurrency(item.lmtdValue)}
          </Text>
        </View>
      </View>

      {/* Growth Row (Growth Qty % & Growth Value %) */}
      <View style={styles.brandGrowthRow}>
        {/* Growth Qty % */}
        <View
          style={[
            styles.brandGrowthBox,
            growthQtyNum >= 0 ? styles.growthGreenBox : styles.growthRedBox,
          ]}
        >
          <Text
            style={[
              styles.brandGrowthLabel,
              growthQtyNum >= 0 ? styles.growthGreenText : styles.growthRedText,
            ]}
          >
            Growth Qty %
          </Text>
          <Text
            style={[
              styles.brandGrowthValue,
              growthQtyNum >= 0 ? styles.growthGreenText : styles.growthRedText,
            ]}
          >
            {growthQtyNum > 0
              ? `▲ +${formatPercent(growthQtyNum)}`
              : growthQtyNum < 0
              ? `▼ ${formatPercent(growthQtyNum)}`
              : formatPercent(growthQtyNum)}
          </Text>
        </View>

        {/* Growth Value % */}
        <View
          style={[
            styles.brandGrowthBox,
            growthValueNum >= 0 ? styles.growthGreenBox : styles.growthRedBox,
          ]}
        >
          <Text
            style={[
              styles.brandGrowthLabel,
              growthValueNum >= 0 ? styles.growthGreenText : styles.growthRedText,
            ]}
          >
            Growth Value %
          </Text>
          <Text
            style={[
              styles.brandGrowthValue,
              growthValueNum >= 0 ? styles.growthGreenText : styles.growthRedText,
            ]}
          >
            {growthValueNum > 0
              ? `▲ +${formatPercent(growthValueNum)}`
              : growthValueNum < 0
              ? `▼ ${formatPercent(growthValueNum)}`
              : formatPercent(growthValueNum)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const DashboardScreen: React.FC<{ navigation?: any }> = ({ navigation: propNavigation }) => {
  const nav = useNavigation<any>();
  const navigation = propNavigation || nav;
  const { user, token, logout, justLoggedIn, clearJustLoggedIn } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  // ── Active Alerts Popup (ONLY shown right after successful Login API call) ──
  const [activeAlerts, setActiveAlerts] = React.useState<AlertItem[]>([]);
  const [showAlertPopup, setShowAlertPopup] = React.useState(false);
  const [alertPopupIndex, setAlertPopupIndex] = React.useState(0);

  useEffect(() => {
    // Only proceed if user just completed a fresh Login API call
    if (!justLoggedIn) return;

    let isMounted = true;

    const loadActiveAlerts = async () => {
      try {
        const all = await fetchAlertsApi(token);
        const active = all.filter((a) => a.active === 1 || String(a.active) === '1');
        if (isMounted && active.length > 0) {
          setActiveAlerts(active);
          setAlertPopupIndex(0);
          setShowAlertPopup(true);
        }
      } catch (e) {
        console.warn('Error loading active alerts:', e);
      } finally {
        if (isMounted) {
          clearJustLoggedIn();
        }
      }
    };

    // Small delay so Dashboard renders first
    const timer = setTimeout(loadActiveAlerts, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [justLoggedIn, token, clearJustLoggedIn]);

  // Dashboard store & state hooks
  const {
    activeTab,
    loading,
    refreshing,
    error,
    cashDepositList,
    brandSalesList,
    brandSalesTotals,
    selectedState,
    selectedStates,
    selectedZones,
    abmSearchQuery,
    brandSearchQuery,
    selectedDate,
    isDateModalOpen,
    calendarYear,
    calendarMonth,
    apiStatesList,
    apiZonesList,
    setActiveTab,
    setSelectedState,
    setSelectedStates,
    setSelectedZones,
    setAbmSearchQuery,
    setBrandSearchQuery,
    setSelectedDate,
    setIsDateModalOpen,
    setCalendarYear,
    setCalendarMonth,
    resetFilters,
    handleTabChange,
    loadStatesDropdown,
    loadCashDepositData,
    loadBrandSalesData,
    onRefresh,
  } = useDashboardStore();

  // TextInput refs
  const abmInputRef = useRef<TextInput>(null);
  const brandInputRef = useRef<TextInput>(null);

  // Local Filter Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
  const [filterModalTab, setFilterModalTab] = React.useState<'STATE' | 'ZONE'>('STATE');
  const [stateSearchText, setStateSearchText] = React.useState('');
  const [zoneSearchText, setZoneSearchText] = React.useState('');
  const [tempSelectedStates, setTempSelectedStates] = React.useState<string[]>([]);
  const [tempSelectedZones, setTempSelectedZones] = React.useState<string[]>([]);

  // Initial load: Fetch states list and data on screen focus
  useFocusEffect(
    React.useCallback(() => {
      loadStatesDropdown(token);
      loadCashDepositData(token, false, []);
    }, [token, resetFilters, loadCashDepositData])
  );

  // Extract unique state names strictly from authorized API states
  const availableStates = React.useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(apiStatesList) && apiStatesList.length > 0) {
      apiStatesList.forEach((st) => {
        if (st && st.trim() && st !== 'All States') set.add(st.trim());
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [apiStatesList]);

  // Extract unique zone names from API and data
  const availableZones = React.useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(apiZonesList) && apiZonesList.length > 0) {
      apiZonesList.forEach((zn) => {
        if (zn && zn.trim() && zn !== 'All Zones') set.add(zn.trim());
      });
    }
    if (Array.isArray(brandSalesList)) {
      brandSalesList.forEach((item: any) => {
        const z = item.zone || item.zone_name || item.zoneName;
        if (z && typeof z === 'string' && z.trim() && z !== 'All Zones') {
          set.add(z.trim());
        }
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [apiZonesList, brandSalesList]);

  // Filter states inside modal by search query
  const filteredModalStates = React.useMemo(() => {
    if (!stateSearchText.trim()) return availableStates;
    const q = stateSearchText.toLowerCase().trim();
    return availableStates.filter((s) => s.toLowerCase().includes(q));
  }, [availableStates, stateSearchText]);

  // Filter zones inside modal by search query
  const filteredModalZones = React.useMemo(() => {
    if (!zoneSearchText.trim()) return availableZones;
    const q = zoneSearchText.toLowerCase().trim();
    return availableZones.filter((z) => z.toLowerCase().includes(q));
  }, [availableZones, zoneSearchText]);

  // Filtered ABM List based on search query and selected states
  const filteredCashDepositList = React.useMemo(() => {
    return cashDepositList.filter((item) => {
      const nameMatch =
        !abmSearchQuery.trim() ||
        item.abmName.toLowerCase().includes(abmSearchQuery.toLowerCase().trim());
      const itemState = (item.stateName || item.state_name || item.state || '').trim();
      const stateMatch =
        selectedStates.length === 0 ||
        selectedStates.includes(itemState);

      return nameMatch && stateMatch;
    });
  }, [cashDepositList, abmSearchQuery, selectedStates]);

  // Filtered Brand Sales List based on search query for brand_name
  const filteredBrandSalesList = React.useMemo(() => {
    const query = brandSearchQuery.toLowerCase().trim();
    return brandSalesList.filter((item) => {
      const brand = item.brandName || item.brand_name || '';
      return (
        !brandSearchQuery.trim() ||
        brand.toLowerCase().includes(query)
      );
    });
  }, [brandSalesList, brandSearchQuery]);

  // User details
  const userName =
    user?.name ||
    user?.username ||
    user?.full_name ||
    user?.fullName ||
    user?.firstName ||
    'User';
  const userRole =
    user?.role || user?.user_role || user?.designation || user?.type || 'Member';
  const avatarLetter = userName.trim().charAt(0).toUpperCase();

  // Handlers for Opening Filter Modal
  const handleOpenStateFilter = () => {
    setTempSelectedStates(selectedStates);
    setTempSelectedZones(selectedZones);
    setFilterModalTab('STATE');
    setStateSearchText('');
    setIsFilterModalOpen(true);
  };

  const handleOpenZoneFilter = () => {
    setTempSelectedStates(selectedStates);
    setTempSelectedZones(selectedZones);
    setFilterModalTab('ZONE');
    setZoneSearchText('');
    setIsFilterModalOpen(true);
  };

  const handleToggleTempState = (st: string) => {
    setTempSelectedStates((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const handleToggleTempZone = (zn: string) => {
    setTempSelectedZones((prev) =>
      prev.includes(zn) ? prev.filter((z) => z !== zn) : [...prev, zn]
    );
  };

  const handleResetModalFilter = () => {
    if (filterModalTab === 'STATE') {
      setTempSelectedStates([]);
    } else {
      setTempSelectedZones([]);
    }
  };

  const handleApplyModalFilter = () => {
    setSelectedStates(tempSelectedStates);
    setSelectedZones(tempSelectedZones);
    setIsFilterModalOpen(false);

    if (activeTab === 'CASH_DEPOSIT') {
      loadCashDepositData(token, false, tempSelectedStates);
    } else {
      loadBrandSalesData(
        token,
        false,
        tempSelectedStates,
        tempSelectedZones,
        selectedDate,
        brandSearchQuery
      );
    }
  };

  // Load tab data on dependency changes
  useEffect(() => {
    if (activeTab === 'CASH_DEPOSIT') {
      loadCashDepositData(token, false, selectedStates);
    } else {
      loadBrandSalesData(
        token,
        false,
        selectedStates,
        selectedZones,
        selectedDate,
        brandSearchQuery
      );
    }
  }, [
    activeTab,
    selectedStates,
    selectedZones,
    selectedDate,
    token,
    loadCashDepositData,
    loadBrandSalesData,
  ]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Top Header Bar ── */}
      <View style={styles.header}>
        {/* Left Side: Logo */}
        <View style={styles.headerLeft}>
          <Image
            source={Images.logo}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Right Side: Interactive User Profile Chip (Navigates to Profile) */}
        <TouchableOpacity
          style={styles.profileChip}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.userRole} numberOfLines={1}>
              {userRole}
            </Text>
          </View>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <Image
            source={Images.down}
            style={styles.profileDownArrow}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* ── 1-Line Active Offers Auto-Scrolling Bar (Top, Right After Header) ── */}
      <ActiveOffersTicker token={token} navigation={navigation} />

      {/* ── Logout Confirmation Modal ── */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutModalIconWrap}>
              <Text style={styles.logoutModalIcon}>⏻</Text>
            </View>
            <Text style={styles.logoutModalTitle}>Logout</Text>
            <Text style={styles.logoutModalSubtitle}>
              Are you sure you want to logout?{`\n`}You will need to sign in again.
            </Text>
            <View style={styles.logoutModalBtns}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                activeOpacity={0.7}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.logoutCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                activeOpacity={0.7}
                onPress={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                <Text style={styles.logoutConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Active Alert Popup (shown once after login) ── */}
      <Modal
        visible={showAlertPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlertPopup(false)}
      >
        <View style={styles.alertPopupOverlay}>
          <View style={styles.alertPopupCard}>
            {/* Header */}
            <View style={styles.alertPopupHeader}>
              <View style={styles.alertPopupBadge}>
                <Text style={styles.alertPopupBadgeText}>🔔</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertPopupHeading}>Active Alert</Text>
                {activeAlerts.length > 1 && (
                  <Text style={styles.alertPopupCounter}>
                    {alertPopupIndex + 1} of {activeAlerts.length}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowAlertPopup(false)}
                style={styles.alertPopupClose}
                activeOpacity={0.7}
              >
                <Text style={styles.alertPopupCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Alert Image */}
            {activeAlerts[alertPopupIndex]?.image_url ? (
              <View style={styles.alertPopupImageWrap}>
                <Image
                  source={{ uri: activeAlerts[alertPopupIndex].image_url }}
                  style={styles.alertPopupImage}
                  resizeMode="cover"
                  onError={() => {}}
                />
              </View>
            ) : null}

            {/* Title */}
            <Text style={styles.alertPopupTitle} numberOfLines={2}>
              {activeAlerts[alertPopupIndex]?.title}
            </Text>

            {/* Description */}
            {activeAlerts[alertPopupIndex]?.description ? (
              <Text style={styles.alertPopupDesc} numberOfLines={4}>
                {activeAlerts[alertPopupIndex].description}
              </Text>
            ) : null}

            {/* Navigation / Action Buttons */}
            <View style={styles.alertPopupActions}>
              {activeAlerts.length > 1 && alertPopupIndex > 0 && (
                <TouchableOpacity
                  style={styles.alertPopupNavBtn}
                  activeOpacity={0.7}
                  onPress={() => setAlertPopupIndex((i) => i - 1)}
                >
                  <Text style={styles.alertPopupNavText}>‹ Prev</Text>
                </TouchableOpacity>
              )}

              {activeAlerts.length > 1 && alertPopupIndex < activeAlerts.length - 1 ? (
                <TouchableOpacity
                  style={[styles.alertPopupNavBtn, styles.alertPopupNextBtn]}
                  activeOpacity={0.7}
                  onPress={() => setAlertPopupIndex((i) => i + 1)}
                >
                  <Text style={styles.alertPopupNextText}>Next ›</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.alertPopupNavBtn, styles.alertPopupNextBtn]}
                  activeOpacity={0.7}
                  onPress={() => setShowAlertPopup(false)}
                >
                  <Text style={styles.alertPopupNextText}>Got it ✓</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* ── 2-Way Toggle Buttons ── */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeTab === 'CASH_DEPOSIT' && styles.toggleBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => handleTabChange('CASH_DEPOSIT')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'CASH_DEPOSIT' && styles.toggleBtnTextActive,
              ]}
              numberOfLines={1}
            >
              Cash Deposit (ABM Wise)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeTab === 'BRAND_WISE' && styles.toggleBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => handleTabChange('BRAND_WISE')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'BRAND_WISE' && styles.toggleBtnTextActive,
              ]}
              numberOfLines={1}
            >
              Brand Wise Sales
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════ TAB 1: CASH DEPOSIT (ABM WISE) CARD UI ══════════════ */}
        {activeTab === 'CASH_DEPOSIT' && (
          <View style={{ flex: 1 }}>
            {/* ── Filter Bar (Search ABM Name + State Wise Dropdown) ── */}
            <View style={styles.filterRow}>
              {/* 1. Search ABM Name */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => abmInputRef.current?.focus()}
                style={styles.searchContainer}
              >
                <Image
                  source={Images.filter}
                  style={styles.searchIcon}
                  resizeMode="contain"
                />
                <TextInput
                  ref={abmInputRef}
                  style={styles.searchInput}
                  placeholder="Search ABM name..."
                  placeholderTextColor="#94A3B8"
                  value={abmSearchQuery}
                  onChangeText={setAbmSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                />
                {abmSearchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setAbmSearchQuery('')}
                    style={styles.clearSearchBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.clearSearchText}>✕</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {/* 2. State Wise Filter Dropdown */}
              <TouchableOpacity
                style={[
                  styles.stateDropdownBtn,
                  selectedStates.length > 0 && styles.stateDropdownBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={handleOpenStateFilter}
              >
                <Text
                  style={[
                    styles.stateDropdownText,
                    selectedStates.length > 0 && styles.stateDropdownTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedStates.length === 0
                    ? 'All States'
                    : selectedStates.length === 1
                    ? selectedStates[0]
                    : `${selectedStates.length} States`}
                </Text>
                <Image
                  source={Images.down}
                  style={[
                    styles.stateDropdownIcon,
                    selectedStates.length > 0 && styles.stateDropdownIconActive,
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* ABM Card FlatList */}
            <FlatList
              data={filteredCashDepositList}
              keyExtractor={(item, index) => String(item.id ?? index)}
              renderItem={({ item, index }) => (
                <DashboardAbmCard item={item} index={index} />
              )}
              style={styles.cardListScroll}
              contentContainerStyle={[
                styles.cardListContent,
                (filteredCashDepositList.length === 0 || (loading && !refreshing)) && {
                  flexGrow: 1,
                  justifyContent: 'center',
                },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={7}
              removeClippedSubviews={Platform.OS === 'android'}
              updateCellsBatchingPeriod={50}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => onRefresh(token)}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                loading && !refreshing ? (
                  <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading ABM deposit cards...</Text>
                  </View>
                ) : error && isAccessDeniedError(error) ? (
                  <AccessDenied
                    message={error}
                    onRetry={() => loadCashDepositData(token, true, selectedStates)}
                  />
                ) : (
                  <View style={styles.center}>
                    <Text style={styles.stateIcon}>📊</Text>
                    <Text style={styles.stateText}>No data found</Text>
                  </View>
                )
              }
            />
          </View>
        )}

        {/* ══════════════ TAB 2: BRAND WISE SALES CARD UI ══════════════ */}
        {activeTab === 'BRAND_WISE' && (
          <View style={{ flex: 1 }}>
            {/* ── Filter Bar (Search Brand Name) ── */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => brandInputRef.current?.focus()}
                style={[styles.searchContainer, { marginRight: 0 }]}
              >
                <Image
                  source={Images.filter}
                  style={styles.searchIcon}
                  resizeMode="contain"
                />
                <TextInput
                  ref={brandInputRef}
                  style={styles.searchInput}
                  placeholder="Search brand name..."
                  placeholderTextColor="#94A3B8"
                  value={brandSearchQuery}
                  onChangeText={setBrandSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                />
                {brandSearchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setBrandSearchQuery('')}
                    style={styles.clearSearchBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.clearSearchText}>✕</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Brand Wise Controls Row: Filter Dropdown (State & Zone) + Date Calendar Picker ── */}
            <View style={styles.brandFilterControlsRow}>
              {/* Single Filter Dropdown Button with Down Arrow (State & Zone list inside) */}
              <TouchableOpacity
                style={[
                  styles.brandFilterDropdownBtn,
                  (selectedStates.length > 0 || selectedZones.length > 0) &&
                    styles.brandFilterDropdownBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleOpenStateFilter()}
              >
                <Image
                  source={Images.filter}
                  style={[
                    styles.filterBtnLeftIcon,
                    (selectedStates.length > 0 || selectedZones.length > 0) &&
                      styles.filterBtnLeftIconActive,
                  ]}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.brandFilterDropdownText,
                    (selectedStates.length > 0 || selectedZones.length > 0) &&
                      styles.brandFilterDropdownTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedStates.length === 0 && selectedZones.length === 0
                    ? 'State/Zone'
                    : selectedStates.length > 0 && selectedZones.length === 0
                    ? selectedStates.length === 1
                      ? selectedStates[0]
                      : `${selectedStates.length} States`
                    : selectedStates.length === 0 && selectedZones.length > 0
                    ? selectedZones.length === 1
                      ? selectedZones[0]
                      : `${selectedZones.length} Zones`
                    : `${selectedStates.length + selectedZones.length} Filters`}
                </Text>
                <Image
                  source={Images.down}
                  style={[
                    styles.brandFilterDropdownIcon,
                    (selectedStates.length > 0 || selectedZones.length > 0) &&
                      styles.brandFilterDropdownIconActive,
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Date Calendar Picker Button */}
              <TouchableOpacity
                style={[
                  styles.datePickerBtn,
                  selectedDate ? styles.datePickerBtnActive : null,
                ]}
                activeOpacity={0.8}
                onPress={() => setIsDateModalOpen(true)}
              >
                <Image
                  source={Images.calendar}
                  style={[
                    styles.datePickerIcon,
                    selectedDate ? styles.datePickerIconActive : null,
                  ]}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.datePickerText,
                    selectedDate ? styles.datePickerTextActive : null,
                  ]}
                  numberOfLines={1}
                >
                  {selectedDate ? formatToDisplayDate(selectedDate) : 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Brand Sales FlatList */}
            <FlatList
              data={filteredBrandSalesList}
              keyExtractor={(item, index) => String(item.id ?? index)}
              renderItem={({ item, index }) => (
                <DashboardBrandCard item={item} index={index} />
              )}
              style={styles.cardListScroll}
              contentContainerStyle={[
                styles.cardListContent,
                filteredBrandSalesList.length === 0 &&
                  !brandSalesTotals && {
                    flexGrow: 1,
                    justifyContent: 'center',
                  },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={7}
              removeClippedSubviews={Platform.OS === 'android'}
              updateCellsBatchingPeriod={50}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => onRefresh(token)}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              ListHeaderComponent={
                brandSalesTotals ? (
                  <View style={[styles.brandCard, styles.totalBrandCard]}>
                    {/* Total Card Header */}
                    <View style={styles.totalBrandCardHeader}>
                      <View style={styles.totalBrandHeaderLeft}>
                        <View style={styles.totalBrandIconWrapper}>
                          <Image
                            source={Images.report}
                            style={styles.totalBrandProductIcon}
                            resizeMode="contain"
                          />
                        </View>
                        <View>
                          <Text style={styles.totalBrandTitle}>
                            {brandSalesTotals.brandName || 'Total Brand Sales'}
                          </Text>
                          <Text style={styles.totalBrandSubtitle}>
                            Cumulative Summary
                          </Text>
                        </View>
                      </View>

                      <View style={styles.totalBadge}>
                        <Text style={styles.totalBadgeText}>SUMMARY</Text>
                      </View>
                    </View>

                    {/* 4-Box Metrics Grid for Totals */}
                    <View style={styles.brandStatsGrid}>
                      {/* 1. FTD */}
                      <View style={[styles.brandBox, styles.totalBox]}>
                        <View style={styles.brandBoxHeader}>
                          <Text style={[styles.brandBoxTitle, styles.totalBoxTitle]}>
                            FTD
                          </Text>
                          <View style={[styles.brandBoxQtyBadge, styles.totalQtyBadge]}>
                            <Text style={styles.brandBoxQtyText}>
                              {formatQuantity(brandSalesTotals.ftdQty)}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.brandBoxValueText, styles.totalBoxValueText]}>
                          {formatCurrency(brandSalesTotals.ftdValue)}
                        </Text>
                      </View>

                      {/* 2. LMFTD */}
                      <View style={[styles.brandBox, styles.totalBox]}>
                        <View style={styles.brandBoxHeader}>
                          <Text style={[styles.brandBoxTitle, styles.totalBoxTitle]}>
                            LMFTD
                          </Text>
                          <View style={[styles.brandBoxQtyBadge, styles.totalQtyBadge]}>
                            <Text style={styles.brandBoxQtyText}>
                              {formatQuantity(brandSalesTotals.lmftdQty)}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.brandBoxValueText, styles.totalBoxValueText]}>
                          {formatCurrency(brandSalesTotals.lmftdValue)}
                        </Text>
                      </View>

                      {/* 3. MTD (Highlighted in Purple) */}
                      <View style={[styles.brandBox, styles.totalBoxMtd]}>
                        <View style={styles.brandBoxHeader}>
                          <Text style={[styles.brandBoxTitle, styles.totalBoxTitleMtd]}>
                            MTD
                          </Text>
                          <View style={[styles.brandBoxQtyBadge, styles.totalQtyBadgeMtd]}>
                            <Text style={[styles.brandBoxQtyText, styles.brandBoxQtyTextMtd]}>
                              {formatQuantity(brandSalesTotals.mtdQty)}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.brandBoxValueText, styles.totalBoxValueTextMtd]}>
                          {formatCurrency(brandSalesTotals.mtdValue)}
                        </Text>
                      </View>

                      {/* 4. LMTD */}
                      <View style={[styles.brandBox, styles.totalBox]}>
                        <View style={styles.brandBoxHeader}>
                          <Text style={[styles.brandBoxTitle, styles.totalBoxTitle]}>
                            LMTD
                          </Text>
                          <View style={[styles.brandBoxQtyBadge, styles.totalQtyBadge]}>
                            <Text style={styles.brandBoxQtyText}>
                              {formatQuantity(brandSalesTotals.lmtdQty)}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.brandBoxValueText, styles.totalBoxValueText]}>
                          {formatCurrency(brandSalesTotals.lmtdValue)}
                        </Text>
                      </View>
                    </View>

                    {/* Growth Row for Totals */}
                    <View style={styles.brandGrowthRow}>
                      {/* Growth Qty % */}
                      <View
                        style={[
                          styles.brandGrowthBox,
                          (brandSalesTotals.growthQtyPercentage ?? 0) >= 0
                            ? styles.growthGreenBox
                            : styles.growthRedBox,
                        ]}
                      >
                        <Text
                          style={[
                            styles.brandGrowthLabel,
                            (brandSalesTotals.growthQtyPercentage ?? 0) >= 0
                              ? styles.growthGreenText
                              : styles.growthRedText,
                          ]}
                        >
                          Growth Qty %
                        </Text>
                        <Text
                          style={[
                            styles.brandGrowthValue,
                            (brandSalesTotals.growthQtyPercentage ?? 0) >= 0
                              ? styles.growthGreenText
                              : styles.growthRedText,
                          ]}
                        >
                          {(brandSalesTotals.growthQtyPercentage ?? 0) > 0
                            ? `▲ +${formatPercent(brandSalesTotals.growthQtyPercentage)}`
                            : (brandSalesTotals.growthQtyPercentage ?? 0) < 0
                            ? `▼ ${formatPercent(brandSalesTotals.growthQtyPercentage)}`
                            : formatPercent(brandSalesTotals.growthQtyPercentage)}
                        </Text>
                      </View>

                      {/* Growth Value % */}
                      <View
                        style={[
                          styles.brandGrowthBox,
                          (brandSalesTotals.growthValuePercentage ?? 0) >= 0
                            ? styles.growthGreenBox
                            : styles.growthRedBox,
                        ]}
                      >
                        <Text
                          style={[
                            styles.brandGrowthLabel,
                            (brandSalesTotals.growthValuePercentage ?? 0) >= 0
                              ? styles.growthGreenText
                              : styles.growthRedText,
                          ]}
                        >
                          Growth Value %
                        </Text>
                        <Text
                          style={[
                            styles.brandGrowthValue,
                            (brandSalesTotals.growthValuePercentage ?? 0) >= 0
                              ? styles.growthGreenText
                              : styles.growthRedText,
                          ]}
                        >
                          {(brandSalesTotals.growthValuePercentage ?? 0) > 0
                            ? `▲ +${formatPercent(brandSalesTotals.growthValuePercentage)}`
                            : (brandSalesTotals.growthValuePercentage ?? 0) < 0
                            ? `▼ ${formatPercent(brandSalesTotals.growthValuePercentage)}`
                            : formatPercent(brandSalesTotals.growthValuePercentage)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                loading && !refreshing ? (
                  <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading brand sales cards...</Text>
                  </View>
                ) : error && isAccessDeniedError(error) ? (
                  <AccessDenied
                    message={error}
                    onRetry={() =>
                      loadBrandSalesData(
                        token,
                        true,
                        selectedStates,
                        selectedZones,
                        selectedDate,
                        brandSearchQuery
                      )
                    }
                  />
                ) : (
                  <View style={styles.center}>
                    <Text style={styles.stateIcon}>📊</Text>
                    <Text style={styles.stateText}>
                      {brandSearchQuery.trim()
                        ? 'No brands matching your search'
                        : 'No data found'}
                    </Text>
                  </View>
                )
              }
            />
          </View>
        )}
      </View>

      {/* ── State & Zone Selection Modal Dropdown (Multi-select) ── */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterModalOpen(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>
                  {filterModalTab === 'STATE' ? 'Select States' : 'Select Zones'}
                </Text>
                {(filterModalTab === 'STATE'
                  ? tempSelectedStates.length > 0
                  : tempSelectedZones.length > 0) && (
                  <View style={styles.selectedCountBadge}>
                    <Text style={styles.selectedCountText}>
                      {filterModalTab === 'STATE'
                        ? `${tempSelectedStates.length} selected`
                        : `${tempSelectedZones.length} selected`}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Segmented Filter Switcher (State / Zone Tabs) - shown for Brand Wise Sales */}
            {activeTab === 'BRAND_WISE' && (
              <View style={styles.modalTabsRow}>
                <TouchableOpacity
                  style={[
                    styles.modalTabBtn,
                    filterModalTab === 'STATE' && styles.modalTabBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setFilterModalTab('STATE')}
                >
                  <Text
                    style={[
                      styles.modalTabText,
                      filterModalTab === 'STATE' && styles.modalTabTextActive,
                    ]}
                  >
                    States
                  </Text>
                  {tempSelectedStates.length > 0 && (
                    <View
                      style={[
                        styles.modalTabBadge,
                        filterModalTab === 'STATE' && styles.modalTabBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalTabBadgeText,
                          filterModalTab === 'STATE' && styles.modalTabBadgeTextActive,
                        ]}
                      >
                        {tempSelectedStates.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalTabBtn,
                    filterModalTab === 'ZONE' && styles.modalTabBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setFilterModalTab('ZONE')}
                >
                  <Text
                    style={[
                      styles.modalTabText,
                      filterModalTab === 'ZONE' && styles.modalTabTextActive,
                    ]}
                  >
                    Zones
                  </Text>
                  {tempSelectedZones.length > 0 && (
                    <View
                      style={[
                        styles.modalTabBadge,
                        filterModalTab === 'ZONE' && styles.modalTabBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalTabBadgeText,
                          filterModalTab === 'ZONE' && styles.modalTabBadgeTextActive,
                        ]}
                      >
                        {tempSelectedZones.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* In-Modal Search Bar */}
            <View style={styles.modalSearchContainer}>
              <Image
                source={Images.filter}
                style={styles.modalSearchIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={
                  filterModalTab === 'STATE'
                    ? 'Search state name...'
                    : 'Search zone name...'
                }
                placeholderTextColor="#94A3B8"
                value={
                  filterModalTab === 'STATE'
                    ? stateSearchText
                    : zoneSearchText
                }
                onChangeText={
                  filterModalTab === 'STATE'
                    ? setStateSearchText
                    : setZoneSearchText
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
              {((filterModalTab === 'STATE' && stateSearchText.length > 0) ||
                (filterModalTab === 'ZONE' && zoneSearchText.length > 0)) && (
                <TouchableOpacity
                  onPress={() => {
                    if (filterModalTab === 'STATE') setStateSearchText('');
                    else setZoneSearchText('');
                  }}
                  style={styles.modalClearSearchBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalClearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List of Options (Multi-select Checkboxes) */}
            <ScrollView
              style={styles.modalOptionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filterModalTab === 'STATE' ? (
                <>
                  {/* "All States" Option */}
                  <TouchableOpacity
                    style={[
                      styles.stateOptionItem,
                      tempSelectedStates.length === 0 && styles.stateOptionItemActive,
                    ]}
                    onPress={() => setTempSelectedStates([])}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <View
                        style={[
                          styles.checkboxBox,
                          tempSelectedStates.length === 0 && styles.checkboxBoxActive,
                        ]}
                      >
                        {tempSelectedStates.length === 0 && (
                          <Text style={styles.checkmarkIcon}>✓</Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stateOptionText,
                          tempSelectedStates.length === 0 && styles.stateOptionTextActive,
                        ]}
                      >
                        All States
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Filtered State Items */}
                  {filteredModalStates.map((st) => {
                    const isSelected = tempSelectedStates.includes(st);
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.stateOptionItem,
                          isSelected && styles.stateOptionItemActive,
                        ]}
                        onPress={() => handleToggleTempState(st)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionLeft}>
                          <View
                            style={[
                              styles.checkboxBox,
                              isSelected && styles.checkboxBoxActive,
                            ]}
                          >
                            {isSelected && (
                              <Text style={styles.checkmarkIcon}>✓</Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.stateOptionText,
                              isSelected && styles.stateOptionTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {st}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {filteredModalStates.length === 0 && (
                    <View style={styles.modalEmptyContainer}>
                      <Text style={styles.modalEmptyText}>No states found</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* "All Zones" Option */}
                  <TouchableOpacity
                    style={[
                      styles.stateOptionItem,
                      tempSelectedZones.length === 0 && styles.stateOptionItemActive,
                    ]}
                    onPress={() => setTempSelectedZones([])}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <View
                        style={[
                          styles.checkboxBox,
                          tempSelectedZones.length === 0 && styles.checkboxBoxActive,
                        ]}
                      >
                        {tempSelectedZones.length === 0 && (
                          <Text style={styles.checkmarkIcon}>✓</Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stateOptionText,
                          tempSelectedZones.length === 0 && styles.stateOptionTextActive,
                        ]}
                      >
                        All Zones
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Filtered Zone Items */}
                  {filteredModalZones.map((zn) => {
                    const isSelected = tempSelectedZones.includes(zn);
                    return (
                      <TouchableOpacity
                        key={zn}
                        style={[
                          styles.stateOptionItem,
                          isSelected && styles.stateOptionItemActive,
                        ]}
                        onPress={() => handleToggleTempZone(zn)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionLeft}>
                          <View
                            style={[
                              styles.checkboxBox,
                              isSelected && styles.checkboxBoxActive,
                            ]}
                          >
                            {isSelected && (
                              <Text style={styles.checkmarkIcon}>✓</Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.stateOptionText,
                              isSelected && styles.stateOptionTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {zn}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {filteredModalZones.length === 0 && (
                    <View style={styles.modalEmptyContainer}>
                      <Text style={styles.modalEmptyText}>No zones found</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalFooterRow}>
              {(tempSelectedStates.length > 0 || tempSelectedZones.length > 0) && (
                <TouchableOpacity
                  style={styles.modalResetBtn}
                  onPress={handleResetModalFilter}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalResetText}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleApplyModalFilter}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyText}>
                  {tempSelectedStates.length === 0 && tempSelectedZones.length === 0
                    ? 'Show All'
                    : `Apply (${
                        tempSelectedStates.length +
                        (activeTab === 'BRAND_WISE' ? tempSelectedZones.length : 0)
                      })`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Date Calendar Picker Modal ── */}
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

                  cells.push(
                    <TouchableOpacity
                      key={`day-${d}`}
                      style={[
                        styles.calendarDayCell,
                        isSelected && styles.calendarDayCellSelected,
                        isToday && !isSelected && styles.calendarDayCellToday,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedDate(dayStr);
                        setIsDateModalOpen(false);
                        loadBrandSalesData(
                          token,
                          false,
                          selectedStates,
                          selectedZones,
                          dayStr,
                          brandSearchQuery
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isSelected && styles.calendarDayTextSelected,
                          isToday && !isSelected && styles.calendarDayTextToday,
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
                  loadBrandSalesData(
                    token,
                    false,
                    selectedStates,
                    selectedZones,
                    '',
                    brandSearchQuery
                  );
                }}
              >
                <Text style={styles.calendarActionText}>Clear Date</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.calendarActionBtn, styles.calendarActionBtnPrimary]}
                activeOpacity={0.7}
                onPress={() => {
                  const todayStr = getTodayDateString();
                  setSelectedDate(todayStr);
                  setCalendarYear(new Date().getFullYear());
                  setCalendarMonth(new Date().getMonth());
                  setIsDateModalOpen(false);
                  loadBrandSalesData(
                    token,
                    false,
                    selectedStates,
                    selectedZones,
                    todayStr,
                    brandSearchQuery
                  );
                }}
              >
                <Text style={styles.calendarActionTextPrimary}>
                  Today ({formatToDisplayDate(getTodayDateString())})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default DashboardScreen;
