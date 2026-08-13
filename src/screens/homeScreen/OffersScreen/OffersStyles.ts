import { StyleSheet, Platform } from 'react-native';
import {
  colors,
  fontSize,
  fontFamily,
  marginHorizontal,
  spaceVertical,
  borderRadius,
  responsiveHeight,
  responsiveWidth,
} from '../../../styles/variables';

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
    backgroundColor: '#F4F6FB',
    borderTopLeftRadius: borderRadius.cardRadius || 24,
    borderTopRightRadius: borderRadius.cardRadius || 24,
    paddingTop: spaceVertical.small,
    overflow: 'hidden',
  },

  /* ── Tab Switcher Container ── */
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    padding: 3,
    marginHorizontal: marginHorizontal.small,
    marginBottom: spaceVertical.small,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: responsiveHeight(1.1),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleBtnText: {
    fontSize: 12.5,
    fontFamily: fontFamily.medium,
    color: colors.primary,
    textAlign: 'center',
  },
  toggleBtnTextActive: {
    color: colors.white,
    fontFamily: fontFamily.bold,
  },
  badgePill: {
    marginLeft: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(107, 33, 168, 0.15)',
  },
  badgePillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  badgeTextActive: {
    color: colors.white,
  },

  /* ── Filter Row & Quick Search ── */
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: marginHorizontal.small,
    marginBottom: spaceVertical.small,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 42,
    marginRight: 8,
  },
  searchIcon: {
    width: 16,
    height: 16,
    tintColor: '#64748B',
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#0F172A',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 4,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 12,
    height: 42,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnIcon: {
    width: 16,
    height: 16,
    tintColor: colors.primary,
    marginRight: 6,
  },
  filterBtnIconActive: {
    tintColor: colors.white,
  },
  filterBtnText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  filterBtnTextActive: {
    color: colors.white,
  },
  filterBadgeCount: {
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterBadgeCountText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },

  /* ── Horizontal Offer Cards Carousel ── */
  horizontalScrollContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  horizontalCardListContent: {
    paddingHorizontal: marginHorizontal.small,
    alignItems: 'stretch',
  },
  offerCardHorizontal: {
    width: responsiveWidth(86),
    minHeight: 270,
    marginRight: 14,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.8,
    borderColor: colors.primary,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
    justifyContent: 'space-between',
  },
  offerCardExpiredHorizontal: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderLeftColor: '#94A3B8',
    opacity: 0.88,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
  },

  /* Highlighted Brand Badge */
  brandBadgeHighlight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  brandBadgeHighlightText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#1D4ED8',
  },

  carouselCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  carouselDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  carouselCountText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    marginLeft: 8,
  },

  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#64748B',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13.5,
    fontFamily: fontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
  },

  /* ── Offer Item Card ── */
  offerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  offerCardExpired: {
    backgroundColor: '#FAF9F6',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },

  offerCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  offerTitleWrapper: {
    flex: 1,
    marginRight: 8,
  },
  offerTitleText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    lineHeight: 19,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusBadgeExpired: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  statusBadgeTextActive: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#15803D',
    letterSpacing: 0.3,
  },
  statusBadgeTextExpired: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    letterSpacing: 0.3,
  },

  discountBanner: {
    backgroundColor: '#FAF5FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountTagIcon: {
    width: 14,
    height: 14,
    tintColor: colors.primary,
    marginRight: 6,
  },
  discountText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },

  /* Badges Grid */
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metaBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  metaBadgeLabel: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#475569',
  },

  /* Meta Badge with Value Pill */
  metaBadgeWithType: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Only value gets the pill background */
  valPillGreen: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 3,
  },
  valPillTextGreen: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: '#15803D',
  },
  valPillRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 3,
  },
  valPillTextRed: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: '#DC2626',
  },

  /* Date Row */
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  calendarIcon: {
    width: 15,
    height: 15,
    tintColor: colors.primary,
    marginRight: 6,
  },
  dateText: {
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    color: '#475569',
  },
  dateValText: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },

  descriptionText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#475569',
    lineHeight: 17,
  },
  termsText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    marginTop: 4,
    fontStyle: 'italic',
  },

  /* ── Filter Modal Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  closeModalBtn: {
    padding: 4,
  },
  closeModalText: {
    fontSize: 18,
    color: '#64748B',
    fontFamily: fontFamily.bold,
  },

  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterInput: {
    height: 42,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontFamily: fontFamily.medium,
    color: '#0F172A',
  },

  dateFieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateHalfField: {
    flex: 1,
  },

  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resetBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  resetBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },
  applyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
});

export default styles;
