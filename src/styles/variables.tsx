import { Dimensions, Platform } from 'react-native';

const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;

// responsive
const responsiveHeight = (h: any) => {
    return deviceHeight * (h / 100);
};
const responsiveWidth = (w: any) => {
    return deviceWidth * (w / 100);
};

const navHeight = responsiveHeight(6.6);
const StatusHeight = Platform.OS === 'ios' ? 20 : 24;

// button size
const btnWidth = {
    normal: responsiveWidth(74.4),
    large: responsiveWidth(91.47),
};
let btnHeight = 48;
export const tabHeight1 = responsiveHeight(11);
export const tabHeight = responsiveHeight(8);
export const drawerWidth = responsiveWidth(80);
let smallBtnHeight = 30;
let scrollableTabHeight = 50;

// input box height
let inputHeight = 43;

// margin or padding horizontal
const marginHorizontal = {
    large: responsiveWidth(12.8), // margin = 48
    normal: responsiveWidth(8.5), // margin = 32
    semiSmall: responsiveWidth(6.4), // margin = 24
    small: responsiveWidth(4.27), // margin = 16,
    extraSmall: responsiveWidth(2),
    XXS: responsiveWidth(1),
    XLARGE: responsiveWidth(24),
    XXL: responsiveWidth(28),
    Big: responsiveWidth(36),
    extraBig: responsiveWidth(42),
    tooSmall: responsiveWidth(3),
    flatlistMargin: responsiveWidth(2),
    smallest: responsiveWidth(1),
};

// margin or padding vertical
const spaceVertical = {
    XXLarge: responsiveHeight(20),
    extraLarge: responsiveHeight(12),
    large: responsiveHeight(7.19), // space = 48
    normal: responsiveHeight(4.8), // space = 32
    semiSmall: responsiveHeight(3.6), // space = 24
    small: responsiveHeight(2.4), // space = 16
    extraSmall: responsiveHeight(1.5),
    tiny: responsiveHeight(1),
    tinySamll: responsiveHeight(0.5),
};

// Theme Colors
const colors = {
    white: '#FFFFFF',
    black: '#000000',
    primary: '#9333EA',
    primaryDark: '#7C3AED',
    primaryLight: '#A855F7',
    primaryLightCard:'#f3f1feff',
    background: '#0A0D1B',
    cardBackground: '#11162A',
    inputBackground: '#090C1B',
    inputBackgroundFocused: '#0D1126',
    cardBorder: '#1D2545',
    inputBorder: '#19203C',
    inputBorderFocused: '#9333EA',
    labelColor: '#7E8B9F',
    titleColor: '#FFFFFF',
    subtitleColor: '#8E9BB5',
    placeholderColor: '#475569',
    iconDefault: '#64748B',
    iconFocused: '#A855F7',
    error: '#EF4444',
    footerText: '#64748B',
};

// dark theme
export const darkColors = {};

// Plus Jakarta Sans font family
const fontFamily = {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semiBold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    extraBold: 'PlusJakartaSans-ExtraBold',
    light: 'PlusJakartaSans-Light',
};

const LargeDeviceScale = 1.3;

let fontSize: any = {
    tooSmall: 8,
    semiSmall: 10,
    extraSmall: 12,
    small: 14,
    normal: 16,
    medium: 18,
    extraMedium: 20,
    semiLarge: 22,
    large: 24,
    extraLarge0: 26,
    extraLarge: 30,
    XLarge: 32,
    XXLarge: 50,
    sizeGuideTxt: 23,
    sizeTxt: 64,
    starIc: 18,
    tileHeader: 12,
    addIc: 22,
    XXSmall: 10,
};

let lineHeight = {
    normal: 24,
    small: 16,
};

let borderRadius = {
    normal: 4,
    otpRadius: 8,
    semiLarge: 10,
    medium: 12,
    inputRadius: 14,
    btnRadius: 14,
    boxRadius: 20,
    cardRadius: 24,
    bigBoxRadius: 40,
    XLarge: 50,
    backNextBtn: 100,
    L150: 150,
    circle: 1000,
};

if (deviceWidth >= 768) {
    fontSize = {
        extraSmall: 12 * LargeDeviceScale,
        small: 14 * LargeDeviceScale,
        normal: 16 * LargeDeviceScale,
        medium: 18 * LargeDeviceScale,
        semiLarge: 20 * LargeDeviceScale,
        large: 24 * LargeDeviceScale,
        extraLarge: 30 * LargeDeviceScale,
        sizeGuideTxt: 64 * LargeDeviceScale,
        starIc: 18 * LargeDeviceScale,
        tileHeader: 19 * LargeDeviceScale,
        addIc: 22 * LargeDeviceScale,
    };
    lineHeight = {
        normal: 24 * LargeDeviceScale,
        small: 16 * LargeDeviceScale,
    };
    borderRadius = {
        normal: 4 * LargeDeviceScale,
        medium: 12 * LargeDeviceScale,
        inputRadius: 14 * LargeDeviceScale,
        btnRadius: 14 * LargeDeviceScale,
        backNextBtn: 100 * LargeDeviceScale,
        semiLarge: 10 * LargeDeviceScale,
        XLarge: 50 * LargeDeviceScale,
        boxRadius: 20 * LargeDeviceScale,
        cardRadius: 24 * LargeDeviceScale,
        L150: 150 * LargeDeviceScale,
        circle: 1000 * LargeDeviceScale,
        otpRadius: 8 * LargeDeviceScale,
        bigBoxRadius: 40 * LargeDeviceScale,
    };
    btnHeight = 48 * LargeDeviceScale;
    smallBtnHeight = 24 * LargeDeviceScale;
    inputHeight = 43 * LargeDeviceScale;
    scrollableTabHeight = 40 * LargeDeviceScale;
}

export {
    responsiveHeight,
    responsiveWidth,
    btnWidth,
    btnHeight,
    smallBtnHeight,
    inputHeight,
    marginHorizontal,
    spaceVertical,
    scrollableTabHeight,
    navHeight,
    StatusHeight,
    deviceHeight,
    deviceWidth,
    colors,
    fontSize,
    fontFamily,
    lineHeight,
    borderRadius,
};