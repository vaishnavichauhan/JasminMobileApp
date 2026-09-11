import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import Header from '../../../components/Header/Header';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';
import { colors, fontSize, fontFamily, borderRadius } from '../../../styles/variables';
import { useAuth } from '../../../context/AuthContext';
import { useFinanceBrandStore } from '../../../store';
import Images from '../../../assets/images';
import {
  FinanceBrandRow,
  FinanceBrandItem,
  FinanceMachineItem,
  FinanceCompanyItem,
} from '../../../api/financeBrandApi';

/* ── Individual Finance & Brand Card Component ── */
interface CardProps {
  item: FinanceBrandRow;
  index: number;
  brands: FinanceBrandItem[];
  machines: FinanceMachineItem[];
  companies: FinanceCompanyItem[];
}

const FinanceBrandCard = React.memo<CardProps>(({
  item,
  index,
  brands,
  machines,
  companies,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active brand codes
  const mappedBrandCount = useMemo(() => {
    if (!item.brand_codes) return 0;
    return Object.values(item.brand_codes).filter((v) => v && v !== '—' && v !== '-').length;
  }, [item.brand_codes]);

  return (
    <View style={[styles.card, isExpanded && styles.cardActive]}>
      {/* ── Card Main Header (Tappable to expand) ── */}
      <TouchableOpacity
        style={styles.cardHeader}
        activeOpacity={0.7}
        onPress={() => setIsExpanded((prev) => !prev)}
      >
        <View style={styles.cardHeaderLeft}>
          {/* Index / Branch Icon Badge */}
          <View style={styles.branchIconBadge}>
            <Image
              source={Images.brand}
              style={styles.branchIconImg}
              resizeMode="contain"
            />
            <View style={styles.indexMiniBadge}>
              <Text style={styles.indexMiniText}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
          </View>

          {/* Branch Title & Meta Badges */}
          <View style={styles.headerInfo}>
            <Text style={styles.branchNameText} numberOfLines={2} ellipsizeMode="tail">
              {item.branch_name || 'Unnamed Branch'}
            </Text>

            <View style={styles.subMetaRow}>
              {!!item.state_name && (
                <View style={styles.statePill}>
                  <Text style={styles.statePillText}>📍 {item.state_name}</Text>
                </View>
              )}
              {!!item.branch_code && (
                <View style={styles.codePill}>
                  <Text style={styles.codePillText}>Code: {item.branch_code}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Expand / Collapse Action Button */}
        <View
          style={[
            styles.expandArrowBtn,
            isExpanded && styles.expandArrowBtnActive,
          ]}
        >
          <Image
            source={Images.down}
            style={[
              styles.expandArrowIcon,
              isExpanded && styles.expandArrowIconRotated,
            ]}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {/* ── Quick Summary Chips Row ── */}
      <View style={styles.cardSummaryRow}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipIcon}>🏷️</Text>
          <Text style={styles.summaryChipText}>
            <Text style={styles.summaryChipBold}>{mappedBrandCount || brands.length}</Text> Brands
          </Text>
        </View>

        {machines.length > 0 && (
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipIcon}>🖥️</Text>
            <Text style={styles.summaryChipText}>
              <Text style={styles.summaryChipBold}>{machines.length}</Text> Machines
            </Text>
          </View>
        )}

        {companies.length > 0 && (
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipIcon}>🏦</Text>
            <Text style={styles.summaryChipText}>
              <Text style={styles.summaryChipBold}>{companies.length}</Text> Companies
            </Text>
          </View>
        )}
      </View>

      {/* ── Expandable Details Section ── */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* QR Code ID & Password / Remarks */}
          {(!!item.qr_code_id_password || !!item.remarks) && (
            <View style={styles.qrRemarksCard}>
              {!!item.qr_code_id_password && (
                <View style={styles.qrInfoRow}>
                  <View style={styles.qrIconCircle}>
                    <Text style={{ fontSize: 13 }}>📱</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qrLabelText}>QR CODE ID & PASSWORD</Text>
                    <Text style={styles.qrValueText} numberOfLines={1}>
                      {item.qr_code_id_password}
                    </Text>
                  </View>
                </View>
              )}
              {!!item.remarks && (
                <View style={[styles.qrInfoRow, !!item.qr_code_id_password && { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }]}>
                  <View style={styles.qrIconCircle}>
                    <Text style={{ fontSize: 13 }}>📝</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qrLabelText}>REMARKS</Text>
                    <Text style={styles.qrValueText} numberOfLines={2}>
                      {item.remarks}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Mobile Brands Section (Brand Codes) */}
          {brands.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionPill}>
                  <Text style={styles.sectionPillText}>🏷️ BRAND CODES</Text>
                </View>
                <Text style={styles.sectionItemCountText}>
                  {brands.length} {brands.length === 1 ? 'Brand' : 'Brands'}
                </Text>
              </View>

              <View style={styles.gridContainer}>
                {brands.map((brand) => {
                  const brandVal =
                    item.brand_codes?.[String(brand.id)] ??
                    item.brand_codes?.[Number(brand.id)] ??
                    '—';
                  const hasValue = brandVal !== '—' && brandVal !== '' && brandVal !== null;

                  return (
                    <View
                      key={String(brand.id)}
                      style={[
                        styles.brandBox,
                        hasValue && styles.brandBoxActive,
                      ]}
                    >
                      <Text style={styles.brandNameText} numberOfLines={1}>
                        {brand.mobile_brand}
                      </Text>
                      <View
                        style={[
                          styles.brandValuePill,
                          hasValue && styles.brandValuePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.brandValueText,
                            hasValue && styles.brandValueTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {String(brandVal)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Machine Details Section */}
          {machines.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionPill, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={[styles.sectionPillText, { color: colors.primary }]}>
                    🖥️ MACHINE DETAILS
                  </Text>
                </View>
                <Text style={styles.sectionItemCountText}>
                  {machines.length} {machines.length === 1 ? 'Machine' : 'Machines'}
                </Text>
              </View>

              {machines.map((machine) => {
                const detail =
                  item.machine_details?.[String(machine.id)] ||
                  item.machine_details?.[Number(machine.id)] ||
                  {};

                const tidVal = detail.tid !== undefined && detail.tid !== '' ? String(detail.tid) : '—';
                const posVal = detail.pos_id !== undefined && detail.pos_id !== '' ? String(detail.pos_id) : '—';
                const serialVal = detail.serial_no !== undefined && detail.serial_no !== '' ? String(detail.serial_no) : '—';

                return (
                  <View key={String(machine.id)} style={styles.machineCard}>
                    <View style={styles.machineTitleRow}>
                      <Text style={styles.machineNameText} numberOfLines={1}>
                        {machine.machine_name}
                      </Text>
                    </View>
                    <View style={styles.machineMetricsRow}>
                      <View style={styles.machineMetricCol}>
                        <Text style={styles.machineMetricLabel}>TID</Text>
                        <Text
                          style={[
                            styles.machineMetricValue,
                            tidVal !== '—' && styles.machineMetricValueActive,
                          ]}
                        >
                          {tidVal}
                        </Text>
                      </View>
                      <View style={styles.machineMetricDivider} />
                      <View style={styles.machineMetricCol}>
                        <Text style={styles.machineMetricLabel}>POS ID</Text>
                        <Text
                          style={[
                            styles.machineMetricValue,
                            posVal !== '—' && styles.machineMetricValueActive,
                          ]}
                        >
                          {posVal}
                        </Text>
                      </View>
                      <View style={styles.machineMetricDivider} />
                      <View style={styles.machineMetricCol}>
                        <Text style={styles.machineMetricLabel}>SERIAL NO</Text>
                        <Text
                          style={[
                            styles.machineMetricValue,
                            serialVal !== '—' && styles.machineMetricValueActive,
                          ]}
                        >
                          {serialVal}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Companies Section */}
          {companies.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionPill, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.sectionPillText, { color: '#B45309' }]}>
                    🏦 BANK / COMPANY CODES
                  </Text>
                </View>
                <Text style={styles.sectionItemCountText}>
                  {companies.length} {companies.length === 1 ? 'Company' : 'Companies'}
                </Text>
              </View>
              <View style={styles.gridContainer}>
                {companies.map((comp) => {
                  const compVal =
                    item.company_codes?.[String(comp.id)] ??
                    item.company_codes?.[Number(comp.id)] ??
                    '—';
                  const hasCompVal = compVal !== '—' && compVal !== '' && compVal !== null;

                  return (
                    <View
                      key={String(comp.id)}
                      style={[
                        styles.companyBox,
                        hasCompVal && styles.companyBoxActive,
                      ]}
                    >
                      <Text style={styles.companyNameText} numberOfLines={1}>
                        {comp.bank_card_name}
                      </Text>
                      <View
                        style={[
                          styles.companyValuePill,
                          hasCompVal && styles.companyValuePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.companyValueText,
                            hasCompVal && styles.companyValueTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {String(compVal)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

/* ── Main Screen Component ── */
const FinanceBrandReport: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { token } = useAuth();
  const {
    rows,
    brands,
    machines,
    companies,
    loading,
    refreshing,
    error,
    searchQuery,
    apiStatesList,
    setSearchQuery,
    loadStatesDropdown,
    loadData,
    onRefresh,
  } = useFinanceBrandStore();

  const [selectedStates, setSelectedStates] = useState<string[]>(['All States']);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadStatesDropdown(token);
    loadData(token);
  }, [token, loadStatesDropdown, loadData]);

  // Extract unique state names dynamically
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    set.add('All States');
    if (Array.isArray(apiStatesList)) {
      apiStatesList.forEach((st) => {
        if (st && typeof st === 'string' && st.trim().length > 0) {
          set.add(st.trim());
        }
      });
    }
    if (Array.isArray(rows)) {
      rows.forEach((item) => {
        if (item.state_name && typeof item.state_name === 'string' && item.state_name.trim().length > 0) {
          set.add(item.state_name.trim());
        }
      });
    }
    return Array.from(set);
  }, [apiStatesList, rows]);

  const activeStates = useMemo(() => {
    return (selectedStates || []).filter((s) => s && s !== 'All States');
  }, [selectedStates]);

  const stateDropdownLabel = useMemo(() => {
    if (activeStates.length === 0) return 'All States';
    if (activeStates.length === 1) return activeStates[0];
    if (activeStates.length === 2) return `${activeStates[0]}, ${activeStates[1]}`;
    return `${activeStates.length} States`;
  }, [activeStates]);

  // Filter rows based on search query and selected multiple states client-side
  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const branchName = (item.branch_name || '').toLowerCase();
        const branchCode = (item.branch_code || '').toLowerCase();
        const qrPass = (item.qr_code_id_password || '').toLowerCase();
        const remarks = (item.remarks || '').toLowerCase();
        const stateName = (item.state_name || '').toLowerCase();

        const matches =
          branchName.includes(q) ||
          branchCode.includes(q) ||
          qrPass.includes(q) ||
          remarks.includes(q) ||
          stateName.includes(q);

        if (!matches) return false;
      }

      // 2. Multi-state filter by item.state_name
      if (activeStates.length > 0) {
        const itemState = (item.state_name || '').toLowerCase().trim();
        if (!itemState) return false;

        const isMatch = activeStates.some((st) => {
          const target = st.toLowerCase().trim();
          return itemState.includes(target) || target.includes(itemState);
        });

        if (!isMatch) return false;
      }

      return true;
    });
  }, [rows, searchQuery, activeStates]);

  const handleToggleState = (st: string) => {
    if (st === 'All States') {
      setSelectedStates(['All States']);
      return;
    }

    const withoutAll = selectedStates.filter((s) => s !== 'All States');
    let next: string[];
    if (withoutAll.includes(st)) {
      next = withoutAll.filter((s) => s !== st);
    } else {
      next = [...withoutAll, st];
    }

    if (next.length === 0) {
      setSelectedStates(['All States']);
    } else {
      setSelectedStates(next);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Finance & Brand Report"
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading Finance & Brand report…</Text>
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
            title="Finance & Brand Report"
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
          title="Finance & Brand Report"
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
        title="Finance & Brand Report"
        showBack={true}
        onBackPress={() => navigation?.goBack()}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Main Content */}
      <View style={styles.mainContainer}>
        {/* Search & State Filter Row */}
        <View style={styles.filterRow}>
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
              placeholder="Search branch name, code..."
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

          {/* State Wise Filter Dropdown Button */}
          <TouchableOpacity
            style={[
              styles.stateDropdownBtn,
              activeStates.length > 0 && styles.stateDropdownBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setIsStateModalOpen(true)}
          >
            <Text
              style={[
                styles.stateDropdownText,
                activeStates.length > 0 && styles.stateDropdownTextActive,
              ]}
              numberOfLines={1}
            >
              {stateDropdownLabel}
            </Text>
            <Image
              source={Images.down}
              style={[
                styles.stateDropdownIcon,
                activeStates.length > 0 && styles.stateDropdownIconActive,
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Card List */}
        <FlatList
          data={filteredRows}
          keyExtractor={(item, idx) => String(item.branch_id ?? idx)}
          renderItem={({ item, index }) => (
            <FinanceBrandCard
              item={item}
              index={index}
              brands={brands}
              machines={machines}
              companies={companies}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredRows.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          updateCellsBatchingPeriod={50}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.stateIcon}>📊</Text>
              <Text style={styles.stateText}>No data found</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => onRefresh(token)}>
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

      {/* ── State Selection Modal Dropdown (Multi-Select, Client-Side) ── */}
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
              <View>
                <Text style={styles.modalTitle}>Select States</Text>
                <Text style={styles.modalSubtitle}>
                  {activeStates.length > 0
                    ? `${activeStates.length} state(s) selected`
                    : 'Showing all states'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {activeStates.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSelectedStates(['All States'])}
                    style={styles.modalResetBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalResetText}>Reset</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setIsStateModalOpen(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              {availableStates.map((st) => {
                const isAllOption = st === 'All States';
                const isSelected = isAllOption
                  ? activeStates.length === 0
                  : selectedStates.includes(st);

                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.stateOptionItem,
                      isSelected && styles.stateOptionItemActive,
                    ]}
                    onPress={() => handleToggleState(st)}
                    activeOpacity={0.7}
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
                      <View style={styles.checkmarkBadge}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={() => setIsStateModalOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalApplyBtnText}>Apply</Text>
            </TouchableOpacity>
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
    fontSize: fontSize.large,
    fontFamily: fontFamily.bold,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: borderRadius.cardRadius || 24,
    borderTopRightRadius: borderRadius.cardRadius || 24,
    paddingTop: 14,
    overflow: 'hidden',
  },

  /* Filter Row (Search + State Dropdown) */
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
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
    marginRight: 8,
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

  /* State Dropdown Button */
  stateDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingHorizontal: 12,
    height: 44,
    minWidth: 110,
    maxWidth: 150,
  },
  stateDropdownBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  stateDropdownText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    flex: 1,
    marginRight: 6,
  },
  stateDropdownTextActive: {
    color: colors.white,
  },
  stateDropdownIcon: {
    width: 12,
    height: 12,
    tintColor: colors.primary,
  },
  stateDropdownIconActive: {
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
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderLeftWidth: 4.5,
    borderLeftColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardActive: {
    borderColor: colors.primary,
    borderLeftWidth: 5,
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },

  /* Card Header */
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  branchIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F3E8FF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  branchIconImg: {
    width: 20,
    height: 20,
    tintColor: colors.primary,
  },
  indexMiniBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.white,
  },
  indexMiniText: {
    fontSize: 8.5,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  branchNameText: {
    fontSize: 14.5,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 4,
    flexShrink: 1,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  statePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statePillText: {
    fontSize: 10.5,
    fontFamily: fontFamily.medium,
    color: '#475569',
  },
  codePill: {
    backgroundColor: '#FAF5FF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  codePillText: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  expandArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandArrowBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  expandArrowIcon: {
    width: 14,
    height: 14,
    tintColor: '#64748B',
  },
  expandArrowIconRotated: {
    tintColor: colors.white,
    transform: [{ rotate: '180deg' }],
  },

  /* Quick Summary Chips Row */
  cardSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  summaryChipIcon: {
    fontSize: 11,
  },
  summaryChipText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  summaryChipBold: {
    fontFamily: fontFamily.bold,
    color: '#1E293B',
  },

  /* Expandable Content Container */
  expandedContent: {
    paddingTop: 10,
  },

  /* QR & Remarks Card */
  qrRemarksCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  qrInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLabelText: {
    fontSize: 9.5,
    fontFamily: fontFamily.bold,
    color: '#6B21A8',
    letterSpacing: 0.3,
  },
  qrValueText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    marginTop: 1,
  },

  /* Section Containers */
  sectionContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionPillText: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  sectionItemCountText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#94A3B8',
  },

  /* Grid for Brands & Companies */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBoxActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
  },
  brandNameText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#334155',
    flex: 1,
    marginRight: 4,
  },
  brandValuePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  brandValuePillActive: {
    backgroundColor: colors.primary,
  },
  brandValueText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#94A3B8',
  },
  brandValueTextActive: {
    color: colors.white,
  },

  /* Machine Cards */
  machineCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 8,
  },
  machineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  machineNameText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  machineMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  machineMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  machineMetricLabel: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    color: '#94A3B8',
    marginBottom: 2,
  },
  machineMetricValue: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  machineMetricValueActive: {
    color: colors.primary,
  },
  machineMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },

  /* Companies */
  companyBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyBoxActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  companyNameText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#334155',
    flex: 1,
    marginRight: 4,
    textTransform: 'uppercase',
  },
  companyValuePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  companyValuePillActive: {
    backgroundColor: '#D97706',
  },
  companyValueText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#94A3B8',
  },
  companyValueTextActive: {
    color: colors.white,
  },

  /* States, Center, Loading, Empty */
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
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
    fontSize: 12,
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
  stateOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  stateOptionItemActive: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  stateOptionText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#334155',
  },
  stateOptionTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  checkmarkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  modalApplyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalApplyBtnText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fontFamily.bold,
  },
});

export default FinanceBrandReport;
