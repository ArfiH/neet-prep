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
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useRootNavigation } from 'expo-router';
import * as Linking from 'expo-linking';
import { Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  
  const [tokenInput, setTokenInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Get token from deep link if present
  const urlToken = params.token || '';
  const token = tokenInput.trim() || urlToken;

  useEffect(() => {
    // Handle deep link if token comes in URL
    if (urlToken && !tokenInput) {
      setTokenInput(urlToken);
    }
  }, [urlToken]);

  async function handleReset() {
    setError('');
    setMessage('');

    if (!token) {
      setError('Please enter the reset code from your email');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      setMessage('Password reset successful! Redirecting to login...');
      
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
      
    } catch (e: any) {
      setError(e.message || 'Password reset failed. Please check your reset code.');
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
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.push('/login')}
          >
            <ArrowLeft size={22} color={COLORS.text} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the reset code from your email
            </Text>
          </View>

          <View style={styles.form}>
            {/* Token Input - Always Visible */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reset Code</Text>
              <View style={styles.inputContainer}>
                <KeyRound size={18} color={COLORS.textSecondary} strokeWidth={2} />
                <TextInput
                  style={[styles.input, isWideDevice && styles.inputWide]}
                  placeholder="Paste reset code from email"
                  placeholderTextColor={COLORS.textLight}
                  value={tokenInput}
                  onChangeText={setTokenInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.hintText}>
                Check your email for the reset code (check spam too)
              </Text>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color={COLORS.textSecondary} strokeWidth={2} />
                <TextInput
                  style={[styles.input, isWideDevice && styles.inputWide]}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={COLORS.textSecondary} />
                  ) : (
                    <Eye size={18} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color={COLORS.textSecondary} strokeWidth={2} />
                <TextInput
                  style={[styles.input, isWideDevice && styles.inputWide]}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Success Message */}
            {message ? <Text style={styles.successText}>{message}</Text> : null}

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const isWideDevice = Platform.OS === 'android' && Platform.constants.ReactNativeVersion?.minor >= 74;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    padding: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 22 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
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
    color: COLORS.text 
  },
  inputWide: {
    minWidth: 200,
  },
  eyeButton: { padding: 4 },
  hintText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
  successText: { color: COLORS.primary, fontSize: 14, textAlign: 'center' },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});