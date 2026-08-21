import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { Images } from '../../assets/images';
import {
  colors,
  fontSize,
  borderRadius,
  inputHeight,
  fontFamily,
  spaceVertical,
  marginHorizontal,
  responsiveHeight,
} from '../../styles/variables';

export interface TextInputesProps {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  editable?: boolean;
  maxLength?: number;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  testID?: string;
}

export const TextInputes: React.FC<TextInputesProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = colors.placeholderColor,
  secureTextEntry = false,
  isPassword = false,
  leftIcon,
  rightIcon,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  labelStyle,
  editable = true,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const shouldHideText = isPassword ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          !!error && styles.inputContainerError,
          inputContainerStyle,
        ]}
      >
        {leftIcon ? (
          <View style={styles.leftIconContainer}>
            {React.isValidElement(leftIcon)
              ? React.cloneElement(leftIcon as React.ReactElement<any>, {
                  style: [
                    (leftIcon.props as any)?.style,
                    { tintColor: isFocused ? colors.iconFocused : colors.iconDefault },
                  ],
                })
              : leftIcon}
          </View>
        ) : null}

        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={shouldHideText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, inputStyle]}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconContainer}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={isPasswordVisible ? Images.eye : Images.eyeOff}
              style={[
                styles.eyeIcon,
                { tintColor: isFocused ? colors.iconFocused : colors.iconDefault },
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spaceVertical.small,
  },
  label: {
    fontSize: fontSize.extraSmall,
    color: colors.labelColor,
    letterSpacing: 1.1,
    marginBottom: spaceVertical.tinySamll,
    textTransform: 'uppercase',
    fontFamily: fontFamily.bold,
  },
  inputContainer: {
    height: inputHeight,
    backgroundColor: colors.inputBackground,
    borderWidth: 1.2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.inputRadius,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: marginHorizontal.small,
  },
  inputContainerFocused: {
    borderColor: colors.inputBorderFocused,
    backgroundColor: colors.inputBackgroundFocused,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  leftIconContainer: {
    marginRight: marginHorizontal.extraSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: marginHorizontal.extraSmall,
    alignItems: 'center',
    justifyContent: 'center',
    padding: marginHorizontal.smallest,
  },
  eyeIcon: {
    width: responsiveHeight(3),
    height:  responsiveHeight(3),
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: fontSize.normal,
    paddingVertical: 0,
    fontFamily: fontFamily.regular,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.extraSmall,
    marginTop: spaceVertical.tinySamll,
    marginLeft: marginHorizontal.smallest,
    fontFamily: fontFamily.regular,
  },
});

export default TextInputes;
