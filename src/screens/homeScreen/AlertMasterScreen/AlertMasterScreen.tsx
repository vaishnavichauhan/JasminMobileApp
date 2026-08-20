import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from './AlertMasterStyles';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../styles/variables';
import { useAlertStore, AlertFilter } from '../../../store';
import { AlertItem } from '../../../api/alertsApi';

interface AlertMasterScreenProps {
  navigation?: any;
}

const AlertMasterScreen: React.FC<AlertMasterScreenProps> = ({ navigation }) => {
  const { token } = useAuth();
  const [failedImages, setFailedImages] = React.useState<Record<string | number, boolean>>({});

  // Zustand Store
  const {
    alertsList,
    loading,
    refreshing,
    error,
    searchQuery,
    statusFilter,
    isStatusModalOpen,
    expandedCardIds,
    setSearchQuery,
    clearSearchQuery,
    setStatusFilter,
    setIsStatusModalOpen,
    toggleExpandCard,
    resetExpandedCards,
    loadAlerts,
    onRefresh,
  } = useAlertStore();

  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadAlerts(token);
  }, [token, loadAlerts]);

  // Reset expanded 'see more' cards whenever screen changes or comes into focus
  useFocusEffect(
    React.useCallback(() => {
      resetExpandedCards();
    }, [resetExpandedCards])
  );

  const handleBack = () => {
    if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Dashboard');
    }
  };

  // Counts for dropdown
  const activeCount = useMemo(
    () => alertsList.filter((a) => a.active === 1).length,
    [alertsList]
  );
  const inactiveCount = useMemo(
    () => alertsList.filter((a) => a.active === 0).length,
    [alertsList]
  );

  // Filtered List based on search query (title only) and active status filter
  const filteredAlertsList = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return alertsList.filter((item) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && item.active !== 1) return false;
      if (statusFilter === 'INACTIVE' && item.active !== 0) return false;

      // Search filter (matches TITLE ONLY)
      if (!query) return true;
      return String(item.title || '').toLowerCase().includes(query);
    });
  }, [alertsList, searchQuery, statusFilter]);

  const renderAlertCard = ({ item, index }: { item: AlertItem; index: number }) => {
    const isActive = item.active === 1;
    const isExpanded = Boolean(expandedCardIds[item.id]);
    const hasLongDesc = Boolean(item.description && item.description.trim().length > 35);
    const hasImage = Boolean(
      item.image_url &&
      item.image_url.trim().length > 0 &&
      !failedImages[item.id]
    );

    return (
      <View
        key={String(item.id ?? index)}
        style={[
          styles.alertCard,
          isActive ? styles.alertCardActive : styles.alertCardInactive,
        ]}
      >
        {/* Full Card Size Image Box with Floating Status Badge */}
        <View style={styles.imageContainer}>
          {hasImage ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.cardImage}
              resizeMode="cover"
              onError={() => {
                setFailedImages((prev) => ({ ...prev, [item.id]: true }));
              }}
            />
          ) : (
            <View style={styles.fallbackIconWrapper}>
              <Image
                source={Images.notification}
                style={styles.fallbackIcon}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Floating Status Badge (Green dot + ACTIVE) */}
          <View
            style={[
              styles.floatingStatusBadge,
              isActive
                ? styles.floatingStatusBadgeActive
                : styles.floatingStatusBadgeInactive,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isActive ? styles.statusDotActive : styles.statusDotInactive,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                isActive ? styles.statusTextActive : styles.statusTextInactive,
              ]}
            >
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* Card Body: Title (Left) & Description (Left) with See More */}
        <View style={styles.cardBody}>
          <View
            style={[
              styles.titleWrapper,
              isActive && styles.titleWrapperActive,
            ]}
          >
            <Text
              style={styles.alertTitleText}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {item.title}
            </Text>
          </View>

          {item.description ? (
            <View style={styles.descContainer}>
              <Text
                style={styles.alertDescriptionText}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {item.description}
              </Text>

              {hasLongDesc && (
                <TouchableOpacity
                  onPress={() => toggleExpandCard(item.id)}
                  activeOpacity={0.7}
                  style={styles.seeMoreBtn}
                  hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
                >
                  <Text style={styles.seeMoreText}>
                    {isExpanded ? 'See less' : '... see more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Top Header (Title: Alert) ── */}
      <Header
        title="Alert"
        showBack={true}
        onBackPress={handleBack}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* ── Main Container ── */}
      <View style={styles.mainContainer}>
        {/* ── Search Bar & Right Side Status Dropdown ── */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => searchInputRef.current?.focus()}
            style={styles.searchContainer}
          >
            <Image
              source={Images.filter}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search alert title..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearchQuery}
                style={styles.clearSearchBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Right Side Status Dropdown Button */}
          <TouchableOpacity
            style={styles.statusDropdownBtn}
            activeOpacity={0.8}
            onPress={() => setIsStatusModalOpen(true)}
          >
            <Text style={styles.statusDropdownText} numberOfLines={1}>
              {statusFilter === 'ALL'
                ? 'All'
                : statusFilter === 'ACTIVE'
                ? 'Active'
                : 'Inactive'}
            </Text>
            <Image
              source={Images.down}
              style={styles.statusDropdownIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* ── 2-Column Grid FlatList of Alerts ── */}
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading alerts...</Text>
          </View>
        ) : error && isAccessDeniedError(error) ? (
          <AccessDenied
            message={error}
            onRetry={() => loadAlerts(token)}
            onGoBack={handleBack}
          />
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: '#DC2626' }]}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAlertsList}
            renderItem={renderAlertCard}
            keyExtractor={(item, index) => String(item.id ?? index)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => onRefresh(token)}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Image
                    source={Images.notification}
                    style={styles.emptyIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.emptyText}>
                  {searchQuery.trim()
                    ? `No alerts matching "${searchQuery}" found`
                    : statusFilter === 'ACTIVE'
                    ? 'No active alerts found'
                    : statusFilter === 'INACTIVE'
                    ? 'No inactive alerts found'
                    : 'No alerts found'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── Status Dropdown Modal (All, Active, Inactive) ── */}
      <Modal
        visible={isStatusModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStatusModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsStatusModalOpen(false)}
        >
          <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Status</Text>
              <TouchableOpacity
                onPress={() => setIsStatusModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Option: All */}
            <TouchableOpacity
              style={[
                styles.modalOptionItem,
                statusFilter === 'ALL' && styles.modalOptionItemActive,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                setStatusFilter('ALL');
                setIsStatusModalOpen(false);
              }}
            >
              <View style={styles.modalOptionLeft}>
                <View
                  style={[
                    styles.modalOptionDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    statusFilter === 'ALL' && styles.modalOptionTextActive,
                  ]}
                >
                  All ({alertsList.length})
                </Text>
              </View>
              {statusFilter === 'ALL' && (
                <Text style={styles.modalCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            {/* Option: Active */}
            <TouchableOpacity
              style={[
                styles.modalOptionItem,
                statusFilter === 'ACTIVE' && styles.modalOptionItemActive,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                setStatusFilter('ACTIVE');
                setIsStatusModalOpen(false);
              }}
            >
              <View style={styles.modalOptionLeft}>
                <View
                  style={[
                    styles.modalOptionDot,
                    { backgroundColor: '#16A34A' },
                  ]}
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    statusFilter === 'ACTIVE' && styles.modalOptionTextActive,
                  ]}
                >
                  Active ({activeCount})
                </Text>
              </View>
              {statusFilter === 'ACTIVE' && (
                <Text style={styles.modalCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            {/* Option: Inactive */}
            <TouchableOpacity
              style={[
                styles.modalOptionItem,
                statusFilter === 'INACTIVE' && styles.modalOptionItemActive,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                setStatusFilter('INACTIVE');
                setIsStatusModalOpen(false);
              }}
            >
              <View style={styles.modalOptionLeft}>
                <View
                  style={[
                    styles.modalOptionDot,
                    { backgroundColor: '#64748B' },
                  ]}
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    statusFilter === 'INACTIVE' && styles.modalOptionTextActive,
                  ]}
                >
                  Inactive ({inactiveCount})
                </Text>
              </View>
              {statusFilter === 'INACTIVE' && (
                <Text style={styles.modalCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default AlertMasterScreen;
