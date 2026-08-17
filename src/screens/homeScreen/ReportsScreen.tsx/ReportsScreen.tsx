import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './ReportsScreenStyles';
import Header from '../../../components/Header/Header';
import { colors } from '../../../styles/variables';

interface ReportItem {
  id: number;
  title: string;
}

const reportData: ReportItem[] = [
  { id: 1, title: 'Target vs Achievement' },
  { id: 2, title: 'ABM Wise TvA Report' },
  { id: 3, title: 'Stock vs Cash Deposit' },
  { id: 4, title: 'Finance & Brand Report' },
  { id: 5, title: 'PriceList Report' },
];

interface ReportsScreenProps {
  navigation?: any;
}

const ReportsScreen: React.FC<ReportsScreenProps> = () => {
  const navigation = useNavigation<any>();

  const handleReportPress = (item: ReportItem) => {
    switch (item.id) {
      case 1:
        navigation?.navigate('TargetAchivement');
        break;
        case 2:
          navigation?.navigate('AbmWiseReportScreen');
          break;
          case 3:
            navigation?.navigate('StockVsCashReportScreen');
            break;
            case 5:
            navigation?.navigate('PriceListReport');
            break;
      default:
        console.log('Report selected:', item.title);
        break;
    }
  };

  const renderReportRow = ({ item }: { item: ReportItem }) => (
    <TouchableOpacity
      style={styles.reportRow}
      activeOpacity={0.7}
      onPress={() => handleReportPress(item)}
    >
      {/* Left: ID Badge */}
      <View style={styles.idBadge}>
        <Text style={styles.idText}>{String(item.id).padStart(2, '0')}</Text>
      </View>

      {/* Middle: Title */}
      <View style={styles.titleWrapper}>
        <Text style={styles.reportTitle}>{item.title}</Text>
        <Text style={styles.reportSubtitle}>Tap to view report</Text>
      </View>

      {/* Right: Arrow */}
      <View style={styles.arrowWrapper}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
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
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <Header
        title="Report"
        showBack={true}
        onBackPress={handleBack}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />
     

      <View style={styles.mainContainer}>
        <Text style={styles.sectionLabel}>Available Reports</Text>

        <FlatList
          data={reportData}
          renderItem={renderReportRow}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default ReportsScreen;
