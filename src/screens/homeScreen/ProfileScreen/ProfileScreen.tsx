import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { styles } from './ProfileScreenStyles';
import Header from '../../../components/Header/Header';
import { colors } from '../../../styles/variables';
import { useAuth } from '../../../context/AuthContext';
import {
  checkAppUpdateApi,
  triggerApkDownload,
  AppUpdateResponse,
  CURRENT_APP_VERSION,
} from '../../../api/appUpdateApi';

interface ProfileScreenProps {
  navigation?: any;
}

const parseStatesList = (rawState: any): string[] => {
  if (!rawState) return [];
  let parsed: any = rawState;

  if (typeof rawState === 'string') {
    const trimmed = rawState.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = [trimmed];
      }
    } else if (trimmed.includes(',')) {
      parsed = trimmed.split(',').map((s) => s.trim());
    } else if (trimmed && trimmed !== '-') {
      parsed = [trimmed];
    } else {
      parsed = [];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map((s) => String(s ?? '').trim())
      .filter((s) => s.length > 0 && s !== '-');
  }

  return [];
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [loggingOut, setLoggingOut] = useState(false);
  const [_copiedId, setCopiedId] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateResponse | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const { user, logout } = useAuth();
  const currentAppVersion = CURRENT_APP_VERSION;

  const handleCheckUpdate = useCallback(async (isManual = false) => {
    try {
      setCheckingUpdate(true);
      const res = await checkAppUpdateApi(currentAppVersion);
      console.log('[ProfileScreen] Check update response:', res);
      setUpdateInfo(res);

      if (res.updateRequired) {
        await logout();
        Alert.alert(
          'Update Required',
          `Update is compulsory. A new version (${res.latestVersion || 'latest'}) of Jasmin Mobile App is available!\n\nPlease update the application to continue.`,
          [
            {
              text: 'Close',
              style: 'cancel',
            },
            {
              text: 'Update APK',
              onPress: () =>
                triggerApkDownload(
                  res.downloadUrl,
                  res.apkAvailable,
                  res.latestVersion
                ),
            },
          ],
          { cancelable: true }
        );
        return;
      }

      if (isManual) {
        Alert.alert(
          'App Up to Date',
          `You are already using the latest version of Jasmin Mobile App (v${currentAppVersion}).`
        );
      }
    } catch (e: any) {
      console.warn('[ProfileScreen] Check update error:', e);
      if (isManual) {
        Alert.alert('Update Check Failed', e?.message || 'Unable to check for updates.');
      }
    } finally {
      setCheckingUpdate(false);
    }
  }, [currentAppVersion, logout]);

  useEffect(() => {
    handleCheckUpdate(false);
  }, [handleCheckUpdate]);

  // User values
  const username = user?.username || '-';
  const name = user?.name || '-';
  const statesList = parseStatesList(user?.state ?? user?.states ?? user?.state_name ?? user?.allowed_states);
  const firstLetter = (name.charAt(0) || 'A').toUpperCase();
  const email = user?.email || '-';
  const mobile = user?.mob_no || user?.mobile || user?.phone || '-';
  const role = user?.role || '-';
  const userID= user?.id || '-';
  const userId = String(user?.id ?? '-');

  const handleBack = () => {
    if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Dashboard');
    }
  };

  const handleCopyUserId = () => {
    if (userId && userId !== '-') {
      Clipboard.setString(userId);
    }
    setCopiedId(true);
    setTimeout(() => {
      setCopiedId(false);
    }, 2000);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
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
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Top Header */}
      <Header
        title="Profile"
        showBack={true}
        onBackPress={handleBack}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Hero Overview Header */}
      <View style={styles.heroSection}>
        <View style={styles.avatarWrapper}>
          <Text style={styles.avatarInitial}>{firstLetter}</Text>
        </View>
{/* 
        <View style={styles.heroBadgesRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Name: {name !== '-' ? name : username}</Text>
          </View>
        </View> */}
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Personal Details */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderIcon}>👤</Text>
              <Text style={styles.cardHeaderText}>Personal Details</Text>
            </View>

            <View style={styles.cardBody}>
              {/* Name */}
              <View style={styles.itemRow}>
                <View style={styles.itemLabelWrap}>
                  <Text style={styles.itemLabel}>Name</Text>
                </View>
                <Text style={styles.itemValue} numberOfLines={1}>
                  {name}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* User Name */}
              <View style={styles.itemRow}>
                <View style={styles.itemLabelWrap}>
                  <Text style={styles.itemLabel}>User Name</Text>
                </View>
                <Text style={styles.itemValue} numberOfLines={1}>
                  {username}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Email */}
              <View style={styles.itemRow}>
                <View style={styles.itemLabelWrap}>
                  <Text style={styles.itemLabel}>Email</Text>
                </View>
                <Text style={styles.itemValue} numberOfLines={1}>
                  {email}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Mobile Number */}
              <View style={styles.itemRow}>
                <View style={styles.itemLabelWrap}>
                  <Text style={styles.itemLabel}>Mobile Number</Text>
                </View>
                <Text style={styles.itemValue} numberOfLines={1}>
                  {mobile}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* State / Assigned States */}
              <View style={styles.stateItemRow}>
                <View style={styles.stateHeaderRow}>
                  <View style={styles.stateLabelWithBadge}>
                    <Text style={styles.itemLabel}>
                      {statesList.length > 1 ? 'Assigned States' : 'State'}
                    </Text>
                    {statesList.length > 1 && (
                      <View style={styles.stateCountBadge}>
                        <Text style={styles.stateCountBadgeText}>{statesList.length}</Text>
                      </View>
                    )}
                  </View>
                  {statesList.length === 0 && (
                    <Text style={styles.itemValue}>-</Text>
                  )}
                  {statesList.length === 1 && (
                    <View
                      style={[
                        styles.stateChip,
                        statesList[0].toLowerCase() === 'all' && styles.stateChipAll,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stateChipText,
                          statesList[0].toLowerCase() === 'all' && styles.stateChipAllText,
                        ]}
                      >
                        {statesList[0]}
                      </Text>
                    </View>
                  )}
                </View>

                {statesList.length > 1 && (
                  <View style={styles.stateChipsContainer}>
                    {statesList.map((st, idx) => {
                      const isAll = st.toLowerCase() === 'all';
                      return (
                        <View
                          key={`${st}-${idx}`}
                          style={[styles.stateChip, isAll && styles.stateChipAll]}
                        >
                          <Text
                            style={[
                              styles.stateChipText,
                              isAll && styles.stateChipAllText,
                            ]}
                          >
                            {st}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Card 2: Account & Access */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderIcon}>🛡️</Text>
              <Text style={styles.cardHeaderText}>Account & Access</Text>
            </View>

            <View style={styles.cardBody}>
              {/* User ID */}
              <TouchableOpacity
                style={styles.itemRow}
                activeOpacity={0.7}
                onPress={handleCopyUserId}
              >
                <View style={styles.itemLabelWrap}>
                  <Text style={styles.itemLabel}>User ID</Text>
                </View>

                <View style={styles.idWrap}>
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>{userID}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Role */}
              <View style={styles.itemRow}>
                <View style={styles.itemLabelWrap}>
                  <Text style={styles.itemLabel}>Access Role</Text>
                </View>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{role}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Account Status */}
              
            </View>
          </View>

         

          {/* Card 3: App Version & Updates */}
          <View style={[styles.card, updateInfo?.updateRequired && styles.cardHighlighted]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerTitleRow}>
                <View
                  style={[
                    styles.updateHeaderIconBox,
                    !updateInfo?.updateRequired && styles.updateHeaderIconBoxNeutral,
                  ]}
                >
                  <Text style={styles.cardHeaderIcon}>
                    {updateInfo?.updateRequired ? '🚀' : '📱'}
                  </Text>
                </View>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.cardHeaderText}>App Version & Updates</Text>
                  <Text style={styles.cardSubText}>
                    {updateInfo?.updateRequired
                      ? 'New version ready to download'
                      : 'Jasmin Mobile ERP'}
                  </Text>
                </View>
              </View>

              {updateInfo?.updateRequired ? (
                <TouchableOpacity
                  style={styles.headerUpdateBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    triggerApkDownload(
                      updateInfo.downloadUrl,
                      updateInfo.apkAvailable,
                      updateInfo.latestVersion
                    )
                  }
                >
                  <Text style={styles.headerUpdateBtnIcon}>⬇️</Text>
                  <Text style={styles.headerUpdateBtnText}>Update</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.upToDateBadge}>
                  <Text style={styles.upToDateBadgeText}>Up to Date ✓</Text>
                </View>
              )}
            </View>

            <View style={styles.cardBody}>
              {updateInfo?.updateRequired ? (
                <>
                  {/* Version Comparison Card */}
                  <View style={styles.versionCompareRow}>
                    <View style={styles.versionCardItem}>
                      <Text style={styles.versionCardLabel}>INSTALLED</Text>
                      <Text style={styles.versionCardNumber}>v{currentAppVersion}</Text>
                    </View>

                    <View style={styles.versionArrowCircle}>
                      <Text style={styles.versionArrowText}>➔</Text>
                    </View>

                    <View style={[styles.versionCardItem, styles.versionCardItemLatest]}>
                      <Text style={styles.versionCardLabelLatest}>LATEST</Text>
                      <Text style={styles.versionCardNumberLatest}>
                        v{updateInfo.latestVersion || 'New'}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Current Version */}
                 

                  <View style={styles.divider} />

                  {/* Check Status */}
                  <View style={styles.itemRow}>
                    <View style={styles.itemLabelWrap}>
                      <Text style={styles.itemLabel}>Status</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.checkUpdateBtn}
                      onPress={() => handleCheckUpdate(true)}
                      disabled={checkingUpdate}
                      activeOpacity={0.7}
                    >
                      {checkingUpdate ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <View style={styles.checkUpdateContent}>
                          <Text style={styles.checkUpdateBtnIcon}>🔄</Text>
                          <Text style={styles.checkUpdateBtnText}>Check for Updates</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Full-width Danger Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.logoutIcon}>⏻</Text>
                <Text style={styles.logoutButtonText}>Log Out of Account</Text>
              </>
            )}
          </TouchableOpacity>
           {/* App Info Footer */}
          <View style={styles.appInfoContainer}>
            <Text style={styles.appInfoText}>
              Jasmin Mobile App Version • {currentAppVersion}
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default ProfileScreen;
