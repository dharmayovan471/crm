import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stage, setStage] = useState<'FORGOT' | 'RESET'>('FORGOT');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const cardOpacity = useState(new Animated.Value(0))[0];
  const cardTranslateY = useState(new Animated.Value(60))[0];

  useEffect(() => {
    if (Platform.OS === 'web') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(fontLink);
    }
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(cardTranslateY, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Invalid email address';
    return '';
  };

  const validateCode = (val: string) => {
    if (!val.trim()) return 'Verification code is required';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'New password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateConfirmPassword = (val: string, pass: string) => {
    if (!val) return 'Confirm password is required';
    if (val !== pass) return 'Passwords do not match';
    return '';
  };

  const handleRequestCode = async () => {
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setLoading(false);
      if (Platform.OS === 'web') {
        alert('Verification code sent to your email.');
      } else {
        Alert.alert('Sent', 'Verification code sent to your email.');
      }
      setStage('RESET');
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.message || 'Request failed.');
    }
  };

  const handleResetPassword = async () => {
    const codeErr = validateCode(code);
    const passErr = validatePassword(newPassword);
    const confirmErr = validateConfirmPassword(confirmPassword, newPassword);

    if (codeErr || passErr || confirmErr) {
      setCodeError(codeErr);
      setPasswordError(passErr);
      setConfirmPasswordError(confirmErr);
      return;
    }

    setCodeError(''); setPasswordError(''); setConfirmPasswordError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        token: code.trim(),
        newPassword: newPassword.trim(),
      });
      setLoading(false);
      if (Platform.OS === 'web') {
        alert('Password has been reset successfully. Please login.');
      } else {
        Alert.alert('Success', 'Password has been reset successfully. Please login.');
      }
      navigation.navigate('Login');
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.message || 'Reset failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top section */}
        <View style={styles.topSection}>
          <View style={styles.brandIconOuter}>
            <MaterialIcons name="lock-reset" size={36} color="#FF6B81" />
          </View>
          <Text style={styles.illustrationText}>
            {stage === 'FORGOT' ? 'Forgot Password?' : 'Reset Password'}
          </Text>
          <Text style={styles.illustrationSub}>
            {stage === 'FORGOT'
              ? 'Enter your registered email to receive a reset code.'
              : `Enter the code sent to ${email} and choose a new password.`}
          </Text>
        </View>

        {/* Bottom Card Section */}
        <View style={styles.bottomSection}>
          <Animated.View
            style={[
              styles.card,
              { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
            ]}
          >
            {stage === 'FORGOT' ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="mail-outline" size={18} color={focusedInput === 'email' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        focusedInput === 'email' && styles.inputFocused,
                        !!emailError && styles.inputError,
                      ]}
                      placeholder="name@company.com"
                      placeholderTextColor="#8A99AD"
                      value={email}
                      onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(validateEmail(t)); }}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                  </View>
                  {!!emailError && <Text style={styles.errorText}>⚠️ {emailError}</Text>}
                </View>

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRequestCode} disabled={loading}>
                  {loading ? (
                    <View style={styles.buttonInner}>
                      <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                      <Text style={styles.buttonText}>SENDING...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonInner}>
                      <MaterialIcons name="send" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.buttonText}>SEND RESET CODE</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="verified" size={18} color={focusedInput === 'code' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        focusedInput === 'code' && styles.inputFocused,
                        !!codeError && styles.inputError,
                      ]}
                      placeholder="Enter verification code"
                      placeholderTextColor="#8A99AD"
                      value={code}
                      onChangeText={(t) => { setCode(t); if (codeError) setCodeError(validateCode(t)); }}
                      onFocus={() => setFocusedInput('code')}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize="none"
                    />
                  </View>
                  {!!codeError && <Text style={styles.errorText}>⚠️ {codeError}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="lock-outline" size={18} color={focusedInput === 'newPassword' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        focusedInput === 'newPassword' && styles.inputFocused,
                        !!passwordError && styles.inputError,
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor="#8A99AD"
                      value={newPassword}
                      onChangeText={(t) => { setNewPassword(t); if (passwordError) setPasswordError(validatePassword(t)); }}
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedInput('newPassword')}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                      <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#8A99AD" />
                    </TouchableOpacity>
                  </View>
                  {!!passwordError && <Text style={styles.errorText}>⚠️ {passwordError}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="lock-outline" size={18} color={focusedInput === 'confirmPassword' ? '#FF6B81' : '#8A99AD'} style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        focusedInput === 'confirmPassword' && styles.inputFocused,
                        !!confirmPasswordError && styles.inputError,
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor="#8A99AD"
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); if (confirmPasswordError) setConfirmPasswordError(validateConfirmPassword(t, newPassword)); }}
                      secureTextEntry={!showConfirmPassword}
                      onFocus={() => setFocusedInput('confirmPassword')}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={20} color="#8A99AD" />
                    </TouchableOpacity>
                  </View>
                  {!!confirmPasswordError && <Text style={styles.errorText}>⚠️ {confirmPasswordError}</Text>}
                </View>

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleResetPassword} disabled={loading}>
                  {loading ? (
                    <View style={styles.buttonInner}>
                      <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                      <Text style={styles.buttonText}>RESETTING...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonInner}>
                      <MaterialIcons name="check-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.buttonText}>RESET PASSWORD</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={styles.cardFooter}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.helperLink}>
                <MaterialIcons name="arrow-back" size={16} color="#718096" style={styles.helperLinkIcon} />
                <Text style={styles.helperLinkText}>Back to Login</Text>
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
    backgroundColor: '#F2F4FF',
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
    fontFamily: Platform.select({ web: '"Poppins", sans-serif', default: 'System' }),
  },
  illustrationSub: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
    fontWeight: '500',
    fontFamily: Platform.select({ web: '"Poppins", sans-serif', default: 'System' }),
  },
  bottomSection: {
    flex: 1.4,
    backgroundColor: '#1E1B3A',
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A99AD',
    marginBottom: 8,
    letterSpacing: 0.5,
    fontFamily: Platform.select({ web: '"Poppins", sans-serif', default: 'System' }),
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
    fontFamily: Platform.select({ web: '"Poppins", sans-serif', default: 'System' }),
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
    fontFamily: Platform.select({ web: '"Poppins", sans-serif', default: 'System' }),
  },
  button: {
    height: 52,
    backgroundColor: '#FF6B81',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
    fontFamily: Platform.select({ web: '"Poppins", sans-serif', default: 'System' }),
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 16,
    alignItems: 'center',
    marginTop: 20,
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
