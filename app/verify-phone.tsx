import { useState, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import AlertBanner from '@/components/AlertBanner';

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown() {
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function normalizedPhone() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]/.test(digits)) return '91' + digits;
    return digits;
  }

  function isValidPhone() {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 && /^[6-9]/.test(digits);
  }

  async function handleSendOtp() {
    if (!isValidPhone()) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.sendSecondaryPhoneOtp(normalizedPhone());
      setStep('otp');
      startCooldown();
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.verifySecondaryPhone(normalizedPhone(), otp);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setError(e.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setOtp('');
    setError('');
    setLoading(true);
    try {
      await api.sendSecondaryPhoneOtp(normalizedPhone());
      startCooldown();
    } catch (e: any) {
      setError(e.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }}>
            <ArrowLeft size={20} color={COLORS.muted} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Phone size={28} color={COLORS.primary} strokeWidth={2} />
            </View>
            <Text style={styles.title}>
              {step === 'phone' ? 'Verify your phone' : 'Enter OTP'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'Add your phone number to your profile. We\'ll send a verification code via WhatsApp.'
                : `OTP sent to +91 ${phone.replace(/\D/g, '')}`}
            </Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.prefix}>+91</Text>
                  <View style={styles.prefixDivider} />
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={COLORS.placeholder}
                    value={phone}
                    onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="number-pad"
                    maxLength={10}
                    autoFocus
                  />
                </View>
              </View>

              {error ? <AlertBanner type="error" message={error} /> : null}

              <TouchableOpacity
                style={[styles.button, (!isValidPhone() || loading) && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={!isValidPhone() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Code on WhatsApp</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-digit OTP</Text>
                <View style={styles.inputContainer}>
                  <Phone size={18} color={COLORS.muted} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    placeholderTextColor={COLORS.placeholder}
                    value={otp}
                    onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
              </View>

              {error ? <AlertBanner type="error" message={error} /> : null}

              <TouchableOpacity
                style={[styles.button, (otp.length !== 6 || loading) && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={otp.length !== 6 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Phone</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resendBtn, cooldown > 0 && styles.resendBtnDisabled]}
                onPress={handleResend}
                disabled={cooldown > 0 || loading}
              >
                <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeNumberBtn}
                onPress={() => { setStep('phone'); setOtp(''); setError(''); }}
              >
                <Text style={styles.changeNumberText}>Change number</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  header: { alignItems: 'center', marginBottom: 36 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.fg, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
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
  prefix: { fontSize: 16, fontWeight: '600', color: COLORS.fg, paddingVertical: 14 },
  prefixDivider: { width: 1, height: 22, backgroundColor: COLORS.border, marginHorizontal: 10 },
  input: { flex: 1, paddingVertical: 14, paddingLeft: 4, fontSize: 16, color: COLORS.fg },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  resendBtn: { alignItems: 'center', paddingVertical: 10 },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  resendTextDisabled: { color: COLORS.muted },
  changeNumberBtn: { alignItems: 'center', paddingVertical: 6 },
  changeNumberText: { fontSize: 13, color: COLORS.muted },
});
