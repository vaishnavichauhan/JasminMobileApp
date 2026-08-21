import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  colors,
  fontSize,
  borderRadius,
  btnHeight,
  fontFamily,
  marginHorizontal,
} from '../../styles/variables';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'right',
  style,
  textStyle,
  testID,
}) => {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? (
            <View style={styles.iconLeft}>{icon}</View>
          ) : null}

          <Text style={[styles.title, textStyle]}>{title}</Text>

          {icon && iconPosition === 'right' ? (
            <View style={styles.iconRight}>{icon}</View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: btnHeight,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.btnRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: marginHorizontal.small,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.white,
    fontSize: fontSize.normal,
    letterSpacing: 0.3,
    fontFamily: fontFamily.bold,
  },
  iconLeft: {
    marginRight: marginHorizontal.extraSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRight: {
    marginLeft: marginHorizontal.extraSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
