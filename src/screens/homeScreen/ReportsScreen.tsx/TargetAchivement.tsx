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
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { fetchTvaData, fetchStatesApi, TvaItem, TvaBrandItem } from '../../../api/targetVsAchievementApi';
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
  return n.toLocaleString('en-IN');
};

const fmtPct = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return `${n.toFixed(2)}%`;
};

const fmtGrowthPct = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(2)}%`;
};

const getBranchName = (item: TvaItem): string =>
  item.branch_name || item.branchName || item.name || item.branch || '—';

const getAbmName = (item: TvaItem): string =>
  item.abm_name || '—';

const getZoneName = (item: TvaItem): string =>
  item.zone || item.zone_name || item.zoneName || item.zone_title || '';

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
const TvaCard = React.memo<{
  item: TvaItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}>(({ item, index, isExpanded, onToggleExpand }) => {
  const gQty   = item.growth_qty_percentage   ?? item.growth_qty   ?? null;
  const gValue = item.growth_value_percentage ?? item.growth_value ?? null;
  const gQtyN   = Number(gQty);
  const gValueN = Number(gValue);
  const zoneName = getZoneName(item);

  const isQtyNeg = !isNaN(gQtyN) && gQtyN < 0;
  const isValNeg = !isNaN(gValueN) && gValueN < 0;
  const isGrowthNeg = isValNeg || isQtyNeg;

  const brands = useMemo(() => (Array.isArray(item.brands) ? item.brands : []), [item.brands]);
  const hasBrands = brands.length > 0;

  return (
    <View style={styles.cardSmall}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.branchName} numberOfLines={2} ellipsizeMode="tail">{getBranchName(item)}</Text>
          {getAbmName(item) !== '—' && (
            <Text style={styles.abmName} numberOfLines={1} ellipsizeMode="tail">ABM: {getAbmName(item)}</Text>
          )}
          {!!zoneName && (
            <Text style={styles.zoneName} numberOfLines={1} ellipsizeMode="tail">Zone: {zoneName}</Text>
          )}
        </View>
        {hasBrands && (
          <TouchableOpacity
            style={styles.headerBrandBadge}
            onPress={onToggleExpand}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.headerBrandBadgeInner}>
              <Text style={styles.headerBrandBadgeCount}>{brands.length}</Text>
              <Text style={styles.headerBrandChevron}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>
        )}
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
         {/* MTD Arch per */}
        <View style={[styles.metricBoxCompact, styles.mtdPctBoxGrid]}>
          <Text style={[styles.boxTitle, styles.mtdPctTitleGrid]}>MTD % ACH</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={[styles.boxSubLabel, styles.mtdPctSubLabelGrid]}>QTY</Text>
              <Text style={[styles.boxSubValue, styles.mtdPctValue]}>{fmtNum(item.mtd_qty_percentage_ach)}</Text>
            </View>
            <View style={[styles.boxColDivider, styles.mtdPctDividerGrid]} />
            <View style={styles.boxCol}>
              <Text style={[styles.boxSubLabel, styles.mtdPctSubLabelGrid]}>VAL</Text>
              <Text style={[styles.boxSubValue, styles.mtdPctValue]}>{fmtNum(item.mtd_value_percentage_ach)}</Text>
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
        <View style={[styles.metricBoxCompact, styles.metricBoxFullWidth, isGrowthNeg ? styles.growthBoxGridNeg : styles.growthBoxGrid]}>
          <Text style={[styles.boxTitle, isGrowthNeg ? styles.growthTitleGridNeg : styles.growthTitleGrid]}>GROWTH</Text>
          <View style={styles.boxRow}>
            <View style={styles.boxCol}>
              <Text style={[styles.boxSubLabel, isGrowthNeg ? styles.growthSubLabelGridNeg : styles.growthSubLabelGrid]}>QTY</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.boxSubValue,
                  styles.growthSubValueGrid,
                  isQtyNeg ? styles.growthNeg : null,
                ]}
              >
                {fmtGrowthPct(gQty)}
              </Text>
            </View>
            <View style={[styles.boxColDivider, isGrowthNeg ? styles.growthDividerGridNeg : styles.growthDividerGrid]} />
            <View style={styles.boxCol}>
              <Text style={[styles.boxSubLabel, isGrowthNeg ? styles.growthSubLabelGridNeg : styles.growthSubLabelGrid]}>VAL</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.boxSubValue,
                  styles.growthSubValueGrid,
                  isValNeg ? styles.growthNeg : null,
                ]}
              >
                {fmtGrowthPct(gValue)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Brands Toggle Footer Bar */}
      {hasBrands && (
        <TouchableOpacity
          style={[styles.brandsToggleBar, isExpanded && styles.brandsToggleBarExpanded]}
          onPress={onToggleExpand}
          activeOpacity={0.7}
        >
          <View style={styles.brandsToggleLeft}>
            <View style={styles.brandCountPill}>
              <Text style={styles.brandCountPillText}>{brands.length}</Text>
            </View>
            <Text style={styles.brandsToggleTitle}>
              {brands.length === 1 ? 'Brand' : 'Brands'}
            </Text>
          </View>
          <View style={styles.brandsToggleRight}>
            
            <Text style={styles.brandsToggleChevron}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Expanded Brands List (Horizontal Scroll) */}
      {isExpanded && hasBrands && (
        <View style={styles.brandsContainer}>
          <ScrollView
            horizontal
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsScrollContent}
          >
            {brands.map((brand: TvaBrandItem, bIdx: number) => {
            const bGQty   = brand.growth_qty_percentage   ?? brand.growth_qty   ?? null;
            const bGValue = brand.growth_value_percentage ?? brand.growth_value ?? null;
            const bGQtyN   = Number(bGQty);
            const bGValueN = Number(bGValue);
            const isBQtyNeg = !isNaN(bGQtyN) && bGQtyN < 0;
            const isBValNeg = !isNaN(bGValueN) && bGValueN < 0;
            const isBGrowthNeg = isBValNeg || isBQtyNeg;

            return (
              <View key={brand.brand_name || brand.name || `brand-${bIdx}`} style={styles.brandCard}>
                {/* Brand Header */}
                <View style={styles.brandCardHeader}>
                  <View style={styles.brandTitleLeft}>
                    <Text style={[styles.brandTitleText,{color:colors.primary,fontSize:14}]}>{bIdx+1}.</Text>
                    <Text style={styles.brandTitleText}>
                      {brand.brand_name || brand.name || `Brand #${bIdx + 1}`}
                    </Text>
                  </View>
                  {brand.share_percentage !== undefined &&
                    brand.share_percentage !== null &&
                    Number(brand.share_percentage) > 0 && (
                      <View style={styles.shareBadge}>
                        <Text style={styles.shareBadgeText}>
                          {Number(brand.share_percentage).toFixed(1)}% Share
                        </Text>
                      </View>
                    )}
                </View>

                {/* Brand Metrics Grid */}
                <View style={styles.brandGridContainer}>
                  {/* TGT */}
                  <View style={styles.brandMetricBox}>
                    <Text style={styles.boxTitle}>TGT</Text>
                    <View style={styles.boxRow}>
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>QTY</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.qty_tgt)}</Text>
                      </View>
                      <View style={styles.boxColDivider} />
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>VAL</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.value_tgt)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* FTD ACH */}
                  <View style={styles.brandMetricBox}>
                    <Text style={styles.boxTitle}>FTD ACH</Text>
                    <View style={styles.boxRow}>
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>QTY</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.ftd_qty_ach)}</Text>
                      </View>
                      <View style={styles.boxColDivider} />
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>VAL</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.ftd_value_ach)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* LMFTD ACH */}
                  <View style={styles.brandMetricBox}>
                    <Text style={styles.boxTitle}>LMFTD ACH</Text>
                    <View style={styles.boxRow}>
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>QTY</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.lmftd_qty_ach)}</Text>
                      </View>
                      <View style={styles.boxColDivider} />
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>VAL</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.lmftd_value_ach)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* MTD ACH */}
                  <View style={styles.brandMetricBox}>
                    <Text style={styles.boxTitle}>MTD ACH</Text>
                    <View style={styles.boxRow}>
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>QTY</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.mtd_qty_ach)}</Text>
                      </View>
                      <View style={styles.boxColDivider} />
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>VAL</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.mtd_value_ach)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* MTD % ACH */}
                  <View style={[styles.brandMetricBox, styles.mtdPctBoxGrid]}>
                    <Text style={[styles.boxTitle, styles.mtdPctTitleGrid]}>MTD % ACH</Text>
                    <View style={styles.boxRow}>
                      <View style={styles.boxCol}>
                        <Text style={[styles.boxSubLabel, styles.mtdPctSubLabelGrid]}>QTY</Text>
                        <Text style={[styles.boxSubValue, styles.mtdPctValue]}>{fmtNum(brand.mtd_qty_percentage_ach)}</Text>
                      </View>
                      <View style={[styles.boxColDivider, styles.mtdPctDividerGrid]} />
                      <View style={styles.boxCol}>
                        <Text style={[styles.boxSubLabel, styles.mtdPctSubLabelGrid]}>VAL</Text>
                        <Text style={[styles.boxSubValue, styles.mtdPctValue]}>{fmtNum(brand.mtd_value_percentage_ach)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* LMTD ACH */}
                  <View style={styles.brandMetricBox}>
                    <Text style={styles.boxTitle}>LMTD ACH</Text>
                    <View style={styles.boxRow}>
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>QTY</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.lmtd_qty_ach)}</Text>
                      </View>
                      <View style={styles.boxColDivider} />
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>VAL</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.lmtd_value_ach)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* BTD */}
                  <View style={styles.brandMetricBox}>
                    <Text style={styles.boxTitle}>BTD</Text>
                    <View style={styles.boxRow}>
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>QTY</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.btd_qty)}</Text>
                      </View>
                      <View style={styles.boxColDivider} />
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>VAL</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.btd_value)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* DDR */}
                  <View style={styles.brandMetricBox}>
                    <Text style={styles.boxTitle}>DDR</Text>
                    <View style={styles.boxRow}>
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>QTY</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.ddr_qty)}</Text>
                      </View>
                      <View style={styles.boxColDivider} />
                      <View style={styles.boxCol}>
                        <Text style={styles.boxSubLabel}>VAL</Text>
                        <Text style={styles.boxSubValue}>{fmtNum(brand.ddr_value)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* GROWTH */}
                  <View style={[styles.brandMetricBox, styles.metricBoxFullWidth, isBGrowthNeg ? styles.growthBoxGridNeg : styles.growthBoxGrid]}>
                    <Text style={[styles.boxTitle, isBGrowthNeg ? styles.growthTitleGridNeg : styles.growthTitleGrid]}>GROWTH</Text>
                    <View style={styles.boxRow}>
                      <View style={styles.boxCol}>
                        <Text style={[styles.boxSubLabel, isBGrowthNeg ? styles.growthSubLabelGridNeg : styles.growthSubLabelGrid]}>QTY</Text>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[
                            styles.boxSubValue,
                            styles.growthSubValueGrid,
                            isBQtyNeg ? styles.growthNeg : null,
                          ]}
                        >
                          {fmtGrowthPct(bGQty)}
                        </Text>
                      </View>
                      <View style={[styles.boxColDivider, isBGrowthNeg ? styles.growthDividerGridNeg : styles.growthDividerGrid]} />
                      <View style={styles.boxCol}>
                        <Text style={[styles.boxSubLabel, isBGrowthNeg ? styles.growthSubLabelGridNeg : styles.growthSubLabelGrid]}>VAL</Text>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[
                            styles.boxSubValue,
                            styles.growthSubValueGrid,
                            isBValNeg ? styles.growthNeg : null,
                          ]}
                        >
                          {fmtGrowthPct(bGValue)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

/* ── Main Screen ── */
const TargetAchivement: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { token } = useAuth();
  const [data, setData]             = useState<TvaItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Unified State & Zone multi-select filter
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedZones, setSelectedZones]   = useState<string[]>([]);
  const [tempSelectedStates, setTempSelectedStates] = useState<string[]>([]);
  const [tempSelectedZones, setTempSelectedZones]   = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen]   = useState(false);
  const [filterModalTab, setFilterModalTab]         = useState<'STATE' | 'ZONE'>('STATE');
  const [stateSearchText, setStateSearchText]       = useState('');
  const [zoneSearchText, setZoneSearchText]         = useState('');
  const [apiStates, setApiStates] = useState<string[]>([]);

  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchSearchText, setBranchSearchText] = useState('');

  const [selectedABMs, setSelectedABMs] = useState<string[]>([]);
  const [isAbmModalOpen, setIsAbmModalOpen] = useState(false);
  const [abmSearchText, setAbmSearchText] = useState('');

  // Expand/collapse brands state
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());

  const searchInputRef = useRef<TextInput>(null);

  // Fetch all states from http://localhost:5005/api/states/all
  useEffect(() => {
    fetchStatesApi(token).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setApiStates(res);
      }
    });
  }, [token]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await fetchTvaData(token);
      setData(result);
    } catch (err: any) {
      console.log("errvvv",err);
      
      setError(err?.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Extract unique state names dynamically from /states/all API + data
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    if (apiStates.length > 0) {
      apiStates.forEach((s) => set.add(s));
    }
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const st = item.state_name || item.stateName || item.STATE_NAME || item.state || item.State;
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

  // Extract unique zone names dynamically from API data (key = "zone")
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const name = getZoneName(item);
        if (name && name !== '—' && name.trim().length > 0) {
          set.add(name.trim());
        }
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Filter zones inside modal by search query
  const filteredModalZones = useMemo(() => {
    if (!zoneSearchText.trim()) return availableZones;
    const q = zoneSearchText.toLowerCase().trim();
    return availableZones.filter((z) => z.toLowerCase().includes(q));
  }, [availableZones, zoneSearchText]);

  // Extract unique branch names dynamically from API data
  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const name = getBranchName(item);
        if (name && name !== '—' && name.trim().length > 0) {
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

  // Filter main list by state multi-select ("state_name"), zone multi-select ("zone"), branch multi-select, ABM multi-select & search query
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. State Multi-select Filter using "state_name"
      if (selectedStates.length > 0) {
        const itemState = String(
          item.state_name || item.stateName || item.STATE_NAME || item.state || item.State || ''
        ).trim().toLowerCase();

        const matchesState = selectedStates.some(
          (sel) => sel.trim().toLowerCase() === itemState
        );
        if (!matchesState) {
          return false;
        }
      }

      // 2. Zone Multi-select Filter using key "zone"
      if (selectedZones.length > 0) {
        const itemZone = getZoneName(item).trim().toLowerCase();
        const matchesZone = selectedZones.some(
          (sel) => sel.trim().toLowerCase() === itemZone
        );
        if (!matchesZone) {
          return false;
        }
      }

      // 3. Branch Multi-select Filter
      if (selectedBranches.length > 0) {
        const itemBranch = getBranchName(item).trim();
        if (!selectedBranches.includes(itemBranch)) {
          return false;
        }
      }

      // 4. ABM Multi-select Filter
      if (selectedABMs.length > 0) {
        const itemAbm = getAbmName(item).trim();
        if (!selectedABMs.includes(itemAbm)) {
          return false;
        }
      }

      // 5. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const branch = getBranchName(item).toLowerCase();
        const abm = getAbmName(item).toLowerCase();
        const zone = getZoneName(item).toLowerCase();
        const matchesBrand = Array.isArray(item.brands) && item.brands.some((b: any) =>
          String(b.brand_name || b.name || '').toLowerCase().includes(q)
        );
        if (!branch.includes(q) && !abm.includes(q) && !zone.includes(q) && !matchesBrand) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, selectedStates, selectedZones, selectedBranches, selectedABMs]);

  const totalBranchesWithBrands = useMemo(() => {
    return filteredData.filter((i) => Array.isArray(i.brands) && i.brands.length > 0).length;
  }, [filteredData]);

  const isAllExpanded = useMemo(() => {
    if (totalBranchesWithBrands === 0) return false;
    return filteredData.every((item, idx) => {
      if (!Array.isArray(item.brands) || item.brands.length === 0) return true;
      return expandedIds.has(item.id ?? idx);
    });
  }, [filteredData, expandedIds, totalBranchesWithBrands]);

  const handleToggleExpandAll = useCallback(() => {
    if (isAllExpanded) {
      setExpandedIds(new Set());
    } else {
      const next = new Set<string | number>();
      filteredData.forEach((item, idx) => {
        if (Array.isArray(item.brands) && item.brands.length > 0) {
          next.add(item.id ?? idx);
        }
      });
      setExpandedIds(next);
    }
  }, [isAllExpanded, filteredData]);

  const handleToggleCardExpand = useCallback((id: string | number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isAllBranchesSelected = selectedBranches.length === 0;
  const isAllABMsSelected = selectedABMs.length === 0;

  const handleOpenFilterModal = (initialTab: 'STATE' | 'ZONE' = 'STATE') => {
    setTempSelectedStates([...selectedStates]);
    setTempSelectedZones([...selectedZones]);
    setFilterModalTab(initialTab);
    setStateSearchText('');
    setZoneSearchText('');
    setIsFilterModalOpen(true);
  };

  const handleSelectAllStates = () => {
    setTempSelectedStates([]);
  };

  const handleToggleState = (st: string) => {
    setTempSelectedStates((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const handleSelectAllZones = () => {
    setTempSelectedZones([]);
  };

  const handleToggleZone = (zn: string) => {
    setTempSelectedZones((prev) =>
      prev.includes(zn) ? prev.filter((z) => z !== zn) : [...prev, zn]
    );
  };

  const handleApplyFilterModal = () => {
    setSelectedStates(tempSelectedStates);
    setSelectedZones(tempSelectedZones);
    setIsFilterModalOpen(false);
  };

  const handleResetFilterModal = () => {
    setTempSelectedStates([]);
    setTempSelectedZones([]);
    setSelectedStates([]);
    setSelectedZones([]);
    setIsFilterModalOpen(false);
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
          title="Target vs Achievement"
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading data…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Target vs Achievement"
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        {isAccessDeniedError(error) ? (
          <AccessDenied
            message={error}
            onRetry={() => load()}
            onGoBack={() => navigation?.goBack()}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.stateIcon}>⚠️</Text>
            <Text style={[styles.stateText, { color: '#DC2626' }]}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Target vs Achievement"
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <Text style={styles.stateIcon}>📊</Text>
          <Text style={styles.stateText}>No data found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
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
              placeholder="Search Branch, ABM or Brand..."
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

        {/* Dropdowns Row (Expand All, State, Zone, Branches & ABMs) */}
        <View style={styles.dropdownsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dropdownsScrollContent}
          >
            {/* Expand All / Collapse All Button */}
            {totalBranchesWithBrands > 0 && (
              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  styles.expandAllBtn,
                  isAllExpanded && styles.expandAllBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={handleToggleExpandAll}
              >
                <Text
                  style={[
                    styles.expandAllIcon,
                    isAllExpanded && styles.expandAllIconActive,
                  ]}
                >
                  {isAllExpanded ? '▲' : '▼'}
                </Text>
                <Text
                  style={[
                    styles.dropdownBtnText,
                    styles.expandAllText,
                    isAllExpanded && styles.dropdownBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {isAllExpanded ? 'Collapse All' : `Expand All (${totalBranchesWithBrands})`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Unified State & Zone Filter Dropdown Button */}
            <TouchableOpacity
              style={[
                styles.dropdownBtn,
                (selectedStates.length > 0 || selectedZones.length > 0) &&
                  styles.dropdownBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => handleOpenFilterModal('STATE')}
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
                  styles.dropdownBtnText,
                  (selectedStates.length > 0 || selectedZones.length > 0) &&
                    styles.dropdownBtnTextActive,
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
                  styles.dropdownBtnIcon,
                  (selectedStates.length > 0 || selectedZones.length > 0) &&
                    styles.dropdownBtnIconActive,
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
          </ScrollView>
        </View>

        {/* Card list */}
        <FlatList
          data={filteredData}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={({ item, index }) => {
            const cardKey = item.id ?? index;
            const isBrandQueryMatch =
              searchQuery.trim().length >= 2 &&
              Array.isArray(item.brands) &&
              item.brands.some((b: any) =>
                String(b.brand_name || b.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
              );
            return (
              <TvaCard
                item={item}
                index={index}
                isExpanded={expandedIds.has(cardKey) || isBrandQueryMatch}
                onToggleExpand={() => handleToggleCardExpand(cardKey)}
              />
            );
          }}
          extraData={[expandedIds, searchQuery]}
          contentContainerStyle={[
            styles.listContent,
            filteredData.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          updateCellsBatchingPeriod={50}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.stateIcon}>🔍</Text>
              <Text style={styles.stateText}>No matching branch, ABM or brand found</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => load(true)}>
                <Text style={styles.retryText}>Refresh</Text>
              </TouchableOpacity>
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

      {/* ── Unified State & Zone Selection Modal Dropdown (Multi-select) ── */}
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

            {/* Segmented Switcher: States / Zones Tabs */}
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
                  filterModalTab === 'STATE' ? stateSearchText : zoneSearchText
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalClearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List of Options (Multi-select Checkboxes) */}
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
            >
              {filterModalTab === 'STATE' ? (
                <>
                  {/* "All States" Option */}
                  <TouchableOpacity
                    style={[
                      styles.branchOptionItem,
                      tempSelectedStates.length === 0 && styles.branchOptionItemActive,
                    ]}
                    onPress={handleSelectAllStates}
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
                          styles.branchOptionText,
                          tempSelectedStates.length === 0 && styles.branchOptionTextActive,
                          { fontFamily: fontFamily.bold },
                        ]}
                      >
                        All States
                      </Text>
                    </View>
                    {tempSelectedStates.length === 0 && (
                      <View style={styles.allBadge}>
                        <Text style={styles.allBadgeText}>ALL</Text>
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
                </>
              ) : (
                <>
                  {/* "All Zones" Option */}
                  <TouchableOpacity
                    style={[
                      styles.branchOptionItem,
                      tempSelectedZones.length === 0 && styles.branchOptionItemActive,
                    ]}
                    onPress={handleSelectAllZones}
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
                          styles.branchOptionText,
                          tempSelectedZones.length === 0 && styles.branchOptionTextActive,
                          { fontFamily: fontFamily.bold },
                        ]}
                      >
                        All Zones
                      </Text>
                    </View>
                    {tempSelectedZones.length === 0 && (
                      <View style={styles.allBadge}>
                        <Text style={styles.allBadgeText}>ALL</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Individual Zone Items */}
                  {filteredModalZones.map((zone) => {
                    const isSelected = tempSelectedZones.includes(zone);

                    return (
                      <TouchableOpacity
                        key={zone}
                        style={[
                          styles.branchOptionItem,
                          isSelected && styles.branchOptionItemActive,
                        ]}
                        onPress={() => handleToggleZone(zone)}
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
                            {zone}
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
              {(tempSelectedStates.length > 0 ||
                tempSelectedZones.length > 0 ||
                selectedStates.length > 0 ||
                selectedZones.length > 0) && (
                <TouchableOpacity
                  style={styles.modalResetBtn}
                  onPress={handleResetFilterModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalResetText}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleApplyFilterModal}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyText}>
                  {tempSelectedStates.length === 0 && tempSelectedZones.length === 0
                    ? 'Show All'
                    : `Apply (${tempSelectedStates.length + tempSelectedZones.length})`}
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
    marginBottom: 8,
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

  /* Dropdowns Row (State & Zone Filter, Branches & ABMs) */
  dropdownsRow: {
    marginBottom: 10,
  },
  dropdownsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  dropdownBtn: {
    minWidth: 105,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingHorizontal: 10,
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
  filterBtnLeftIcon: {
    width: 13,
    height: 13,
    tintColor: colors.primary,
    marginRight: 5,
  },
  filterBtnLeftIconActive: {
    tintColor: colors.white,
  },
  expandAllBtn: {
    minWidth: 110,
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
  },
  expandAllBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  expandAllIcon: {
    fontSize: 9,
    color: colors.primary,
    marginRight: 4,
    fontFamily: fontFamily.bold,
  },
  expandAllIconActive: {
    color: colors.white,
  },
  expandAllText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },

  /* Modal Tabs Segmented Switcher */
  modalTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  modalTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  modalTabBtnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modalTabText: {
    fontSize: 12.5,
    fontFamily: fontFamily.medium,
    color: '#64748B',
  },
  modalTabTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  modalTabBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  modalTabBadgeActive: {
    backgroundColor: '#F3E8FF',
  },
  modalTabBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  modalTabBadgeTextActive: {
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  listContentEmpty: {
    flexGrow: 1,
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
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    marginHorizontal: -14,
    marginTop: -14,
    marginBottom: 0,
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
    flex: 1,
    flexShrink: 1,
  },
  abmName: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  zoneName: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  headerBrandBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  headerBrandBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBrandBadgeCount: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
  headerBrandChevron: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },

  /* Brands Toggle Footer Bar */
  brandsToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  brandsToggleBarExpanded: {
    backgroundColor: '#F3E8FF',
    borderColor: '#C084FC',
  },
  brandsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandCountPill: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCountPillText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
  brandsToggleTitle: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  brandsToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandsToggleActionText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
  brandsToggleChevron: {
    fontSize: 9,
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },

  /* Brands Container & Brand Card (Horizontal Scroll) */
  brandsContainer: {
    marginTop: 8,
    marginHorizontal: -10,
  },
  brandsScrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    gap: 12,
  },
  brandCard: {
    width: 295,
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    padding: 10,
    paddingBottom: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  brandCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  brandTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  brandTitleText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    flexShrink: 1,
  },
  shareBadge: {
    backgroundColor: '#E9D5FF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  shareBadgeText: {
    fontSize: 9.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  brandGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  brandMetricBox: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 7,
    marginBottom: 6,
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
  /* MTD % ACH grid box override */
  mtdPctBoxGrid: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderWidth: 1.5,
  },
  mtdPctTitleGrid: {
    color: '#C25E00',
  },
  mtdPctSubLabelGrid: {
    color: '#EA580C',
  },
  mtdPctValue: {
    color: '#E27000',
  },
  mtdPctDividerGrid: {
    backgroundColor: '#FED7AA',
  },

  metricBoxFullWidth: {
    width: '100%',
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
  growthBoxGridNeg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1.5,
  },
  growthTitleGridNeg: {
    color: '#B91C1C',
  },
  growthSubLabelGridNeg: {
    color: '#991B1B',
  },
  growthDividerGridNeg: {
    backgroundColor: '#FECACA',
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

  /* Modal Overlay & Card */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'android' ? 64 : 20,
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

export default TargetAchivement;
