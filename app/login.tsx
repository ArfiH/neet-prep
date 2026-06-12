import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Link, Router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, RefreshCw, LogOut } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/authContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import WhatsAppSignInButton from '@/components/WhatsAppSignInButton';
import AlertBanner from '@/components/AlertBanner';
import CustomAlert from '@/components/CustomAlert';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, resendVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sessionInvalidated, setSessionInvalidated] = useState(false);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [conflictEmail, setConflictEmail] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('session_invalidated').then(val => {
      if (val === 'true') {
        setSessionInvalidated(true);
        AsyncStorage.removeItem('session_invalidated');
      }
    });
  }, []);

  async function handleLogin(force = false) {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setNeedsVerification(false);
    setResendMessage('');

    try {
      if (force) {
        await login(email, password, true);
      } else {
        await login(email, password);
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.message === 'ACTIVE_SESSION_EXISTS') {
        setConflictEmail(email);
        setShowConflictAlert(true);
      } else if (e.needs_verification) {
        setNeedsVerification(true);
        setError('Please verify your email before logging in');
      } else {
        setError(e.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(force = false) {
    setGoogleLoading(true);
    setError('');
    try {
      if (force) {
        await loginWithGoogle(true);
      } else {
        await loginWithGoogle();
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.message === 'ACTIVE_SESSION_EXISTS') {
        setShowConflictAlert(true);
      } else {
        setError(e.message || 'Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    setResendMessage('');
    try {
      const msg = await resendVerification(email);
      setResendMessage(msg);
    } catch (e: any) {
      setResendMessage(e.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {sessionInvalidated && (
            <View style={{ marginBottom: 16 }}>
              <AlertBanner
                type="info"
                message="A new login was detected on another device. You have been logged out. Please sign in again to continue."
              />
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color={COLORS.muted} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color={COLORS.muted} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={COLORS.muted} />
                  ) : (
                    <Eye size={18} color={COLORS.muted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={() => router.push('/forgot-password' as any)}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {error ? (
              <AlertBanner
                type="error"
                message={error}
                action={
                  error === 'This account uses Google Sign-In. Please sign in with Google.'
                    ? { label: 'Sign in with Google', onPress: () => handleGoogleSignIn() }
                    : undefined
                }
              />
            ) : null}

            {needsVerification && (
              <View style={styles.verifyBlock}>
                {resendMessage ? (
                  <AlertBanner
                    type={resendMessage.includes('sent') ? 'success' : 'error'}
                    message={resendMessage}
                  />
                ) : null}
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleResend}
                  disabled={resending}
                >
                  <RefreshCw size={16} color={COLORS.primary} strokeWidth={2} />
                  <Text style={styles.resendText}>
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={() => handleLogin()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleSignInButton onPress={() => handleGoogleSignIn()} loading={googleLoading} />

          <WhatsAppSignInButton onPress={() => router.push('/whatsapp-otp' as any)} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register' as any)}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={showConflictAlert}
        title="Already Signed In"
        message="Another device is already signed in to this account. Continue? That device will be logged out."
        type="destructive"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setShowConflictAlert(false) },
          { text: 'Continue', style: 'destructive', onPress: () => {
            setShowConflictAlert(false);
            if (conflictEmail) {
              handleLogin(true);
            } else {
              handleGoogleSignIn(true);
            }
          }},
        ]}
        onDismiss={() => setShowConflictAlert(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { marginTop: 40, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.fg, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.muted },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.fg },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: { 
    flex: 1, 
    paddingVertical: 14, 
    paddingLeft: 12,
    fontSize: 16, 
    color: COLORS.fg 
  },
  eyeButton: { padding: 4 },
  forgotButton: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  verifyBlock: { gap: 8 },
  resendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  resendText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: COLORS.muted, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: { fontSize: 15, color: COLORS.muted },
  linkText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
});
