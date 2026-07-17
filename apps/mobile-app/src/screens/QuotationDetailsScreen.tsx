import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { api } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';

export default function QuotationDetailsScreen({ route, navigation }: any) {
  const { quoteId } = route.params;
  const [quote, setQuote] = useState<any>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'REVISIONS' | 'HISTORY'>('DETAILS');

  const fetchQuoteDetails = async () => {
    setLoading(true);
    try {
      const prodRes = await api.get('/products');
      setProductsList(prodRes.data || []);

      const res = await api.get(`/quotations/${quoteId}`);
      setQuote(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load quotation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuoteDetails();
  }, [quoteId]);

  const getProductName = (productId: string) => {
    const p = productsList.find((x) => x.id === productId);
    return p ? p.productName : 'Product Addon';
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return styles.statusApproved;
      case 'SENT':
        return styles.statusSent;
      case 'REJECTED':
        return styles.statusRejected;
      default:
        return styles.statusDraft;
    }
  };

  const handleActionMock = (actionName: string) => {
    Alert.alert(actionName, `The document has been successfully ${actionName.toLowerCase()}ed.`);
  };

  if (loading || !quote) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B81" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B3A" />

      {/* Modern Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.quoteNo}>{quote.quotationNo}</Text>
            <Text style={styles.revisionNo}>Active Revision: {quote.revisionNo || 'R0'}</Text>
          </View>
          <Text style={[styles.statusBadge, getStatusStyle(quote.status)]}>{quote.status}</Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Quote Date</Text>
            <Text style={styles.summaryVal}>{new Date(quote.quoteDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Grand Total</Text>
            <Text style={styles.summaryValTotal}>₹{parseFloat(quote.totalAmount).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'DETAILS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('DETAILS')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'DETAILS' && styles.tabBtnTextActive]}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'REVISIONS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('REVISIONS')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'REVISIONS' && styles.tabBtnTextActive]}>Revisions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'HISTORY' && styles.tabBtnActive]}
            onPress={() => setActiveTab('HISTORY')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'HISTORY' && styles.tabBtnTextActive]}>Audit Trail</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'DETAILS' && (
        <View>
          {/* Action Bar */}
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Document Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionItem} onPress={() => handleActionMock('Print')}>
                <MaterialIcons name="print" size={20} color="#FF6B81" />
                <Text style={styles.actionText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem} onPress={() => handleActionMock('Export PDF')}>
                <MaterialIcons name="picture-as-pdf" size={20} color="#FFB020" />
                <Text style={styles.actionText}>Export PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem} onPress={() => handleActionMock('Email')}>
                <MaterialIcons name="email" size={20} color="#5854D6" />
                <Text style={styles.actionText}>Email Quote</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem} onPress={() => handleActionMock('Share')}>
                <MaterialIcons name="share" size={20} color="#4CD964" />
                <Text style={styles.actionText}>Share Link</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quotation Line Items Table */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quotation Line Items</Text>
            {quote.items && quote.items.length > 0 ? (
              quote.items.map((item: any, index: number) => {
                const quantity = item.quantity;
                const rate = parseFloat(item.rate || '0');
                const amount = parseFloat(item.amount || '0');
                const isFixed = Math.abs(amount - rate) < 0.01;
                const label = isFixed
                  ? `Fixed Range: ₹${amount.toLocaleString('en-IN')}`
                  : `${quantity} units × ₹${rate.toLocaleString('en-IN')} (Unit Price)`;

                return (
                  <View key={item.id || index} style={styles.itemRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.itemName}>{getProductName(item.productId)}</Text>
                      <Text style={styles.itemQty}>{label}</Text>
                    </View>
                    <Text style={styles.itemAmount}>₹{amount.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.empty}>No products linked.</Text>
            )}

            <View style={styles.divider} />
            <View style={styles.priceSummaryRow}>
              <Text style={styles.priceSummaryLabel}>Subtotal</Text>
              <Text style={styles.priceSummaryVal}>₹{parseFloat(quote.subtotal).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.priceSummaryRow}>
              <Text style={styles.priceSummaryLabel}>Discount (-)</Text>
              <Text style={styles.priceSummaryVal}>₹{parseFloat(quote.discount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.priceSummaryRow}>
              <Text style={styles.priceSummaryLabel}>Tax amount (+)</Text>
              <Text style={styles.priceSummaryVal}>₹{parseFloat(quote.taxAmount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.priceSummaryRow, { marginTop: 8 }]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalVal}>₹{parseFloat(quote.totalAmount).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Terms & Notes */}
          {(quote.terms || quote.notes) && (
            <View style={styles.card}>
              {quote.terms && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.sectionSubTitle}>Terms & Conditions</Text>
                  <Text style={styles.notesText}>{quote.terms}</Text>
                </View>
              )}
              {quote.notes && (
                <View>
                  <Text style={styles.sectionSubTitle}>Client Notes</Text>
                  <Text style={styles.notesText}>{quote.notes}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {activeTab === 'REVISIONS' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revision History Snapshot logs</Text>
          {quote.revisions && quote.revisions.length > 0 ? (
            quote.revisions.map((rev: any) => (
              <View key={rev.id} style={styles.revisionItem}>
                <View style={styles.revisionHeader}>
                  <Text style={styles.revisionName}>Revision {rev.revisionNo}</Text>
                  <Text style={styles.revisionDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.revisionVal}>Total Amount: ₹{parseFloat(rev.totalAmount).toLocaleString('en-IN')}</Text>
                <Text style={styles.revisionStatus}>Status: {rev.status}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No previous revisions exist. This is the original copy (R0).</Text>
          )}
        </View>
      )}

      {activeTab === 'HISTORY' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Audit Trail Log</Text>
          {quote.history && quote.history.length > 0 ? (
            quote.history.map((hist: any, index: number) => (
              <View key={hist.id || index} style={styles.historyItem}>
                <View style={styles.historyDot} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyText}>{hist.remarks}</Text>
                  <Text style={styles.historyDate}>
                    Status: {hist.status} | {new Date(hist.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No audit log events found.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  headerCard: {
    backgroundColor: '#1E1B3A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 16,
    marginBottom: 16,
  },
  quoteNo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  revisionNo: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '700',
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  statusDraft: {
    backgroundColor: '#FEF7E0',
    color: '#B06000',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCol: {
    width: '48%',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  summaryValTotal: {
    fontSize: 18,
    color: '#FF6B81',
    fontWeight: '900',
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0AEC0',
  },
  tabBtnTextActive: {
    color: '#1E1B3A',
  },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B3A',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A5568',
    marginTop: 6,
    textAlign: 'center',
  },

  // Items list
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B3A',
  },
  itemQty: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
    fontWeight: '500',
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B3A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F8',
    marginVertical: 12,
  },
  priceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceSummaryLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  priceSummaryVal: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '600',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B3A',
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF6B81',
  },
  sectionSubTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#718096',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Revisions
  revisionItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  revisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  revisionName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B3A',
  },
  revisionDate: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '600',
  },
  revisionVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5568',
  },
  revisionStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
    marginTop: 4,
  },

  // History / Audit trail
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B81',
    marginTop: 6,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: 13,
    color: '#1E1B3A',
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
    fontWeight: '500',
  },
  empty: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#A0AEC0',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
