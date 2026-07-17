import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';

export default function CustomerFormScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [customerType, setCustomerType] = useState('College');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (Platform.OS === 'web') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(fontLink);
    }
  }, []);

  const validateForm = () => {
    const errs: any = {};
    if (!name.trim()) errs.name = 'Customer name is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) errs.email = 'Invalid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please complete the required fields.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/customers', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        customerType,
        latitude: lat !== null && lat.trim() !== '' ? Number(lat) : null,
        longitude: lng !== null && lng.trim() !== '' ? Number(lng) : null,
      });
      setLoading(false);
      if (Platform.OS === 'web') {
        alert('Customer registered successfully.');
      } else {
        Alert.alert('Success', 'Customer registered successfully.');
      }
      navigation.goBack();
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.message || 'Failed to create customer.');
    }
  };

  const customerTypes = ['College', 'School', 'Group of Institute'];

  const getStyleForFocusedInput = (fieldName: string) => [
    styles.input,
    focusedField === fieldName && styles.inputFocused,
    !!errors[fieldName] && styles.inputError,
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>👥 Register Customer</Text>
        <Text style={styles.subtitle}>Register new institutions, colleges, and catalog leads.</Text>

        <View style={styles.card}>
          {/* Institution Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Institution Name *</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="business" size={20} color={focusedField === 'name' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
              <TextInput
                style={getStyleForFocusedInput('name')}
                placeholder="e.g. Stanford University"
                placeholderTextColor="#8A99AD"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {!!errors.name && <Text style={styles.errorText}>⚠️ {errors.name}</Text>}
          </View>

          {/* Customer Type Pills selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Classification *</Text>
            <View style={styles.segmentContainer}>
              {customerTypes.map((type) => {
                const isSelected = customerType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                    onPress={() => setCustomerType(type)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile / Phone Number *</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color={focusedField === 'phone' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
              <TextInput
                style={getStyleForFocusedInput('phone')}
                placeholder="e.g. +1 555-019-9234"
                placeholderTextColor="#8A99AD"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) setErrors({ ...errors, phone: null });
                }}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                keyboardType="phone-pad"
              />
            </View>
            {!!errors.phone && <Text style={styles.errorText}>⚠️ {errors.phone}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address (Optional)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="mail-outline" size={20} color={focusedField === 'email' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
              <TextInput
                style={getStyleForFocusedInput('email')}
                placeholder="e.g. contact@stanford.edu"
                placeholderTextColor="#8A99AD"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {!!errors.email && <Text style={styles.errorText}>⚠️ {errors.email}</Text>}
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postal Address (Optional)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="place" size={20} color={focusedField === 'address' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
              <TextInput
                style={getStyleForFocusedInput('address')}
                placeholder="e.g. 450 Serra Mall, Stanford, CA"
                placeholderTextColor="#8A99AD"
                value={address}
                onChangeText={setAddress}
                onFocus={() => setFocusedField('address')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Office Coordinates */}
          <Text style={styles.subTitleLabel}>OFFICE COORDINATES (OPTIONAL)</Text>
          <View style={styles.coordsRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={getStyleForFocusedInput('lat')}
                placeholder="e.g. 37.4275"
                placeholderTextColor="#8A99AD"
                value={lat}
                onChangeText={setLat}
                onFocus={() => setFocusedField('lat')}
                onBlur={() => setFocusedField(null)}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={getStyleForFocusedInput('lng')}
                placeholder="e.g. -122.1697"
                placeholderTextColor="#8A99AD"
                value={lng}
                onChangeText={setLng}
                onFocus={() => setFocusedField('lng')}
                onBlur={() => setFocusedField(null)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Submit Action */}
          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
            onPress={handleRegister} 
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.submitBtnInner}>
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>REGISTER CUSTOMER</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4FF',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B3A',
    letterSpacing: -0.5,
    marginBottom: 6,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  subtitle: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
    marginBottom: 24,
    fontWeight: '500',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A99AD',
    marginBottom: 8,
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  subTitleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E1B3A',
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 10,
  },
  input: {
    flex: 1,
    height: 52,
    backgroundColor: '#F8FAFD',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 14,
    color: '#1E1B3A',
    fontWeight: '500',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  inputFocused: {
    borderColor: '#FF6B81',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF6B81',
    backgroundColor: '#FFF5F5',
  },
  inputGroup: {
    marginBottom: 20,
  },
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#2D2A55', // Pill Selector background
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FF6B81', // Coral Red Active button
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A99AD',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FF6B81',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  submitBtn: {
    height: 52,
    backgroundColor: '#FF6B81', // Coral Red Submit Button
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#8A99AD',
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
});
