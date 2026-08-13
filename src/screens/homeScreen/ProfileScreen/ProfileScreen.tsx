import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { styles } from './ProfileScreenStyles';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import { colors } from '../../../styles/variables';
import { useAuth } from '../../../context/AuthContext';

interface ProfileScreenProps {
  navigation?: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();

  // User values
  const username = user?.name || user?.username || 'Administrator';
  const firstLetter = (username.charAt(0) || 'A').toUpperCase();
  const email = user?.email || user?.emailId || 'admin@jasminerp.com';
  const mobile =
    user?.mobile || user?.mobileNumber || user?.phone || user?.contact || '+91 98765 43210';
  const role = user?.role || user?.userRole || 'Super Admin';
  const department = user?.department || 'Jasmin ERP • Operations';
  const userId = user?.id || user?.userId || user?._id || 'ERP-2026';

  const handleBack = () => {
    if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Dashboard');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Jasmin ERP?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } catch (e) {
            console.warn('Logout error:', e);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* 1. Reusable Top Header */}
      <Header title="Profile" onBackPress={handleBack} />

      {/* 2. Primary Color Background Section with User Initial Avatar (Fixed) */}
      <View style={styles.primaryBannerSection}>
        <View style={styles.avatarWrapper}>
          <Text style={styles.avatarInitial}>{firstLetter}</Text>
        </View>
        <Text style={styles.bannerUserName}>{username}</Text>
        <Text style={styles.bannerUserRole}>{role}</Text>
      </View>

      {/* 3. Details Card Section (Only this section scrolls) */}
      <View style={styles.detailsCardSection}>
        <ScrollView
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoList}>
            {/* User Name */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User Name</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {username}
              </Text>
            </View>

            {/* User ID */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {userId}
              </Text>
            </View>

            {/* Email */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {email}
              </Text>
            </View>

            {/* Mobile Number */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {mobile}
              </Text>
            </View>

            {/* Role */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {role}
              </Text>
            </View>

            {/* Department */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {department}
              </Text>
            </View>
          </View>

          {/* 4. Logout Row (Left side "Logout", Right side arrow) */}
          <TouchableOpacity
            style={styles.logoutRow}
            activeOpacity={0.7}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Text style={styles.logoutText}>Logout</Text>
            {loggingOut ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Image
                source={Images.arrowRight}
                style={styles.logoutArrowIcon}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default ProfileScreen;
