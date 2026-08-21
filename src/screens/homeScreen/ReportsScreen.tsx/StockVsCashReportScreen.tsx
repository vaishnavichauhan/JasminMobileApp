import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  TextInput,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { StockCashDepositItem, fetchStatesApi } from '../../../api/stockCashDepositApi';
import { useStockCashDepositStore } from '../../../store';
import { colors, fontFamily, borderRadius } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';

/* ── helpers ── */
const fmtNum = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return n.toLocaleString('en-IN');
};

const fmtCurr = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return `₹${n.toLocaleString('en-IN')}`;
};

const getTodayFormattedDate = (): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const getBranchName = (item: StockCashDepositItem): string =>
  item.branch_name || item.branchName || item.branch || 'Unknown Branch';

const getStateName = (item: StockCashDepositItem): string =>
  item.state_name || item.stateName || item.state || '';

const getCityName = (item: StockCashDepositItem): string =>
  item.city_name || item.cityName || item.city || '';

const getAbmName = (item: StockCashDepositItem): string =>
  item.abm_name || item.abmName || item.abm || '—';

const getStoreType = (item: StockCashDepositItem): string =>
  item.store_type || item.storeType || '—';

const getStatusDetails = (item: StockCashDepositItem) => {
  const raw = (item.status ?? item.store_status ?? 'Active').toString().trim().toLowerCase();
  if (raw === '1' || raw === 'active' || raw === 'true') {
    return { text: 'Active', isActive: true };
  }
  if (raw === '0' || raw === 'inactive' || raw === 'false') {
    return { text: 'Inactive', isActive: false };
  }
  const str = (item.status ?? item.store_status ?? 'Active').toString().trim();
  const isActive = !raw.includes('inact') && !raw.includes('disable') && raw !== '0';
  return { text: str.charAt(0).toUpperCase() + str.slice(1), isActive };
};

/* ── Card Component ── */
const StockVsCashCard: React.FC<{ item: StockCashDepositItem; index: number }> = ({
  item,
  index,
}) => {
  const todayDateStr = getTodayFormattedDate();
  const statusInfo = getStatusDetails(item);

  const openingCashPending =
    item.opening_cash_deposit_pending ??
    item.opening_cash_pending ??
    item.openingCashDepositPending ??
    item.opening_cash ??
    null;

  const cashDep = item.cash_deposit ?? item.cashDeposit ?? null;

  const pendingCashDep =
    item.pending_cash_deposit ?? item.pendingCashDeposit ?? null;

  const support20 =
    item.support_20 ??
    item.support_20_percent ??
    item.support_twenty ??
    item.support ??
    null;

  const totalStockInvest =
    item.total_stock_invest ?? item.totalStockInvest ?? item.stock_invest ?? null;

  const currentStock = item.current_stock ?? item.currentStock ?? null;

  const creditDebit = item.credit_debit ?? item.creditDebit ?? null;
  const creditDebitN = Number(creditDebit);

  const availableLimit =
    item.available_limit_with_cash_deposit ??
    item.availableLimitWithCashDeposit ??
    item.available_limit ??
    null;

  const stName = getStateName(item);
  const ctName = getCityName(item);
  const locationStr = [ctName, stName].filter(Boolean).join(', ');

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.headerTopRow}>
            <Text style={styles.branchNameText} numberOfLines={1}>
              {getBranchName(item)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                statusInfo.isActive
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  statusInfo.isActive
                    ? styles.statusDotActive
                    : styles.statusDotInactive,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  statusInfo.isActive
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {statusInfo.text}
              </Text>
            </View>
          </View>
          {locationStr ? (
            <Text style={styles.locationText} numberOfLines={1}>
              📍 {locationStr}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Meta Bar: ABM Name & Store Type */}
      <View style={styles.metaBar}>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>ABM Name</Text>
          <Text style={styles.metaVal} numberOfLines={1}>
            {getAbmName(item)}
          </Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Store Type</Text>
          <Text style={[styles.metaVal,{textTransform: 'uppercase'}]} numberOfLines={1}>
            {getStoreType(item)}
          </Text>
        </View>
      </View>

      {/* Primary Metrics Grid */}
      <View style={styles.gridContainer}>
        {/* Stock Deposit */}
        <View style={styles.metricBox}>
          <Text style={styles.boxLabel}>Stock Deposit</Text>
          <Text style={styles.boxValue}>{fmtCurr(item.stock_deposit ?? item.stockDeposit)}</Text>
        </View>

        {/* Support (20%) */}
        <View style={styles.metricBox}>
          <Text style={styles.boxLabel}>Support (20%)</Text>
          <Text style={styles.boxValue}>{fmtCurr(support20)}</Text>
        </View>

        {/* Paid Support */}
        <View style={styles.metricBox}>
          <Text style={styles.boxLabel}>Paid Support</Text>
          <Text style={styles.boxValue}>{fmtCurr(item.paid_support ?? item.paidSupport)}</Text>
        </View>

        {/* Total Stock Invest */}
        <View style={styles.metricBox}>
          <Text style={styles.boxLabel}>Total Stock Invest</Text>
          <Text style={styles.boxValue}>{fmtCurr(totalStockInvest)}</Text>
        </View>

        {/* Current Stock */}
        <View style={[styles.metricBox, styles.fullWidthBox]}>
          <Text style={styles.boxLabel}>Current Stock</Text>
          <Text style={[styles.boxValue, { color: '#0F172A' }]}>{fmtCurr(currentStock)}</Text>
        </View>
      </View>

      {/* Today's Date Banner Section */}
      <View style={styles.todaySection}>
        <View style={styles.todaySectionHeader}>
          <Text style={styles.todaySectionTitle}>
            📅 Cash Deposit Status ({todayDateStr})
          </Text>
        </View>
        <View style={styles.todayGrid}>
          <View style={styles.todayCol}>
            <Text style={styles.todayLabel}>Opening Deposit Pending</Text>
            <Text style={styles.todayValue}>{fmtCurr(openingCashPending)}</Text>
          </View>
          <View style={styles.todayDivider} />
          <View style={styles.todayCol}>
            <Text style={styles.todayLabel}>Cash Deposit</Text>
            <Text style={[styles.todayValue, { color: '#16A34A' }]}>
              {fmtCurr(cashDep)}
            </Text>
          </View>
          <View style={styles.todayDivider} />
          <View style={styles.todayCol}>
            <Text style={styles.todayLabel}>Pending Cash Deposit</Text>
            <Text style={[styles.todayValue, { color: '#DC2626' }]}>
              {fmtCurr(pendingCashDep)}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Bar: Credit/Debit & Available Limit */}
      <View style={styles.footerBar}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>Credit / Debit</Text>
          <Text
            style={[
              styles.footerVal,
              !isNaN(creditDebitN) && creditDebitN < 0 ? styles.textNeg : null,
            ]}
          >
            {fmtCurr(creditDebit)}
          </Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>Available Limit w/ Cash Deposit</Text>
          <Text style={[styles.footerVal, styles.limitHighlight]}>
            {fmtCurr(availableLimit)}
          </Text>
        </View>
      </View>
    </View>
  );
};

/* ── Main Screen Component ── */
const StockVsCashReportScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const { token } = useAuth();
  const {
    data,
    loading,
    refreshing,
    error,
    searchQuery,
    setSearchQuery,
    loadData,
    onRefresh,
  } = useStockCashDepositStore();

  // State multi-select filter
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [tempSelectedStates, setTempSelectedStates] = useState<string[]>([]);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [stateSearchText, setStateSearchText] = useState('');
  const [apiStates, setApiStates] = useState<string[]>([]);

  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchSearchText, setBranchSearchText] = useState('');

  const [selectedABMs, setSelectedABMs] = useState<string[]>([]);
  const [isAbmModalOpen, setIsAbmModalOpen] = useState(false);
  const [abmSearchText, setAbmSearchText] = useState('');

  const searchInputRef = useRef<TextInput>(null);

  // Fetch all states from http://localhost:5005/api/states/all
  useEffect(() => {
    fetchStatesApi(token).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setApiStates(res);
      }
    });
  }, [token]);

  useEffect(() => {
    loadData(token);
  }, [token, loadData]);

  // Extract unique state names dynamically from /states/all API + data
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    if (apiStates.length > 0) {
      apiStates.forEach((s) => set.add(s));
    }
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const st = item.state_name || item.stateName || item.state;
        if (st && typeof st === 'string' && st.trim().length > 0 && st !== '—') {
          set.add(st.trim());
        }
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [apiStates, data]);

  // Filter states inside modal by search query
  const filteredModalStates = useMemo(() => {
    if (!stateSearchText.trim()) return availableStates;
    const q = stateSearchText.toLowerCase().trim();
    return availableStates.filter((s) => s.toLowerCase().includes(q));
  }, [availableStates, stateSearchText]);

  // Extract unique branch names dynamically from API data
  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const name = getBranchName(item);
        if (name && name !== 'Unknown Branch' && name.trim().length > 0) {
          set.add(name.trim());
        }
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Extract unique ABM names dynamically from API data
  const availableABMs = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const name = getAbmName(item);
        if (name && name !== '—' && name.trim().length > 0) {
          set.add(name.trim());
        }
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Filter branches inside modal by search query
  const filteredModalBranches = useMemo(() => {
    if (!branchSearchText.trim()) return availableBranches;
    const q = branchSearchText.toLowerCase().trim();
    return availableBranches.filter((b) => b.toLowerCase().includes(q));
  }, [availableBranches, branchSearchText]);

  // Filter ABMs inside modal by search query
  const filteredModalABMs = useMemo(() => {
    if (!abmSearchText.trim()) return availableABMs;
    const q = abmSearchText.toLowerCase().trim();
    return availableABMs.filter((a) => a.toLowerCase().includes(q));
  }, [availableABMs, abmSearchText]);

  // Filter main list by state multi-select ("state_name"), branch multi-select, ABM multi-select & search query
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. State Multi-select Filter using "state_name"
      if (selectedStates.length > 0) {
        const itemState = String(
          item.state_name || item.stateName || item.state || ''
        ).trim().toLowerCase();

        const matchesState = selectedStates.some(
          (sel) => sel.trim().toLowerCase() === itemState
        );
        if (!matchesState) {
          return false;
        }
      }

      // 2. Branch Multi-select Filter
      if (selectedBranches.length > 0) {
        const itemBranch = getBranchName(item).trim();
        if (!selectedBranches.includes(itemBranch)) {
          return false;
        }
      }

      // 3. ABM Multi-select Filter
      if (selectedABMs.length > 0) {
        const itemAbm = getAbmName(item).trim();
        if (!selectedABMs.includes(itemAbm)) {
          return false;
        }
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const branch = getBranchName(item).toLowerCase();
        const abm = getAbmName(item).toLowerCase();
        const city = getCityName(item).toLowerCase();
        if (!branch.includes(q) && !abm.includes(q) && !city.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, selectedStates, selectedBranches, selectedABMs]);

  const isAllStatesSelected = tempSelectedStates.length === 0;
  const isAllBranchesSelected = selectedBranches.length === 0;
  const isAllABMsSelected = selectedABMs.length === 0;

  const handleOpenStateModal = () => {
    setTempSelectedStates([...selectedStates]);
    setStateSearchText('');
    setIsStateModalOpen(true);
  };

  const handleSelectAllStates = () => {
    setTempSelectedStates([]);
  };

  const handleToggleState = (st: string) => {
    setTempSelectedStates((prev) => {
      if (prev.includes(st)) {
        return prev.filter((s) => s !== st);
      } else {
        return [...prev, st];
      }
    });
  };

  const handleApplyStateFilter = () => {
    setSelectedStates(tempSelectedStates);
    setIsStateModalOpen(false);
  };

  const handleResetStateFilter = () => {
    setTempSelectedStates([]);
    setSelectedStates([]);
    setIsStateModalOpen(false);
  };

  const handleSelectAllBranches = () => {
    setSelectedBranches([]);
  };

  const handleToggleBranch = (branchName: string) => {
    setSelectedBranches((prev) => {
      if (prev.includes(branchName)) {
        return prev.filter((b) => b !== branchName);
      } else {
        return [...prev, branchName];
      }
    });
  };

  const handleSelectAllABMs = () => {
    setSelectedABMs([]);
  };

  const handleToggleABM = (abmName: string) => {
    setSelectedABMs((prev) => {
      if (prev.includes(abmName)) {
        return prev.filter((a) => a !== abmName);
      } else {
        return [...prev, abmName];
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Stock vs Cash Deposit Report"
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading Stock vs Cash Deposit report…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    if (isAccessDeniedError(error)) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
          <Header
            title="Stock vs Cash Deposit Report"
            showBack={true}
            onBackPress={() => navigation?.goBack()}
            style={styles.headerStyle}
            titleStyle={styles.headerTitleStyle}
            iconColor={colors.white}
          />
          <AccessDenied
            message={error}
            onRetry={() => loadData(token)}
            onGoBack={() => navigation?.goBack()}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Stock vs Cash Deposit Report"
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={[styles.stateText, { color: '#DC2626' }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(token)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header component */}
      <Header
        title="Stock vs Cash Deposit Report"
        showBack={true}
        onBackPress={() => navigation?.goBack()}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Main Content */}
      <View style={styles.mainContainer}>
        {/* Search Row */}
        <View style={styles.searchRow}>
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
              placeholder="Search Branch, City or ABM..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Dropdowns Row (State, Branches & ABMs) */}
        <View style={styles.dropdownsRow}>
          {/* State Dropdown Button */}
          <TouchableOpacity
            style={[
              styles.dropdownBtn,
              selectedStates.length > 0 && styles.dropdownBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={handleOpenStateModal}
          >
            <Text
              style={[
                styles.dropdownBtnText,
                selectedStates.length > 0 && styles.dropdownBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedStates.length === 0
                ? 'All States'
                : selectedStates.length === 1
                ? selectedStates[0]
                : selectedStates.length === 2
                ? `${selectedStates[0]}, ${selectedStates[1]}`
                : `${selectedStates.length} States`}
            </Text>
            <Image
              source={Images.down}
              style={[
                styles.dropdownBtnIcon,
                selectedStates.length > 0 && styles.dropdownBtnIconActive,
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* All Branches Dropdown Button */}
          <TouchableOpacity
            style={[
              styles.dropdownBtn,
              selectedBranches.length > 0 && styles.dropdownBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setIsBranchModalOpen(true)}
          >
            <Text
              style={[
                styles.dropdownBtnText,
                selectedBranches.length > 0 && styles.dropdownBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedBranches.length === 0
                ? 'All Branches'
                : selectedBranches.length === 1
                ? selectedBranches[0]
                : `${selectedBranches.length} Branches`}
            </Text>
            <Image
              source={Images.down}
              style={[
                styles.dropdownBtnIcon,
                selectedBranches.length > 0 && styles.dropdownBtnIconActive,
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* All ABMs Dropdown Button */}
          <TouchableOpacity
            style={[
              styles.dropdownBtn,
              selectedABMs.length > 0 && styles.dropdownBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setIsAbmModalOpen(true)}
          >
            <Text
              style={[
                styles.dropdownBtnText,
                selectedABMs.length > 0 && styles.dropdownBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedABMs.length === 0
                ? 'All ABMs'
                : selectedABMs.length === 1
                ? selectedABMs[0]
                : `${selectedABMs.length} ABMs`}
            </Text>
            <Image
              source={Images.down}
              style={[
                styles.dropdownBtnIcon,
                selectedABMs.length > 0 && styles.dropdownBtnIconActive,
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Card List */}
        <FlatList
          data={filteredData}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={({ item, index }) => (
            <StockVsCashCard item={item} index={index} />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredData.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.stateIcon}>📊</Text>
              <Text style={styles.stateText}>No data found</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(token, true)}>
                <Text style={styles.retryText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => onRefresh(token)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </View>

      {/* ── State Selection Modal Dropdown (Multi-select) ── */}
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
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Select States</Text>
                {tempSelectedStates.length > 0 && (
                  <View style={styles.selectedCountBadge}>
                    <Text style={styles.selectedCountText}>
                      {tempSelectedStates.length} selected
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setIsStateModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* In-Modal Search Bar */}
            <View style={styles.modalSearchContainer}>
              <Image
                source={Images.filter}
                style={styles.modalSearchIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search state name..."
                placeholderTextColor="#94A3B8"
                value={stateSearchText}
                onChangeText={setStateSearchText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {stateSearchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setStateSearchText('')}
                  style={styles.modalClearSearchBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalClearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List of States with Multi-Select Checkboxes */}
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
            >
              {/* "All States" Option */}
              <TouchableOpacity
                style={[
                  styles.branchOptionItem,
                  isAllStatesSelected && styles.branchOptionItemActive,
                ]}
                onPress={handleSelectAllStates}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.checkboxBox,
                      isAllStatesSelected && styles.checkboxBoxActive,
                    ]}
                  >
                    {isAllStatesSelected && (
                      <Text style={styles.checkmarkIcon}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.branchOptionText,
                      isAllStatesSelected && styles.branchOptionTextActive,
                    ]}
                  >
                    All States
                  </Text>
                </View>
                {isAllStatesSelected && (
                  <View style={styles.allBadge}>
                    <Text style={styles.allBadgeText}>Default</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Individual State Options */}
              {filteredModalStates.map((st) => {
                const isSelected = tempSelectedStates.includes(st);
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.branchOptionItem,
                      isSelected && styles.branchOptionItemActive,
                    ]}
                    onPress={() => handleToggleState(st)}
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
                          styles.branchOptionText,
                          isSelected && styles.branchOptionTextActive,
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
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalFooterRow}>
              {(tempSelectedStates.length > 0 || selectedStates.length > 0) && (
                <TouchableOpacity
                  style={styles.modalResetBtn}
                  onPress={handleResetStateFilter}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalResetText}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleApplyStateFilter}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyText}>
                  {tempSelectedStates.length === 0
                    ? 'Show All'
                    : `Apply (${tempSelectedStates.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Branch Selection Modal Dropdown (Multi-select) ── */}
      <Modal
        visible={isBranchModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBranchModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsBranchModalOpen(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Select Branches</Text>
                {selectedBranches.length > 0 && (
                  <View style={styles.selectedCountBadge}>
                    <Text style={styles.selectedCountText}>
                      {selectedBranches.length} selected
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setIsBranchModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* In-Modal Search Bar */}
            <View style={styles.modalSearchContainer}>
              <Image
                source={Images.filter}
                style={styles.modalSearchIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search branch name..."
                placeholderTextColor="#94A3B8"
                value={branchSearchText}
                onChangeText={setBranchSearchText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {branchSearchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setBranchSearchText('')}
                  style={styles.modalClearSearchBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalClearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List of Branches with Multi-Select Checkboxes */}
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
            >
              {/* "All Branches" Option */}
              <TouchableOpacity
                style={[
                  styles.branchOptionItem,
                  isAllBranchesSelected && styles.branchOptionItemActive,
                ]}
                onPress={handleSelectAllBranches}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.checkboxBox,
                      isAllBranchesSelected && styles.checkboxBoxActive,
                    ]}
                  >
                    {isAllBranchesSelected && (
                      <Text style={styles.checkboxCheckmark}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.branchOptionText,
                      isAllBranchesSelected && styles.branchOptionTextActive,
                      { fontFamily: fontFamily.bold },
                    ]}
                  >
                    All Branches
                  </Text>
                </View>
                {isAllBranchesSelected && (
                  <View style={styles.allBadge}>
                    <Text style={styles.allBadgeText}>ALL</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Individual Branch Items */}
              {filteredModalBranches.map((branch) => {
                const isSelected = selectedBranches.includes(branch);

                return (
                  <TouchableOpacity
                    key={branch}
                    style={[
                      styles.branchOptionItem,
                      isSelected && styles.branchOptionItemActive,
                    ]}
                    onPress={() => handleToggleBranch(branch)}
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
                          <Text style={styles.checkboxCheckmark}>✓</Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.branchOptionText,
                          isSelected && styles.branchOptionTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {branch}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {filteredModalBranches.length === 0 && (
                <View style={styles.modalEmptyContainer}>
                  <Text style={styles.modalEmptyText}>No branches found</Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalFooterRow}>
              {selectedBranches.length > 0 && (
                <TouchableOpacity
                  style={styles.modalResetBtn}
                  onPress={handleSelectAllBranches}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalResetText}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setIsBranchModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyText}>
                  {selectedBranches.length === 0
                    ? 'Show All'
                    : `Apply (${selectedBranches.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── ABM Selection Modal Dropdown (Multi-select) ── */}
      <Modal
        visible={isAbmModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAbmModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsAbmModalOpen(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Select ABMs</Text>
                {selectedABMs.length > 0 && (
                  <View style={styles.selectedCountBadge}>
                    <Text style={styles.selectedCountText}>
                      {selectedABMs.length} selected
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setIsAbmModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* In-Modal Search Bar */}
            <View style={styles.modalSearchContainer}>
              <Image
                source={Images.filter}
                style={styles.modalSearchIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search ABM name..."
                placeholderTextColor="#94A3B8"
                value={abmSearchText}
                onChangeText={setAbmSearchText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {abmSearchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setAbmSearchText('')}
                  style={styles.modalClearSearchBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalClearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List of ABMs with Multi-Select Checkboxes */}
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
            >
              {/* "All ABMs" Option */}
              <TouchableOpacity
                style={[
                  styles.branchOptionItem,
                  isAllABMsSelected && styles.branchOptionItemActive,
                ]}
                onPress={handleSelectAllABMs}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.checkboxBox,
                      isAllABMsSelected && styles.checkboxBoxActive,
                    ]}
                  >
                    {isAllABMsSelected && (
                      <Text style={styles.checkboxCheckmark}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.branchOptionText,
                      isAllABMsSelected && styles.branchOptionTextActive,
                      { fontFamily: fontFamily.bold },
                    ]}
                  >
                    All ABMs
                  </Text>
                </View>
                {isAllABMsSelected && (
                  <View style={styles.allBadge}>
                    <Text style={styles.allBadgeText}>ALL</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Individual ABM Items */}
              {filteredModalABMs.map((abm) => {
                const isSelected = selectedABMs.includes(abm);

                return (
                  <TouchableOpacity
                    key={abm}
                    style={[
                      styles.branchOptionItem,
                      isSelected && styles.branchOptionItemActive,
                    ]}
                    onPress={() => handleToggleABM(abm)}
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
                          <Text style={styles.checkboxCheckmark}>✓</Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.branchOptionText,
                          isSelected && styles.branchOptionTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {abm}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {filteredModalABMs.length === 0 && (
                <View style={styles.modalEmptyContainer}>
                  <Text style={styles.modalEmptyText}>No ABMs found</Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalFooterRow}>
              {selectedABMs.length > 0 && (
                <TouchableOpacity
                  style={styles.modalResetBtn}
                  onPress={handleSelectAllABMs}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalResetText}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setIsAbmModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyText}>
                  {selectedABMs.length === 0
                    ? 'Show All'
                    : `Apply (${selectedABMs.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

/* ── Styles ── */
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
    fontSize: 16,
    fontFamily: fontFamily.bold,
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: borderRadius.cardRadius || 24,
    borderTopRightRadius: borderRadius.cardRadius || 24,
    paddingTop: 14,
    overflow: 'hidden',
  },

  /* Search Row */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    width: 16,
    height: 16,
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
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },

  /* Dropdowns Row (Branches & ABMs) */
  dropdownsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 8,
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    height: 40,
  },
  dropdownBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    flex: 1,
    marginRight: 2,
  },
  dropdownBtnTextActive: {
    color: colors.white,
  },
  dropdownBtnIcon: {
    width: 12,
    height: 12,
    tintColor: colors.primary,
  },
  dropdownBtnIconActive: {
    tintColor: colors.white,
  },

  /* List */
  listContent: {
    padding: 14,
    paddingBottom: 32,
    backgroundColor: '#F4F6FB',
  },

  /* Card */
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  /* Card Header */
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 10,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  indexText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  branchNameText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
  locationText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
    marginLeft: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: '#16A34A',
  },
  statusDotInactive: {
    backgroundColor: '#DC2626',
  },
  statusText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.2,
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#B91C1C',
  },

  /* Meta Bar */
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaCol: {
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  metaLabel: {
    fontSize: 9,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    marginBottom: 1,
  },
  metaVal: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },

  /* Metrics Grid */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  fullWidthBox: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  boxLabel: {
    fontSize: 9.5,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    marginBottom: 2,
  },
  boxValue: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },

  /* Today's Section */
  todaySection: {
    backgroundColor: '#FEFCE8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF08A',
    padding: 10,
    marginBottom: 10,
  },
  todaySectionHeader: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF08A',
  },
  todaySectionTitle: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#854D0E',
  },
  todayGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayCol: {
    flex: 1,
    alignItems: 'center',
  },
  todayDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#FDE047',
  },
  todayLabel: {
    fontSize: 8.5,
    fontFamily: fontFamily.regular,
    color: '#A16207',
    textAlign: 'center',
    marginBottom: 2,
  },
  todayValue: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#854D0E',
    textAlign: 'center',
  },

  /* Footer Bar */
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  footerCol: {
    flex: 1,
  },
  footerDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  footerLabel: {
    fontSize: 9,
    fontFamily: fontFamily.regular,
    color: '#475569',
    marginBottom: 2,
  },
  footerVal: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  textNeg: {
    color: '#DC2626',
  },
  limitHighlight: {
    color: '#16A34A'
  },

  /* States */
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  stateIcon: { fontSize: 44, marginBottom: 12 },
  stateText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
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

  /* Modal Overlay & Card */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  selectedCountBadge: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  selectedCountText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  modalSearchIcon: {
    width: 14,
    height: 14,
    tintColor: '#94A3B8',
    marginRight: 6,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    paddingVertical: 0,
  },
  modalClearSearchBtn: {
    padding: 2,
  },
  modalClearSearchText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },
  modalScrollView: {
    maxHeight: 280,
  },
  branchOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  branchOptionItemActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxCheckmark: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  checkmarkIcon: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  branchOptionText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#334155',
    flex: 1,
  },
  branchOptionTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  allBadge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  allBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: fontFamily.bold,
  },
  modalEmptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fontFamily.regular,
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalResetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalResetText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  modalApplyBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
});

export default StockVsCashReportScreen;
