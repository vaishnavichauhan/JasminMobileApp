import { StyleSheet, Platform } from 'react-native';
import {
  colors,
  fontSize,
  fontFamily,
} from '../styles/variables';

export const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    borderLeftWidth: 1,
    borderLeftColor: colors.cardBorder,
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'space-around',
    height: Platform.OS === 'ios' ? 64 : 54, // Reduced height
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 10 : 4,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
  tabLabel: {
    fontSize: fontSize.tooSmall || 10,
    fontFamily: fontFamily.medium,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default styles;
