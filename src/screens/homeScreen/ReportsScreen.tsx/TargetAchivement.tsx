import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { fetchTvaData, TvaItem } from '../../../api/targetVsAchievementApi';
import { colors, fontFamily, fontSize, borderRadius } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';

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
  return `${String(n)}%`;
};

const getBranchName = (item: TvaItem): string =>
  item.branch_name || item.branchName || item.name || item.branch || '—';

const getAbmName = (item: TvaItem): string =>
  item.abm_name || '—';

/* ── Row helper ── */
interface RowProps { label: string; value: string; sub?: string }
const InfoRow: React.FC<RowProps> = ({ label, value, sub }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValueWrap}>
      <Text style={styles.infoValue}>{value}</Text>
      {sub ? <Text style={styles.infoSub}>{sub}</Text> : null}
    </View>
  </View>
);

/* ── Card component ── */
const TvaCard: React.FC<{ item: TvaItem; index: number }> = ({ item, index }) => {
  const gQty   = item.growth_qty_percentage   ?? item.growth_qty   ?? null;
  const gValue = item.growth_value_percentage ?? item.growth_value ?? null;
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
          <Text style={styles.branchName} numberOfLines={1}>{getBranchName(item)}</Text>
          {getAbmName(item) !== '—' && (
            <Text style={styles.abmName} numberOfLines={1}>ABM: {getAbmName(item)}</Text>
          )}
        </View>
      </View>

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

/* ── Main Screen ── */
const TargetAchivement: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { token } = useAuth();
  const [data, setData]             = useState<TvaItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await fetchTvaData(token);
      setData(result);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter(item => {
      const branch = getBranchName(item).toLowerCase();
      const abm = getAbmName(item).toLowerCase();
      return branch.includes(q) || abm.includes(q);
    });
  }, [data, searchQuery]);

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.stateText}>Loading data…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateIcon}>⚠️</Text>
        <Text style={[styles.stateText, { color: '#DC2626' }]}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateIcon}>📊</Text>
        <Text style={styles.stateText}>No data found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header component (Title only) */}
      <Header
        title="Target vs Achievement"
        showBack={true}
        onBackPress={() => navigation?.goBack()}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Main Content Area */}
      <View style={styles.mainContainer}>
        {/* Search Bar */}
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
              placeholder="Search Branch or ABM Name..."
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

        {/* Card list */}
        <FlatList
          data={filteredData}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={({ item, index }) => <TvaCard item={item} index={index} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.stateIcon}>🔍</Text>
              <Text style={styles.stateText}>No matching branch or ABM found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </View>
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

  /* Search Row */
  searchRow: {
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  searchContainer: {
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
  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* List */
  listContent: {
    padding: 14,
    paddingBottom: 32,
    backgroundColor: '#F4F6FB',
  },

  /* Card – aligned with brandwise sales card */
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
  branchName: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
  abmName: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEF0F5',
  },

  /* Section Label inside card */
  sectionLabel: {
    fontSize: 9.5,
    fontFamily: fontFamily.bold,
    color: '#94A3B8',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
    marginHorizontal: 14,
  },

  /* Grid container for 2-column small boxes */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
    paddingTop: 12,
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

  /* Info row */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  infoValueWrap: { alignItems: 'flex-end' },
  infoValue: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  infoSub: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
  },

  /* States */
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
});

export default TargetAchivement;
