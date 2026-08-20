import { StyleSheet, Platform } from 'react-native';
import {
  colors,
  fontSize,
  borderRadius,
  spaceVertical,
  marginHorizontal,
  fontFamily,
  btnHeight,
  responsiveWidth,
  responsiveHeight,
} from '../../../styles/variables';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: marginHorizontal.small,
    paddingTop: spaceVertical.large,
    paddingBottom: 80,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spaceVertical.semiSmall,
  },
  logoWrapper: {
    marginBottom: spaceVertical.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: responsiveWidth(44),
    height:responsiveWidth(18),
  },
  title: {
    fontSize: fontSize.extraLarge,
    fontWeight: '800',
    color: colors.titleColor,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: spaceVertical.tinySamll,
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    fontSize: fontSize.extraSmall,
    color: colors.subtitleColor,
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.1,
    fontFamily: fontFamily.regular,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.cardRadius,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: marginHorizontal.small,
    paddingTop: spaceVertical.semiSmall,
    paddingBottom: spaceVertical.small,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  inputIcon: {
    width: responsiveHeight(2.5),
    height: responsiveHeight(2.5),
  },
  buttonIcon: {
    width: responsiveHeight(2),
    height: responsiveHeight(2),
    tintColor: colors.white,
  },
  signInButton: {
    marginTop: spaceVertical.tinySamll,
    height: btnHeight,
    borderRadius: borderRadius.btnRadius,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  signInButtonText: {
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fontFamily.bold,
  },
  footerTextContainer: {
    marginTop: spaceVertical.semiSmall,
    alignItems: 'center',
  },
  footerText: {
    color: colors.footerText,
    fontSize: fontSize.extraSmall,
    fontFamily: fontFamily.regular,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: spaceVertical.small,
  },
  errorBannerIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  errorBannerContent: {
    flex: 1,
  },
  errorBannerTitle: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#991B1B',
    marginBottom: 2,
  },
  errorBannerText: {
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    color: '#DC2626',
    lineHeight: 16,
  },
  errorBannerClose: {
    fontSize: 14,
    color: '#991B1B',
    paddingLeft: 8,
    fontWeight: 'bold',
  },
});