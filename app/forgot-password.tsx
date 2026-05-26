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
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/authContext';
import AlertBanner from '@/components/AlertBanner';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const msg = await forgotPassword(email);
      setMessage(msg);
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace('/login' as any)}
          >
            <ArrowLeft size={22} color={COLORS.fg} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password
            </Text>
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

            {message ? (
              <AlertBanner
                type="success"
                message={message}
                action={{ label: 'Already have a reset code? Enter it here', onPress: () => router.push('/reset-password') }}
              />
            ) : null}

            {error ? <AlertBanner type="error" message={error} /> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backToLogin}
              onPress={() => router.push('/login' as any)}
            >
              <Text style={styles.backToLoginText}>Remember your password? </Text>
              <Text style={styles.linkText}>Sign In</Text>
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 12,
    ...SHADOWS.md,
  },
  header: { marginTop: 50, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.fg, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.muted, lineHeight: 22 },
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
  haveCodeButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  haveCodeText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  backToLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  backToLoginText: { fontSize: 15, color: COLORS.muted },
  linkText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
});
