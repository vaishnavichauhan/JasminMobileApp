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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: marginHorizontal.normal,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: marginHorizontal.normal,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },

  /* ── Report Row Card ── */
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 15,
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

  /* Left: ID badge */
  idBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  idText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    lineHeight: 18,
  },

  /* Middle: Title */
  titleWrapper: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14.5,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    lineHeight: 19,
  },
  reportSubtitle: {
    fontSize: 11.5,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Right: Arrow icon */
  arrowWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 16,
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
});

export { styles };
export default styles;