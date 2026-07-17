import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function LeadsListScreen({ navigation }: any) {
  const [leads, setLeads] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [focusedSearch, setFocusedSearch] = useState(false);

  const fetchLeads = async () => {
    try {
      const params: any = {};
      if (search) params.query = search;
      if (status) params.statusId = status;
      const res = await api.get('/leads', { params });
      setLeads(res.data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.warn('Leads fetch failed:', err);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await api.get('/leads/statuses');
      setStatuses(res.data || []);
    } catch (err) {
      console.warn('Statuses fetch failed:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLeads(), fetchStatuses()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLeads();
    fetchStatuses();

    if (Platform.OS === 'web') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(fontLink);
    }

    const unsubscribe = navigation.addListener('focus', () => {
      fetchLeads();
      fetchStatuses();
    });

    return unsubscribe;
  }, [navigation, search, status]);

  const getStatusColor = (statusName: string) => {
    const name = statusName?.toLowerCase() || '';
    if (name.includes('won')) return { bg: '#E6F4EA', text: '#137333' };
    if (name.includes('lost') || name.includes('drop')) return { bg: '#FCE8E6', text: '#C5221F' };
    if (name.includes('contacted')) return { bg: '#E8F0FE', text: '#1A73E8' };
    if (name.includes('new')) return { bg: '#F2F4FF', text: '#5854D6' };
    return { bg: '#EDF2F7', text: '#718096' };
  };

  const renderItem = ({ item }: any) => {
    const statusStyle = getStatusColor(item.statusName);
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('LeadDetails', { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBox}>
            <Text style={styles.leadNo}>{item.leadNo}</Text>
            <Text style={styles.companyName}>{item.companyName || 'No Company Name'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {(item.statusName || 'NEW').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={16} color="#8A99AD" style={styles.infoIcon} />
            <Text style={styles.infoText}>{item.contactName || '-'}</Text>
          </View>
          {item.email && (
            <View style={styles.infoRow}>
              <MaterialIcons name="mail-outline" size={16} color="#8A99AD" style={styles.infoIcon} />
              <Text style={styles.infoText}>{item.email}</Text>
            </View>
          )}
          {item.mobile && (
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={16} color="#8A99AD" style={styles.infoIcon} />
              <Text style={styles.infoText}>{item.mobile}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.valueGroup}>
            <Text style={styles.valueLabel}>EXPECTED VALUE</Text>
            <Text style={styles.valueVal}>${parseFloat(item.expectedValue || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.actionArrowCircle}>
            <MaterialIcons name="chevron-right" size={20} color="#FF6B81" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Header Container */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={focusedSearch ? '#FF6B81' : '#8A99AD'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, focusedSearch && styles.searchInputFocused]}
            placeholder="Search leads..."
            placeholderTextColor="#8A99AD"
            value={search}
            onChangeText={setSearch}
            onFocus={() => setFocusedSearch(true)}
            onBlur={() => setFocusedSearch(false)}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
              <MaterialIcons name="close" size={18} color="#8A99AD" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Horizontal Status pill scroll filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.statusFiltersScroll}
        >
          <TouchableOpacity 
            style={[styles.filterPill, !status && styles.filterPillActive]}
            onPress={() => setStatus('')}
          >
            <Text style={[styles.filterPillText, !status && styles.filterPillTextActive]}>ALL LEADS</Text>
          </TouchableOpacity>
          {statuses.map((st) => {
            const isSelected = status === st.id;
            return (
              <TouchableOpacity 
                key={st.id} 
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setStatus(st.id)}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {st.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B81" />
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF6B81']} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="find-in-page" size={48} color="#8A99AD" />
              <Text style={styles.emptyTitle}>No leads found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or filters.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4FF', // Soft lavender background
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchHeader: {
    backgroundColor: '#1E1B3A', // Curved Dark Navy Header
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 40,
    fontSize: 14,
    color: '#ffffff',
  },
  searchInputFocused: {
    borderColor: '#FF6B81',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  clearBtn: {
    position: 'absolute',
    right: 14,
    height: 48,
    justifyContent: 'center',
    zIndex: 10,
  },
  statusFiltersScroll: {
    gap: 8,
  },
  filterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#FF6B81', // Coral Red Active filter
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A99AD',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleBox: {
    flex: 1,
    marginRight: 12,
  },
  leadNo: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B81',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B3A',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardContent: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
    paddingBottom: 16,
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueGroup: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8A99AD',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valueVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B3A',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  actionArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B3A',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
  },
});
