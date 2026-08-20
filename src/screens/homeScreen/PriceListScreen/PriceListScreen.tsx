import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { VariationItem } from '../../../api/priceListApi';
import { usePriceListStore } from '../../../store';
import { colors } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import styles from './PriceListStyles';

import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';

const PriceListScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { token } = useAuth();
  const { data, loading, refreshing, error, loadData } = usePriceListStore();

  useEffect(() => {
    loadData(token);
  }, [token, loadData]);

  const renderItem = ({ item, index }: { item: VariationItem; index: number }) => {
    const formatName = item.format_name || item.formatName || '—';
    const indexStr = String(index + 1).padStart(2, '0');

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          navigation?.navigate('PriceListDetailScreen', {
            variationId: item.id,
            formatName: formatName,
          });
        }}
      >
        <View style={styles.cardLeft}>
          {/* Left side number */}
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{indexStr}</Text>
          </View>
          
          {/* Format name + View */}
          <View style={styles.infoContainer}>
            <Text style={styles.formatNameText}>{formatName}</Text>
            <View style={styles.viewBadge}>
              <Text style={styles.viewText}>View</Text>
            </View>
          </View>
        </View>

        {/* Right side arrow */}
        <Image
          source={Images.arrowRight}
          style={styles.arrowIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="PriceLists"
          showBack={true}
          onBackPress={() => navigation?.goBack()}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading data…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    if (isAccessDeniedError(error)) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
          <Header
            title="PriceLists"
            showBack={true}
            onBackPress={() => navigation?.goBack()}
            style={styles.headerStyle}
            titleStyle={styles.headerTitleStyle}
            iconColor={colors.white}
          />
          <AccessDenied
            message={error}
            onRetry={() => loadData(token)}
            onGoBack={() => navigation?.goBack()}
          />
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.stateIcon}>⚠️</Text>
        <Text style={[styles.stateText, { color: '#DC2626' }]}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(token)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header component using the title "PriceLists" */}
      <Header
        title="PriceLists"
        showBack={true}
        onBackPress={() => navigation?.goBack()}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Main content layout matching reports style */}
      <View style={styles.mainContainer}>
        <FlatList
          data={data}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.stateIcon}>📋</Text>
              <Text style={styles.stateText}>No price lists found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(token, true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </View>
    </View>
  );
};

export default PriceListScreen;
