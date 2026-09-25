import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { useSpecialTvaStore } from '../../../store';
import { SpecialTvaRecordItem } from '../../../api/specialTvaApi';
import { colors, fontFamily, borderRadius } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';

// Helper for Indian number formatting
const formatNumber = (num: any, decimals = 0): string => {
  if (num === undefined || num === null || isNaN(Number(num))) return '0';
  const n = Number(num);
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Helper for formatted date
const formatDate = (val?: string): string => {
  if (!val) return '—';
  const str = String(val).split('T')[0];
  const parts = str.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [y, m, d] = parts;
    const mName = months[parseInt(m, 10) - 1] || m;
    return `${parseInt(d, 10)} ${mName} ${y}`;
  }
  return str;
};

// Color badge for achievement percentage
const getPctColorStyles = (pct: number) => {
  if (pct >= 100) {
    return {
      bg: '#DCFCE7',
      border: '#86EFAC',
      text: '#15803D',
    };
  }
  if (pct >= 80) {
    return {
      bg: '#FEF3C7',
      border: '#FDE68A',
      text: '#B45309',
    };
  }
  if (pct > 0) {
    return {
      bg: '#FFE4E6',
      border: '#FECDD3',
      text: '#BE123C',
    };
  }
  return {
    bg: '#F1F5F9',
    border: '#E2E8F0',
    text: '#64748B',
  };
};

/* ── Individual Branch Report Card ── */
interface BranchCardProps {
  item: SpecialTvaRecordItem;
  index: number;
  brandHeaders: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const BranchReportCard: React.FC<BranchCardProps> = React.memo(
  ({ item, index, brandHeaders, isExpanded, onToggleExpand }) => {
    const indexStr = String(index + 1).padStart(2, '0');
    const periodTarget = Number(item.period_target) || 0;

    // Resolve Total Achieved Qty
    const totalAch =
      item.achievement_qty?.['Total'] ??
      Object.entries(item.achievement_qty || {}).reduce((acc, [k, v]) => {
        return k !== 'Total' ? acc + (Number(v) || 0) : acc;
      }, 0);

    // Resolve Total Achieved %
    const totalPct =
      item.achievement_pct?.['Total'] !== undefined
        ? Number(item.achievement_pct['Total'])
        : periodTarget > 0
        ? Number(((totalAch / periodTarget) * 100).toFixed(2))
        : 0;

    const pctColors = getPctColorStyles(totalPct);

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {/* Number Badge */}
            <View style={styles.cardIndexBadge}>
              <Text style={styles.cardIndexText}>{indexStr}</Text>
            </View>

            {/* Title & Branch Code */}
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardPartyName} numberOfLines={2}>
                {item.party_name}
              </Text>
              {/* {!!item.branch_code && (
                <Text style={styles.cardBranchCode}>Code: {item.branch_code}</Text>
              )} */}
            </View>
          </View>
        </View>

        {/* Pills / Tags Row */}
        <View style={styles.cardTagsRow}>
          {!!item.type && (
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>{item.type}</Text>
            </View>
          )}
          {!!item.state && (
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>📍 {item.state}</Text>
            </View>
          )}
          {!!item.zone && (
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>{item.zone}</Text>
            </View>
          )}
          {!!item.mf && item.mf !== '—' && item.mf !== '-' && (
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>MF: {item.mf}</Text>
            </View>
          )}
        </View>

        {/* KPI Summary Strip */}
        <View style={styles.kpiContainer}>
          {/* Target */}
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>TARGET</Text>
            <Text style={styles.kpiValueTarget}>{formatNumber(periodTarget)}</Text>
          </View>

          <View style={styles.kpiDivider} />

          {/* Achieved */}
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>ACHIEVED</Text>
            <Text style={styles.kpiValueAch}>{formatNumber(totalAch)}</Text>
          </View>

          <View style={styles.kpiDivider} />

          {/* Achieved % */}
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>ACH %</Text>
            <View
              style={[
                styles.kpiPctBadge,
                { backgroundColor: pctColors.bg, borderColor: pctColors.border },
              ]}
            >
              <Text style={[styles.kpiPctText, { color: pctColors.text }]}>
                {totalPct.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Toggle Brand Breakdown Button */}
        {brandHeaders.length > 0 && (
          <TouchableOpacity
            style={styles.expandToggleBtn}
            onPress={onToggleExpand}
            activeOpacity={0.7}
          >
            <Text style={styles.expandToggleText}>
              {isExpanded ? 'Hide Brand Details' : 'View Brand Breakdown'}
            </Text>
            <Text style={styles.expandToggleChevron}>{isExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        )}

        {/* Expanded Brand Breakdown Table */}
        {isExpanded && (
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownHeaderRow}>
              <Text style={[styles.breakdownHeaderCell, { flex: 2 }]}>Brand</Text>
              <Text style={[styles.breakdownHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Target</Text>
              <Text style={[styles.breakdownHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Ach Qty</Text>
              <Text style={[styles.breakdownHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Ach %</Text>
            </View>

            {brandHeaders.map((bh) => {
              const isTotal = bh === 'Total';
              const bTgt = item.brand_targets?.[bh] || 0;
              const bAch = item.achievement_qty?.[bh] || 0;
              const bPct =
                item.achievement_pct?.[bh] !== undefined
                  ? Number(item.achievement_pct[bh])
                  : bTgt > 0
                  ? Number(((bAch / bTgt) * 100).toFixed(2))
                  : 0;

              const cellColors = getPctColorStyles(bPct);

              return (
                <View
                  key={`brand_${bh}`}
                  style={[
                    styles.breakdownRow,
                    isTotal && styles.breakdownTotalRow,
                  ]}
                >
                  <Text
                    style={[
                      styles.breakdownBrandName,
                      isTotal && styles.breakdownTotalText,
                    ]}
                  >
                    {bh}
                  </Text>
                  <Text
                    style={[
                      styles.breakdownTargetText,
                      isTotal && styles.breakdownTotalText,
                    ]}
                  >
                    {formatNumber(bTgt)}
                  </Text>
                  <Text
                    style={[
                      styles.breakdownAchText,
                      isTotal && styles.breakdownTotalText,
                    ]}
                  >
                    {formatNumber(bAch)}
                  </Text>
                  <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                    <View
                      style={[
                        styles.miniPctBadge,
                        {
                          backgroundColor: cellColors.bg,
                          borderColor: cellColors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.miniPctText, { color: cellColors.text }]}>
                        {bPct.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  }
);

/* ── Top Summary / Total Card ── */
interface TotalCardProps {
  filteredCount: number;
  totalTarget: number;
  totalAchQty: number;
  overallPct: number;
  brandHeaders: string[];
  brandTargets: Record<string, number>;
  brandAchievements: Record<string, number>;
  brandPercentages: Record<string, number>;
  isExpanded: boolean;
  onToggle: () => void;
}

const TotalCard: React.FC<TotalCardProps> = ({
  filteredCount,
  totalTarget,
  totalAchQty,
  overallPct,
  brandHeaders,
  brandTargets,
  brandAchievements,
  brandPercentages,
  isExpanded,
  onToggle,
}) => {
  const pctColors = getPctColorStyles(overallPct);

  return (
    <View style={styles.totalCard}>
      {/* Total Card Header */}
      <View style={styles.totalCardHeader}>
        <View style={styles.totalHeaderTitleWrap}>
          <View style={styles.totalIconWrap}>
            <Text style={styles.totalIconText}>∑</Text>
          </View>
          <View>
            <Text style={styles.totalTitle}>Total Summary</Text>
            <Text style={styles.totalSubtitle}>All Calculated Results</Text>
          </View>
        </View>

        <View style={styles.totalCountBadge}>
          <Text style={styles.totalCountText}>{filteredCount} Branches</Text>
        </View>
      </View>

      {/* Primary KPI Strip */}
      <View style={styles.totalKpiStrip}>
        {/* Total Target */}
        <View style={styles.totalKpiItem}>
          <Text style={styles.totalKpiLabel}>TOTAL TARGET</Text>
          <Text style={styles.totalKpiTarget}>{formatNumber(totalTarget)}</Text>
        </View>

        <View style={styles.totalKpiDivider} />

        {/* Total Achieved */}
        <View style={styles.totalKpiItem}>
          <Text style={styles.totalKpiLabel}>TOTAL ACHIEVED</Text>
          <Text style={styles.totalKpiAch}>{formatNumber(totalAchQty)}</Text>
        </View>

        <View style={styles.totalKpiDivider} />

        {/* Overall Achievement % */}
        <View style={styles.totalKpiItem}>
          <Text style={styles.totalKpiLabel}>ACH %</Text>
          <View
            style={[
              styles.kpiPctBadge,
              { backgroundColor: pctColors.bg, borderColor: pctColors.border },
            ]}
          >
            <Text style={[styles.kpiPctText, { color: pctColors.text }]}>
              {overallPct.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Brand Breakdown in Total Card Toggle */}
      {brandHeaders.length > 0 && (
        <TouchableOpacity
          style={styles.totalToggleBtn}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.totalToggleText}>
            {isExpanded ? 'Hide Brand Totals' : 'View Brand-Wise Totals'}
          </Text>
          <Text style={styles.totalToggleChevron}>{isExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      )}

      {/* Brand-wise Totals Grid */}
      {isExpanded && brandHeaders.length > 0 && (
        <View style={styles.totalBrandBreakdown}>
          <View style={styles.breakdownHeaderRow}>
            <Text style={[styles.breakdownHeaderCell, { flex: 2 }]}>Brand</Text>
            <Text style={[styles.breakdownHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Target</Text>
            <Text style={[styles.breakdownHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Achieved</Text>
            <Text style={[styles.breakdownHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Ach %</Text>
          </View>

          {brandHeaders.map((bh) => {
            const isTotal = bh === 'Total';
            const bTgt = brandTargets[bh] || 0;
            const bAch = brandAchievements[bh] || 0;
            const bPct = brandPercentages[bh] || 0;
            const colorsSet = getPctColorStyles(bPct);

            return (
              <View
                key={`total_brand_${bh}`}
                style={[
                  styles.breakdownRow,
                  isTotal && styles.breakdownTotalRow,
                ]}
              >
                <Text
                  style={[
                    styles.breakdownBrandName,
                    isTotal && styles.breakdownTotalText,
                  ]}
                >
                  {bh}
                </Text>
                <Text
                  style={[
                    styles.breakdownTargetText,
                    isTotal && styles.breakdownTotalText,
                  ]}
                >
                  {formatNumber(bTgt)}
                </Text>
                <Text
                  style={[
                    styles.breakdownAchText,
                    isTotal && styles.breakdownTotalText,
                  ]}
                >
                  {formatNumber(bAch)}
                </Text>
                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.miniPctBadge,
                      {
                        backgroundColor: colorsSet.bg,
                        borderColor: colorsSet.border,
                      },
                    ]}
                  >
                    <Text style={[styles.miniPctText, { color: colorsSet.text }]}>
                      {bPct.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

/* ── Main Screen Component ── */
const SpecialTvaReportDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { token } = useAuth();

  const reportId = route.params?.id;
  const initialTitle = route.params?.title || 'Special TVA Report';

  const {
    reportData,
    reportLoading,
    reportRefreshing,
    reportError,
    loadReportDetails,
    clearReportDetails,
  } = useSpecialTvaStore();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Expanded card state
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [isTotalExpanded, setIsTotalExpanded] = useState(true);

  useEffect(() => {
    if (reportId) {
      loadReportDetails(reportId, token);
    }
    return () => {
      clearReportDetails();
    };
  }, [reportId, token, loadReportDetails, clearReportDetails]);

  const master = reportData?.master;
  const title = master?.title || initialTitle;
  const brandHeaders: string[] = useMemo(
    () => (Array.isArray(reportData?.brand_headers) ? reportData!.brand_headers : []),
    [reportData?.brand_headers]
  );
  const rawRecords: SpecialTvaRecordItem[] = useMemo(
    () => (Array.isArray(reportData?.records) ? reportData!.records : []),
    [reportData?.records]
  );

  // Unique filter options
  const uniqueStates = useMemo(() => {
    const s = new Set<string>();
    rawRecords.forEach((r) => {
      if (r.state) s.add(r.state.trim());
    });
    return Array.from(s).sort();
  }, [rawRecords]);

  const uniqueZones = useMemo(() => {
    const z = new Set<string>();
    rawRecords.forEach((r) => {
      if (r.zone) z.add(r.zone.trim());
    });
    return Array.from(z).sort();
  }, [rawRecords]);

  const uniqueTypes = useMemo(() => {
    const t = new Set<string>();
    rawRecords.forEach((r) => {
      if (r.type) t.add(r.type.trim());
    });
    return Array.from(t).sort();
  }, [rawRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let list = rawRecords;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.party_name && r.party_name.toLowerCase().includes(q)) ||
          (r.branch_code && r.branch_code.toLowerCase().includes(q)) ||
          (r.state && r.state.toLowerCase().includes(q)) ||
          (r.zone && r.zone.toLowerCase().includes(q))
      );
    }

    if (selectedStates.length > 0) {
      list = list.filter((r) => r.state && selectedStates.includes(r.state));
    }

    if (selectedZones.length > 0) {
      list = list.filter((r) => r.zone && selectedZones.includes(r.zone));
    }

    if (selectedTypes.length > 0) {
      list = list.filter((r) => r.type && selectedTypes.includes(r.type));
    }

    return list;
  }, [rawRecords, searchQuery, selectedStates, selectedZones, selectedTypes]);

  // Calculated totals for Total Card
  const totalsData = useMemo(() => {
    let periodTarget = 0;
    let totalAchQty = 0;
    const brandTargets: Record<string, number> = {};
    const brandAchievements: Record<string, number> = {};
    const brandPercentages: Record<string, number> = {};

    brandHeaders.forEach((bh) => {
      brandTargets[bh] = 0;
      brandAchievements[bh] = 0;
      brandPercentages[bh] = 0;
    });

    filteredRecords.forEach((r) => {
      periodTarget += Number(r.period_target) || 0;

      brandHeaders.forEach((bh) => {
        brandTargets[bh] += Number(r.brand_targets?.[bh]) || 0;
        brandAchievements[bh] += Number(r.achievement_qty?.[bh]) || 0;
      });
    });

    // Total Achieved Qty
    totalAchQty =
      brandAchievements['Total'] !== undefined
        ? brandAchievements['Total']
        : Object.entries(brandAchievements).reduce((acc, [k, v]) => {
            return k !== 'Total' ? acc + v : acc;
          }, 0);

    // Compute percentage per brand
    brandHeaders.forEach((bh) => {
      const tgt = brandTargets[bh] || 0;
      const ach = brandAchievements[bh] || 0;
      brandPercentages[bh] = tgt > 0 ? Number(((ach / tgt) * 100).toFixed(2)) : 0;
    });

    const overallPct =
      periodTarget > 0 ? Number(((totalAchQty / periodTarget) * 100).toFixed(2)) : 0;

    return {
      periodTarget,
      totalAchQty,
      overallPct,
      brandTargets,
      brandAchievements,
      brandPercentages,
    };
  }, [filteredRecords, brandHeaders]);

  const activeFiltersCount =
    selectedStates.length + selectedZones.length + selectedTypes.length;

  const handleClearFilters = () => {
    setSelectedStates([]);
    setSelectedZones([]);
    setSelectedTypes([]);
  };

  const toggleCardExpand = (key: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleExpandAll = () => {
    const areAllExpanded =
      filteredRecords.length > 0 &&
      filteredRecords.every(
        (r, idx) => expandedCardIds[String(r.branch_code || idx)]
      );

    if (areAllExpanded) {
      setExpandedCardIds({});
    } else {
      const next: Record<string, boolean> = {};
      filteredRecords.forEach((r, idx) => {
        next[String(r.branch_code || idx)] = true;
      });
      setExpandedCardIds(next);
    }
  };

  const areAllExpanded =
    filteredRecords.length > 0 &&
    filteredRecords.every((r, idx) => expandedCardIds[String(r.branch_code || idx)]);

  if (reportLoading && !reportRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title={initialTitle}
          showBack={true}
          onBackPress={() => navigation.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Calculating Special TVA report data…</Text>
          <Text style={styles.loadingSubtext}>
            Splitting targets and computing achievement percentages
          </Text>
        </View>
      </View>
    );
  }

  if (reportError) {
    if (isAccessDeniedError(reportError)) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
          <Header
            title={initialTitle}
            showBack={true}
            onBackPress={() => navigation.goBack()}
            style={styles.headerStyle}
            titleStyle={styles.headerTitleStyle}
            iconColor={colors.white}
          />
          <AccessDenied
            message={reportError}
            onRetry={() => loadReportDetails(reportId, token)}
            onGoBack={() => navigation.goBack()}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title={initialTitle}
          showBack={true}
          onBackPress={() => navigation.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{reportError}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadReportDetails(reportId, token)}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Screen Header */}
      <Header
        title={title}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Top Search & Filter Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search party or branch..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
          onPress={() => setIsFilterModalOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.filterBtnIcon}>⚙️</Text>
          <Text style={[styles.filterBtnText, activeFiltersCount > 0 && styles.filterBtnTextActive]}>
            Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => loadReportDetails(reportId, token, true)}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshBtnIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Date & Filter Badges Strip */}
      {master && (
        <View style={styles.bannerRow}>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillLabel}>Period:</Text>
            <Text style={styles.bannerPillVal}>
              {formatDate(master.start_date)} - {formatDate(master.end_date)}
            </Text>
          </View>
          {activeFiltersCount > 0 && (
            <TouchableOpacity
              style={styles.clearFiltersPill}
              onPress={handleClearFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.clearFiltersPillText}>Clear Filters ✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Main List Container */}
      <View style={styles.mainContainer}>
        <FlatList
          data={filteredRecords}
          keyExtractor={(item, idx) => String(item.branch_code || item.s_no || idx)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={
            <View>
              {/* ── TOTAL CARD TOP ── */}
              <TotalCard
                filteredCount={filteredRecords.length}
                totalTarget={totalsData.periodTarget}
                totalAchQty={totalsData.totalAchQty}
                overallPct={totalsData.overallPct}
                brandHeaders={brandHeaders}
                brandTargets={totalsData.brandTargets}
                brandAchievements={totalsData.brandAchievements}
                brandPercentages={totalsData.brandPercentages}
                isExpanded={isTotalExpanded}
                onToggle={() => setIsTotalExpanded((prev) => !prev)}
              />

              {/* Subheader: Branches Count + Expand All button */}
              <View style={styles.listSubheader}>
                <Text style={styles.listSubheaderTitle}>
                  Branch Reports ({filteredRecords.length})
                </Text>
                {filteredRecords.length > 0 && brandHeaders.length > 0 && (
                  <TouchableOpacity
                    style={styles.expandAllBtn}
                    onPress={toggleExpandAll}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandAllBtnText}>
                      {areAllExpanded ? 'Collapse All' : 'Expand All'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const cardKey = String(item.branch_code || index);
            return (
              <BranchReportCard
                item={item}
                index={index}
                brandHeaders={brandHeaders}
                isExpanded={Boolean(expandedCardIds[cardKey])}
                onToggleExpand={() => toggleCardExpand(cardKey)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No matching branches found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search query or clear filters to see more results.
              </Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handleClearFilters}
                >
                  <Text style={styles.retryBtnText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={reportRefreshing}
              onRefresh={() => loadReportDetails(reportId, token, true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </View>

      {/* ── FILTER MODAL ── */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Records</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Filter Section: States */}
              {uniqueStates.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>States ({selectedStates.length})</Text>
                  <View style={styles.chipsContainer}>
                    {uniqueStates.map((st) => {
                      const isSelected = selectedStates.includes(st);
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() =>
                            setSelectedStates((prev) =>
                              prev.includes(st)
                                ? prev.filter((x) => x !== st)
                                : [...prev, st]
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {st}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Filter Section: Zones */}
              {uniqueZones.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Zones ({selectedZones.length})</Text>
                  <View style={styles.chipsContainer}>
                    {uniqueZones.map((zn) => {
                      const isSelected = selectedZones.includes(zn);
                      return (
                        <TouchableOpacity
                          key={zn}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() =>
                            setSelectedZones((prev) =>
                              prev.includes(zn)
                                ? prev.filter((x) => x !== zn)
                                : [...prev, zn]
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {zn}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Filter Section: Types */}
              {uniqueTypes.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Store Types ({selectedTypes.length})</Text>
                  <View style={styles.chipsContainer}>
                    {uniqueTypes.map((tp) => {
                      const isSelected = selectedTypes.includes(tp);
                      return (
                        <TouchableOpacity
                          key={tp}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() =>
                            setSelectedTypes((prev) =>
                              prev.includes(tp)
                                ? prev.filter((x) => x !== tp)
                                : [...prev, tp]
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {tp}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalClearBtn}
                onPress={handleClearFilters}
              >
                <Text style={styles.modalClearBtnText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setIsFilterModalOpen(false)}
              >
                <Text style={styles.modalApplyBtnText}>Apply Filters</Text>
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
  loadingContainer: {
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    padding: 0,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 4,
  },
  filterBtnActive: {
    backgroundColor: colors.white,
  },
  filterBtnIcon: {
    fontSize: 14,
  },
  filterBtnText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.white,
  },
  filterBtnTextActive: {
    color: colors.primary,
  },
  refreshBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnIcon: {
    fontSize: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: colors.primary,
    flexWrap: 'wrap',
    gap: 8,
  },
  bannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  bannerPillLabel: {
    fontSize: 11,
    color: '#E9D5FF',
    fontFamily: fontFamily.medium,
  },
  bannerPillVal: {
    fontSize: 11,
    color: colors.white,
    fontFamily: fontFamily.bold,
  },
  clearFiltersPill: {
    backgroundColor: '#F43F5E',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearFiltersPillText: {
    fontSize: 11,
    color: colors.white,
    fontFamily: fontFamily.bold,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: borderRadius.cardRadius || 24,
    borderTopRightRadius: borderRadius.cardRadius || 24,
    overflow: 'hidden',
  },
  listContent: {
    padding: 14,
    paddingBottom: 36,
  },

  /* ── Total Card Top Styles ── */
  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  totalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalIconText: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  totalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  totalSubtitle: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  totalCountBadge: {
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  totalCountText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  totalKpiStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  totalKpiItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalKpiDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#DDD6FE',
  },
  totalKpiLabel: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  totalKpiTarget: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#B45309',
  },
  totalKpiAch: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#2563EB',
  },
  totalToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  totalToggleText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  totalToggleChevron: {
    fontSize: 10,
    color: colors.primary,
  },
  totalBrandBreakdown: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },

  /* ── Subheader ── */
  listSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  listSubheaderTitle: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#334155',
  },
  expandAllBtn: {
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  expandAllBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },

  /* ── Individual Card Styles ── */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  cardIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIndexText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardPartyName: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    lineHeight: 19,
  },
  cardBranchCode: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagPillText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#475569',
  },

  /* ── KPI Container (Strip) inside Card ── */
  kpiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  kpiValueTarget: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#B45309',
  },
  kpiValueAch: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#2563EB',
  },
  kpiPctBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  kpiPctText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
  },

  /* ── Toggle Button inside Card ── */
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 6,
    gap: 6,
  },
  expandToggleText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  expandToggleChevron: {
    fontSize: 10,
    color: colors.primary,
  },

  /* ── Brand Breakdown Table inside Card ── */
  breakdownContainer: {
    marginTop: 8,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 4,
  },
  breakdownHeaderCell: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  breakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    marginTop: 4,
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  breakdownBrandName: {
    flex: 2,
    fontSize: 11.5,
    fontFamily: fontFamily.semiBold,
    color: '#1E293B',
  },
  breakdownTargetText: {
    flex: 1.5,
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    color: '#B45309',
    textAlign: 'right',
  },
  breakdownAchText: {
    flex: 1.5,
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    color: '#2563EB',
    textAlign: 'right',
  },
  breakdownTotalText: {
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  miniPctBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1,
  },
  miniPctText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },

  /* ── Loading / Error / Empty States ── */
  center: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderTopLeftRadius: borderRadius.cardRadius || 24,
    borderTopRightRadius: borderRadius.cardRadius || 24,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 18,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  retryBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginHorizontal: 4,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },

  /* ── Modal Filter Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748B',
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#FAF5FF',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#475569',
  },
  chipTextActive: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalClearBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalClearBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  modalApplyBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
});

export default SpecialTvaReportDetailScreen;
