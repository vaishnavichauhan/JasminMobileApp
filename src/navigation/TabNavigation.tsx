import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../screens/homeScreen/DashboardScreen/DashboardScreen';
import ReportsScreen from '../screens/homeScreen/ReportsScreen.tsx/ReportsScreen';
import PriceListScreen from '../screens/homeScreen/PriceListScreen/PriceListScreen';
import OffersScreen from '../screens/homeScreen/OffersScreen/OffersScreen';
import Images from '../assets/images';
import {
  colors,
  fontSize,
  fontFamily,
  borderRadius,
  marginHorizontal,
  spaceVertical,
  responsiveWidth,
  responsiveHeight,
} from '../styles/variables';

export type BottomTabParamList = {
  Dashboard: undefined;
  PriceList: undefined;
  Offers: undefined;
  Reports: undefined;
  ToggleMenu: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Dummy component for ToggleMenu tab placeholder
const EmptyComponent = () => null;

export interface TabNavigationProps {
  navigation?: any;
  onLogout?: () => void;
  user?: any;
}

interface QuickPillItemProps {
  title: string;
  icon: any;
  onPress: (nav: any) => void;
}

const QuickPillItem: React.FC<QuickPillItemProps> = ({
  title,
  icon,
  onPress,
}) => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={tabStyles.pillItem}
      activeOpacity={0.75}
      onPress={() => onPress(navigation)}
    >
      <View style={tabStyles.pillIconBadge}>
        <Image
          source={icon}
          style={tabStyles.pillIcon}
          resizeMode="contain"
        />
      </View>
      <Text style={tabStyles.pillTitle} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// 3-Bar Toggle Menu Icon component
const ToggleMenuIcon: React.FC<{ focused: boolean }> = ({ focused }) => {
  const barColor = focused ? colors.white : '#94A3B8';
  return (
    <View style={focused ? tabStyles.activeToggleBox : tabStyles.inactiveToggleContainer}>
      <View style={[tabStyles.toggleBar, { width: 17, backgroundColor: barColor }]} />
      <View style={[tabStyles.toggleBar, { width: 12, backgroundColor: barColor, marginVertical: 3 }]} />
      <View style={[tabStyles.toggleBar, { width: 17, backgroundColor: barColor }]} />
    </View>
  );
};

// Animated Tab Icon with Spring Scale Increase Animation on Tab Click
interface AnimatedTabIconProps {
  focused: boolean;
  icon?: any;
  isToggleMenu?: boolean;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  focused,
  icon,
  isToggleMenu,
}) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.88)).current;
  const translateYAnim = useRef(
    new Animated.Value(focused ? (Platform.OS === 'ios' ? -16 : -14) : 0)
  ).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          friction: 4.5,
          tension: 130,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: Platform.OS === 'ios' ? -16 : -14,
          friction: 4.5,
          tension: 130,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.spring(scaleAnim, {
          toValue: 1.0,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <View style={focused ? tabStyles.activeBubbleWrapper : tabStyles.inactiveIconWrapper}>
      {focused ? (
        <Animated.View
          style={[
            tabStyles.activeCircle,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim },
              ],
            },
          ]}
        >
          {isToggleMenu ? (
            <ToggleMenuIcon focused={true} />
          ) : (
            <Image
              source={icon}
              style={tabStyles.activeIcon}
              resizeMode="contain"
            />
          )}
        </Animated.View>
      ) : (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {isToggleMenu ? (
            <ToggleMenuIcon focused={false} />
          ) : (
            <Image
              source={icon}
              style={tabStyles.inactiveIcon}
              resizeMode="contain"
            />
          )}
        </Animated.View>
      )}
    </View>
  );
};

export const TabNavigation: React.FC<TabNavigationProps> = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const [plusMenuVisible, setPlusMenuVisible] = useState(false);

  // 3D Spring and Scale Animation values for Quick Menu Modal
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (plusMenuVisible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
      translateYAnim.setValue(30);
    }
  }, [plusMenuVisible]);

  const tabHeight = Platform.OS === 'ios'
    ? (bottomInset > 0 ? 54 + bottomInset : 64)
    : 62;
  const tabBottomOffset = Platform.OS === 'ios'
    ? (bottomInset > 0 ? 8 : 12)
    : 10;
  const menuBottomSpacing = tabHeight + tabBottomOffset + 14;

  const closeMenuWithAnimation = (callback?: () => void) => {
    setPlusMenuVisible(false);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 20,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  const handleMenuSelect = (navigation: any, routeName: string) => {
    setPlusMenuVisible(false);
    setTimeout(() => {
      if (['Dashboard', 'PriceList', 'Offers', 'Reports'].includes(routeName)) {
        try {
          navigation.navigate('Home', { screen: routeName });
        } catch (e) {
          navigation.navigate(routeName);
        }
      } else {
        navigation.navigate(routeName);
      }
    }, 50);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: '#F1F5F9',
            marginHorizontal: 12,
            height: tabHeight,
            paddingBottom: Platform.OS === 'ios'
              ? (bottomInset > 0 ? bottomInset - 4 : 8)
              : 8,
            paddingTop: 6,
            position: 'absolute',
            bottom: tabBottomOffset,
            left: 0,
            right: 0,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 14,
            elevation: 10,
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: {
            fontSize: fontSize.tooSmall || 10,
            fontFamily: fontFamily.bold,
            marginTop: 2,
            marginBottom: 2,
          },
        }}
      >
        {/* 1. Tab 1: Dashboard */}
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarLabelStyle: {
              fontSize: fontSize.tooSmall || 10,
              fontFamily: fontFamily.bold,
              marginTop: 2,
              marginBottom: 2,
              color: (!plusMenuVisible) ? undefined : '#94A3B8',
            },
            tabBarIcon: ({ focused }) => {
              const isTabActive = focused && !plusMenuVisible;
              return (
                <AnimatedTabIcon
                  focused={isTabActive}
                  icon={Images.dashboardIcon}
                />
              );
            },
          }}
        />

        {/* 2. Tab 2: PriceList */}
        <Tab.Screen
          name="PriceList"
          component={PriceListScreen}
          options={{
            tabBarLabel: 'PriceList',
            tabBarLabelStyle: {
              fontSize: fontSize.tooSmall || 10,
              fontFamily: fontFamily.bold,
              marginTop: 2,
              marginBottom: 2,
              color: (!plusMenuVisible) ? undefined : '#94A3B8',
            },
            tabBarIcon: ({ focused }) => {
              const isTabActive = focused && !plusMenuVisible;
              return (
                <AnimatedTabIcon
                  focused={isTabActive}
                  icon={Images.clipboard}
                />
              );
            },
          }}
        />

        {/* 3. Tab 3: Offers */}
        <Tab.Screen
          name="Offers"
          component={OffersScreen}
          options={{
            tabBarLabel: 'Offers',
            tabBarLabelStyle: {
              fontSize: fontSize.tooSmall || 10,
              fontFamily: fontFamily.bold,
              marginTop: 2,
              marginBottom: 2,
              color: (!plusMenuVisible) ? undefined : '#94A3B8',
            },
            tabBarIcon: ({ focused }) => {
              const isTabActive = focused && !plusMenuVisible;
              return (
                <AnimatedTabIcon
                  focused={isTabActive}
                  icon={Images.offer}
                />
              );
            },
          }}
        />

        {/* 4. Tab 4: Reports */}
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            tabBarLabel: 'Reports',
            tabBarLabelStyle: {
              fontSize: fontSize.tooSmall || 10,
              fontFamily: fontFamily.bold,
              marginTop: 2,
              marginBottom: 2,
              color: (!plusMenuVisible) ? undefined : '#94A3B8',
            },
            tabBarIcon: ({ focused }) => {
              const isTabActive = focused && !plusMenuVisible;
              return (
                <AnimatedTabIcon
                  focused={isTabActive}
                  icon={Images.report}
                />
              );
            },
          }}
        />

        {/* 5. Tab 5: Toggle Menu Button with Instant Highlight */}
        <Tab.Screen
          name="ToggleMenu"
          component={EmptyComponent}
          options={{
            tabBarLabel: 'Menu',
            tabBarLabelStyle: {
              fontSize: fontSize.tooSmall || 10,
              fontFamily: fontFamily.bold,
              marginTop: 2,
              marginBottom: 2,
              color: plusMenuVisible ? colors.primary : '#94A3B8',
            },
            tabBarIcon: ({ focused }) => {
              const isMenuActive = focused || plusMenuVisible;
              return (
                <AnimatedTabIcon
                  focused={isMenuActive}
                  isToggleMenu={true}
                />
              );
            },
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setPlusMenuVisible(true);
            },
          }}
        />
      </Tab.Navigator>

      {/* 3D Floating Spring Pop-Up Quick Menu Modal */}
      <Modal
        visible={plusMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeMenuWithAnimation()}
      >
        <TouchableWithoutFeedback onPress={() => closeMenuWithAnimation()}>
          <View style={[tabStyles.modalOverlay, { paddingBottom: menuBottomSpacing }]}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  tabStyles.menuCard,
                  {
                    opacity: opacityAnim,
                    transform: [
                      { scale: scaleAnim },
                      { translateY: translateYAnim },
                    ],
                  },
                ]}
              >
                {/* Header */}
                <View style={tabStyles.menuHeader}>
                  <Text style={tabStyles.menuTitle}>Menu</Text>
                  <TouchableOpacity
                    style={tabStyles.closeBtn}
                    activeOpacity={0.7}
                    onPress={() => closeMenuWithAnimation()}
                  >
                    <Text style={tabStyles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Vertical Stack of 3D Pill Views */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={tabStyles.verticalListContainer}
                >
                  {/* 1. Dashboard */}
                  <QuickPillItem
                    title="Dashboard"
                    icon={Images.dashboardIcon}
                    onPress={(nav) => handleMenuSelect(nav, 'Dashboard')}
                  />

                  {/* 2. Home */}
                  <QuickPillItem
                    title="Home"
                    icon={Images.home}
                    onPress={(nav) => handleMenuSelect(nav, 'HomeScreen')}
                  />

                  {/* 3. PriceList */}
                  <QuickPillItem
                    title="PriceList"
                    icon={Images.clipboard}
                    onPress={(nav) => handleMenuSelect(nav, 'PriceList')}
                  />

                  {/* 4. Alert */}
                  <QuickPillItem
                    title="Alert"
                    icon={Images.notification}
                    onPress={(nav) => handleMenuSelect(nav, 'AlertMaster')}
                  />

                  {/* 5. Offers */}
                  <QuickPillItem
                    title="Offers"
                    icon={Images.offer}
                    onPress={(nav) => handleMenuSelect(nav, 'Offers')}
                  />

                  {/* 6. Reports */}
                  <QuickPillItem
                    title="Reports"
                    icon={Images.report}
                    onPress={(nav) => handleMenuSelect(nav, 'Reports')}
                  />

                  {/* 7. Profile */}
                  <QuickPillItem
                    title="Profile"
                    icon={Images.user}
                    onPress={(nav) => handleMenuSelect(nav, 'Profile')}
                  />
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  activeBubbleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  inactiveIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  activeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  activeIcon: {
    width: 22,
    height: 22,
    tintColor: colors.white,
  },
  inactiveIcon: {
    width: 22,
    height: 22,
    tintColor: '#94A3B8',
  },
  activeToggleBox: {
    width: 22,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveToggleContainer: {
    width: 22,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBar: {
    height: 2,
    borderRadius: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  menuCard: {
    backgroundColor: colors.white,
    alignSelf: 'flex-end',
    marginRight: 14,
    width: 145,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 8,
    maxHeight: '68%',
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 20,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 5,
    paddingHorizontal: 2,
  },
  menuTitle: {
    fontSize: fontSize.extraSmall || 12,
    color: colors.black,
    fontFamily: fontFamily.bold,
  },
  closeBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 9,
    color: colors.subtitleColor,
    fontFamily: fontFamily.bold,
  },
  verticalListContainer: {
    paddingTop: 1,
    paddingBottom: 1,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginBottom: 4,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#6B21A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pillIconBadge: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pillIcon: {
    width: 13,
    height: 13,
    tintColor: colors.primary,
  },
  pillTitle: {
    flex: 1,
    fontSize: 11.5,
    color: colors.black,
    fontFamily: fontFamily.bold,
  },
});

export default TabNavigation;
