import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { api } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';

export default function QuotationsListScreen({ navigation }: any) {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data || []);
    } catch (err) {
      console.warn('Failed to load quotations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchQuotations();
    });
    return unsubscribe;
  }, [navigation]);

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return styles.statusApproved;
      case 'SENT':
        return styles.statusSent;
      case 'REJECTED':
        return styles.statusRejected;
      case 'EXPIRED':
        return styles.statusExpired;
      default:
        return styles.statusDraft;
    }
  };

  const duplicateQuote = async (id: string) => {
    Alert.alert(
      'Duplicate Quotation',
      'Are you sure you want to duplicate this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: async () => {
            try {
              const res = await api.post(`/quotations/${id}/duplicate`);
              Alert.alert('Success', 'Quotation duplicated successfully.');
              fetchQuotations();
              navigation.navigate('QuotationDetails', { quoteId: res.data.id });
            } catch (err) {
              Alert.alert('Error', 'Failed to duplicate quotation.');
            }
          },
        },
      ]
    );
  };

  const renderQuoteItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('QuotationDetails', { quoteId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.quoteNo}>{item.quotationNo}</Text>
          <Text style={styles.revisionNo}>Rev {item.revisionNo || 'R0'}</Text>
        </View>
        <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>{item.status}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialIcons name="event" size={16} color="#718096" />
          <Text style={styles.infoText}>Date: {new Date(item.quoteDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="attach-money" size={16} color="#FF6B81" />
          <Text style={styles.amountText}>Total: ₹{parseFloat(item.totalAmount).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => duplicateQuote(item.id)}>
          <MaterialIcons name="content-copy" size={16} color="#5854D6" />
          <Text style={styles.actionBtnText}>Duplicate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('QuotationForm', { quoteId: item.id })}
        >
          <MaterialIcons name="edit" size={16} color="#FF6B81" />
          <Text style={styles.actionBtnText}>Edit / Revise</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B3A" />
      {loading ? (
        <ActivityIndicator color="#FF6B81" style={{ flex: 1 }} />
      ) : quotations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="description" size={64} color="#A0AEC0" />
          <Text style={styles.emptyText}>No quotations found.</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('QuotationForm')}
          >
            <Text style={styles.createBtnText}>Create Quotation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={quotations}
          keyExtractor={(item) => item.id}
          renderItem={renderQuoteItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('QuotationForm')}
      >
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
    paddingBottom: 12,
    marginBottom: 12,
  },
  quoteNo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B3A',
  },
  revisionNo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusApproved: {
    backgroundColor: '#E6F4EA',
    color: '#137333',
  },
  statusSent: {
    backgroundColor: '#E8F0FE',
    color: '#1A73E8',
  },
  statusRejected: {
    backgroundColor: '#FCE8E6',
    color: '#C5221F',
  },
  statusExpired: {
    backgroundColor: '#F1F3F4',
    color: '#5F6368',
  },
  statusDraft: {
    backgroundColor: '#FEF7E0',
    color: '#B06000',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#4A5568',
    marginLeft: 6,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 14,
    color: '#1E1B3A',
    marginLeft: 6,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5568',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#718096',
    marginTop: 16,
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: '#FF6B81',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#FF6B81',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
});
