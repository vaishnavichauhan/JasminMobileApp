import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fontFamily, borderRadius } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';
import {
  useScratchReconciliationStore,
  DEFAULT_START_DATE,
} from '../../../store/useScratchReconciliationStore';
import { ReconciliationItem } from '../../../api/scratchReconciliationApi';
import { downloadReconciliationPdf, promptOpenPdf, openPdfFile } from '../../../utils/scratchPdfGenerator';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* ── Date and Currency Formatting Helpers ── */
const formatDateTime = (val: any): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`;
  } catch {
    return String(val);
  }
};

const formatCurrency = (val: any): string => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

const formatDateOnly = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(m, 10) - 1;
    return `${d} ${months[monthIdx] || m} ${y}`;
  }
  return dateStr;
};

const getTodayString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/* ── Card Component for Individual Reconciliation Record ── */
interface CardProps {
  item: ReconciliationItem;
  index: number;
}

const ReconciliationCard = React.memo<CardProps>(({ item, index }) => {
  const isFullyMatched = item.match_status === 'MATCHED';
  const isPartiallyMatched = item.match_status === 'PARTIALLY_MATCHED';
  const isNotScratched = item.match_status === 'INVOICE_NOT_SCRATCHED';
  const isWinningNoInvoice = item.match_status === 'WINNING_NO_INVOICE';

  const timeDiffMinutes = item.time_diff_minutes;
  const isNegativeTime = timeDiffMinutes !== null && timeDiffMinutes !== undefined && timeDiffMinutes < 0;
  const isSuperFast = !isNegativeTime && timeDiffMinutes !== null && timeDiffMinutes !== undefined && timeDiffMinutes <= 15;

  const phoneMismatch = item.phone_match === false;
  const invoiceNumber = item.invoice_number || item.contest_invoice_number;
  const erpBranchName = item.invoice_branch_name || (isWinningNoInvoice ? '—' : (item.contest_branch_name || '—'));
  const erpBranchCode = item.invoice_branch_code || (!isWinningNoInvoice ? item.contest_branch_code : null);
  const contestBranchName = item.contest_branch_name || (isNotScratched ? '—' : (item.invoice_branch_name || '—'));
  const contestBranchCode = item.contest_branch_code || (!isNotScratched ? item.invoice_branch_code : null);

  return (
    <View style={styles.card}>
      {/* ── Top Header: Invoice No (Top Left) & Status (Top Right) ── */}
      <View style={styles.cardHeaderRow}>
        {/* Top Left: Index & Bold Highlighted Invoice Number */}
        <View style={styles.cardHeaderLeft}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
          </View>

          <View
            style={[
              styles.invoiceHighlightBadge,
              !invoiceNumber && styles.invoiceHighlightBadgeMissing,
            ]}
          >
            {invoiceNumber ? (
              <>
                <Text style={styles.invoiceHighlightPrefix}>INV#</Text>
                <Text style={styles.invoiceHighlightText} numberOfLines={1}>
                  {invoiceNumber}
                </Text>
              </>
            ) : (
              <Text style={styles.invoiceHighlightTextMissing}>No Bill Found</Text>
            )}
          </View>
        </View>

        {/* Top Right: Status Badge */}
        <View style={styles.cardHeaderRight}>
          {isFullyMatched && (
            <View style={[styles.statusBadge, styles.statusBadgeGreen]}>
              <Text style={[styles.statusBadgeText, styles.statusTextGreen]}>Fully Matched</Text>
            </View>
          )}

          {isPartiallyMatched && (
            <View style={[styles.statusBadge, styles.statusBadgeSky]}>
              <Text style={[styles.statusBadgeText, styles.statusTextSky]}>
                {phoneMismatch ? 'Partial (Phone Diff)' : 'Partially Matched'}
              </Text>
            </View>
          )}

          {isNotScratched && (
            <View style={[styles.statusBadge, styles.statusBadgeAmber]}>
              <Text style={[styles.statusBadgeText, styles.statusTextAmber]}>Not Scratched</Text>
            </View>
          )}

          {isWinningNoInvoice && (
            <View style={[styles.statusBadge, styles.statusBadgeRed]}>
              <Text style={[styles.statusBadgeText, styles.statusTextRed]}>No Invoice Found</Text>
            </View>
          )}
        </View>
      </View>

      {/* Warning chip if scratched before billing */}
      {isNegativeTime && (
        <View style={styles.warningStrip}>
          <Text style={styles.warningStripText}>⚠️ Scratched before billing timestamp</Text>
        </View>
      )}

      {/* ── Middle Comparison Content ── */}
      <View style={styles.cardBody}>
        {/* Section 1: ERP Invoice Details (if present) */}
        {(item.invoice_number || !isWinningNoInvoice) && (
          <View style={styles.erpSection}>
            {/* Price Highlighted on Next Line */}
            {item.invoice_value !== null && item.invoice_value !== undefined && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Invoice Amount</Text>
                <Text style={styles.priceHighlightText}>{formatCurrency(item.invoice_value)}</Text>
              </View>
            )}

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValBold}>
                  {item.invoice_customer_name || '—'}
                </Text>
                <Text style={styles.detailSubVal}>{item.invoice_customer_phone || '—'}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Branch</Text>
                <Text style={styles.detailValBold}>
                  {erpBranchName}
                </Text>
                {!!erpBranchCode && (
                  <Text style={styles.detailSubVal}>{erpBranchCode}</Text>
                )}
              </View>
            </View>

            {/* Bill DateTime */}
            <View style={styles.dateMetaRow}>
              <Text style={styles.dateMetaLabel}>📅 Bill Time:</Text>
              <Text style={styles.dateMetaVal}>
                {item.invoice_datetime
                  ? formatDateTime(item.invoice_datetime)
                  : item.invoice_date || '—'}
              </Text>
            </View>
          </View>
        )}

        {/* Section 2: Contest Winning Details (if present) */}
        {(item.contest_id || !isNotScratched) && (
          <View style={[styles.contestSection, isWinningNoInvoice && styles.contestSectionStandalone]}>
            {item.contest_id ? (
              <>
                <View style={styles.contestTopRow}>
                  {/* Left: Scratch Participant */}
                  <View style={styles.contestParticipantCol}>
                    <Text style={styles.detailLabel}>Scratch Participant</Text>
                    <Text style={styles.detailValBold}>
                      {item.contest_customer_name || '—'}
                    </Text>
                    <View style={styles.phoneRow}>
                      <Text
                        style={[
                          styles.detailSubVal,
                          phoneMismatch && styles.phoneMismatchText,
                        ]}
                      >
                        {item.contest_customer_phone || '—'}
                      </Text>
                      {phoneMismatch && (
                        <View style={styles.mismatchBadge}>
                          <Text style={styles.mismatchBadgeText}>Phone Differs</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Top Right: Prize Badge */}
                  <View style={styles.contestPrizeCol}>
                    <View style={styles.prizeBadge}>
                      <Image source={Images.gift} style={styles.prizeGiftIcon} resizeMode="contain" />
                      <Text style={styles.prizeBadgeText}>
                        {item.contest_prize || 'No Prize Recorded'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Branch Details */}
                <View style={styles.contestBranchRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Branch</Text>
                    <Text style={styles.detailValBold}>
                      {contestBranchName}
                    </Text>
                    {!!contestBranchCode && (
                      <Text style={styles.detailSubVal}>{contestBranchCode}</Text>
                    )}
                  </View>
                </View>

                {/* Scratch DateTime */}
                <View style={styles.dateMetaRow}>
                  <Text style={styles.dateMetaLabel}>🎯 Scratch Time:</Text>
                  <Text style={styles.dateMetaVal}>
                    {formatDateTime(item.contest_scratch_time)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.notScratchedRow}>
                <Text style={styles.missingNoticeText}>Not Scratched</Text>
              </View>
            )}
          </View>
        )}

        {/* Section 3: Dedicated Time Difference Field */}
        <View style={styles.timeDiffFieldRow}>
          <Text style={styles.timeDiffFieldLabel} numberOfLines={1}>⏱️ Time Difference</Text>
          {item.time_diff_human && item.time_diff_human !== 'N/A' && item.time_diff_human !== '—' ? (
            <View
              style={[
                styles.timeDiffChip,
                isNegativeTime
                  ? styles.timeDiffChipAmber
                  : isSuperFast
                  ? styles.timeDiffChipGreen
                  : styles.timeDiffChipBlue,
              ]}
            >
              <Text
                style={[
                  styles.timeDiffChipText,
                  isNegativeTime
                    ? styles.timeDiffTextAmber
                    : isSuperFast
                    ? styles.timeDiffTextGreen
                    : styles.timeDiffTextBlue,
                ]}
                numberOfLines={2}
              >
                {item.time_diff_human}{isNegativeTime ? ' (Pre-scratch)' : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.timeDiffEmptyText}>—</Text>
          )}
        </View>
      </View>
    </View>
  );
});

/* ── Main Screen Component ── */
export const ScratchReportScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // Zustand Store
  const {
    records,
    summary,
    lastSync,
    branches,
    loading,
    refreshing,
    error,
    startDate,
    endDate,
    selectedBranches,
    activeTab,
    searchQuery,
    setStartDate,
    setEndDate,
    setSelectedBranches,
    toggleBranch,
    selectAllBranches,
    clearBranches,
    setActiveTab,
    setSearchQuery,
    resetFilters,
    loadData,
    loadBranches,
  } = useScratchReconciliationStore();

  // Local state for modals & search
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [tempSelectedBranches, setTempSelectedBranches] = useState<string[]>([]);
  const [branchSearchText, setBranchSearchText] = useState('');
  const isMountedRef = useRef(false);
  const isFocusResetRef = useRef(false);

  // Calendar picker state
  const [calendarTarget, setCalendarTarget] = useState<'FROM' | 'TO' | null>(null);
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());

  const searchInputRef = useRef<TextInput>(null);

  // PDF generation state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccessModal, setDownloadSuccessModal] = useState<{
    visible: boolean;
    filePath: string;
    fileName: string;
  }>({
    visible: false,
    filePath: '',
    fileName: '',
  });

  // Derive filtered records based on selectedBranches, activeTab, and search query in memory
  const filteredRecords = useMemo(() => {
    let list = records;

    // 1. In-memory Branch Filter (Strictly ensure only selected branch records show)
    if (selectedBranches.length > 0) {
      const selectedUpper = new Set(selectedBranches.map((c) => String(c).trim().toUpperCase()));
      list = list.filter((r) => {
        const invCode = String(r.invoice_branch_code || '').trim().toUpperCase();
        const winCode = String(r.contest_branch_code || '').trim().toUpperCase();
        return (invCode && selectedUpper.has(invCode)) || (winCode && selectedUpper.has(winCode));
      });
    }

    // 2. Active Tab Filter
    if (activeTab !== 'ALL') {
      list = list.filter((r) => r.match_status === activeTab);
    }

    // 3. Search Query Filter
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((r) => {
      const invNo = String(r.invoice_number || r.contest_invoice_number || '').toLowerCase();
      const custName = String(r.invoice_customer_name || r.contest_customer_name || '').toLowerCase();
      const phone = String(r.invoice_customer_phone || r.contest_customer_phone || '').toLowerCase();
      const branch = String(r.invoice_branch_name || r.contest_branch_name || r.invoice_branch_code || r.contest_branch_code || '').toLowerCase();
      const prize = String(r.contest_prize || '').toLowerCase();
      return (
        invNo.includes(q) ||
        custName.includes(q) ||
        phone.includes(q) ||
        branch.includes(q) ||
        prize.includes(q)
      );
    });
  }, [records, activeTab, searchQuery, selectedBranches]);

  // Dynamic summary counts that accurately reflect branch-filtered data
  const displaySummary = useMemo(() => {
    if (selectedBranches.length > 0) {
      const selectedUpper = new Set(selectedBranches.map((c) => String(c).trim().toUpperCase()));
      const branchRows = records.filter((r) => {
        const invCode = String(r.invoice_branch_code || '').trim().toUpperCase();
        const winCode = String(r.contest_branch_code || '').trim().toUpperCase();
        return (invCode && selectedUpper.has(invCode)) || (winCode && selectedUpper.has(winCode));
      });

      return {
        totalAllReconciled: branchRows.length,
        fullyMatchedCount: branchRows.filter((r) => r.match_status === 'MATCHED').length,
        partiallyMatchedCount: branchRows.filter((r) => r.match_status === 'PARTIALLY_MATCHED').length,
        invoiceNotScratchedCount: branchRows.filter((r) => r.match_status === 'INVOICE_NOT_SCRATCHED').length,
        winningNoInvoiceCount: branchRows.filter((r) => r.match_status === 'WINNING_NO_INVOICE').length,
      };
    }

    return {
      totalAllReconciled: summary?.totalAllReconciled ?? records.length,
      fullyMatchedCount: summary?.fullyMatchedCount ?? records.filter((r) => r.match_status === 'MATCHED').length,
      partiallyMatchedCount: summary?.partiallyMatchedCount ?? records.filter((r) => r.match_status === 'PARTIALLY_MATCHED').length,
      invoiceNotScratchedCount: summary?.invoiceNotScratchedCount ?? records.filter((r) => r.match_status === 'INVOICE_NOT_SCRATCHED').length,
      winningNoInvoiceCount: summary?.winningNoInvoiceCount ?? records.filter((r) => r.match_status === 'WINNING_NO_INVOICE').length,
    };
  }, [records, summary, selectedBranches]);

  const handleExportPdf = async () => {
    if (filteredRecords.length === 0) {
      Alert.alert('Notice', 'No reconciliation records available to download.');
      return;
    }

    try {
      setIsDownloadingPdf(true);
      const filePath = await downloadReconciliationPdf({
        records: filteredRecords,
        summary: displaySummary as any,
        startDate,
        endDate,
        activeTab,
        selectedBranches,
        lastSync,
      });

      const cleanTab = activeTab.toLowerCase().replace(/_/g, '-');
      const fileName = `Scratch_Win_Reconciliation_${cleanTab}_${startDate}_to_${endDate}.pdf`;

      setDownloadSuccessModal({
        visible: true,
        filePath,
        fileName,
      });
    } catch (err: any) {
      console.error('PDF export error:', err);
      Alert.alert('PDF Export Error', err?.message || 'Failed to generate PDF report.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleOpenDownloadedPdf = () => {
    const { filePath } = downloadSuccessModal;
    setDownloadSuccessModal({ visible: false, filePath: '', fileName: '' });
    if (filePath) {
      openPdfFile(filePath);
    }
  };

  // Helper to completely clear all filters and reload fresh records
  const handleClearAllFilters = useCallback(() => {
    resetFilters();
    setBranchSearchText('');
    setTempSelectedBranches([]);
    setIsBranchModalOpen(false);
    setCalendarTarget(null);
    loadData(false);
  }, [resetFilters, loadData]);

  // Screen Focus Effect: Whenever the user enters/comes onto the screen, clear all filters
  useFocusEffect(
    useCallback(() => {
      isFocusResetRef.current = true;
      resetFilters();
      setBranchSearchText('');
      setTempSelectedBranches([]);
      setIsBranchModalOpen(false);
      setCalendarTarget(null);
      loadBranches();
      loadData(false).finally(() => {
        setTimeout(() => {
          isFocusResetRef.current = false;
        }, 150);
      });

      return () => {
        // Also clear filters when navigating away from this screen
        resetFilters();
      };
    }, [resetFilters, loadBranches, loadData])
  );

  // Reactive refetch when user deliberately changes date or branch filters while active on screen
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (isFocusResetRef.current) {
      return;
    }
    loadData(false);
  }, [startDate, endDate, selectedBranches, loadData]);

  // Filter branches inside modal by search
  const filteredModalBranches = useMemo(() => {
    if (!branchSearchText.trim()) return branches;
    const q = branchSearchText.trim().toLowerCase();
    return branches.filter((b) => {
      const name = String(b.name || '').toLowerCase();
      const code = String(b.code || '').toLowerCase();
      const city = String(b.city || '').toLowerCase();
      return name.includes(q) || code.includes(q) || city.includes(q);
    });
  }, [branches, branchSearchText]);

  // Check if non-default filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedBranches.length > 0 ||
      startDate !== DEFAULT_START_DATE ||
      endDate !== getTodayString() ||
      activeTab !== 'ALL' ||
      searchQuery.trim().length > 0
    );
  }, [selectedBranches, startDate, endDate, activeTab, searchQuery]);

  // Open Calendar picker modal
  const handleOpenCalendar = (target: 'FROM' | 'TO') => {
    const curDateStr = target === 'FROM' ? startDate : endDate;
    let initialYear = new Date().getFullYear();
    let initialMonth = new Date().getMonth();
    if (curDateStr) {
      const parts = curDateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y)) initialYear = y;
        if (!isNaN(m) && m >= 0 && m <= 11) initialMonth = m;
      }
    }
    setCalendarYear(initialYear);
    setCalendarMonth(initialMonth);
    setCalendarTarget(target);
  };

  // Select day in Calendar
  const handleSelectCalendarDate = (dateStr: string) => {
    if (calendarTarget === 'FROM') {
      const effective = dateStr < DEFAULT_START_DATE ? DEFAULT_START_DATE : dateStr;
      setStartDate(effective);
      if (effective > endDate) {
        setEndDate(effective);
      }
    } else if (calendarTarget === 'TO') {
      setEndDate(dateStr);
      if (dateStr < startDate) {
        const effStart = dateStr < DEFAULT_START_DATE ? DEFAULT_START_DATE : dateStr;
        setStartDate(effStart);
      }
    }
    setCalendarTarget(null);
  };


  /* ── Error Screen ── */
  if (error && !records.length) {
    if (isAccessDeniedError(error)) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
          <Header
            title="Scratch & Win Reconciliation"
            showBack={true}
            onBackPress={() => navigation?.goBack()}
            style={styles.headerStyle}
            titleStyle={styles.headerTitleStyle}
            iconColor={colors.white}
          />
          <AccessDenied
            message={error}
            onRetry={() => loadData(false)}
            onGoBack={() => navigation?.goBack()}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Scratch & Win Reconciliation"
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <Header
        title="Scratch & Win Reconciliation"
        showBack={true}
        onBackPress={() => navigation?.goBack()}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
        rightComponent={
          <TouchableOpacity
            style={[
              styles.headerPdfBtn,
              (isDownloadingPdf || filteredRecords.length === 0) && styles.headerPdfBtnDisabled,
            ]}
            activeOpacity={0.75}
            disabled={isDownloadingPdf || filteredRecords.length === 0}
            onPress={handleExportPdf}
          >
            {isDownloadingPdf ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.headerPdfBtnText}>📥 PDF</Text>
            )}
          </TouchableOpacity>
        }
      />

      {/* ── Main Container ── */}
      <View style={styles.mainContainer}>
        {/* Winnings Synced Banner */}
        {lastSync?.created_at && (
          <View style={styles.syncBannerRow}>
            <Image source={Images.gift} style={styles.syncBannerIcon} resizeMode="contain" />
            <Text style={styles.syncBannerText}>
              Winnings Synced:{' '}
              <Text style={styles.syncBannerBold}>{formatDateTime(lastSync.created_at)}</Text>
            </Text>
          </View>
        )}


        {/* ── Status Tab Navigation ── */}
        <View style={styles.tabBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
          >
            {/* All Records Tab */}
            <TouchableOpacity
              style={[
                styles.statusTabBtn,
                styles.statusTabBtnAll,
                activeTab === 'ALL' && styles.statusTabBtnActiveAll,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('ALL')}
            >
              <Text
                style={[
                  styles.statusTabText,
                  styles.statusTabTextAll,
                  activeTab === 'ALL' && styles.statusTabTextActive,
                ]}
              >
                All Records
              </Text>
              <View
                style={[
                  styles.tabCountPill,
                  styles.tabCountPillAll,
                  activeTab === 'ALL' && styles.tabCountPillActiveAll,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    styles.tabCountTextAll,
                    activeTab === 'ALL' && styles.tabCountTextActive,
                  ]}
                >
                  {displaySummary.totalAllReconciled}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Fully Matched Tab */}
            <TouchableOpacity
              style={[
                styles.statusTabBtn,
                styles.statusTabBtnGreen,
                activeTab === 'MATCHED' && styles.statusTabBtnActiveGreen,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('MATCHED')}
            >
              <Text
                style={[
                  styles.statusTabText,
                  styles.statusTabTextGreen,
                  activeTab === 'MATCHED' && styles.statusTabTextActive,
                ]}
              >
                Fully Matched
              </Text>
              <View
                style={[
                  styles.tabCountPill,
                  styles.tabCountPillGreen,
                  activeTab === 'MATCHED' && styles.tabCountPillActiveGreen,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    styles.tabCountTextGreen,
                    activeTab === 'MATCHED' && styles.tabCountTextActive,
                  ]}
                >
                  {displaySummary.fullyMatchedCount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Partially Matched Tab */}
            <TouchableOpacity
              style={[
                styles.statusTabBtn,
                styles.statusTabBtnSky,
                activeTab === 'PARTIALLY_MATCHED' && styles.statusTabBtnActiveSky,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('PARTIALLY_MATCHED')}
            >
              <Text
                style={[
                  styles.statusTabText,
                  styles.statusTabTextSky,
                  activeTab === 'PARTIALLY_MATCHED' && styles.statusTabTextActive,
                ]}
              >
                Partially Matched
              </Text>
              <View
                style={[
                  styles.tabCountPill,
                  styles.tabCountPillSky,
                  activeTab === 'PARTIALLY_MATCHED' && styles.tabCountPillActiveSky,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    styles.tabCountTextSky,
                    activeTab === 'PARTIALLY_MATCHED' && styles.tabCountTextActive,
                  ]}
                >
                  {displaySummary.partiallyMatchedCount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Invoices Not Scratched Tab */}
            <TouchableOpacity
              style={[
                styles.statusTabBtn,
                styles.statusTabBtnAmber,
                activeTab === 'INVOICE_NOT_SCRATCHED' && styles.statusTabBtnActiveAmber,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('INVOICE_NOT_SCRATCHED')}
            >
              <Text
                style={[
                  styles.statusTabText,
                  styles.statusTabTextAmber,
                  activeTab === 'INVOICE_NOT_SCRATCHED' && styles.statusTabTextActive,
                ]}
              >
                Invoices Not Scratched
              </Text>
              <View
                style={[
                  styles.tabCountPill,
                  styles.tabCountPillAmber,
                  activeTab === 'INVOICE_NOT_SCRATCHED' && styles.tabCountPillActiveAmber,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    styles.tabCountTextAmber,
                    activeTab === 'INVOICE_NOT_SCRATCHED' && styles.tabCountTextActive,
                  ]}
                >
                  {displaySummary.invoiceNotScratchedCount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Winnings Without Invoice Tab */}
            <TouchableOpacity
              style={[
                styles.statusTabBtn,
                styles.statusTabBtnRed,
                activeTab === 'WINNING_NO_INVOICE' && styles.statusTabBtnActiveRed,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('WINNING_NO_INVOICE')}
            >
              <Text
                style={[
                  styles.statusTabText,
                  styles.statusTabTextRed,
                  activeTab === 'WINNING_NO_INVOICE' && styles.statusTabTextActive,
                ]}
              >
                Winnings Without Invoice
              </Text>
              <View
                style={[
                  styles.tabCountPill,
                  styles.tabCountPillRed,
                  activeTab === 'WINNING_NO_INVOICE' && styles.tabCountPillActiveRed,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    styles.tabCountTextRed,
                    activeTab === 'WINNING_NO_INVOICE' && styles.tabCountTextActive,
                  ]}
                >
                  {displaySummary.winningNoInvoiceCount}
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => searchInputRef.current?.focus()}
            style={styles.searchContainer}
          >
            <Image source={Images.filter} style={styles.searchIcon} resizeMode="contain" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search Invoice, Mobile, Customer, Prize..."
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

        {/* ── Filter Dropdowns (Branch, Date Range, Reset) ── */}
        <View style={styles.filterControlsRow}>
          {/* Branch Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              selectedBranches.length > 0 && styles.filterBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              setTempSelectedBranches([...selectedBranches]);
              setBranchSearchText('');
              setIsBranchModalOpen(true);
            }}
          >
            <Text
              style={[
                styles.filterBtnText,
                selectedBranches.length > 0 && styles.filterBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedBranches.length === 0
                ? 'All Branches'
                : selectedBranches.length === 1
                ? `Branch: ${branches.find((b) => b.code.toUpperCase() === selectedBranches[0].toUpperCase())?.name || selectedBranches[0]}`
                : `${selectedBranches.length} Branches`}
            </Text>
            <Image source={Images.down} style={styles.filterBtnIcon} resizeMode="contain" />
          </TouchableOpacity>

          {/* From Date Box (Frontend UI) */}
          <View style={styles.dateFieldWrapper}>
            <Text style={styles.dateFieldPrefix}>From:</Text>
            <TouchableOpacity
              style={[
                styles.dateBoxBtn,
                startDate !== DEFAULT_START_DATE && styles.dateBoxBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => handleOpenCalendar('FROM')}
            >
                   <Image source={Images.calendar} style={styles.calendarMiniIcon} resizeMode="contain" />
              <Text
                style={[
                  styles.dateBoxText,
                  startDate !== DEFAULT_START_DATE && styles.dateBoxTextActive,
                ]}
                numberOfLines={1}
              >
                {startDate}
              </Text>
           
            </TouchableOpacity>
          </View>

          {/* To Date Box (Frontend UI) */}
          <View style={styles.dateFieldWrapper}>
            <Text style={styles.dateFieldPrefix}>To:</Text>
            <TouchableOpacity
              style={[
                styles.dateBoxBtn,
                endDate !== getTodayString() && styles.dateBoxBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => handleOpenCalendar('TO')}
            >
                <Image source={Images.calendar} style={styles.calendarMiniIcon} resizeMode="contain" />
              <Text
                style={[
                  styles.dateBoxText,
                  endDate !== getTodayString() && styles.dateBoxTextActive,
                ]}
                numberOfLines={1}
              >
                {endDate}
              </Text>
              
            </TouchableOpacity>
          </View>

          {/* Download PDF Button */}
          <TouchableOpacity
            style={[
              styles.filterPdfBtn,
              (isDownloadingPdf || filteredRecords.length === 0) && styles.filterPdfBtnDisabled,
            ]}
            activeOpacity={0.8}
            disabled={isDownloadingPdf || filteredRecords.length === 0}
            onPress={handleExportPdf}
          >
            {isDownloadingPdf ? (
              <ActivityIndicator size="small" color="#BE123C" />
            ) : (
              <Text style={styles.filterPdfBtnText}>📄 PDF</Text>
            )}
          </TouchableOpacity>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.resetBtn}
              activeOpacity={0.7}
              onPress={handleClearAllFilters}
            >
              <Text style={styles.resetBtnText}>✕ Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Record List ── */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            {/* <Text style={styles.loadingText}>Comparing ERP invoices against contest winnings...</Text> */}
          </View>
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={(item, idx) => item.reconciliation_id || String(idx)}
            renderItem={({ item, index }) => (
              <ReconciliationCard
                item={item}
                index={index}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              filteredRecords.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Image source={Images.gift} style={styles.emptyGiftIcon} resizeMode="contain" />
                <Text style={styles.emptyTitle}>No reconciliation records found</Text>
                <Text style={styles.emptySub}>
                  Try selecting different date ranges, branches, or clear your search query.
                </Text>
                {hasActiveFilters && (
                  <TouchableOpacity style={styles.retryBtn} onPress={handleClearAllFilters}>
                    <Text style={styles.retryText}>Clear All Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      {/* ── Branch Multi-Select Filter Modal ── */}
      <Modal
        visible={isBranchModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsBranchModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Branches</Text>
                <Text style={styles.modalSubTitle}>
                  {tempSelectedBranches.length === 0
                    ? 'Showing all branches'
                    : `${tempSelectedBranches.length} branch(es) selected`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsBranchModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Branches */}
            <View style={styles.modalSearchBox}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search branch name, code, or city..."
                placeholderTextColor="#94A3B8"
                value={branchSearchText}
                onChangeText={setBranchSearchText}
              />
            </View>

            {/* Quick Actions (Select All / Clear) */}
            <View style={styles.modalQuickActions}>
              <TouchableOpacity
                onPress={() => {
                  const allCodes = filteredModalBranches.map((b) => b.code.trim().toUpperCase());
                  setTempSelectedBranches(Array.from(new Set(allCodes)));
                }}
              >
                <Text style={styles.quickActionText}>Select All</Text>
              </TouchableOpacity>
              <Text style={styles.quickActionDivider}>|</Text>
              <TouchableOpacity onPress={() => setTempSelectedBranches([])}>
                <Text style={styles.quickActionText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {/* Branch List */}
            <ScrollView style={styles.branchListScroll} showsVerticalScrollIndicator={true}>
              {filteredModalBranches.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>No branches matching search</Text>
                </View>
              ) : (
                filteredModalBranches.map((b) => {
                  const upperCode = b.code.trim().toUpperCase();
                  const isChecked = tempSelectedBranches.includes(upperCode);
                  return (
                    <TouchableOpacity
                      key={`${b.code}-${b.name}`}
                      style={[styles.branchRowItem, isChecked && styles.branchRowItemActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setTempSelectedBranches((prev) =>
                          prev.includes(upperCode)
                            ? prev.filter((c) => c !== upperCode)
                            : [...prev, upperCode]
                        );
                      }}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.branchRowTextCol}>
                        <Text style={[styles.branchRowName, isChecked && styles.branchRowNameActive]}>
                          {b.name}
                        </Text>
                        <Text style={styles.branchRowCode}>
                          Code: {b.code} {b.city ? `• ${b.city}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Modal Bottom Apply Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedBranches(tempSelectedBranches);
                  setIsBranchModalOpen(false);
                }}
              >
                <Text style={styles.applyButtonText}>
                  {tempSelectedBranches.length === 0
                    ? 'Apply (All Branches)'
                    : `Apply (${tempSelectedBranches.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Date Calendar Picker Modal ── */}
      <Modal
        visible={Boolean(calendarTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarTarget(null)}
      >
        <TouchableOpacity
          style={styles.calendarModalOverlay}
          activeOpacity={1}
          onPress={() => setCalendarTarget(null)}
        >
          <View style={styles.calendarCard} onStartShouldSetResponder={() => true}>
            {/* Header: Title & Close */}
            <View style={styles.calendarHeaderRow}>
              <View>
                <Text style={styles.calendarModalTitle}>
                  {calendarTarget === 'FROM' ? 'Select From Date' : 'Select To Date'}
                </Text>
                {calendarTarget === 'FROM' && (
                  <Text style={styles.calendarModalSubtitle}>Min Date: 2026-10-05</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setCalendarTarget(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigator */}
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

                // Empty padding cells before first day of month
                for (let i = 0; i < firstDayOfWeek; i++) {
                  cells.push(
                    <View key={`empty-${i}`} style={styles.calendarDayCell}>
                      <Text style={styles.calendarDayTextDisabled}> </Text>
                    </View>
                  );
                }

                // Month days
                for (let d = 1; d <= daysInMonth; d++) {
                  const dayStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const isSelected = (calendarTarget === 'FROM' ? startDate : endDate) === dayStr;
                  const isToday = getTodayString() === dayStr;
                  const isBeforeMin = calendarTarget === 'FROM' && dayStr < DEFAULT_START_DATE;

                  cells.push(
                    <TouchableOpacity
                      key={`day-${d}`}
                      style={[
                        styles.calendarDayCell,
                        isSelected && styles.calendarDayCellSelected,
                        isToday && !isSelected && styles.calendarDayCellToday,
                        isBeforeMin && styles.calendarDayCellDisabled,
                      ]}
                      activeOpacity={0.7}
                      disabled={isBeforeMin}
                      onPress={() => handleSelectCalendarDate(dayStr)}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isSelected && styles.calendarDayTextSelected,
                          isToday && !isSelected && styles.calendarDayTextToday,
                          isBeforeMin && styles.calendarDayTextDisabled,
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
              {calendarTarget === 'FROM' ? (
                <TouchableOpacity
                  style={styles.calendarActionBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    setStartDate(DEFAULT_START_DATE);
                    setCalendarTarget(null);
                  }}
                >
                  <Text style={styles.calendarActionText}>Min (05 Oct 2026)</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.calendarActionBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    const todayStr = getTodayString();
                    setEndDate(todayStr);
                    setCalendarTarget(null);
                  }}
                >
                  <Text style={styles.calendarActionText}>Today</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.calendarActionBtn, styles.calendarActionBtnPrimary]}
                activeOpacity={0.7}
                onPress={() => setCalendarTarget(null)}
              >
                <Text style={styles.calendarActionTextPrimary}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── PDF Downloaded Alert Modal with Green Right Icon ── */}
      <Modal
        visible={downloadSuccessModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() =>
          setDownloadSuccessModal({ visible: false, filePath: '', fileName: '' })
        }
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContent}>
            {/* Green Circular Badge with Right (Check) Icon */}
            <View style={styles.alertSuccessBadge}>
              <Text style={styles.alertRightIconText}>✓</Text>
            </View>

            {/* Title */}
            <Text style={styles.alertTitleText}>PDF Downloaded</Text>

            {/* Subtitle / Details */}
            <Text style={styles.alertMessageText}>
              Report has been successfully downloaded and saved to your Downloads folder.
            </Text>

            {/* File info pill */}
            <View style={styles.alertFilePill}>
              <Text style={styles.alertFileIcon}>📄</Text>
              <Text style={styles.alertFileNameText} numberOfLines={2}>
                {downloadSuccessModal.fileName}
              </Text>
            </View>

            {/* Action Buttons: Cancel and Open PDF */}
            <View style={styles.alertActionsRow}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                activeOpacity={0.7}
                onPress={() =>
                  setDownloadSuccessModal({ visible: false, filePath: '', fileName: '' })
                }
              >
                <Text style={styles.alertCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alertOpenBtn}
                activeOpacity={0.8}
                onPress={handleOpenDownloadedPdf}
              >
                <Text style={styles.alertOpenBtnText}>Open PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

/* ── Stylesheet ── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D1B',
  },
  headerStyle: {
    backgroundColor: colors.primary,
    borderBottomWidth: 0,
  },
  headerTitleStyle: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 16,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  syncBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  syncBannerIcon: {
    width: 15,
    height: 15,
  },
  syncBannerText: {
    fontSize: 11,
    color: '#1E40AF',
    fontFamily: fontFamily.medium,
  },
  syncBannerBold: {
    fontFamily: fontFamily.bold,
    color: '#1E3A8A',
  },


  /* Status Tab Bar */
  tabBarWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  statusTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  statusTabBtnAll: {
    borderColor: '#334155',
  },
  statusTabBtnGreen: {
    borderColor: '#10B981',
  },
  statusTabBtnSky: {
    borderColor: '#0284C7',
  },
  statusTabBtnAmber: {
    borderColor: '#F59E0B',
  },
  statusTabBtnRed: {
    borderColor: '#F43F5E',
  },
  statusTabBtnActiveAll: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusTabBtnActiveGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  statusTabBtnActiveSky: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  statusTabBtnActiveAmber: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  statusTabBtnActiveRed: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  statusTabText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    marginRight: 6,
  },
  statusTabTextAll: { color: '#1E293B' },
  statusTabTextGreen: { color: '#047857' },
  statusTabTextSky: { color: '#0284C7' },
  statusTabTextAmber: { color: '#B45309' },
  statusTabTextRed: { color: '#BE123C' },
  statusTabTextActive: {
    color: colors.white,
    fontFamily: fontFamily.bold,
  },
  tabCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabCountPillAll: { backgroundColor: 'transparent' },
  tabCountPillGreen: { backgroundColor: 'transparent' },
  tabCountPillSky: { backgroundColor: 'transparent' },
  tabCountPillAmber: { backgroundColor: 'transparent' },
  tabCountPillRed: { backgroundColor: 'transparent' },

  tabCountPillActiveAll: { backgroundColor: 'transparent' },
  tabCountPillActiveGreen: { backgroundColor: 'transparent' },
  tabCountPillActiveSky: { backgroundColor: 'transparent' },
  tabCountPillActiveAmber: { backgroundColor: 'transparent' },
  tabCountPillActiveRed: { backgroundColor: 'transparent' },

  tabCountText: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
  },
  tabCountTextAll: { color: '#1E293B' },
  tabCountTextGreen: { color: '#065F46' },
  tabCountTextSky: { color: '#075985' },
  tabCountTextAmber: { color: '#92400E' },
  tabCountTextRed: { color: '#9F1239' },
  tabCountTextActive: {
    color: colors.white,
  },

  /* Search Row */
  searchRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    width: 15,
    height: 15,
    tintColor: '#64748B',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 'bold',
  },

  /* Filter Controls Row */
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  filterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#F5F3FF',
  },
  filterBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#475569',
    flex: 1,
    marginRight: 4,
  },
  filterBtnTextActive: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  filterBtnIcon: {
    width: 10,
    height: 10,
    tintColor: '#64748B',
  },
  resetBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resetBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },

  /* List & Cards */
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    justifyContent: 'flex-end',
  },
  invoiceHighlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#818CF8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: 175,
  },
  invoiceHighlightBadgeMissing: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FDA4AF',
    shadowColor: '#E11D48',
  },
  invoiceHighlightPrefix: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: '#4F46E5',
    marginRight: 3,
    letterSpacing: 0.5,
  },
  invoiceHighlightText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#1E1B4B',
    letterSpacing: 0.2,
  },
  invoiceHighlightTextMissing: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#BE123C',
    fontStyle: 'italic',
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  statusBadgeGreen: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  statusBadgeSky: { backgroundColor: '#F0F9FF', borderColor: '#0284C7' },
  statusBadgeAmber: { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
  statusBadgeRed: { backgroundColor: '#FFF1F2', borderColor: '#F43F5E' },
  statusBadgeText: { fontSize: 11, fontFamily: fontFamily.bold },
  statusTextGreen: { color: '#047857' },
  statusTextSky: { color: '#0369A1' },
  statusTextAmber: { color: '#B45309' },
  statusTextRed: { color: '#BE123C' },

  timeDiffChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: '65%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDiffChipGreen: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  timeDiffChipAmber: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  timeDiffChipBlue: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  timeDiffChipText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    textAlign: 'right',
  },
  timeDiffTextGreen: { color: '#047857' },
  timeDiffTextAmber: { color: '#B45309' },
  timeDiffTextBlue: { color: '#1D4ED8' },

  warningStrip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  warningStripText: {
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    color: '#B45309',
  },

  /* Card Body */
  cardBody: {
    padding: 12,
    gap: 10,
  },
  erpSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contestSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contestSectionStandalone: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 4,
  },
  sectionTagBlue: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  sectionTagTextBlue: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: '#1E40AF',
    letterSpacing: 0.3,
  },
  sectionTagAmber: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  sectionTagTextAmber: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: '#92400E',
    letterSpacing: 0.3,
  },

  /* Price Highlighted on Next Line */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#64748B',
  },
  priceHighlightText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#047857',
  },

  invoiceNoText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  invoiceAmountText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  contestIdText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#B45309',
  },
  missingNoticeText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fontFamily.medium,
    marginBottom: 2,
  },
  detailValBold: {
    fontSize: 13.5,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  detailSubVal: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#475569',
    marginTop: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  phoneMismatchText: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  mismatchBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  mismatchBadgeText: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    color: '#B91C1C',
  },
  contestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  contestParticipantCol: {
    flex: 1,
  },
  contestPrizeCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexShrink: 0,
    maxWidth: '48%',
  },
  contestBranchRow: {
    marginBottom: 6,
  },
  prizeSectionRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  prizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.2,
    borderColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: 'flex-end',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  prizeGiftIcon: {
    width: 22,
    height: 22,
  },
  prizeGiftIconSmall: {
    width: 14,
    height: 14,
  },
  emptyGiftIcon: {
    width: 50,
    height: 50,
    marginBottom: 10,
    opacity: 0.85,
  },
  prizeBadgeText: {
    fontSize: 13.5,
    fontFamily: fontFamily.bold,
    color: '#065F46',
    letterSpacing: 0.2,
  },
  dateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
  },
  dateMetaLabel: {
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    color: '#64748B',
    marginRight: 6,
  },
  dateMetaVal: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
  },

  /* Time Difference Field */
  timeDiffFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  timeDiffFieldLabel: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#334155',
    flexShrink: 0,
  },
  timeDiffEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  prizeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notScratchedRow: {
    paddingVertical: 6,
  },


  /* Loading & Empty States */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontFamily: fontFamily.medium,
    textAlign: 'center',
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fontFamily.regular,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
  },

  /* Branch Modal Elements */
  modalSearchBox: {
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSearchInput: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    height: 36,
  },
  modalQuickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingVertical: 8,
  },
  quickActionText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  quickActionDivider: {
    color: '#CBD5E1',
  },
  branchListScroll: {
    maxHeight: 280,
  },
  branchRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  branchRowItemActive: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  branchRowTextCol: {
    flex: 1,
  },
  branchRowName: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#1E293B',
  },
  branchRowNameActive: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  branchRowCode: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  modalEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalFooter: {
    paddingTop: 12,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 13,
  },

  /* From/To Date Inputs */
  dateFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateFieldPrefix: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  dateBoxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 5,
  },
  dateBoxBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#F5F3FF',
  },
  dateBoxText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#334155',
  },
  dateBoxTextActive: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  calendarMiniIcon: {
    width: 12,
    height: 12,
    tintColor: '#64748B',
  },

  /* Calendar Modal Elements */
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarModalTitle: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  calendarModalSubtitle: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: '#D97706',
    marginTop: 1,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavBtnText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#334155',
  },
  calendarMonthText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarWeekDayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDayCell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  calendarDayCellSelected: {
    backgroundColor: colors.primary,
  },
  calendarDayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  calendarDayCellDisabled: {
    opacity: 0.25,
  },
  calendarDayText: {
    fontSize: 12,
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
    color: '#94A3B8',
  },
  calendarActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calendarActionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  calendarActionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  calendarActionText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },
  calendarActionTextPrimary: {
    color: colors.white,
  },

  /* Header & Filter PDF Buttons */
  headerPdfBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    minHeight: 28,
  },
  headerPdfBtnDisabled: {
    opacity: 0.5,
  },
  headerPdfBtnText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 11.5,
  },
  filterPdfBtn: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPdfBtnDisabled: {
    opacity: 0.4,
  },
  filterPdfBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#BE123C',
  },

  /* ── PDF Downloaded Alert Modal ── */
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    elevation: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  alertSuccessBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  alertRightIconText: {
    fontSize: 34,
    color: '#16A34A',
    fontWeight: 'bold',
    fontFamily: fontFamily.bold,
    lineHeight: 38,
  },
  alertTitleText: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessageText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  alertFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 18,
    width: '100%',
  },
  alertFileIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  alertFileNameText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#334155',
    flex: 1,
  },
  alertActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  alertCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCancelBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#64748B',
  },
  alertOpenBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  alertOpenBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },

});

export default ScratchReportScreen;
