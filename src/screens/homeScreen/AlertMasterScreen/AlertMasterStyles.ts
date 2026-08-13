import { StyleSheet, Platform } from 'react-native';
import {
  colors,
  fontSize,
  fontFamily,
  marginHorizontal,
  borderRadius,
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
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: borderRadius.cardRadius || 24,
    borderTopRightRadius: borderRadius.cardRadius || 24,
    paddingTop: 16,
    overflow: 'hidden',
  },

  /* ── Search & Dropdown Filter Row ── */
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: marginHorizontal.normal,
    marginBottom: 12,
    gap: 8,
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
    height: 46,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#94A3B8',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fontFamily.medium,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fontFamily.bold,
  },

  /* ── Status Dropdown Button ── */
  statusDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingHorizontal: 12,
    height: 46,
    minWidth: 105,
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  statusDropdownText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    marginRight: 6,
  },
  statusDropdownIcon: {
    width: 11,
    height: 11,
    tintColor: colors.primary,
  },

  /* ── Modal Styles for Status Picker ── */
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
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fontFamily.bold,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalOptionItemActive: {
    backgroundColor: '#FAF5FF',
    borderColor: colors.primary,
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#334155',
  },
  modalOptionTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  modalCheckmark: {
    fontSize: 15,
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },

  /* ── 2-Column Grid FlatList Scroll Content ── */
  listContent: {
    paddingHorizontal: marginHorizontal.normal,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 4,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  /* ── 2-Column Box Type Alert Card ── */
  alertCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'flex-start',
  },
  alertCardActive: {
    backgroundColor: colors.white,
    borderColor: '#DDD6FE',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  alertCardInactive: {
    opacity: 0.85,
    backgroundColor: colors.white,
    borderColor: '#E2E8F0',
  },

  /* Full Width Card Image Container */
  imageContainer: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  fallbackIconWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5FF',
  },
  fallbackIcon: {
    width: 38,
    height: 38,
    tintColor: colors.primary,
  },

  /* Floating Status Badge (with Green Dot & Active label) */
  floatingStatusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  floatingStatusBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 0.8,
    borderColor: '#86EFAC',
  },
  floatingStatusBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 0.8,
    borderColor: '#CBD5E1',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotActive: {
    backgroundColor: '#16A34A',
  },
  statusDotInactive: {
    backgroundColor: '#64748B',
  },
  statusText: {
    fontSize: 9.5,
    fontFamily: fontFamily.bold,
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#64748B',
  },

  /* Content Body (Left Aligned) */
  cardBody: {
    width: '100%',
    alignItems: 'flex-start',
  },
  titleWrapper: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 5,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  titleWrapperActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
  },
  alertTitleText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    textAlign: 'left',
    lineHeight: 18,
  },
  descContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  alertDescriptionText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#475569',
    textAlign: 'left',
    lineHeight: 17,
  },

  /* See More / See Less Button */
  seeMoreBtn: {
    marginTop: 3,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  seeMoreText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },

  /* ── Empty & Loading States ── */
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.medium,
    color: colors.subtitleColor,
    marginTop: 10,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    width: 28,
    height: 28,
    tintColor: '#94A3B8',
  },
  emptyText: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.medium,
    color: colors.subtitleColor,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export { styles };
export default styles;
