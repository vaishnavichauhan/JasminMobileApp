import { StyleSheet, Platform } from 'react-native';
import {
  colors,
  fontSize,
  spaceVertical,
  marginHorizontal,
  fontFamily,
  responsiveWidth,
  borderRadius,
  tabHeight1,
} from '../../../styles/variables';

export const styles = StyleSheet.create({
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

  /* ── Hero Overview Section ── */
  heroSection: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  avatarWrapper: {
    width: responsiveWidth(20),
    height: responsiveWidth(20),
    borderRadius: responsiveWidth(20) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatarInitial: {
    fontSize: 32,
    color: colors.white,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  heroUserName: {
    fontSize: 20,
    color: colors.white,
    fontFamily: fontFamily.bold,
    marginTop: 12,
    letterSpacing: 0.3,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleBadgeText: {
    fontSize: 12,
    color: colors.white,
    fontFamily: fontFamily.semiBold,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusBadgeText: {
    fontSize: 11,
    color: '#D1FAE5',
    fontFamily: fontFamily.semiBold,
  },

  /* ── Main Content Area ── */
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: marginHorizontal.small,
    paddingTop: 16,
    paddingBottom: tabHeight1 + 20,
  },

  /* ── Grouped Enterprise Cards ── */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  cardHeaderIcon: {
    fontSize: 15,
  },
  cardHeaderText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#334155',
    letterSpacing: 0.2,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },

  /* ── Info Rows ── */
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    gap: 12,
  },
  itemLabelWrap: {
    minWidth: 95,
    flexShrink: 0,
  },
  itemLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fontFamily.medium,
  },
  itemValue: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: fontFamily.semiBold,
    textAlign: 'right',
    flex: 1,
    flexShrink: 1,
  },
  stateItemRow: {
    paddingVertical: 12,
  },
  stateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stateLabelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateCountBadge: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    marginLeft: 8,
  },
  stateCountBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  stateChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  stateChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
  },
  stateChipText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: '#334155',
  },
  stateChipAll: {
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
  },
  stateChipAllText: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* ── Special Row Pills & Badges ── */
  idWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idBadgeCopied: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  idBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },
  idBadgeTextCopied: {
    color: '#16A34A',
  },
  rolePill: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rolePillText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 6,
  },
  activeGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeStatusText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#059669',
  },

  /* ── App Info ── */
  appInfoContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  appInfoText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },

  /* ── Full-Width Danger Logout Button ── */
  logoutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoutIcon: {
    fontSize: 16,
    color: colors.white,
    fontFamily: fontFamily.bold,
  },
  logoutButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.white,
    letterSpacing: 0.2,
  },
});