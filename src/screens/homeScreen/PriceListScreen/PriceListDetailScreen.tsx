import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { usePriceListStore } from '../../../store';
import { colors, fontFamily, borderRadius } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';

const renderStringValue = (val: any): string => {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (val.length === 0) return '—';
      return val.map((x) => renderStringValue(x)).join(', ');
    }
    return val.offer_type || val.title || val.offerType || val.brand_name || val.name || val.label || JSON.stringify(val);
  }
  return String(val);
};
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const PriceListDetailScreen: React.FC<{ route: any; navigation?: any }> = ({
  route,
  navigation,
}) => {
  const { variationId, formatName } = route.params || {};
  const { token } = useAuth();
  const {
    reportDetails,
    detailsLoading,
    detailsError,
    loadReportDetails,
    selectedDate,
    setSelectedDate,
  } = usePriceListStore();

  const [selectedStockItem, setSelectedStockItem] = useState<any>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  const isReportDetail = route.name === 'PriceListReportDetailScreen';

  useEffect(() => {
    if (variationId) {
      if (isReportDetail) {
        const targetDate = selectedDate || getTodayDateString();
        if (!selectedDate) {
          setSelectedDate(targetDate);
        }
        loadReportDetails(token, variationId, targetDate);
      } else {
        loadReportDetails(token, variationId, '');
      }
    }
  }, [token, variationId, loadReportDetails, selectedDate, isReportDetail]);

  const visibleColumns = React.useMemo(() => {
    if (!reportDetails?.columns) return [];
    return reportDetails.columns.filter(
      (col) =>
        col.not_show_in_report !== true &&
        col.not_show_in_report !== 'true' &&
        col.not_show_in_report !== 1
    );
  }, [reportDetails]);

  const renderItem = ({ item }: { item: any }) => {
    // Standard keys safely rendered
    const brand = renderStringValue(item.Brand || item.brand);
    const productName = renderStringValue(item.product_name || item.model_name || item.modelName);
    const modelGroup = renderStringValue(item.model_group_name || item.modelGroupName);
    const activeOffers = renderStringValue(item.active_offers || item.activeOffers);

    return (
      <View style={styles.card}>
        {/* Brand & Stock Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.productNameText} numberOfLines={2}>
              {productName}
            </Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>{brand}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.stockBtn}
            onPress={() => setSelectedStockItem(item)}
            activeOpacity={0.7}
          >
            <Image
              source={Images.product}
              style={styles.stockBtnIcon}
              resizeMode="contain"
            />
            <Text style={styles.stockBtnText}>View Stock</Text>
          </TouchableOpacity>
        </View>

        {/* Details List */}
        <View style={styles.detailsContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Model Group</Text>
            <Text style={styles.infoValue}>{modelGroup}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Active Offers</Text>
            <Text style={[styles.infoValue, styles.activeOffersText]}>
              {activeOffers}
            </Text>
          </View>

          {/* Dynamic Columns from columns[] where not_show_in_report = false */}
          {visibleColumns.map((col) => {
            const val = item[col.column_name];
            return (
              <View key={col.column_name} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{col.column_name}</Text>
                <Text style={styles.infoValue}>{renderStringValue(val)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (detailsLoading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.stateText}>Loading report details…</Text>
      </View>
    );
  }

  if (detailsError) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateIcon}>⚠️</Text>
        <Text style={[styles.stateText, { color: '#DC2626' }]}>{detailsError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadReportDetails(token, variationId)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header showing the formatName of the variation */}
      <Header
        title={formatName || 'Price List Details'}
        showBack={true}
        onBackPress={() => navigation?.goBack()}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Date Filter Bar */}
      {isReportDetail && (
        <View style={styles.filterBar}>
          <View style={styles.dateField}>
            <Image source={Images.calendar} style={styles.calendarIcon} resizeMode="contain" />
            <Text style={styles.dateText}>
              {selectedDate ? selectedDate : 'No date selected'}
            </Text>
          </View>
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.changeDateBtn}
              onPress={() => setIsDateModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.changeDateBtnText}>Select Date</Text>
            </TouchableOpacity>
            {!!selectedDate && (
              <TouchableOpacity
                style={styles.clearDateBtn}
                onPress={() => {
                  setSelectedDate('');
                  loadReportDetails(token, variationId, '');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearDateBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.mainContainer}>
        <FlatList
          data={reportDetails?.data || []}
          keyExtractor={(item, idx) => String(item.id || item._id || idx)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.stateIcon}>📋</Text>
              <Text style={styles.stateText}>No variation items found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={detailsLoading}
              onRefresh={() => loadReportDetails(token, variationId, selectedDate)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </View>

      {/* ── Date Calendar Picker Modal ── */}
      {isReportDetail && (
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
                    const isFuture = dayStr > getTodayDateString();

                    cells.push(
                      <TouchableOpacity
                        key={`day-${d}`}
                        style={[
                          styles.calendarDayCell,
                          isSelected && styles.calendarDayCellSelected,
                          isToday && !isSelected && styles.calendarDayCellToday,
                        ]}
                        activeOpacity={isFuture ? 1 : 0.7}
                        disabled={isFuture}
                        onPress={() => {
                          setSelectedDate(dayStr);
                          setIsDateModalOpen(false);
                          loadReportDetails(token, variationId, dayStr);
                        }}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            isSelected && styles.calendarDayTextSelected,
                            isToday && !isSelected && styles.calendarDayTextToday,
                            isFuture && styles.calendarDayTextDisabled,
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
                    loadReportDetails(token, variationId, '');
                  }}
                >
                  <Text style={styles.calendarActionBtnText}>Clear Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calendarActionBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.7}
                  onPress={() => setIsDateModalOpen(false)}
                >
                  <Text style={[styles.calendarActionBtnText, { color: '#fff' }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Stock Status Detail Modal */}
      <Modal
        visible={selectedStockItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedStockItem(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedStockItem(null)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock Status</Text>
              <TouchableOpacity
                onPress={() => setSelectedStockItem(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.stockItemName}>
                {selectedStockItem?.product_name || selectedStockItem?.model_name || 'Item Stock'}
              </Text>
              
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Available Stock:</Text>
                <Text style={styles.stockValue}>
                  {selectedStockItem?.stock ?? selectedStockItem?.stock_qty ?? selectedStockItem?.available_stock ?? 'In Stock'}
                </Text>
              </View>

              {selectedStockItem?.warehouse_stock && (
                <View style={[styles.stockRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10, paddingTop: 10 }]}>
                  <Text style={styles.stockLabel}>Warehouse Details:</Text>
                  <Text style={styles.stockValue}>{selectedStockItem.warehouse_stock}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

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
    fontSize: 18,
    fontFamily: fontFamily.bold,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    // borderTopLeftRadius: borderRadius.cardRadius || 24,
    // borderTopRightRadius: borderRadius.cardRadius || 24,
    overflow: 'hidden',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
    gap: 4,
  },
  productNameText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  activeOffersText: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    overflow: 'hidden',
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  brandText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  stockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    borderWidth: 1,
    borderColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  stockBtnIcon: {
    width: 12,
    height: 12,
    tintColor: '#FFFFFF',
  },
  stockBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  detailsContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#1E293B',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
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
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },
  modalScroll: {
    paddingBottom: 10,
  },
  stockItemName: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginBottom: 14,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  stockValue: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIcon: {
    width: 16,
    height: 16,
    tintColor: colors.primary,
  },
  dateText: {
    fontSize: 13.5,
    fontFamily: fontFamily.medium,
    color: '#334155',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeDateBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeDateBtnText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  clearDateBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearDateBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    marginTop: -1,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calendarNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavBtnText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#334155',
  },
  calendarMonthText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarWeekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  calendarDayCellSelected: {
    backgroundColor: colors.primary,
  },
  calendarDayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  calendarDayText: {
    fontSize: 13,
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
    color: '#CBD5E1',
  },
  calendarActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calendarActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  calendarActionBtnText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },
});

export default PriceListDetailScreen;
