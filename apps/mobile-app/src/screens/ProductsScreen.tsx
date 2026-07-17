import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [uom, setUom] = useState('');
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [unitPrice, setUnitPrice] = useState('');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation errors
  const [productErrors, setProductErrors] = useState<any>({});
  const [priceErrors, setPriceErrors] = useState<any>({});

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedProductId(res.data[0].id);
        fetchPrices(res.data[0].id);
      }
    } catch (err) {
      console.warn('Failed to load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const validateProduct = () => {
    const errs: any = {};
    if (!productCode.trim()) errs.productCode = 'Product code is required';
    if (!productName.trim()) errs.productName = 'Product name is required';
    setProductErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createProduct = async () => {
    if (!validateProduct()) {
      Alert.alert('Validation Error', 'Please check all required fields.');
      return;
    }
    try {
      await api.post('/products', {
        productCode: productCode.trim().toUpperCase(),
        productName: productName.trim(),
        category: category.trim(),
        description: description.trim(),
        uom: uom.trim() || 'Units',
      });
      setProductCode('');
      setProductName('');
      setCategory('');
      setDescription('');
      setUom('');
      setProductErrors({});
      fetchProducts();
      Alert.alert('Success', 'Product successfully added.');
    } catch (err) {
      Alert.alert('Error', 'Failed to create product.');
    }
  };

  const fetchPrices = async (productId: string) => {
    setLoadingPrices(true);
    try {
      const res = await api.get(`/products/${productId}/prices`);
      setPrices(res.data || []);
    } catch (err) {
      console.warn('Failed to load pricing ranges', err);
    } finally {
      setLoadingPrices(false);
    }
  };

  const validatePrice = () => {
    const errs: any = {};
    
    if (!unitPrice.trim()) {
      errs.unitPrice = 'Price is required';
    } else {
      const val = parseFloat(unitPrice);
      if (isNaN(val) || val <= 0) {
        errs.unitPrice = 'Must be > 0';
      }
    }

    let min = 0;
    if (!minQty.trim()) {
      errs.minQty = 'Min Qty is required';
    } else {
      min = parseInt(minQty);
      if (isNaN(min) || min < 1) {
        errs.minQty = 'Must be >= 1';
      }
    }

    let max = 0;
    if (!maxQty.trim()) {
      errs.maxQty = 'Max Qty is required';
    } else {
      max = parseInt(maxQty);
      if (isNaN(max) || max < 1) {
        errs.maxQty = 'Must be >= 1';
      } else if (max < min) {
        errs.maxQty = 'Must be >= Min Qty';
      }
    }

    setPriceErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addPrice = async () => {
    if (!selectedProductId) {
      Alert.alert('Error', 'Please select a product first.');
      return;
    }

    if (!validatePrice()) {
      Alert.alert('Validation Error', 'Please check all required fields.');
      return;
    }

    try {
      await api.post(`/products/${selectedProductId}/prices`, {
        unitPrice: parseFloat(unitPrice),
        minimumQty: parseInt(minQty),
        maximumQty: parseInt(maxQty),
        effectiveFrom: effectiveFrom.trim() || new Date().toISOString(),
        effectiveTo: effectiveTo.trim() || new Date(Date.now() + 31536000000).toISOString(),
      });
      setUnitPrice('');
      setMinQty('');
      setMaxQty('');
      setEffectiveFrom('');
      setEffectiveTo('');
      setPriceErrors({});
      fetchPrices(selectedProductId);
      Alert.alert('Success', 'Product price matrix added.');
    } catch (err) {
      Alert.alert('Error', 'Failed to create product price matrix.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>📦 Products & Pricing Matrix</Text>

      {/* Add Product Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Product Catalog</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Code *</Text>
          <TextInput
            style={[
              styles.input,
              focusedField === 'productCode' && styles.inputFocused,
              !!productErrors.productCode && styles.inputError
            ]}
            value={productCode}
            onChangeText={(text) => {
              setProductCode(text);
              if (productErrors.productCode) setProductErrors({ ...productErrors, productCode: null });
            }}
            placeholder="e.g. ELEC-001"
            placeholderTextColor="#A0AEC0"
            autoCapitalize="characters"
            onFocus={() => setFocusedField('productCode')}
            onBlur={() => setFocusedField(null)}
          />
          {!!productErrors.productCode && <Text style={styles.errorText}>⚠️ {productErrors.productCode}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={[
              styles.input,
              focusedField === 'productName' && styles.inputFocused,
              !!productErrors.productName && styles.inputError
            ]}
            value={productName}
            onChangeText={(text) => {
              setProductName(text);
              if (productErrors.productName) setProductErrors({ ...productErrors, productName: null });
            }}
            placeholder="e.g. Copper Wire Core"
            placeholderTextColor="#A0AEC0"
            onFocus={() => setFocusedField('productName')}
            onBlur={() => setFocusedField(null)}
          />
          {!!productErrors.productName && <Text style={styles.errorText}>⚠️ {productErrors.productName}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { width: '48%' }]}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={[styles.input, focusedField === 'category' && styles.inputFocused]}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Hardware"
              placeholderTextColor="#A0AEC0"
              onFocus={() => setFocusedField('category')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          <View style={[styles.inputGroup, { width: '48%' }]}>
            <Text style={styles.label}>UoM</Text>
            <TextInput
              style={[styles.input, focusedField === 'uom' && styles.inputFocused]}
              value={uom}
              onChangeText={setUom}
              placeholder="e.g. Meters"
              placeholderTextColor="#A0AEC0"
              onFocus={() => setFocusedField('uom')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, focusedField === 'description' && styles.inputFocused]}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. High-efficiency conductivity raw copper spool"
            placeholderTextColor="#A0AEC0"
            onFocus={() => setFocusedField('description')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={createProduct}>
          <Text style={styles.buttonText}>ADD PRODUCT</Text>
        </TouchableOpacity>
      </View>

      {/* Active Catalog List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Products</Text>
        {loadingProducts ? (
          <ActivityIndicator color="#FF6B81" style={{ marginVertical: 12 }} />
        ) : products.length === 0 ? (
          <Text style={styles.empty}>No products in catalog.</Text>
        ) : (
          <View style={styles.productsList}>
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.prodRow, selectedProductId === p.id && styles.prodRowActive]}
                onPress={() => {
                  setSelectedProductId(p.id);
                  fetchPrices(p.id);
                }}
              >
                <Text style={[styles.prodName, selectedProductId === p.id && styles.prodNameActive]}>{p.productName}</Text>
                <Text style={[styles.prodCodeText, selectedProductId === p.id && styles.prodCodeTextActive]}>{p.productCode}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Pricing Matrix settings */}
      {selectedProductId && (
        <View style={styles.card}>
          <Text style={styles.cardTitleSection}>Pricing Tier matrix</Text>
          {loadingPrices ? (
            <ActivityIndicator color="#FF6B81" style={{ marginVertical: 12 }} />
          ) : prices.length === 0 ? (
            <Text style={styles.empty}>No pricing limits defined for this product.</Text>
          ) : (
            prices.map((pr) => (
              <View key={pr.id} style={styles.priceRow}>
                <View>
                  <Text style={styles.priceHeading}>Quantity Range {pr.minimumQty} – {pr.maximumQty}</Text>
                  <Text style={styles.priceDateLabel}>Active Term</Text>
                </View>
                <Text style={styles.priceVal}>${parseFloat(pr.unitPrice).toLocaleString()}</Text>
              </View>
            ))
          )}

          <Text style={[styles.cardTitle, { marginTop: 24, marginBottom: 12 }]}>Add Pricing range matrix</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tier Price ($) *</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'unitPrice' && styles.inputFocused,
                !!priceErrors.unitPrice && styles.inputError
              ]}
              value={unitPrice}
              onChangeText={(text) => {
                setUnitPrice(text);
                if (priceErrors.unitPrice) setPriceErrors({ ...priceErrors, unitPrice: null });
              }}
              placeholder="e.g. 19.99"
              placeholderTextColor="#A0AEC0"
              keyboardType="numeric"
              onFocus={() => setFocusedField('unitPrice')}
              onBlur={() => setFocusedField(null)}
            />
            {!!priceErrors.unitPrice && <Text style={styles.errorText}>⚠️ {priceErrors.unitPrice}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.label}>Min Qty *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'minQty' && styles.inputFocused,
                  !!priceErrors.minQty && styles.inputError
                ]}
                value={minQty}
                onChangeText={(text) => {
                  setMinQty(text);
                  if (priceErrors.minQty) setPriceErrors({ ...priceErrors, minQty: null });
                }}
                placeholder="1"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                onFocus={() => setFocusedField('minQty')}
                onBlur={() => setFocusedField(null)}
              />
              {!!priceErrors.minQty && <Text style={styles.errorText}>⚠️ {priceErrors.minQty}</Text>}
            </View>

            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.label}>Max Qty *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'maxQty' && styles.inputFocused,
                  !!priceErrors.maxQty && styles.inputError
                ]}
                value={maxQty}
                onChangeText={(text) => {
                  setMaxQty(text);
                  if (priceErrors.maxQty) setPriceErrors({ ...priceErrors, maxQty: null });
                }}
                placeholder="100"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                onFocus={() => setFocusedField('maxQty')}
                onBlur={() => setFocusedField(null)}
              />
              {!!priceErrors.maxQty && <Text style={styles.errorText}>⚠️ {priceErrors.maxQty}</Text>}
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={addPrice}>
            <Text style={styles.buttonText}>ADD PRICING RANGE</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 20,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#718096',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitleSection: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A202C',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#FF6B81',
  },
  inputError: {
    borderColor: '#e53e3e',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    height: 48,
    backgroundColor: '#FF6B81',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  empty: {
    fontStyle: 'italic',
    color: '#A0AEC0',
    fontWeight: '500',
    paddingVertical: 8,
  },
  productsList: {
    marginVertical: 4,
  },
  prodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prodRowActive: {
    backgroundColor: '#FF6B81',
    borderColor: '#FF6B81',
  },
  prodName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3748',
  },
  prodNameActive: {
    color: '#FFFFFF',
  },
  prodCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  prodCodeTextActive: {
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  priceHeading: {
    fontWeight: '700',
    fontSize: 14,
    color: '#2D3748',
  },
  priceDateLabel: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 2,
    fontWeight: '600',
  },
  priceVal: {
    fontWeight: '800',
    fontSize: 16,
    color: '#FF6B81',
  },
});
