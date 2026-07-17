import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import { api } from '../services/api';
import MapView, { Marker } from '../components/Map';
import { MaterialIcons } from '@expo/vector-icons';

export default function LeadFormScreen({ navigation, route }: any) {
  const leadId = route?.params?.leadId || null;
  const isEditMode = !!leadId;
  const { width: windowWidth } = useWindowDimensions();
  const IS_WEB_WIDE = Platform.OS === 'web' && windowWidth > 700;

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [expectedValue, setExpectedValue] = useState('0');
  const [industry, setIndustry] = useState('');
  const [source, setSource] = useState('');

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  // Dynamic dropdowns loaded from master tables
  const [industriesList, setIndustriesList] = useState<string[]>([]);
  const [sourcesList, setSourcesList] = useState<string[]>([]);
  const [productPricesCache, setProductPricesCache] = useState<{ [productId: string]: any[] }>({});

  // Selected products state
  const [selectedProducts, setSelectedProducts] = useState<{ [productId: string]: any }>({});

  // Searchable Product Modal State
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(fontLink);
    }
    fetchDropdownsAndProducts();
  }, []);

  const fetchDropdownsAndProducts = async () => {
    setLoading(true);
    try {
      // 1. Fetch Lead Sources Master
      const sourcesRes = await api.get('/masters/lead-sources');
      const sources = (sourcesRes.data || []).map((s: any) => s.name);
      setSourcesList(sources.length > 0 ? sources : ['Cold Call', 'Referral', 'Website', 'Campaign', 'Other']);

      // 2. Fetch Industries Master
      const industriesRes = await api.get('/masters/industries');
      const industries = (industriesRes.data || []).map((i: any) => i.name);
      setIndustriesList(industries.length > 0 ? industries : ['School', 'College', 'Hospital', 'Manufacturing', 'Software', 'Other']);

      // 3. Initialize prices cache
      const cache: { [productId: string]: any[] } = {};
      setProductPricesCache(cache);

      // 4. If editing, fetch lead details last
      if (isEditMode && leadId) {
        await fetchLeadForEdit(leadId, cache, []);
      }
    } catch (err) {
      console.warn('Error loading master data dropdowns', err);
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

  const fetchLeadForEdit = async (id: string, pricesCache: any, productsList: any[]) => {
    try {
      const res = await api.get(`/leads/${id}`);
      const l = res.data;
      setCompanyName(l.companyName || '');
      setContactPerson(l.contactPerson || '');
      setMobile(l.mobile || '');
      setEmail(l.email || '');
      setExpectedValue(l.expectedValue ? String(Math.round(parseFloat(l.expectedValue))) : '0');
      setIndustry(l.industry || '');
      setSource(l.source || '');
      if (l.latitude) setLat(l.latitude);
      if (l.longitude) setLng(l.longitude);

      // Restore selected products
      if (l.products && l.products.length > 0) {
        const selectedMap: { [productId: string]: any } = {};
        for (const lp of l.products) {
          // Fetch prices on demand for pre-linked products
          let slabs = pricesCache[lp.productId];
          if (!slabs) {
            try {
              const pricesRes = await api.get(`/products/${lp.productId}/prices`);
              slabs = pricesRes.data || [];
              pricesCache[lp.productId] = slabs;
            } catch (e) {
              slabs = [];
            }
          }

          const matchingSlab = slabs.find(
            (slab: any) => lp.quantity >= slab.minCount && lp.quantity <= slab.maxCount
          );

          const pricingType = matchingSlab ? matchingSlab.pricingType : 'UNIT';
          const rangeLabel = matchingSlab ? `${matchingSlab.minCount} - ${matchingSlab.maxCount}` : 'N/A';
          const label = matchingSlab
            ? (pricingType === 'FIXED' ? `₹${parseFloat(matchingSlab.fixedAmount).toLocaleString('en-IN')} (Fixed)` : `${lp.quantity} × ₹${parseFloat(matchingSlab.unitPrice).toLocaleString('en-IN')} (Unit)`)
            : `${lp.quantity} × ₹${parseFloat(lp.unitPrice).toLocaleString('en-IN')}`;

          selectedMap[lp.productId] = {
            quantity: lp.quantity,
            unitPrice: parseFloat(lp.unitPrice),
            amount: lp.quantity * parseFloat(lp.unitPrice),
            pricingType,
            label,
            rangeLabel,
            name: lp.productName || 'Product',
          };
        }
        setProductPricesCache({ ...pricesCache });
        setSelectedProducts(selectedMap);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load lead data for editing.');
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

  // Handle product toggle selection
  const handleProductToggle = async (productId: string, productName: string) => {
    const isSelected = !!selectedProducts[productId];
    const nextSelected = { ...selectedProducts };

    if (isSelected) {
      delete nextSelected[productId];
      setSelectedProducts(nextSelected);
      recalculateGrandTotal(nextSelected);
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
      recalculateGrandTotal(nextSelected);
    }
  };

  // Handle quantity change for a product
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
      recalculateGrandTotal(nextSelected);
    }
  };

  const recalculateGrandTotal = (productsMap: any) => {
    let total = 0;
    Object.keys(productsMap).forEach((key) => {
      const item = productsMap[key];
      total += item.amount;
    });
    setExpectedValue(String(total));
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (mobile.trim()) {
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(mobile.trim().replace(/\s/g, '')))
        newErrors.mobile = 'Invalid mobile number (min 8 digits)';
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) newErrors.email = 'Invalid email address';
    }
    if (!industry.trim()) newErrors.industry = 'Industry is required';
    if (!source.trim()) newErrors.source = 'Source is required';

    const selectedKeys = Object.keys(selectedProducts);
    if (selectedKeys.length === 0) {
      newErrors.products = 'Please select at least one product';
    } else {
      selectedKeys.forEach((key) => {
        if (selectedProducts[key].quantity <= 0) {
          newErrors.products = 'Product estimated counts must be positive';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check all fields and ensure at least one product is selected.');
      return;
    }
    setLoading(true);

    const productsDataPayload = Object.keys(selectedProducts).map((key) => ({
      productId: key,
      quantity: selectedProducts[key].quantity,
      unitPrice: selectedProducts[key].unitPrice,
    }));

    try {
      const payload = {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        mobile: mobile.trim() || null,
        email: email.trim() || null,
        industry: industry.trim(),
        source: source.trim(),
        latitude: lat !== null ? Number(lat) : null,
        longitude: lng !== null ? Number(lng) : null,
        products: productsDataPayload,
      };

      if (isEditMode) {
        await api.put(`/leads/${leadId}`, payload);
      } else {
        await api.post('/leads', payload);
      }

      setLoading(false);
      if (Platform.OS === 'web') {
        alert(isEditMode ? 'Lead updated successfully.' : 'Lead created successfully.');
      } else {
        Alert.alert('Success', isEditMode ? 'Lead updated successfully.' : 'Lead created successfully.');
      }
      navigation.goBack();
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.message || (isEditMode ? 'Failed to update lead.' : 'Failed to create lead.'));
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    !!errors[field] && styles.inputError,
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B3A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Lead' : 'New Lead'}</Text>
          <Text style={styles.headerSub}>{isEditMode ? 'Update the lead details below' : 'Fill in the details below'}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            {/* Section: Contact Info */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#5854D6' }]} />
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>

            <View style={IS_WEB_WIDE ? styles.rowGrid : {}}>
              {/* Company Name */}
              <View style={[styles.inputGroup, IS_WEB_WIDE && styles.halfWidth]}>
                <Text style={styles.label}>Company Name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={inputStyle('companyName')}
                  value={companyName}
                  onChangeText={(t) => { setCompanyName(t); if (errors.companyName) setErrors({ ...errors, companyName: null }); }}
                  placeholder="Apex Industries Ltd"
                  placeholderTextColor="#8A99AD"
                  onFocus={() => setFocusedField('companyName')}
                  onBlur={() => setFocusedField(null)}
                />
                {!!errors.companyName && <Text style={styles.errorText}>⚠️ {errors.companyName}</Text>}
              </View>

              {/* Contact Person */}
              <View style={[styles.inputGroup, IS_WEB_WIDE && styles.halfWidth]}>
                <Text style={styles.label}>Contact Person <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={inputStyle('contactPerson')}
                  value={contactPerson}
                  onChangeText={(t) => { setContactPerson(t); if (errors.contactPerson) setErrors({ ...errors, contactPerson: null }); }}
                  placeholder="Mr. Suresh Kumar"
                  placeholderTextColor="#8A99AD"
                  onFocus={() => setFocusedField('contactPerson')}
                  onBlur={() => setFocusedField(null)}
                />
                {!!errors.contactPerson && <Text style={styles.errorText}>⚠️ {errors.contactPerson}</Text>}
              </View>
            </View>

            <View style={IS_WEB_WIDE ? styles.rowGrid : {}}>
              {/* Mobile */}
              <View style={[styles.inputGroup, IS_WEB_WIDE && styles.halfWidth]}>
                <Text style={styles.label}>Mobile Phone</Text>
                <TextInput
                  style={inputStyle('mobile')}
                  value={mobile}
                  onChangeText={(t) => { setMobile(t); if (errors.mobile) setErrors({ ...errors, mobile: null }); }}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#8A99AD"
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedField('mobile')}
                  onBlur={() => setFocusedField(null)}
                />
                {!!errors.mobile && <Text style={styles.errorText}>⚠️ {errors.mobile}</Text>}
              </View>

              {/* Email */}
              <View style={[styles.inputGroup, IS_WEB_WIDE && styles.halfWidth]}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={inputStyle('email')}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: null }); }}
                  placeholder="suresh@apex.com"
                  placeholderTextColor="#8A99AD"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                {!!errors.email && <Text style={styles.errorText}>⚠️ {errors.email}</Text>}
              </View>
            </View>

            {/* Section: Lead Details */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#FFB020' }]} />
              <Text style={styles.sectionTitle}>Lead Details</Text>
            </View>

            {/* Industry */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Industry <Text style={styles.required}>*</Text></Text>
              <View style={styles.chipGrid}>
                {industriesList.map((ind) => (
                  <TouchableOpacity
                    key={ind}
                    style={[styles.chip, industry === ind && styles.chipActive]}
                    onPress={() => { setIndustry(ind); if (errors.industry) setErrors({ ...errors, industry: null }); }}
                  >
                    <Text style={[styles.chipText, industry === ind && styles.chipTextActive]}>{ind}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!errors.industry && <Text style={styles.errorText}>⚠️ {errors.industry}</Text>}
            </View>

            {/* Source */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lead Source <Text style={styles.required}>*</Text></Text>
              <View style={styles.chipGrid}>
                {sourcesList.map((src) => (
                  <TouchableOpacity
                    key={src}
                    style={[styles.chip, source === src && styles.chipActive]}
                    onPress={() => { setSource(src); if (errors.source) setErrors({ ...errors, source: null }); }}
                  >
                    <Text style={[styles.chipText, source === src && styles.chipTextActive]}>{src}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!errors.source && <Text style={styles.errorText}>⚠️ {errors.source}</Text>}
            </View>            {/* Product Selection Section */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#FF6B81' }]} />
              <Text style={styles.sectionTitle}>Select Products & Estimated Range</Text>
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
            {!!errors.products && <Text style={styles.errorText}>⚠️ {errors.products}</Text>}
            {/* Product Configuration Slates */}
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
                      <Text style={styles.slabLabel}>Estimated Count</Text>
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

            {/* Pricing Summary Card */}
            {Object.keys(selectedProducts).length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Professional Pricing Summary</Text>
                {Object.keys(selectedProducts).map((productId) => {
                  const item = selectedProducts[productId];
                  return (
                    <View key={productId} style={styles.summaryRow}>
                      <Text style={styles.summaryName}>✓ {item.name}</Text>
                      <Text style={styles.summaryValue}>{item.label} = ₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                  );
                })}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRowTotal}>
                  <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                  <Text style={styles.summaryTotalValue}>₹{parseFloat(expectedValue).toLocaleString('en-IN')}</Text>
                </View>
              </View>
            )}

            {/* GPS Location Location */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#FF6B81' }]} />
              <Text style={styles.sectionTitle}>Client GPS Pinpoint</Text>
            </View>

            <TouchableOpacity style={styles.locationBtn} onPress={() => setMapVisible(true)}>
              <MaterialIcons name="my-location" size={18} color="#FF6B81" />
              <Text style={styles.locationBtnText}>
                {lat && lng ? 'Update Custom GPS Pin' : 'Pin Client Location on Map'}
              </Text>
            </TouchableOpacity>

            {lat && lng && (
              <View style={styles.locationDisplay}>
                <Text style={styles.locationText}>
                  Coordinates: Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitBtnText}>{isEditMode ? 'Update Lead' : 'Create Lead'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Map modal selection */}
      <Modal animationType="slide" transparent={false} visible={mapVisible} onRequestClose={() => setMapVisible(false)}>
        <View style={styles.mapModalWrapper}>
          <View style={styles.mapHeader}>
            <TouchableOpacity style={styles.mapCloseBtn} onPress={() => setMapVisible(false)}>
              <MaterialIcons name="close" size={24} color="#1E1B3A" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Hold & Drag Pin to Select Location</Text>
            <TouchableOpacity
              style={styles.mapSaveBtn}
              onPress={() => {
                if (tempCoords) {
                  setLat(tempCoords.latitude);
                  setLng(tempCoords.longitude);
                }
                setMapVisible(false);
              }}
            >
              <Text style={styles.mapSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              style={StyleSheet.absoluteFillObject}
              initialRegion={{
                latitude: lat || 12.9716,
                longitude: lng || 77.5946,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={(e: any) => {
                if (e.nativeEvent && e.nativeEvent.coordinate) {
                  setTempCoords(e.nativeEvent.coordinate);
                }
              }}
            >
              <Marker
                coordinate={tempCoords || { latitude: lat || 12.9716, longitude: lng || 77.5946 }}
                draggable
                onDragEnd={(e: any) => {
                  if (e.nativeEvent && e.nativeEvent.coordinate) {
                    setTempCoords(e.nativeEvent.coordinate);
                  }
                }}
              />
            </MapView>
          </View>

          {tempCoords && (
            <View style={styles.mapPinBar}>
              <Text style={styles.mapPinBarText}>
                📍 {tempCoords.latitude.toFixed(5)}, {tempCoords.longitude.toFixed(5)}
              </Text>
              <TouchableOpacity onPress={() => setTempCoords(null)}>
                <Text style={styles.mapPinClear}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F2F4FF',
  },
  kavWrapper: {
    flex: 1,
  },

  // Header
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
    letterSpacing: -0.3,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },

  // Form Wrapper
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },

  // Section titles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B3A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Grid / input group
  rowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 8,
  },
  required: {
    color: '#E53E3E',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#1E1B3A',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  inputFocused: {
    borderColor: '#FF6B81',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#E53E3E',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },

  // Chips
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

  // Slab card
  productSlabCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  slabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slabTitle: {
    fontSize: 14,
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
    marginBottom: 6,
  },
  slabInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#1E1B3A',
    fontWeight: '700',
  },
  slabPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4A5568',
    marginTop: 6,
  },
  slabPriceTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B81',
    marginTop: 6,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#1E1B3A',
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF0F2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryName: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6B81',
  },

  // Map pinbar
  mapPinBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  mapPinBarText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#4A5568',
  },
  mapPinClear: {
    color: '#E53E3E',
    fontWeight: '800',
    fontSize: 13,
  },

  // Location button
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingVertical: 12,
    marginBottom: 12,
  },
  locationBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5568',
    marginLeft: 8,
  },
  locationDisplay: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
  },

  // Action Buttons
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancelBtn: {
    width: '45%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5568',
  },
  submitBtn: {
    width: '50%',
    backgroundColor: '#FF6B81',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Map Modal
  mapModalWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapCloseBtn: {
    padding: 4,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B3A',
  },
  mapSaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF6B81',
    borderRadius: 12,
  },
  mapSaveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  mapContainer: {
    flex: 1,
  },
  subText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
    marginBottom: 8,
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
