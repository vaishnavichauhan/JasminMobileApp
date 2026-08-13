import { StyleSheet, Platform } from 'react-native';
import {
  colors,
  fontSize,
  fontFamily,
  marginHorizontal,
  spaceVertical,
  borderRadius,
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

  /* ── Section Title Header ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: marginHorizontal.small,
    marginBottom: spaceVertical.small,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  sectionCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionCountText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },

  /* ── Search Bar ── */
  searchRow: {
    marginHorizontal: marginHorizontal.small,
    marginBottom: spaceVertical.small,
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
  },
  searchIcon: {
    width: 16,
    height: 16,
    tintColor: '#64748B',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#0F172A',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
  },

  /* ── List Scroll ── */
  scrollContent: {
    paddingHorizontal: marginHorizontal.small,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },

  /* ── Expired Offer Card ── */
  offerCard: {
    backgroundColor: '#FAF9F6',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderLeftWidth: 5,
    borderLeftColor: '#94A3B8',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    opacity: 0.92,
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
    fontSize: 14.5,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    lineHeight: 20,
  },
  statusBadgeExpired: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeTextExpired: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    letterSpacing: 0.3,
  },

  /* Meta Badges Grid */
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  calendarIcon: {
    width: 15,
    height: 15,
    tintColor: '#64748B',
    marginRight: 6,
  },
  dateText: {
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    color: '#475569',
  },
  dateValText: {
    fontFamily: fontFamily.bold,
    color: '#334155',
  },

  /* Empty & Loading States */
  centerLoading: {
    paddingVertical: 50,
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
    paddingVertical: 60,
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
});

export { styles };
export default styles;
