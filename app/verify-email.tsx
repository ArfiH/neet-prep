import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, KeyRound } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/authContext';
import AlertBanner from '@/components/AlertBanner';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const { verifyEmail, resendVerification } = useAuth();

  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualVerifying, setManualVerifying] = useState(false);

  const email = params.email || '';

  useEffect(() => {
    if (params.token) {
      handleVerify(params.token);
    }
  }, [params.token]);

  async function handleVerify(token: string) {
    setStatus('verifying');
    setError('');
    try {
      await verifyEmail(token);
      setStatus('verified');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Verification failed. The link may have expired.');
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

  // Deep link mode — verifying token
  if (params.token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          {status === 'verifying' && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.centerTitle}>Verifying your email...</Text>
            </View>
          )}

          {status === 'verified' && (
            <View style={styles.centerContent}>
              <View style={styles.successIcon}>
                <CheckCircle2 size={48} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Text style={styles.centerTitle}>Email Verified!</Text>
              <Text style={styles.centerSubtitle}>Redirecting to the app...</Text>
            </View>
          )}

          {status === 'error' && (
            <View style={styles.centerContent}>
              <Text style={styles.centerTitle}>Verification Failed</Text>
              <AlertBanner type="error" message={error} />
              <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Post-registration mode — no token, show instructions
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/login')}>
          <ArrowLeft size={22} color={COLORS.fg} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.mailIcon}>
            <Mail size={40} color={COLORS.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a verification email to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Open your email</Text>
              <Text style={styles.stepDesc}>Check your inbox (and spam folder)</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Tap "Verify Email"</Text>
              <Text style={styles.stepDesc}>This will open the app automatically</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Start using NEET Zymee</Text>
              <Text style={styles.stepDesc}>You'll be logged in automatically</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.manualToggle}
          onPress={() => setShowManualInput(!showManualInput)}
          activeOpacity={0.7}
        >
          <Text style={styles.manualToggleText}>Didn't get redirected?</Text>
          {showManualInput ? <ChevronUp size={16} color={COLORS.muted} /> : <ChevronDown size={16} color={COLORS.muted} />}
        </TouchableOpacity>

        {showManualInput && (
          <View style={styles.manualInputSection}>
            <Text style={styles.manualInputLabel}>Paste the verification code from your email</Text>
            <View style={styles.manualInputRow}>
              <KeyRound size={16} color={COLORS.muted} strokeWidth={2} />
              <TextInput
                style={styles.manualInput}
                placeholder="Paste verification code here"
                placeholderTextColor={COLORS.placeholder}
                value={manualToken}
                onChangeText={setManualToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.manualVerifyBtn, (!manualToken || manualVerifying) && styles.manualVerifyBtnDisabled]}
              onPress={async () => {
                if (!manualToken) return;
                setManualVerifying(true);
                setError('');
                try {
                  await verifyEmail(manualToken);
                  setStatus('verified');
                  setTimeout(() => router.replace('/(tabs)'), 2000);
                } catch (e: any) {
                  setError(e.message || 'Verification failed');
                } finally {
                  setManualVerifying(false);
                }
              }}
              disabled={!manualToken || manualVerifying}
            >
              {manualVerifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.manualVerifyText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {error && !status ? (
          <AlertBanner type="error" message={error} />
        ) : null}

        {resendMessage ? (
          <AlertBanner
            type={resendMessage.includes('failed') || resendMessage.includes('error') ? 'error' : 'success'}
            message={resendMessage}
          />
        ) : null}

        <TouchableOpacity
          style={[styles.resendBtn, resending && styles.resendBtnDisabled]}
          onPress={handleResend}
          disabled={resending}
        >
          <RefreshCw size={16} color={resending ? COLORS.muted : COLORS.primary} strokeWidth={2} />
          <Text style={[styles.resendText, resending && styles.resendTextDisabled]}>
            {resending ? 'Sending...' : 'Resend Email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/login')}>
          <Text style={styles.loginBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, padding: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  centerContent: { alignItems: 'center', gap: 16 },
  centerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.fg, textAlign: 'center' },
  centerSubtitle: { fontSize: 15, color: COLORS.muted, textAlign: 'center' },
  successIcon: { marginBottom: 8 },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  header: { alignItems: 'center', marginBottom: 32 },
  mailIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.fg, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
  emailText: { fontWeight: '600', color: COLORS.fg },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    gap: 16,
  },
  stepRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: COLORS.fg, marginBottom: 2 },
  stepDesc: { fontSize: 13, color: COLORS.muted },

  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resendBtnDisabled: { opacity: 0.6 },
  resendText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  resendTextDisabled: { color: COLORS.muted },

  loginBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  loginBtnText: { fontSize: 15, color: COLORS.muted, fontWeight: '500' },

  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 16,
  },
  manualToggleText: { fontSize: 14, color: COLORS.muted, fontWeight: '500' },

  manualInputSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 12,
  },
  manualInputLabel: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.stage,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 12,
  },
  manualInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    color: COLORS.fg,
  },
  manualVerifyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  manualVerifyBtnDisabled: { opacity: 0.6 },
  manualVerifyText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});