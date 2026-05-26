import { useState } from 'react';
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
  Alert,
} from 'react-native';
import { useRouter, Link, Router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/authContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';

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

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setNeedsVerification(false);
    setResendMessage('');

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.needs_verification) {
        setNeedsVerification(true);
        setError('Please verify your email before logging in');
      } else {
        setError(e.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed');
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {needsVerification && (
              <View style={styles.verifyBlock}>
                {resendMessage ? (
                  <Text style={resendMessage.includes('sent') ? styles.successText : styles.errorText}>
                    {resendMessage}
                  </Text>
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
              onPress={handleLogin}
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

          <GoogleSignInButton onPress={handleGoogleSignIn} loading={googleLoading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register' as any)}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  errorText: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
  successText: { color: COLORS.primary, fontSize: 14, textAlign: 'center', marginBottom: 8 },
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
