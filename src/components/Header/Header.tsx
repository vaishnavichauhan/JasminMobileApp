import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Images from '../../assets/images';
import {
  colors,
  fontSize,
  fontFamily,
  spaceVertical,
  marginHorizontal,
  responsiveWidth,
} from '../../styles/variables';

export interface HeaderProps {
  title?: string;
  onBackPress?: () => void;
  showBack?: boolean;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  iconStyle?: StyleProp<ImageStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBackPress,
  showBack = true,
  leftComponent,
  rightComponent,
  style,
  titleStyle,
  iconColor,
  iconStyle,
}) => {
  const insets = useSafeAreaInsets();
  const topInset =
    insets.top > 0
      ? insets.top
      : Platform.OS === 'ios'
      ? 1
      : StatusBar.currentHeight || 0;
  const dynamicTopPadding = topInset + (Platform.OS === 'ios' ? 1 : 8);

  return (
    <View style={[styles.header, { paddingTop: dynamicTopPadding }, style]}>
      {leftComponent ? (
        leftComponent
      ) : showBack && onBackPress ? (
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={onBackPress}
        >
          <Image
            source={Images.arrowRight}
            style={[
              styles.backArrowIcon,
              iconColor ? { tintColor: iconColor } : null,
              iconStyle,
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : null}

      {title ? (
        <Text
          style={[styles.headerTitle, titleStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      ) : null}

      {rightComponent ? (
        <View style={styles.rightContainer}>{rightComponent}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: marginHorizontal.small,
    paddingBottom: spaceVertical.small,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.subtitleColor,
    backgroundColor: colors.white,
  },
  backButton: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: marginHorizontal.small,
  },
  backArrowIcon: {
    width: fontSize.starIc,
    height: fontSize.starIc,
    tintColor: colors.black,
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.semiLarge,
    color: colors.black,
    fontFamily: fontFamily.bold,
  },
  rightContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default Header;
