import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Image, 
  Platform,
  Linking
} from 'react-native';
import { api } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotificationStore } from '../store/notification.store';

const PROFILE_AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaxcSZJ9qd-d9n_R_IL-BIkY05uDvFSnFTXP-W_HDzD9zr6wzQ6SA_EiPyceBbWU0x6qGRScEQiiKPOSEmqYPfF7rsWy97WPPj-SLNvzkJuEdV6bGrryME0RNtXMfFMhL2bNI0CvGYkPcyxtIOZtbj8-3VoDbCLEyhrekaCkSuH8nQZZB-70_ARsFL7owQK5_SrUbmq3b8Kzois_45jts38l220M-QXbPv4JIHts4rlLHXSwerMcny';

export default function DashboardScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>({ totalLeads: 0, wonDeals: 0, lostDeals: 0, hotLeads: 0 });
  const [target, setTarget] = useState<any>({ targetValue: 1, actualValue: 0, percentage: 0 });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchDashboardData = async () => {
    try {
      const [sumRes, targetRes, alertsRes, leadsRes, activitiesRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/target-vs-actual'),
        api.get('/dashboard/hot-leads'),
        api.get('/leads'),
        api.get('/activities'),
      ]);
      
      setSummary({
        totalLeads: sumRes.data.totalLeads || 0,
        wonDeals: sumRes.data.wonDeals || 0,
        lostDeals: sumRes.data.lostDeals || 0,
        hotLeads: sumRes.data.hotLeads || 0,
      });

      setTarget({
        targetValue: parseFloat(targetRes.data.targetValue) || 1,
        actualValue: parseFloat(targetRes.data.actualValue) || 0,
        percentage: parseFloat(targetRes.data.percentage) || 0,
      });

      const allLeads = leadsRes.data || [];
      const hotLeadsList = allLeads.filter((l: any) => (l.leadScore || 0) > 70);
      setAlerts(hotLeadsList);
      setEnquiries(allLeads);

      useNotificationStore.getState().generateDynamicNotifications(allLeads, activitiesRes.data || []);
    } catch (err) {
      console.warn('Dashboard fetch failed:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();

    if (Platform.OS === 'web') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(fontLink);
    }

    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });

    navigation.setOptions({
      headerShown: false,
    });

    return unsubscribe;
  }, [navigation]);

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      alert('Phone number not available');
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      alert('Email not available');
    }
  };

  return (
    <View style={styles.container}>
      {/* TopAppBar - Branded Navy */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <TouchableOpacity 
              style={styles.avatarButton} 
              onPress={() => navigation.openDrawer()}
            >
              <Image source={{ uri: PROFILE_AVATAR_URL }} style={styles.avatarImage} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CRM Pro</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialIcons name="notifications-none" size={24} color="#ffffff" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF6B81']} />}
      >
        {/* Date / Greeting */}
        <View style={styles.summaryHeader}>
          <View style={styles.summaryTitleGroup}>
            <Text style={styles.summaryDate}>{getFormattedDate().toUpperCase()}</Text>
            <Text style={styles.summaryTitle}>Sales Performance</Text>
          </View>
        </View>

        {/* Target Achievements Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: '#FF6B81' }]} />
            <Text style={styles.cardTitle}>Sales Target Vs Actual</Text>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{target.percentage.toFixed(1)}%</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TARGET</Text>
              <Text style={styles.metricVal}>${parseFloat(target.targetValue).toLocaleString()}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ACHIEVED</Text>
              <Text style={[styles.metricVal, { color: '#FF6B81' }]}>
                ${parseFloat(target.actualValue).toLocaleString()}
              </Text>
            </View>
          </View>
          {/* Custom Accent Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(target.percentage, 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>Achieved target value metrics</Text>
        </View>

        {/* KPI Grid */}
        <View style={styles.grid}>
          {/* Total Leads */}
          <View style={styles.gridCard}>
            <View style={[styles.cardDot, { backgroundColor: '#5854D6' }]} />
            <Text style={styles.gridLabel}>Total Leads</Text>
            <Text style={[styles.gridVal, { color: '#5854D6' }]}>{summary.totalLeads}</Text>
          </View>
          {/* Won Deals */}
          <View style={styles.gridCard}>
            <View style={[styles.cardDot, { backgroundColor: '#2aa946' }]} />
            <Text style={styles.gridLabel}>Won Deals</Text>
            <Text style={[styles.gridVal, { color: '#2aa946' }]}>{summary.wonDeals}</Text>
          </View>
          {/* Hot Leads */}
          <View style={styles.gridCard}>
            <View style={[styles.cardDot, { backgroundColor: '#FF6B81' }]} />
            <Text style={styles.gridLabel}>Hot Leads</Text>
            <Text style={[styles.gridVal, { color: '#FF6B81' }]}>{summary.hotLeads}</Text>
          </View>
          {/* Lost Deals */}
          <View style={styles.gridCard}>
            <View style={[styles.cardDot, { backgroundColor: '#8A99AD' }]} />
            <Text style={styles.gridLabel}>Lost Deals</Text>
            <Text style={[styles.gridVal, { color: '#8A99AD' }]}>{summary.lostDeals}</Text>
          </View>
        </View>

        {/* Alerts / Hot Calls Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Hot Calls</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leads')}>
              <Text style={styles.sectionAction}>See more</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            {alerts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No hot leads right now.</Text>
              </View>
            ) : (
              alerts.slice(0, 3).map((lead: any) => (
                <View key={lead.id} style={styles.enquiryCard}>
                  <View style={styles.enquiryTop}>
                    <TouchableOpacity onPress={() => navigation.navigate('LeadDetails', { id: lead.id })}>
                      <Text style={styles.enquiryName}>{lead.contactPerson || 'No Contact'}</Text>
                      <Text style={styles.enquiryCompany}>{lead.companyName || 'No Company'}</Text>
                    </TouchableOpacity>
                    <View style={styles.hotTag}>
                      <Text style={styles.hotTagText}>Hot</Text>
                    </View>
                  </View>
                  <View style={styles.enquiryBottom}>
                    <Text style={styles.timeAgoText}>Score: {lead.leadScore}</Text>
                    <View style={styles.contactActions}>
                      <TouchableOpacity style={styles.actionCircleButton} onPress={() => handleCall(lead.mobile)}>
                        <MaterialIcons name="call" size={16} color="#FF6B81" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionCircleButton, styles.emailButton]} onPress={() => handleEmail(lead.email)}>
                        <MaterialIcons name="mail-outline" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Enquiries / Pipeline List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pipeline Enquiries</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leads')}>
              <Text style={styles.sectionAction}>See more</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            {enquiries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No enquiries registered yet.</Text>
              </View>
            ) : (
              enquiries.slice(0, 3).map((lead: any) => (
                <View key={lead.id} style={styles.enquiryCard}>
                  <View style={styles.enquiryTop}>
                    <TouchableOpacity onPress={() => navigation.navigate('LeadDetails', { id: lead.id })}>
                      <Text style={styles.enquiryName}>{lead.contactPerson || 'No Contact'}</Text>
                      <Text style={styles.enquiryCompany}>{lead.companyName || 'No Company'}</Text>
                    </TouchableOpacity>
                    <View style={[styles.hotTag, lead.statusName?.toLowerCase().includes('won') && styles.wonTag]}>
                      <Text style={styles.hotTagText}>{lead.statusName || 'New'}</Text>
                    </View>
                  </View>
                  <View style={styles.enquiryBottom}>
                    <Text style={styles.timeAgoText}>
                      {new Date(lead.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                    <View style={styles.contactActions}>
                      <TouchableOpacity style={styles.actionCircleButton} onPress={() => handleCall(lead.mobile)}>
                        <MaterialIcons name="call" size={16} color="#FF6B81" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionCircleButton, styles.emailButton]} onPress={() => handleEmail(lead.email)}>
                        <MaterialIcons name="mail-outline" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>

      {/* Floating Action Button (FAB) in Coral Red */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('LeadForm')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navLink} onPress={() => navigation.navigate('Dashboard')}>
          <MaterialIcons name="home" size={24} color="#ffffff" />
          <Text style={[styles.navLabel, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navLink} onPress={() => navigation.navigate('Leads')}>
          <MaterialIcons name="leaderboard" size={24} color="#8A99AD" />
          <Text style={styles.navLabel}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navLink} onPress={() => navigation.navigate('New Customer')}>
          <MaterialIcons name="description" size={24} color="#8A99AD" />
          <Text style={styles.navLabel}>Quotes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navLink} onPress={() => navigation.navigate('Leads')}>
          <MaterialIcons name="search" size={24} color="#8A99AD" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navLink} onPress={() => navigation.navigate('User Profile')}>
          <MaterialIcons name="person" size={24} color="#8A99AD" />
          <Text style={styles.navLabel}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4FF', // Soft grayish-purple/lavender
  },
  header: {
    width: '100%',
    height: 64,
    backgroundColor: '#1E1B3A', // Dark Navy/Purple
    justifyContent: 'center',
    zIndex: 50,
  },
  headerContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FF6B81',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  notificationBtn: {
    position: 'relative',
    padding: 6,
  },
  notificationBadge: {
    position: 'absolute',
    right: 2,
    top: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B81',
    borderWidth: 1.5,
    borderColor: '#1E1B3A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 110,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitleGroup: {
    alignItems: 'flex-start',
  },
  summaryDate: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B81',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B3A',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B3A',
    flex: 1,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  percentBadge: {
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B81',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
  },
  metricDivider: {
    width: 1.5,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A99AD',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B3A',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B81',
  },
  progressLabel: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  gridCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A99AD',
    marginTop: 8,
    marginBottom: 4,
  },
  gridVal: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B3A',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B81',
  },
  listContainer: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#8A99AD',
  },
  enquiryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  enquiryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  enquiryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B3A',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  enquiryCompany: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
    marginTop: 2,
  },
  hotTag: {
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  wonTag: {
    backgroundColor: '#E6F4EA',
  },
  hotTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B81',
  },
  enquiryBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 12,
  },
  timeAgoText: {
    fontSize: 11,
    color: '#8A99AD',
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: '#1d4ed8',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B81',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 99,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 64,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#1E1B3A',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 50,
  },
  navLink: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    color: '#8A99AD',
    marginTop: 4,
    fontWeight: '600',
  },
  activeNavText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
