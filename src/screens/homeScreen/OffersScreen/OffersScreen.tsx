import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  SafeAreaView,
} from 'react-native';
import styles from './OffersStyles';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../styles/variables';
import { OfferItem } from '../../../api/offersApi';
import { useOffersStore, OfferTab } from '../../../store';

interface OffersScreenProps {
  navigation?: any;
}

const formatToDDMMYYYY = (dateStr: any): string => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  if (str.includes('-')) {
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4) {
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
  }
  return str;
};

const OffersScreen: React.FC<OffersScreenProps> = ({ navigation }) => {
  const { token } = useAuth();

  // Zustand Store
  const {
    activeTab,
    offersList,
    loading,
    refreshing,
    error,
    quickSearch,
    activeIndex,
    setActiveTab,
    setQuickSearch,
    clearQuickSearch,
    setActiveIndex,
    loadOffers,
    onRefresh,
  } = useOffersStore();

  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadOffers(token);
  }, [token, loadOffers]);

  const handleBack = () => {
    if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation && navigation.navigate) {
      try {
        navigation.navigate('Home', { screen: 'Dashboard' });
      } catch (e) {
        navigation.navigate('Dashboard');
      }
    }
  };

  // Separate All vs Active vs Expired Offers
  const { allOffers, activeOffers, expiredOffers } = useMemo(() => {
    const all: OfferItem[] = [];
    const active: OfferItem[] = [];
    const expired: OfferItem[] = [];

    const query = quickSearch.toLowerCase().trim();

    offersList.forEach((item) => {
      // Quick search matching (Title, Brand, Model Group, State, Offer Type)
      const matchesSearch =
        !query ||
        String(item.title || '').toLowerCase().includes(query) ||
        String(item.brandName || '').toLowerCase().includes(query) ||
        String(item.modelGroupName || '').toLowerCase().includes(query) ||
        String(item.stateName || '').toLowerCase().includes(query) ||
        String(item.offerType || '').toLowerCase().includes(query);

      if (!matchesSearch) return;

      all.push(item);
      if (item.status === 'expired') {
        expired.push(item);
      } else {
        active.push(item);
      }
    });

    return { allOffers: all, activeOffers: active, expiredOffers: expired };
  }, [offersList, quickSearch]);
console.log("OfferItem,", allOffers);

  const displayedOffers =
    activeTab === 'ALL'
      ? allOffers
      : activeTab === 'ACTIVE'
      ? activeOffers
      : expiredOffers;

  useEffect(() => {
    setActiveIndex(0);
  }, [activeTab, quickSearch]);

  const renderOfferItem = ({ item, index }: { item: OfferItem; index: number }) => {
    const isExpired = item.status === 'expired';
    const hasDates = !!item.fromDate || !!item.toDate;

    return (
      <View
        key={item.id || index}
        style={[
          styles.offerCardHorizontal,
          isExpired && styles.offerCardExpiredHorizontal,
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          style={{ flex: 1 }}
        >
          {/* Card Header: Type Badge & Status Badge */}
          <View style={styles.offerCardHeader}>
            <View style={styles.offerTypeBadge}>
              <Image source={Images.tag} style={styles.offerTypeTagIcon} resizeMode="contain" />
              <Text style={styles.offerTypeBadgeText}>
                {item.transactionType || item.offerType || 'OFFER'}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                isExpired
                  ? styles.statusBadgeExpired
                  : styles.statusBadgeActive,
              ]}
            >
              <Text
                style={
                  isExpired
                    ? styles.statusBadgeTextExpired
                    : styles.statusBadgeTextActive
                }
              >
                {isExpired ? '● EXPIRED' : '● ACTIVE'}
              </Text>
            </View>
          </View>

          {/* ── Date on Top ── */}
          {hasDates && (
            <View style={styles.dateRowTop}>
              <Image
                source={Images.calendar}
                style={styles.calendarIcon}
                resizeMode="contain"
              />
              <Text style={styles.dateText}>
                {item.fromDate ? `From: ${formatToDDMMYYYY(item.fromDate)}` : ''}
                {item.fromDate && item.toDate ? '   ' : ''}
                {item.toDate ? `To: ${formatToDDMMYYYY(item.toDate)}` : ''}
              </Text>
            </View>
          )}

          {/* Badges Grid (Brand, Model Group, State) */}
          <View style={styles.gridRow}>
            {/* Highlighted Brand Name Badge */}
            <View style={styles.brandBadgeHighlight}>
              <Text style={styles.brandBadgeHighlightText}>
                🏷️ Brand: {item.brandName}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeLabel}>📱 Model: {item.modelGroupName}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeLabel}>📍 State: {item.stateName}</Text>
            </View>
          </View>

          {/* ── Transaction Details Section (Offer Type Value, Value Type, Upto Value, Transaction Type) ── */}
          {(!!item.offerTypeValue || !!item.transactionType || !!item.uptoValue || !!item.valueType) && (
            <View style={styles.txnDetailsCard}>
              {/* Offer Type Value */}
              {!!item.offerTypeValue && (
                <View style={styles.txnDetailRow}>
                  <Text style={styles.txnDetailLabel}>Offer Type Value</Text>
                  <View style={styles.txnValuePill}>
                    <Text style={styles.txnValuePillText}>{item.offerTypeValue}</Text>
                  </View>
                </View>
              )}

              {/* Value Type */}
              {!!item.valueType && (
                <View style={styles.txnDetailRow}>
                  <Text style={styles.txnDetailLabel}>Value Type</Text>
                  <Text style={styles.txnDetailValue}>{item.valueType}</Text>
                </View>
              )}

              {/* Upto Value */}
              {!!item.uptoValue && (
                <View style={styles.txnDetailRow}>
                  <Text style={styles.txnDetailLabel}>Upto Value</Text>
                  <Text style={styles.txnDetailValueHighlight}>{item.uptoValue}</Text>
                </View>
              )}

              {/* Transaction Type */}
              {!!item.transactionType && (
                <View style={styles.txnDetailRow}>
                  <Text style={styles.txnDetailLabel}>Transaction Type</Text>
                  <Text style={styles.txnDetailValue}>{item.transactionType}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Offer Text at Bottom ── */}
          {!!(item.offerText || item.title) && (
            <View style={styles.offerTextBox}>
              <Text style={styles.offerTextHeader}>Offer Text</Text>
              <Text style={styles.offerItemTitleBottom}>{item.offerText || item.title}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  if (error && isAccessDeniedError(error)) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Offers"
          showBack={true}
          onBackPress={handleBack}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <AccessDenied
          message={error}
          onRetry={() => loadOffers(token)}
          onGoBack={handleBack}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Top Header ── */}
      <Header
        title="Offers"
        showBack={true}
        onBackPress={handleBack}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* ── Main Container ── */}
      <View style={styles.mainContainer}>
        {/* ── 3-Way Tab Switcher (All Offers | Active Offers | Expired Offers) ── */}
        <View style={styles.toggleContainer}>
          {/* Tab 1: All Offers */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeTab === 'ALL' && styles.toggleBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('ALL')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'ALL' && styles.toggleBtnTextActive,
              ]}
              numberOfLines={1}
            >
              All
            </Text>
            <View
              style={[
                styles.badgePill,
                activeTab === 'ALL' && styles.badgePillActive,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  activeTab === 'ALL' && styles.badgeTextActive,
                ]}
              >
                {allOffers.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 2: Active Offers */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeTab === 'ACTIVE' && styles.toggleBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('ACTIVE')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'ACTIVE' && styles.toggleBtnTextActive,
              ]}
              numberOfLines={1}
            >
              Active
            </Text>
            <View
              style={[
                styles.badgePill,
                activeTab === 'ACTIVE' && styles.badgePillActive,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  activeTab === 'ACTIVE' && styles.badgeTextActive,
                ]}
              >
                {activeOffers.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 3: Expired Offers */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeTab === 'EXPIRED' && styles.toggleBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('EXPIRED')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'EXPIRED' && styles.toggleBtnTextActive,
              ]}
              numberOfLines={1}
            >
              Expired
            </Text>
            <View
              style={[
                styles.badgePill,
                activeTab === 'EXPIRED' && styles.badgePillActive,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  activeTab === 'EXPIRED' && styles.badgeTextActive,
                ]}
              >
                {expiredOffers.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Quick Search Bar ── */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => searchInputRef.current?.focus()}
            style={[styles.searchContainer, { marginRight: 0 }]}
          >
            <Image
              source={Images.filter}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search offer, brand, model..."
              placeholderTextColor="#94A3B8"
              value={quickSearch}
              onChangeText={setQuickSearch}
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
            />
            {quickSearch.length > 0 && (
              <TouchableOpacity
                onPress={clearQuickSearch}
                style={styles.clearSearchBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Horizontal Offer Cards FlatList Carousel ── */}
        <ScrollView
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
        >
          {loading && !refreshing ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading promotional offers...</Text>
            </View>
          ) : error && isAccessDeniedError(error) ? (
            <AccessDenied
              message={error}
              onRetry={() => loadOffers(token)}
              onGoBack={handleBack}
            />
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: '#DC2626' }]}>{error}</Text>
            </View>
          ) : displayedOffers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {activeTab === 'ALL' ? '' : activeTab === 'ACTIVE' ? 'active ' : 'expired '}offers found.
              </Text>
            </View>
          ) : (
            <View style={styles.horizontalScrollContainer}>
              <FlatList
                data={displayedOffers}
                renderItem={renderOfferItem}
                keyExtractor={(item, index) => String(item.id ?? index)}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                contentContainerStyle={styles.horizontalCardListContent}
                onScroll={(event) => {
                  const slideSize = event.nativeEvent.layoutMeasurement.width * 0.83 + 14;
                  const idx = Math.round(event.nativeEvent.contentOffset.x / slideSize);
                  if (idx >= 0 && idx < displayedOffers.length && idx !== activeIndex) {
                    setActiveIndex(idx);
                  }
                }}
                scrollEventThrottle={16}
              />

              {/* Horizontal Pagination Dots Indicator */}
              {displayedOffers.length > 1 && (
                <View style={styles.carouselCounterRow}>
                  {displayedOffers.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.carouselDot,
                        idx === activeIndex && styles.carouselDotActive,
                      ]}
                    />
                  ))}
                  <Text style={styles.carouselCountText}>
                    {activeIndex + 1} of {displayedOffers.length}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default OffersScreen;
