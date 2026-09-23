import { StyleSheet, Platform } from 'react-native';
import {
  colors,
  fontSize,
  fontFamily,
  marginHorizontal,
  borderRadius,
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
    fontSize: fontSize.large,
    fontFamily: fontFamily.bold,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: marginHorizontal.normal,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },

  /* ── Hero Banner ── */
  heroBanner: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    lineHeight: 18,
  },

  /* ── Section Header ── */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionNumberText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fontFamily.bold,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    marginLeft: 6,
  },

  /* ── Tickets Container ── */
  ticketsContainer: {
    marginBottom: 20,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ticketIconText: {
    fontSize: 20,
  },
  ticketCardContent: {
    flex: 1,
  },
  ticketCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  ticketCardTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  ticketActionTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ticketActionText: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
  },
  ticketCardDesc: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    lineHeight: 16,
  },
  ticketCardFooter: {
    marginTop: 4,
  },
  ticketMetaText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  arrowWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  arrowText: {
    fontSize: 16,
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },

  /* ── Help / Info Box ── */
  helpBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  helpBoxIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  helpBoxTitle: {
    fontSize: 13.5,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
  },
  helpBoxDesc: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    lineHeight: 17,
  },
});

export default styles;
