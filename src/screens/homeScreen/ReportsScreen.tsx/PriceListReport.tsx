import React, { useEffect } from 'react';
import {
  StyleSheet,
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
import { colors, fontFamily, borderRadius } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';

const PriceListReport: React.FC<{ navigation?: any }> = ({ navigation }) => {
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
          navigation?.navigate('PriceListReportDetailScreen', {
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
          
          {/* Format name + Report */}
          <View style={styles.infoContainer}>
            <Text style={styles.formatNameText}>{formatName}</Text>
            <View style={styles.reportBadge}>
              <Text style={styles.reportText}>Report</Text>
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
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.stateText}>Loading data…</Text>
      </View>
    );
  }

  if (error) {
    if (isAccessDeniedError(error)) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
          <Header
            title="PriceLists Report"
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

      {/* Header component using the title "PriceLists Report" */}
      <Header
        title="PriceLists Report"
        showBack={true}
        onBackPress={() => navigation?.goBack()}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Main content layout */}
      <View style={styles.mainContainer}>
        <FlatList
          data={data}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            data.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.stateIcon}>📋</Text>
              <Text style={styles.stateText}>No reports found</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(token, true)}>
                <Text style={styles.retryText}>Refresh</Text>
              </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  headerStyle: {
    backgroundColor: colors.primary,
    borderBottomWidth: 0,
  },
  headerTitleStyle: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fontFamily.bold,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: borderRadius.cardRadius || 24,
    borderTopRightRadius: borderRadius.cardRadius || 24,
    overflow: 'hidden',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  numberText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatNameText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
  },
  reportBadge: {
    backgroundColor: '#FAF5FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  reportText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  arrowIcon: {
    width: 14,
    height: 14,
    tintColor: '#94A3B8',
  },
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  stateText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  retryText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});

export default PriceListReport;
