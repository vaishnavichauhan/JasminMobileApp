import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import styles from './HomeScreenStyles';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../styles/variables';
import { OfferItem } from '../../../api/offersApi';
import { useHomeStore } from '../../../store';

interface HomeScreenProps {
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

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { token } = useAuth();

  // Zustand Store
  const {
    offersList,
    loading,
    refreshing,
    error,
    quickSearch,
    setQuickSearch,
    clearQuickSearch,
    loadOffers,
    onRefresh,
  } = useHomeStore();

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

  // Filter EXPIRED OFFERS ONLY matching search query
  const expiredOffersList = useMemo(() => {
    const expired: OfferItem[] = [];
    const query = quickSearch.toLowerCase().trim();

    offersList.forEach((item) => {
      // Must be an EXPIRED offer
      if (item.status !== 'expired') return;

      // Quick search matching (Title, Brand, Model Group, State, Offer Type)
      const matchesSearch =
        !query ||
        String(item.title || '').toLowerCase().includes(query) ||
        String(item.brandName || '').toLowerCase().includes(query) ||
        String(item.modelGroupName || '').toLowerCase().includes(query) ||
        String(item.stateName || '').toLowerCase().includes(query) ||
        String(item.offerType || '').toLowerCase().includes(query);

      if (matchesSearch) {
        expired.push(item);
      }
    });

    return expired;
  }, [offersList, quickSearch]);

  const renderOfferItem = ({ item, index }: { item: OfferItem; index: number }) => {
    return (
      <View key={item.id || index} style={styles.offerCard}>
        {/* Card Header: Title & Expired Badge */}
        <View style={styles.offerCardHeader}>
          <View style={styles.offerTitleWrapper}>
            <Text style={styles.offerTitleText} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          <View style={styles.statusBadgeExpired}>
            <Text style={styles.statusBadgeTextExpired}>● EXPIRED</Text>
          </View>
        </View>

        {/* Badges Grid (Brand, Model Group, State, Type Value Pill) */}
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

          {/* Type Badge: plain label, background pill on value only */}
          <View style={styles.metaBadgeWithType}>
            <Text style={styles.metaBadgeLabel}>🎁 Type:</Text>
            <View
              style={
                String(item.offerType || '').toLowerCase().includes('bundle')
                  ? styles.valPillRed
                  : styles.valPillGreen
              }
            >
              <Text
                style={
                  String(item.offerType || '').toLowerCase().includes('bundle')
                    ? styles.valPillTextRed
                    : styles.valPillTextGreen
                }
              >
                {item.offerType}
              </Text>
            </View>
          </View>
        </View>

        {/* From Date & To Date Row */}
        <View style={styles.dateRow}>
          <Image
            source={Images.calendar}
            style={styles.calendarIcon}
            resizeMode="contain"
          />
          <Text style={styles.dateText}>
            from date : <Text style={styles.dateValText}>{formatToDDMMYYYY(item.fromDate)}</Text>    to date : <Text style={styles.dateValText}>{formatToDDMMYYYY(item.toDate)}</Text>
          </Text>
        </View>
      </View>
    );
  };

  if (error && isAccessDeniedError(error)) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Home"
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

      {/* ── Top Header (Title: Home) ── */}
      <Header
        title="Home"
        showBack={true}
        onBackPress={handleBack}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* ── Main Container ── */}
      <View style={styles.mainContainer}>
        {/* ── Inside Title: "Expired Offers" ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Expired Offers</Text>
          <View style={styles.sectionCountBadge}>
            <Text style={styles.sectionCountText}>
              {expiredOffersList.length} Total
            </Text>
          </View>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchRow}>
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
              placeholder="Search expired offers..."
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

        {/* ── Vertical FlatList of Expired Offers ── */}
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading expired offers...</Text>
          </View>
        ) : (
          <FlatList
            data={expiredOffersList}
            renderItem={renderOfferItem}
            keyExtractor={(item, index) => String(item.id ?? index)}
            contentContainerStyle={styles.scrollContent}
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
                <Text style={styles.emptyText}>
                  No expired offers found matching your criteria.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

export default HomeScreen;
