import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './SupportScreenStyles';
import Header from '../../../components/Header/Header';
import { colors } from '../../../styles/variables';

export interface SupportScreenProps {
  navigation?: any;
}

export const SupportScreen: React.FC<SupportScreenProps> = () => {
  const navigation = useNavigation<any>();

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

  const handleNavigateToRaise = () => {
    try {
      navigation.navigate('RaiseTicketScreen');
    } catch (e) {
      navigation.navigate('RaiseTicket');
    }
  };

  const handleNavigateToAll = () => {
    try {
      navigation.navigate('AllTicketsScreen');
    } catch (e) {
      navigation.navigate('AllTickets');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <Header
        title="Support"
        showBack={true}
        onBackPress={handleBack}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Support Helpdesk Banner */}
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Jasmin Helpdesk</Text>
            </View>
          {/* Section: 1. Tickets */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tickets</Text>
          </View>

          <View style={styles.ticketsContainer}>
            {/* 1) Raise Tickets */}
            <TouchableOpacity
              style={styles.ticketCard}
              activeOpacity={0.75}
              onPress={handleNavigateToRaise}
            >
              <View style={[styles.ticketIconBadge, { backgroundColor: '#EDE9FE' }]}>
                <Text style={styles.ticketIconText}>➕</Text>
              </View>
              <View style={styles.ticketCardContent}>
                <View style={styles.ticketCardHeaderRow}>
                  <Text style={styles.ticketCardTitle}>Raise Tickets</Text>
                </View>
                <Text style={styles.ticketCardDesc}>
                  Create a new support request for hardware, software, or ERP issues.
                </Text>
              </View>
              <View style={styles.arrowWrapper}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>

            {/* 2) All Tickets */}
            <TouchableOpacity
              style={styles.ticketCard}
              activeOpacity={0.75}
              onPress={handleNavigateToAll}
            >
              <View style={[styles.ticketIconBadge, { backgroundColor: '#E0F2FE' }]}>
                <Text style={styles.ticketIconText}>📋</Text>
              </View>
              <View style={styles.ticketCardContent}>
                <View style={styles.ticketCardHeaderRow}>
                  <Text style={styles.ticketCardTitle}>All Tickets</Text>
                </View>
                <Text style={styles.ticketCardDesc}>
                  View active & history tickets list and resolution status.
                </Text>
                </View>
              <View style={styles.arrowWrapper}>
                <Text style={[styles.arrowText, { color: '#0284C7' }]}>›</Text>
              </View>
              
            </TouchableOpacity>
          </View>

          {/* Quick Helpdesk Info */}
          <View style={styles.helpBox}>
            <View style={styles.helpBoxHeader}>
              <Text style={styles.helpBoxIcon}>ℹ️</Text>
              <Text style={styles.helpBoxTitle}>Need Immediate Help?</Text>
            </View>
            <Text style={styles.helpBoxDesc}>
              Our central support desk is available to assist you with critical system and any devices issues.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default SupportScreen;
