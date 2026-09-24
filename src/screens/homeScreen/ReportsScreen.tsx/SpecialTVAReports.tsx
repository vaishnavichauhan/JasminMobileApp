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
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { SpecialTvaItem } from '../../../api/specialTvaApi';
import { useSpecialTvaStore } from '../../../store';
import { colors, fontFamily, borderRadius } from '../../../styles/variables';
import Header from '../../../components/Header/Header';
import Images from '../../../assets/images';
import AccessDenied from '../../../components/AccessDenied/AccessDenied';
import { isAccessDeniedError } from '../../../utils/authUtils';

interface SpecialTVAReportsProps {
  navigation?: any;
}

const SpecialTVAReports: React.FC<SpecialTVAReportsProps> = ({ navigation: propNav }) => {
  const hookNav = useNavigation<any>();
  const navigation = propNav || hookNav;
  const { token } = useAuth();
  const { data, loading, refreshing, error, loadData } = useSpecialTvaStore();

  useEffect(() => {
    loadData(token);
  }, [token, loadData]);

  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('ReportsScreen');
    }
  };

  const renderItem = ({ item, index }: { item: SpecialTvaItem; index: number }) => {
    const title = item.title || 'Special TVA Report';
    const indexStr = String(index + 1).padStart(2, '0');
    const hasDates = Boolean(item.start_date || item.end_date);
    const dateRange = hasDates
      ? `${item.start_date || ''}${item.start_date && item.end_date ? ' - ' : ''}${item.end_date || ''}`
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          navigation?.navigate('SpecialTvaReportDetailScreen', {
            id: item.id,
            title: item.title,
          });
        }}
      >
        <View style={styles.cardLeft}>
          {/* Index Number Badge */}
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{indexStr}</Text>
          </View>

          {/* Title and metadata */}
          <View style={styles.infoContainer}>
            <Text style={styles.titleText} numberOfLines={2}>
              {title}
            </Text>
          </View>
        </View>

        {/* Right Arrow */}
        <View style={styles.arrowWrapper}>
          <Image
            source={Images.arrowRight}
            style={styles.arrowIcon}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Special TVA Reports"
          showBack={true}
          onBackPress={handleBack}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading Special TVA Reports…</Text>
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
            title="Special TVA Reports"
            showBack={true}
            onBackPress={handleBack}
            style={styles.headerStyle}
            titleStyle={styles.headerTitleStyle}
            iconColor={colors.white}
          />
          <AccessDenied
            message={error}
            onRetry={() => loadData(token)}
            onGoBack={handleBack}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header
          title="Special TVA Reports"
          showBack={true}
          onBackPress={handleBack}
          style={styles.headerStyle}
          titleStyle={styles.headerTitleStyle}
          iconColor={colors.white}
        />
        <View style={styles.center}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={[styles.stateText, { color: '#DC2626' }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(token)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header with Title: "Special TVA Reports" */}
      <Header
        title="Special TVA Reports"
        showBack={true}
        onBackPress={handleBack}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      {/* Main Content Layout */}
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
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          updateCellsBatchingPeriod={50}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.stateIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No Special TVA Reports</Text>
              <Text style={styles.stateText}>
                There are currently no special TVA reports available.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => loadData(token, true)}
              >
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
  loadingContainer: {
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
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginRight: 10,
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
  },
  titleText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 8,
  },
  reportBadge: {
    backgroundColor: '#FAF5FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  reportBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  dateText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  arrowWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    width: 12,
    height: 12,
    tintColor: '#64748B',
  },
  center: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderTopLeftRadius: borderRadius.cardRadius || 24,
    borderTopRightRadius: borderRadius.cardRadius || 24,
  },
  stateIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  retryText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
});

export default SpecialTVAReports;
