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

const FinanceBrandCard: React.FC<CardProps> = ({
  item,
  index,
  brands,
  machines,
  companies,
}) => {
  return (
    <View style={styles.card}>
      {/* Card Header: Sr. No & Branch Info */}
      <View style={styles.cardHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.branchNameText} numberOfLines={1}>
            {item.branch_name || 'Unnamed Branch'}
          </Text>
          <View style={styles.subInfoRow}>
            {!!item.state_name && (
              <Text style={styles.subInfoText} numberOfLines={1}>
                State: {item.state_name}
              </Text>
            )}
            {!!item.branch_code && (
              <Text style={styles.subInfoText} numberOfLines={1}>
                {item.state_name ? ' • ' : ''}Code: {item.branch_code}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* QR Code ID / Password & Remarks */}
      {(!!item.qr_code_id_password || !!item.remarks) && (
        <View style={styles.qrRemarksContainer}>
          {!!item.qr_code_id_password && (
            <View style={styles.infoRowBox}>
              <Text style={styles.infoLabel}>QR CODE ID & PASSWORD:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.qr_code_id_password}
              </Text>
            </View>
          )}
          {!!item.remarks && (
            <View style={styles.infoRowBox}>
              <Text style={styles.infoLabel}>REMARKS:</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {item.remarks}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Mobile Brands Section */}
      {brands.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionPillText}>BRAND CODES</Text>
            </View>
          </View>
          <View style={styles.gridContainer}>
            {brands.map((brand) => {
              const brandVal =
                item.brand_codes?.[String(brand.id)] ??
                item.brand_codes?.[Number(brand.id)] ??
                '—';

              return (
                <View key={String(brand.id)} style={styles.brandBox}>
                  <Text style={styles.brandNameText} numberOfLines={1}>
                    {brand.mobile_brand}
                  </Text>
                  <Text
                    style={[
                      styles.brandValueText,
                      brandVal !== '—' && styles.brandValueTextActive,
                    ]}
                  >
                    {String(brandVal)}
                  </Text>
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
                MACHINE DETAILS
              </Text>
            </View>
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

      {/* Companies Section (if available) */}
      {companies.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionPill, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.sectionPillText, { color: '#B45309' }]}>
                BANK / COMPANY CODES
              </Text>
            </View>
          </View>
          <View style={styles.gridContainer}>
            {companies.map((comp) => {
              const compVal =
                item.company_codes?.[String(comp.id)] ??
                item.company_codes?.[Number(comp.id)] ??
                '—';

              return (
                <View key={String(comp.id)} style={styles.companyBox}>
                  <Text style={styles.companyNameText} numberOfLines={1}>
                    {comp.bank_card_name}
                  </Text>
                  <Text
                    style={[
                      styles.companyValueText,
                      compVal !== '—' && styles.companyValueTextActive,
                    ]}
                  >
                    {String(compVal)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

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
    if (set.size === 1) {
      ['Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Delhi'].forEach((s) => set.add(s));
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
    borderWidth: 1,
    borderColor: '#EDE9FE',
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
    marginBottom: 8,
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
  branchNameText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subInfoText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
  },

  /* QR & Remarks */
  qrRemarksContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  infoRowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },

  /* Sections */
  sectionContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectionPillText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    letterSpacing: 0.5,
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
    backgroundColor: '#FAF5FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandNameText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#6B21A8',
    flex: 1,
    marginRight: 4,
  },
  brandValueText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#94A3B8',
  },
  brandValueTextActive: {
    color: colors.primary,
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
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#334155',
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
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyNameText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#92400E',
    flex: 1,
    marginRight: 4,
    textTransform: 'uppercase',
  },
  companyValueText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#94A3B8',
  },
  companyValueTextActive: {
    color: '#B45309',
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
