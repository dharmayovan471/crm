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

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const { width } = useWindowDimensions();

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const tenantCode = useAuthStore((state) => state.tenantCode);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Animation values
  const cardTranslateY = useState(new Animated.Value(60))[0];
  const cardOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (Platform.OS === 'web') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(fontLink);
    }

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Invalid email address';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleLogin = async () => {
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      setEmailError(emailErr);
      setPasswordError(passErr);
      return;
    }

    setEmailError('');
    setPasswordError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });
      const { accessToken } = response.data;

      setAuth(accessToken, { id: '', email: email.trim() });

      const meResponse = await api.get('/auth/me');
      const profile = meResponse.data;

      setAuth(accessToken, {
        id: profile.id,
        email: profile.email,
        name: profile.name || email.trim().split('@')[0],
        designation: profile.designationName,
        department: profile.departmentName,
      });

      setLoading(false);
      navigation.navigate('MainDrawer');
    } catch (err: any) {
      setLoading(false);
      if (Platform.OS === 'web') {
        alert(err.response?.data?.message || 'Invalid email or password.');
      } else {
        Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials.');
      }
    }
  };

  const isLargeScreen = width >= 860;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Top Navbar */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoGroup}>
            <Image source={{ uri: LOGO_URL }} style={styles.headerLogo} />
            <Text style={styles.headerTitle}>CRM Pro</Text>
          </View>
          {tenantCode && (
            <View style={styles.tenantBadge}>
              <MaterialIcons name="domain" size={14} color="#FF6B81" style={{ marginRight: 6 }} />
              <Text style={styles.tenantBadgeText}>{tenantCode.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Graphic Panel */}
        <View style={styles.topSection}>
          <View style={styles.brandIconOuter}>
            <MaterialIcons name="lock-open" size={48} color="#FF6B81" />
          </View>
          <Text style={styles.illustrationText}>Welcome back!</Text>
          <Text style={styles.illustrationSub}>
            Sign in to start mapping targets, logging activity, and closing deals.
          </Text>
        </View>

        {/* Curved separator */}
        <View style={styles.curveSeparator} />

        {/* Bottom Panel containing Form Card */}
        <View style={styles.bottomSection}>
          <Animated.View style={[
            styles.card, 
            isLargeScreen && styles.cardWeb,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }
          ]}>
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="mail-outline" size={20} color={focusedInput === 'email' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'email' && styles.inputFocused,
                      !!emailError && styles.inputError,
                    ]}
                    placeholder="name@company.com"
                    placeholderTextColor="#8A99AD"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError(validateEmail(text));
                    }}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {!!emailError && <Text style={styles.errorText}>⚠️ {emailError}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="vpn-key" size={20} color={focusedInput === 'password' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'password' && styles.inputFocused,
                      !!passwordError && styles.inputError,
                      { paddingRight: 50 }
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor="#8A99AD"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError(validatePassword(text));
                    }}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={secureText}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setSecureText(!secureText)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={secureText ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#8A99AD"
                    />
                  </TouchableOpacity>
                </View>
                {!!passwordError && <Text style={styles.errorText}>⚠️ {passwordError}</Text>}
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <View style={styles.buttonInner}>
                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>LOGGING IN...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonText}>SIGN IN</Text>
                    <MaterialIcons name="login" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.helperLink} onPress={() => navigation.navigate('Splash')}>
                <MaterialIcons name="arrow-back" size={16} color="#718096" style={styles.helperLinkIcon} />
                <Text style={styles.helperLinkText}>Change enterprise workspace</Text>
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
    backgroundColor: '#F2F4FF', // Soft Gray-Purple
  },
  header: {
    width: '100%',
    height: 64,
    backgroundColor: 'rgb(242, 244, 255)',
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
  tenantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 129, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 129, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tenantBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B81',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: '#F2F4FF',
  },
  brandIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  illustrationText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B3A',
    textAlign: 'center',
    marginBottom: 8,
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
    paddingHorizontal: 24,
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
    flex: 1.2,
    backgroundColor: '#1E1B3A', // Dark Navy curved box
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
  form: {
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 20,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B81', // Coral Red forgot link
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
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: 52,
    justifyContent: 'center',
    zIndex: 10,
  },
  errorText: {
    color: '#FF6B81',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  button: {
    height: 52,
    backgroundColor: '#FF6B81', // Coral Red Sign In button
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#8A99AD',
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
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 16,
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
