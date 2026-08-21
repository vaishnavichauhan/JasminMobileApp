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
import { AbmWiseTvaItem } from '../../../api/targetVsAchievementApi';
import { useAbmWiseStore } from '../../../store';
import { colors, fontFamily, fontSize, borderRadius } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';

/* ── helpers ── */
const fmtNum = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return String(n);
};

const fmtPct = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return `${n.toFixed(2)}%`;
};

const getAbmName = (item: AbmWiseTvaItem): string =>
  item.abm_name || item.abmName || item.abm || item.name || '—';

/* ── Card Component ── */
const AbmCard: React.FC<{ item: AbmWiseTvaItem; index: number }> = ({ item, index }) => {
  const mtdQtyPct   = item.mtd_qty_percentage_ach ?? item.mtd_qty_pct_ach ?? item.mtd_qty_ach_pct ?? item.mtd_qty_percentage ?? item.mtd_qty_pct ?? null;
  const mtdValPct   = item.mtd_value_percentage_ach ?? item.mtd_value_pct_ach ?? item.mtd_value_ach_pct ?? item.mtd_value_percentage ?? item.mtd_value_pct ?? null;
  
  const gQty   = item.growth_qty_percentage?? null;
  const gValue = item.growth_value_percentage??null;
  const gQtyN   = Number(gQty);
  const gValueN = Number(gValue);

  return (
    <View style={styles.cardSmall}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.abmNameText} numberOfLines={1}>{getAbmName(item)}</Text>
          {!!item.state_name && (
            <Text style={styles.abmSubtext} numberOfLines={1}>State: {item.state_name}</Text>
          )}
        </View>
      </View>

      {/* Grid of Equal Sized Compact Metric Boxes */}
      <View style={styles.gridContainer}>
        {/* TGT */}
        <View style={styles.metricBoxCompact}>
          <Text style={styles.boxTitle}>TGT</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>QTY</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.qty_tgt)}</Text>
            </View>
            <View style={styles.boxColDivider} />
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>VAL</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.value_tgt)}</Text>
            </View>
          </View>
        </View>

        {/* FTD */}
        <View style={styles.metricBoxCompact}>
          <Text style={styles.boxTitle}>FTD ACH</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>QTY</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.ftd_qty_ach)}</Text>
            </View>
            <View style={styles.boxColDivider} />
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>VAL</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.ftd_value_ach)}</Text>
            </View>
          </View>
        </View>

        {/* LMFTD */}
        <View style={styles.metricBoxCompact}>
          <Text style={styles.boxTitle}>LMFTD ACH</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>QTY</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.lmftd_qty_ach)}</Text>
            </View>
            <View style={styles.boxColDivider} />
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>VAL</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.lmftd_value_ach)}</Text>
            </View>
          </View>
        </View>

        {/* MTD */}
        <View style={styles.metricBoxCompact}>
          <Text style={styles.boxTitle}>MTD ACH</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>QTY</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.mtd_qty_ach)}</Text>
            </View>
            <View style={styles.boxColDivider} />
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>VAL</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.mtd_value_ach)}</Text>
            </View>
          </View>
        </View>

        {/* MTD % ACH */}
        <View style={styles.metricBoxCompact}>
          <Text style={styles.boxTitle}>MTD % ACH</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>QTY %</Text>
              <Text style={styles.boxSubValue}>{fmtPct(mtdQtyPct)}</Text>
            </View>
            <View style={styles.boxColDivider} />
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>VAL %</Text>
              <Text style={styles.boxSubValue}>{fmtPct(mtdValPct)}</Text>
            </View>
          </View>
        </View>

        {/* LMTD */}
        <View style={styles.metricBoxCompact}>
          <Text style={styles.boxTitle}>LMTD ACH</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>QTY</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.lmtd_qty_ach)}</Text>
            </View>
            <View style={styles.boxColDivider} />
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>VAL</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.lmtd_value_ach)}</Text>
            </View>
          </View>
        </View>

        {/* BTD */}
        <View style={styles.metricBoxCompact}>
          <Text style={styles.boxTitle}>BTD</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>QTY</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.btd_qty)}</Text>
            </View>
            <View style={styles.boxColDivider} />
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>VAL</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.btd_value)}</Text>
            </View>
          </View>
        </View>

        {/* DDR */}
        <View style={styles.metricBoxCompact}>
          <Text style={styles.boxTitle}>DDR</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>QTY</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.ddr_qty)}</Text>
            </View>
            <View style={styles.boxColDivider} />
            <View style={styles.boxCol}>
              <Text style={styles.boxSubLabel}>VAL</Text>
              <Text style={styles.boxSubValue}>{fmtNum(item.ddr_value)}</Text>
            </View>
          </View>
        </View>

        {/* Growth */}
        <View style={[styles.metricBoxCompact, styles.growthBoxGrid]}>
          <Text style={[styles.boxTitle, styles.growthTitleGrid]}>GROWTH</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={[styles.boxSubLabel, styles.growthSubLabelGrid]}>QTY</Text>
              <Text
                style={[
                  styles.boxSubValue,
                  styles.growthSubValueGrid,
                  !isNaN(gQtyN) && gQtyN < 0 ? styles.growthNeg : null,
                ]}
              >
                {fmtPct(gQty)}
              </Text>
            </View>
            <View style={[styles.boxColDivider, styles.growthDividerGrid]} />
            <View style={styles.boxCol}>
              <Text style={[styles.boxSubLabel, styles.growthSubLabelGrid]}>VAL</Text>
              <Text
                style={[
                  styles.boxSubValue,
                  styles.growthSubValueGrid,
                  !isNaN(gValueN) && gValueN < 0 ? styles.growthNeg : null,
                ]}
              >
                {fmtPct(gValue)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

/* ── Main Screen Component ── */
const AbmWiseReportScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { token } = useAuth();
  const {
    data,
    loading,
    refreshing,
    error,
    searchQuery,
    selectedState,
    apiStatesList,
    setSearchQuery,
    setSelectedState,
    loadStatesDropdown,
    loadData,
    onRefresh,
  } = useAbmWiseStore();

  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadStatesDropdown(token);
    loadData(token);
  }, [token, loadStatesDropdown, loadData]);

  // Extract unique state names dynamically from API states and items data
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    set.add('All States');
    if (Array.isArray(apiStatesList)) {
      apiStatesList.forEach((st) => set.add(st));
    }
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const st = item.state_name || item.stateName || item.state;
        if (st && typeof st === 'string' && st.trim().length > 0) {
          set.add(st.trim());
        }
      });
    }
    return Array.from(set);
  }, [apiStatesList, data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = getAbmName(item).toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [data, searchQuery]);
 
  

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="ABM wise TvA Report"
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading ABM report…</Text>
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
            title="ABM wise TvA Report"
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
      <View style={styles.center}>
        <Text style={styles.stateIcon}>⚠️</Text>
        <Text style={[styles.stateText, { color: '#DC2626' }]}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(token)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header component */}
      <Header
        title="ABM wise TvA Report"
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
              placeholder="Search ABM Name..."
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

        {/* Card List */}
        <FlatList
          data={filteredData}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={({ item, index }) => <AbmCard item={item} index={index} />}
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

      {/* ── State Selection Modal Dropdown (Single Select) ── */}
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

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
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
                      loadData(token, false, st);
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
                      <View style={styles.checkmarkBadge}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  cardSmall: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
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
    marginBottom: 4,
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
  abmNameText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
  abmSubtext: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  /* Grid container for 2-column small boxes */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  metricBoxCompact: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  boxTitle: {
    fontSize: 9.5,
    fontFamily: fontFamily.bold,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 5,
    letterSpacing: 0.4,
  },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  boxCol: {
    flex: 1,
    alignItems: 'center',
  },
  boxColDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
  },
  boxSubLabel: {
    fontSize: 8,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    marginBottom: 1,
  },
  boxSubValue: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },

  /* Growth grid box override */
  growthBoxGrid: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1.5,
  },
  growthTitleGrid: {
    color: '#15803D',
  },
  growthSubLabelGrid: {
    color: '#166534',
  },
  growthSubValueGrid: {
    color: '#16A34A',
  },
  growthDividerGrid: {
    backgroundColor: '#BBF7D0',
  },
  growthNeg: {
    color: '#DC2626',
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
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },
  modalApplyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalApplyBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.white,
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
});

export default AbmWiseReportScreen;
