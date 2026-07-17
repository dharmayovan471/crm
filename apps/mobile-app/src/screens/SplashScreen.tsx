import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  useWindowDimensions,
  Animated
} from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { api } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';

const LOGO_URL = 'https://lh3.googleusercontent.com/aida/AP1WRLuFgmhae5ZV_QBM1KpWRu8mTaIch7N_yS8u3ENDKhliYneZgPO6Lh1qs6wOdMj_Y7v5lxmLM5L2g2ywFWzcrhvQIBJYjalqgVRPzDpv8ZgY8FfV_4spPcdXXp3TweLBm5cb9zFmNfeUHONBPTEbUlGUy6jaE93k_lMhrsbEeTlkulkWfaw1GegyjpTZi6RIouRSRy3AX0jWMqDjeF3DLCTSS6uehRoeWesX5ZqXzYdNMxsvxkUb1Fgzsso';

export default function SplashScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const setTenantCode = useAuthStore((state) => state.setTenantCode);
  const { width } = useWindowDimensions();

  // Animation States
  const logoOpacity = useState(new Animated.Value(0))[0];
  const logoScale = useState(new Animated.Value(0.4))[0];
  const cardTranslateY = useState(new Animated.Value(100))[0];
  const cardOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Web fonts loading
    if (Platform.OS === 'web') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(fontLink);
    }

    // Run animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        })
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  const validateCode = (val: string) => {
    if (!val.trim()) {
      return 'Workspace enterprise code is required';
    }
    if (val.trim().length < 3) {
      return 'Workspace code must be at least 3 characters';
    }
    const regex = /^[a-z0-9-]+$/;
    if (!regex.test(val.trim())) {
      return 'Alphanumeric lowercase and hyphens only';
    }
    return '';
  };

  const handleProceed = async () => {
    const error = validateCode(code);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      await api.get(`/tenants/code/${code.trim().toLowerCase()}`);
      setTenantCode(code.trim().toLowerCase());
      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        navigation.navigate('Login');
      }, 800);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage('Invalid workspace enterprise code');
      if (Platform.OS === 'web') {
        alert('Invalid company workspace code. Please try again.');
      } else {
        Alert.alert('Error', 'Invalid company code. Please try again.');
      }
    }
  };

  const isLargeScreen = width >= 860;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Top Navbar styled with `#1E1B3A` */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoGroup}>
            <Image source={{ uri: LOGO_URL }} style={styles.headerLogo} />
            <Text style={styles.headerTitle}>CRM Pro</Text>
          </View>
          {Platform.OS === 'web' && (
            <View style={styles.headerLinks}>
              <TouchableOpacity style={styles.headerLinkButton}>
                <Text style={styles.headerLinkText}>Support</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerLinkButton}>
                <Text style={styles.headerLinkText}>Enterprise</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Splash Illustration section */}
        <View style={styles.topSection}>
          <Animated.View style={[styles.illustrationContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <View style={styles.brandIconOuter}>
              <MaterialIcons name="business" size={48} color="#FF6B81" />
            </View>
            <Text style={styles.illustrationText}>Let's connect with each other</Text>
            <Text style={styles.illustrationSub}>
              Ensure secure, encrypted access to your company's CRM database pipelines.
            </Text>
          </Animated.View>
        </View>

        {/* Curved visual separator */}
        <View style={styles.curveSeparator} />

        {/* Bottom container containing form card */}
        <View style={styles.bottomSection}>
          <Animated.View style={[
            styles.card,
            isLargeScreen && styles.cardWeb,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.subtitleText}>
                Enter your company code to launch your workspace.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ENTERPRISE CODE</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="domain" size={20} color={isFocused ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      isFocused && styles.inputFocused,
                      !!errorMessage && styles.inputError,
                    ]}
                    placeholder="e.g. acme-corp"
                    placeholderTextColor="#8A99AD"
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      if (errorMessage) setErrorMessage(validateCode(text));
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {!!errorMessage ? (
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                ) : (
                  <Text style={styles.inputCaption}>
                    Your system subdomain assigned during company setup.
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  loading && styles.buttonDisabled,
                  success && styles.buttonSuccess
                ]}
                onPress={handleProceed}
                disabled={loading || success}
                activeOpacity={0.9}
              >
                {loading ? (
                  <View style={styles.buttonInner}>
                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>VERIFYING...</Text>
                  </View>
                ) : success ? (
                  <View style={styles.buttonInner}>
                    <MaterialIcons name="check" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.buttonText}>CONNECTED</Text>
                  </View>
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonText}>LET'S START</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(242, 244, 255)', // Soft grayish-purple/lavender background
  },
  header: {
    width: '100%',
    height: 64,
    backgroundColor: 'rgb(242, 244, 255)', // Dark Navy/Purple
    justifyContent: 'center',
    zIndex: 50,
  },
  headerContent: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  headerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerLinkButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  headerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F2F4FF',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#F2F4FF',
  },
  illustrationContainer: {
    alignItems: 'center',
    textAlign: 'center',
  },
  brandIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  illustrationText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1B3A',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  illustrationSub: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    fontWeight: '500',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  curveSeparator: {
    height: 36,
    backgroundColor: '#F2F4FF',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#1E1B3A', // Bottom half is Dark Navy
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  cardWeb: {
    width: '100%',
  },
  cardHeader: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B3A',
    letterSpacing: -0.5,
    marginBottom: 8,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  subtitleText: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
    fontWeight: '500',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  form: {
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
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
  inputCaption: {
    fontSize: 11,
    color: '#8A99AD',
    marginTop: 6,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF6B81',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  button: {
    height: 52,
    backgroundColor: '#FF6B81', // Coral Red Accent
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#8A99AD',
  },
  buttonSuccess: {
    backgroundColor: '#2aa946',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  cardFooter: {
    alignItems: 'center',
    marginTop: 16,
  },
  helperLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helperLinkIcon: {
    marginRight: 6,
  },
  helperLinkText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
  },
});
