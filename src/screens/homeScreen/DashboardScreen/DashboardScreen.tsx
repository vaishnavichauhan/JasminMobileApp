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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './DashboardScreenStyles';
import Images from '../../../assets/images';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../styles/variables';
import { useFocusEffect } from '@react-navigation/native';
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

const DashboardScreen: React.FC = () => {
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

  // Zustand Store
  const {
    activeTab,
    cashDepositList,
    brandSalesList,
    apiStatesList,
    loading,
    refreshing,
    abmSearchQuery,
    selectedState,
    isStateModalOpen,
    brandSearchQuery,
    selectedDate,
    isDateModalOpen,
    calendarYear,
    calendarMonth,
    setAbmSearchQuery,
    setSelectedState,
    setIsStateModalOpen,
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

  // Refs for Search Inputs
  const abmInputRef = useRef<TextInput>(null);
  const brandInputRef = useRef<TextInput>(null);

  // Load states dropdown
  useEffect(() => {
    loadStatesDropdown(token);
  }, [token, loadStatesDropdown]);

  // Reset State filter and search queries whenever Dashboard Screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      resetFilters();
      loadCashDepositData(token, false, 'All States');
    }, [token, resetFilters, loadCashDepositData])
  );

  // Extract unique state names dynamically from API states and cash deposit list
  const availableStates = React.useMemo(() => {
    const set = new Set<string>();
    set.add('All States');
    apiStatesList.forEach((st) => set.add(st));
    cashDepositList.forEach((item) => {
      const st = item.stateName || item.state_name || item.state;
      if (st && typeof st === 'string' && st.trim().length > 0) {
        set.add(st.trim());
      }
    });
    if (set.size === 1) {
      ['Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Delhi'].forEach((s) => set.add(s));
    }
    return Array.from(set);
  }, [apiStatesList, cashDepositList]);

  // Filtered ABM List based on search query and selected state
  const filteredCashDepositList = React.useMemo(() => {
    return cashDepositList.filter((item) => {
      const nameMatch =
        !abmSearchQuery.trim() ||
        (item.abmName && item.abmName.toLowerCase().includes(abmSearchQuery.toLowerCase().trim()));

      const itemState = item.stateName || item.state_name || item.state || '';
      const stateMatch =
        selectedState === 'All States' ||
        !itemState ||
        itemState.toLowerCase().trim() === selectedState.toLowerCase().trim();

      return nameMatch && stateMatch;
    });
  }, [cashDepositList, abmSearchQuery, selectedState]);

  // Filtered Brand Sales List based on search query for brand_name
  const filteredBrandSalesList = React.useMemo(() => {
    if (!brandSearchQuery.trim()) return brandSalesList;
    const query = brandSearchQuery.toLowerCase().trim();
    return brandSalesList.filter((item) => {
      const name =
        item.brandName || item.brand_name || item.brand || item.name || '';
      return name.toLowerCase().includes(query);
    });
  }, [brandSalesList, brandSearchQuery]);

  // User Header info
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

  // Load tab data on dependency changes
  useEffect(() => {
    if (activeTab === 'CASH_DEPOSIT') {
      loadCashDepositData(token, false, selectedState);
    } else {
      loadBrandSalesData(token, false, selectedState, selectedDate, brandSearchQuery);
    }
  }, [activeTab, selectedState, selectedDate, token, loadCashDepositData, loadBrandSalesData]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.userRole} numberOfLines={1}>
              {userRole}
            </Text>
          </View>
        </View>

        {/* Right Side Buttons */}
        <View style={styles.headerRight}>
          {/* Notification Button */}
          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.7}
            onPress={() => {}}
          >
            <Image
              source={Images.notification}
              style={styles.notificationIcon}
              resizeMode="contain"
            />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.7}
            onPress={() => setShowLogoutConfirm(true)}
          >
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                  selectedState !== 'All States' && styles.stateDropdownBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setIsStateModalOpen(true)}
              >
                <Text
                  style={[
                    styles.stateDropdownText,
                    selectedState !== 'All States' && styles.stateDropdownTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedState}
                </Text>
                <Image
                  source={Images.down}
                  style={[
                    styles.stateDropdownIcon,
                    selectedState !== 'All States' && styles.stateDropdownIconActive,
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* ABM Card ScrollList */}
            <ScrollView
              style={styles.cardListScroll}
              contentContainerStyle={styles.cardListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => onRefresh(token)}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            >
              {loading && !refreshing ? (
                <View style={styles.centerLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading ABM deposit cards...</Text>
                </View>
              ) : filteredCashDepositList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No matching ABM deposit records found</Text>
                </View>
              ) : (
                filteredCashDepositList.map((item, index) => {
                  const firstLetter = (item.abmName || 'A').trim().charAt(0).toUpperCase();
                  return (
                    <View key={item.id || index} style={styles.abmCard}>
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
                        <View
                          style={[
                            styles.abmStatItem,
                            styles.abmStatItemPendingRed,
                          ]}
                        >
                          <Text style={styles.abmStatLabelRed}>
                            Pending Cash Deposit
                          </Text>
                          <Text style={styles.abmStatValueRed}>
                            {formatCurrency(item.pendingCashDeposit)}
                          </Text>
                        </View>

                        {/* 4. Pending Deposit (Title & Value in GREEN) */}
                        <View
                          style={[
                            styles.abmStatItem,
                            styles.abmStatItemPendingGreen,
                          ]}
                        >
                          <Text style={styles.abmStatLabelGreen}>
                            Pending Deposit
                          </Text>
                          <Text style={styles.abmStatValueGreen}>
                            {formatPercent(item.pendingDepositPercentage)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
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

            {/* ── Dual Controls Row: State Dropdown + Date Calendar Picker ── */}
            <View style={styles.brandFilterControlsRow}>
              {/* 1. State Filter Button */}
              <TouchableOpacity
                style={[
                  styles.brandStateDropdownBtn,
                  selectedState !== 'All States' && styles.stateDropdownBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setIsStateModalOpen(true)}
              >
                <Text
                  style={[
                    styles.stateDropdownText,
                    selectedState !== 'All States' && styles.stateDropdownTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedState}
                </Text>
                <Image
                  source={Images.down}
                  style={[
                    styles.stateDropdownIcon,
                    selectedState !== 'All States' && styles.stateDropdownIconActive,
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* 2. Date Calendar Picker Button */}
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

            <ScrollView
              style={styles.cardListScroll}
              contentContainerStyle={styles.cardListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => onRefresh(token)}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            >
              {loading && !refreshing ? (
                <View style={styles.centerLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading brand sales...</Text>
                </View>
              ) : filteredBrandSalesList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {brandSearchQuery.trim()
                      ? `No brand matching "${brandSearchQuery}" found`
                      : 'No brand sales records found'}
                  </Text>
                </View>
              ) : (
                filteredBrandSalesList.map((item, index) => {
                  const growthQtyRaw =
                    item.growth_qty_percentage ?? item.growthQtyPercentage ?? 0;
                  const growthValueRaw =
                    item.growth_value_percentage ?? item.growthValuePercentage ?? 0;
                  const growthQtyNum = Number(growthQtyRaw) || 0;
                  const growthValueNum = Number(growthValueRaw) || 0;

                  return (
                    <View key={item.id || index} style={styles.brandCard}>
                      {/* Brand Card Header (Product Icon + Brand Name) */}
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
                              #{item.srNo || index + 1}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* 2x2 Grid for FTD, LMFTD, MTD, LMTD */}
                      <View style={styles.brandStatsGrid}>
                        {/* 1. FTD */}
                        <View style={styles.brandBox}>
                          <View style={styles.brandBoxHeader}>
                            <Text style={styles.brandBoxTitle}>FTD</Text>
                            <View style={styles.brandBoxQtyBadge}>
                              <Text style={styles.brandBoxQtyText}>
                                Qty: {formatQuantity(item.ftdQty)}
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
                                Qty: {formatQuantity(item.lmftdQty)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.brandBoxValueText}>
                            {formatCurrency(item.lmftdValue)}
                          </Text>
                        </View>

                        {/* 3. MTD (Highlighted Primary Border) */}
                        <View style={[styles.brandBox, styles.brandBoxMtd]}>
                          <View style={styles.brandBoxHeader}>
                            <Text style={[styles.brandBoxTitle, styles.brandBoxTitleMtd]}>
                              MTD
                            </Text>
                            <View style={[styles.brandBoxQtyBadge, styles.brandBoxQtyBadgeMtd]}>
                              <Text style={[styles.brandBoxQtyText, styles.brandBoxQtyTextMtd]}>
                                Qty: {formatQuantity(item.mtdQty)}
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
                                Qty: {formatQuantity(item.lmtdQty)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.brandBoxValueText}>
                            {formatCurrency(item.lmtdValue)}
                          </Text>
                        </View>
                      </View>

                      {/* Growth Stats Row (Growth Qty% & Growth Value%) */}
                      <View style={styles.brandGrowthRow}>
                        {/* 5. Growth Qty (%) */}
                        <View
                          style={[
                            styles.brandGrowthBox,
                            growthQtyNum < 0 ? styles.growthRedBox : styles.growthGreenBox,
                          ]}
                        >
                          <Text
                            style={[
                              styles.brandGrowthLabel,
                              growthQtyNum < 0 ? styles.growthRedText : styles.growthGreenText,
                            ]}
                          >
                            Growth Qty
                          </Text>
                          <Text
                            style={[
                              styles.brandGrowthValue,
                              growthQtyNum < 0 ? styles.growthRedText : styles.growthGreenText,
                            ]}
                          >
                            {growthQtyNum > 0
                              ? `▲ +${formatPercent(growthQtyNum)}`
                              : growthQtyNum < 0
                              ? `▼ ${formatPercent(growthQtyNum)}`
                              : formatPercent(growthQtyNum)}
                          </Text>
                        </View>

                        {/* 6. Growth Value (%) */}
                        <View
                          style={[
                            styles.brandGrowthBox,
                            growthValueNum < 0 ? styles.growthRedBox : styles.growthGreenBox,
                          ]}
                        >
                          <Text
                            style={[
                              styles.brandGrowthLabel,
                              growthValueNum < 0 ? styles.growthRedText : styles.growthGreenText,
                            ]}
                          >
                            Growth Value
                          </Text>
                          <Text
                            style={[
                              styles.brandGrowthValue,
                              growthValueNum < 0 ? styles.growthRedText : styles.growthGreenText,
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
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── State Selection Modal Dropdown ── */}
      <Modal
        visible={isStateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStateModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsStateModalOpen(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity
                onPress={() => setIsStateModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {availableStates.map((st) => {
                const isSelected =
                  selectedState.toLowerCase().trim() === st.toLowerCase().trim();

                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.stateOptionItem,
                      isSelected && styles.stateOptionItemActive,
                    ]}
                    onPress={() => {
                      setSelectedState(st);
                      setIsStateModalOpen(false);
                      if (activeTab === 'CASH_DEPOSIT') {
                        loadCashDepositData(token, false, st);
                      } else {
                        loadBrandSalesData(token, false, st, selectedDate, brandSearchQuery);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.stateOptionText,
                        isSelected && styles.stateOptionTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedCheckBadge}>
                        <Text style={styles.selectedCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
                        loadBrandSalesData(token, false, selectedState, dayStr, brandSearchQuery);
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
                  loadBrandSalesData(token, false, selectedState, '', brandSearchQuery);
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
                  loadBrandSalesData(token, false, selectedState, todayStr, brandSearchQuery);
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
