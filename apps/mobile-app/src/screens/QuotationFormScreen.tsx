import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  useWindowDimensions,
  FlatList,
  Modal,
} from 'react-native';
import { api } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';

export default function QuotationFormScreen({ navigation, route }: any) {
  const quoteId = route?.params?.quoteId || null;
  const isEditMode = !!quoteId;
  const { width: windowWidth } = useWindowDimensions();
  const IS_WEB_WIDE = Platform.OS === 'web' && windowWidth > 700;

  const [loading, setLoading] = useState(false);
  const [quotationNo, setQuotationNo] = useState('');
  const [leadId, setLeadId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [discount, setDiscount] = useState('0');
  const [taxAmount, setTaxAmount] = useState('0');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Dropdowns lists
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productPricesCache, setProductPricesCache] = useState<{[productId: string]: any[]}>({});

  // Selected products: { [productId]: { quantity: number, unitPrice: number, name: string } }
  const [selectedProducts, setSelectedProducts] = useState<{[productId: string]: any}>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Searchable Product Modal State
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    setLoading(true);
    try {
      // 1. Fetch leads
      const leadsRes = await api.get('/leads');
      setLeadsList(leadsRes.data || []);

      // 2. Fetch customers
      const customersRes = await api.get('/customers');
      setCustomersList(customersRes.data || []);

      // 3. Initialize prices cache
      const cache: {[productId: string]: any[]} = {};
      setProductPricesCache(cache);

      // 4. If editing, load quote details
      if (isEditMode && quoteId) {
        const quoteRes = await api.get(`/quotations/${quoteId}`);
        const q = quoteRes.data;
        setQuotationNo(q.quotationNo || '');
        setLeadId(q.leadId || '');
        setCustomerId(q.customerId || '');
        setStatus(q.status || 'DRAFT');
        setDiscount(String(Math.round(parseFloat(q.discount || '0'))));
        setTaxAmount(String(Math.round(parseFloat(q.taxAmount || '0'))));
        setTerms(q.terms || '');
        setNotes(q.notes || '');

        // Load items
        if (q.items && q.items.length > 0) {
          const selectedMap: {[productId: string]: any} = {};
          for (const item of q.items) {
            let slabs = cache[item.productId];
            if (!slabs) {
              try {
                const pricesRes = await api.get(`/products/${item.productId}/prices`);
                slabs = pricesRes.data || [];
                cache[item.productId] = slabs;
              } catch (e) {
                slabs = [];
              }
            }

            const matchingSlab = slabs.find(
              (slab: any) => item.quantity >= slab.minCount && item.quantity <= slab.maxCount
            );
            const pricingType = matchingSlab ? matchingSlab.pricingType : 'UNIT';
            const rangeLabel = matchingSlab ? `${matchingSlab.minCount} - ${matchingSlab.maxCount}` : 'N/A';
            const label = matchingSlab 
              ? (pricingType === 'FIXED' ? `₹${parseFloat(matchingSlab.fixedAmount).toLocaleString('en-IN')} (Fixed)` : `${item.quantity} × ₹${parseFloat(matchingSlab.unitPrice).toLocaleString('en-IN')} (Unit)`)
              : `${item.quantity} × ₹${parseFloat(item.rate).toLocaleString('en-IN')}`;

            selectedMap[item.productId] = {
              quantity: item.quantity,
              unitPrice: parseFloat(item.rate),
              amount: item.quantity * parseFloat(item.rate),
              pricingType,
              label,
              rangeLabel,
              name: item.productName || 'Product',
            };
          }
          setProductPricesCache({ ...cache });
          setSelectedProducts(selectedMap);
        }
      }
    } catch (err) {
      console.warn('Failed to load data for quotation form', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlabPricesOnDemand = async (productId: string) => {
    if (productPricesCache[productId]) {
      return productPricesCache[productId];
    }
    try {
      const res = await api.get(`/products/${productId}/prices`);
      const slabs = res.data || [];
      setProductPricesCache((prev) => ({
        ...prev,
        [productId]: slabs,
      }));
      return slabs;
    } catch (e) {
      console.warn(`Failed to fetch on-demand pricing slabs for product ${productId}`, e);
      return [];
    }
  };

  const searchProducts = async (keyword: string, pageNum: number, shouldAppend = false) => {
    if (searchLoading) return;
    setSearchLoading(true);
    try {
      const res = await api.get(`/products/search`, {
        params: {
          keyword,
          page: pageNum,
          pageSize: 20,
        },
      });
      const data = res.data?.results || [];
      const totalPages = res.data?.totalPages || 1;
      
      if (shouldAppend) {
        setSearchResults((prev) => [...prev, ...data]);
      } else {
        setSearchResults(data);
      }
      setSearchPage(pageNum);
      setHasMoreProducts(pageNum < totalPages);
    } catch (err) {
      console.warn('Search query failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchKeywordChange = (text: string) => {
    setSearchKeyword(text);
    searchProducts(text, 1, false);
  };

  const loadMoreProducts = () => {
    if (hasMoreProducts && !searchLoading) {
      searchProducts(searchKeyword, searchPage + 1, true);
    }
  };

  const getSlabDetails = (productId: string, quantity: number) => {
    const slabs = productPricesCache[productId] || [];
    const matchingSlab = slabs.find(
      (slab) => quantity >= slab.minCount && quantity <= slab.maxCount
    );
    
    if (matchingSlab) {
      const pricingType = matchingSlab.pricingType;
      const unitPrice = parseFloat(matchingSlab.unitPrice || '0');
      const fixedAmount = parseFloat(matchingSlab.fixedAmount || '0');
      const amount = pricingType === 'FIXED' ? fixedAmount : quantity * unitPrice;
      return {
        pricingType,
        unitPrice: pricingType === 'FIXED' ? fixedAmount : unitPrice,
        amount,
        label: pricingType === 'FIXED' ? `₹${fixedAmount.toLocaleString('en-IN')} (Fixed)` : `${quantity} × ₹${unitPrice.toLocaleString('en-IN')} (Unit)`,
        rangeLabel: `${matchingSlab.minCount} - ${matchingSlab.maxCount}`,
      };
    }
    return {
      pricingType: 'UNIT',
      unitPrice: 0,
      amount: 0,
      label: 'No matching slab',
      rangeLabel: 'N/A',
    };
  };

  const handleProductToggle = async (productId: string, productName: string) => {
    const isSelected = !!selectedProducts[productId];
    const nextSelected = { ...selectedProducts };

    if (isSelected) {
      delete nextSelected[productId];
      setSelectedProducts(nextSelected);
    } else {
      const slabs = await fetchSlabPricesOnDemand(productId);
      const initialQty = 1;
      const matchingSlab = slabs.find(
        (slab: any) => initialQty >= slab.minCount && initialQty <= slab.maxCount
      );
      
      let pricingType = 'UNIT';
      let unitPrice = 0;
      let fixedAmount = 0;
      let amount = 0;
      let rangeLabel = 'N/A';
      let label = 'No matching slab';

      if (matchingSlab) {
        pricingType = matchingSlab.pricingType;
        unitPrice = parseFloat(matchingSlab.unitPrice || '0');
        fixedAmount = parseFloat(matchingSlab.fixedAmount || '0');
        amount = pricingType === 'FIXED' ? fixedAmount : initialQty * unitPrice;
        label = pricingType === 'FIXED' ? `₹${fixedAmount.toLocaleString('en-IN')} (Fixed)` : `${initialQty} × ₹${unitPrice.toLocaleString('en-IN')} (Unit)`;
        rangeLabel = `${matchingSlab.minCount} - ${matchingSlab.maxCount}`;
      }

      nextSelected[productId] = {
        quantity: initialQty,
        unitPrice: pricingType === 'FIXED' ? fixedAmount : unitPrice,
        amount,
        pricingType,
        label,
        rangeLabel,
        name: productName,
      };
      setSelectedProducts(nextSelected);
    }
  };

  const handleQuantityChange = (productId: string, qtyStr: string) => {
    const qty = parseInt(qtyStr || '0', 10);
    const nextSelected = { ...selectedProducts };
    if (nextSelected[productId]) {
      const slab = getSlabDetails(productId, qty);
      nextSelected[productId] = {
        ...nextSelected[productId],
        quantity: qty,
        unitPrice: slab.unitPrice,
        amount: slab.amount,
        pricingType: slab.pricingType,
        label: slab.label,
        rangeLabel: slab.rangeLabel,
      };
      setSelectedProducts(nextSelected);
    }
  };

  const getSubtotal = () => {
    let subtotal = 0;
    Object.keys(selectedProducts).forEach((key) => {
      const item = selectedProducts[key];
      subtotal += item.amount;
    });
    return subtotal;
  };

  const getGrandTotal = () => {
    const sub = getSubtotal();
    const disc = parseFloat(discount || '0') || 0;
    const tax = parseFloat(taxAmount || '0') || 0;
    return sub - disc + tax;
  };

  const handleSave = async () => {
    const productKeys = Object.keys(selectedProducts);
    if (productKeys.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one product.');
      return;
    }

    setLoading(true);
    const itemsPayload = productKeys.map((key) => ({
      productId: key,
      quantity: selectedProducts[key].quantity,
      rate: selectedProducts[key].unitPrice,
    }));

    const payload = {
      quotationNo: quotationNo.trim() || undefined,
      leadId: leadId || null,
      customerId: customerId || null,
      discount: parseFloat(discount) || 0,
      taxAmount: parseFloat(taxAmount) || 0,
      status,
      terms: terms.trim() || null,
      notes: notes.trim() || null,
      items: itemsPayload,
    };

    try {
      if (isEditMode) {
        await api.put(`/quotations/${quoteId}`, payload);
      } else {
        await api.post('/quotations', payload);
      }
      setLoading(false);
      Alert.alert('Success', isEditMode ? 'Quotation saved/revised successfully.' : 'Quotation created successfully.');
      navigation.goBack();
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save quotation.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B3A" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isEditMode ? 'Revise Quotation' : 'New Quotation'}</Text>
          <Text style={styles.headerSub}>{isEditMode ? 'Update quote revision details' : 'Draft a new quote'}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6B81" style={{ flex: 1 }} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            {/* Header info */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#5854D6' }]} />
              <Text style={styles.sectionTitle}>Assignee & Status</Text>
            </View>

            {/* Status Selectors */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quotation Status</Text>
              <View style={styles.chipGrid}>
                {['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, status === s && styles.chipActive]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Select Lead */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Associate Lead (Optional)</Text>
              <View style={styles.selectContainer}>
                {leadsList.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={[styles.selectBtn, leadId === l.id && styles.selectBtnActive]}
                    onPress={() => { setLeadId(l.id === leadId ? '' : l.id); if (l.id === leadId) setLeadId(''); }}
                  >
                    <Text style={[styles.selectBtnText, leadId === l.id && styles.selectBtnTextActive]}>
                      {l.companyName} ({l.leadNo})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Select Customer */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Associate Customer Account (Optional)</Text>
              <View style={styles.selectContainer}>
                {customersList.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.selectBtn, customerId === c.id && styles.selectBtnActive]}
                    onPress={() => { setCustomerId(c.id === customerId ? '' : c.id); if (c.id === customerId) setCustomerId(''); }}
                  >
                    <Text style={[styles.selectBtnText, customerId === c.id && styles.selectBtnTextActive]}>
                      {c.companyName} ({c.customerCode})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Product selection */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#FF6B81' }]} />
              <Text style={styles.sectionTitle}>Add Products</Text>
            </View>

            <TouchableOpacity 
              style={styles.searchDropdownBtn}
              onPress={() => {
                setProductModalVisible(true);
                searchProducts('', 1, false);
              }}
            >
              <MaterialIcons name="search" size={20} color="#8A99AD" style={{ marginRight: 8 }} />
              <Text style={styles.searchDropdownText}>Search & Select Products...</Text>
            </TouchableOpacity>

            {/* Configuration of Selected products */}
            {Object.keys(selectedProducts).map((productId) => {
              const item = selectedProducts[productId];
              return (
                <View key={productId} style={styles.productSlabCard}>
                  <View style={styles.slabHeader}>
                    <Text style={styles.slabTitle}>{item.name}</Text>
                    <TouchableOpacity onPress={() => handleProductToggle(productId, item.name)}>
                      <MaterialIcons name="close" size={18} color="#FF6B81" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.slabBody}>
                    <View style={styles.slabCol}>
                      <Text style={styles.slabLabel}>Count</Text>
                      <TextInput
                        style={styles.slabInput}
                        keyboardType="number-pad"
                        value={String(item.quantity || '')}
                        onChangeText={(t) => handleQuantityChange(productId, t)}
                        placeholder="e.g. 1000"
                        placeholderTextColor="#A0AEC0"
                      />
                    </View>

                    <View style={styles.slabCol}>
                      <Text style={styles.slabLabel}>{item.pricingType === 'FIXED' ? 'Fixed (Range)' : 'Unit Price'}</Text>
                      <Text style={styles.slabPrice}>₹{(item.unitPrice || 0).toLocaleString('en-IN')}</Text>
                      <Text style={{ fontSize: 9, color: '#718096', fontWeight: 'bold', marginTop: 2 }}>
                        Slab: {item.rangeLabel}
                      </Text>
                    </View>

                    <View style={styles.slabCol}>
                      <Text style={styles.slabLabel}>Line Total</Text>
                      <Text style={styles.slabPriceTotal}>₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Calculations and adjustments */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#FFB020' }]} />
              <Text style={styles.sectionTitle}>Adjustments</Text>
            </View>

            <View style={IS_WEB_WIDE ? styles.rowGrid : {}}>
              <View style={[styles.inputGroup, IS_WEB_WIDE && styles.halfWidth]}>
                <Text style={styles.label}>Discount Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                  placeholder="e.g. 5000"
                />
              </View>

              <View style={[styles.inputGroup, IS_WEB_WIDE && styles.halfWidth]}>
                <Text style={styles.label}>Tax Amount (GST/VAT) (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={taxAmount}
                  onChangeText={setTaxAmount}
                  placeholder="e.g. 18000"
                />
              </View>
            </View>

            {/* Notes & Terms */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Terms & Conditions</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                numberOfLines={3}
                value={terms}
                onChangeText={setTerms}
                placeholder="e.g. Payment due within 30 days of proposal approval."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Internal Notes</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Client requested customized reporting addon during negotiations."
              />
            </View>

            {/* Pricing Summary */}
            {Object.keys(selectedProducts).length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Pricing Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryName}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{getSubtotal().toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryName}>Discount (-)</Text>
                  <Text style={styles.summaryValue}>₹{(parseFloat(discount) || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryName}>Tax (+)</Text>
                  <Text style={styles.summaryValue}>₹{(parseFloat(taxAmount) || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRowTotal}>
                  <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                  <Text style={styles.summaryTotalValue}>₹{getGrandTotal().toLocaleString('en-IN')}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitBtnText}>{isEditMode ? 'Save Revision' : 'Create Quotation'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      {/* Product Search Modal */}
      <Modal
        visible={productModalVisible}
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={styles.modalFullOverlay}>
          <View style={styles.modalFullHeader}>
            <Text style={styles.modalFullTitle}>Select Products</Text>
            <TouchableOpacity onPress={() => setProductModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#1E1B3A" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchBox}>
            <MaterialIcons name="search" size={20} color="#8A99AD" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by name, code, or category..."
              placeholderTextColor="#8A99AD"
              value={searchKeyword}
              onChangeText={handleSearchKeywordChange}
            />
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListEmptyComponent={() => !searchLoading ? <Text style={styles.modalEmptyText}>No products found.</Text> : null}
            ListFooterComponent={() => searchLoading ? <ActivityIndicator color="#FF6B81" style={{ margin: 16 }} /> : null}
            renderItem={({ item }) => {
              const isSelected = !!selectedProducts[item.id];
              return (
                <TouchableOpacity
                  style={[styles.productSearchItem, isSelected && styles.productSearchItemActive]}
                  onPress={() => handleProductToggle(item.id, item.productName)}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.productSearchItemName}>{item.productName}</Text>
                    <Text style={styles.productSearchItemMeta}>
                      Code: {item.productCode}  |  Category: {item.category || 'General'}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={isSelected ? '#FF6B81' : '#A0AEC0'}
                  />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  header: {
    backgroundColor: '#1E1B3A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B3A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E1B3A',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 4,
  },
  chipActive: {
    borderColor: '#FFB020',
    backgroundColor: '#FFFDF5',
  },
  chipActiveProduct: {
    borderColor: '#FF6B81',
    backgroundColor: '#FFF5F6',
  },
  chipText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#D69E2E',
  },
  chipTextActiveProduct: {
    color: '#FF6B81',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  selectBtnActive: {
    borderColor: '#5854D6',
    backgroundColor: '#EEEDFC',
  },
  selectBtnText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '600',
  },
  selectBtnTextActive: {
    color: '#5854D6',
    fontWeight: '700',
  },
  productSlabCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
  },
  slabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slabTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B3A',
  },
  slabBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slabCol: {
    width: '30%',
  },
  slabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
    marginBottom: 4,
  },
  slabInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: '#1E1B3A',
  },
  slabPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
    marginTop: 4,
  },
  slabPriceTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B81',
    marginTop: 4,
  },
  rowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  summaryCard: {
    backgroundColor: '#1E1B3A',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF0F2',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryName: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  summaryValue: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF6B81',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelBtn: {
    width: '45%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
  },
  submitBtn: {
    width: '50%',
    backgroundColor: '#FF6B81',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  searchDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  searchDropdownText: {
    fontSize: 14,
    color: '#8A99AD',
    fontWeight: '600',
  },
  modalFullOverlay: {
    flex: 1,
    backgroundColor: '#F8FAFD',
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
  },
  modalFullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EDF2F7',
  },
  modalFullTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B3A',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    margin: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1B3A',
    fontWeight: '600',
  },
  modalEmptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#8A99AD',
    fontWeight: '600',
    marginTop: 40,
  },
  productSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#EDF2F7',
  },
  productSearchItemActive: {
    borderColor: '#FF6B81',
    backgroundColor: '#FFF5F6',
  },
  productSearchItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B3A',
    marginBottom: 4,
  },
  productSearchItemMeta: {
    fontSize: 12,
    color: '#8A99AD',
    fontWeight: '600',
  },
});
