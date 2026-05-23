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
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Target, GraduationCap, Check } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'PwD'];

export default function SetTargetScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentTarget();
  }, []);

  async function loadCurrentTarget() {
    try {
      const profile = await api.getProfile();
      if (profile) {
        setRank(profile.neet_rank?.toString() || '');
        setCategory(profile.category || 'General');
      }
    } catch (e) {
      console.log('Error loading target:', e);
    } finally {
      setInitialLoading(false);
    }
  }

  async function handleSave() {
    const rankNum = rank ? parseInt(rank, 10) : 0;
    
    if (rank && (isNaN(rankNum) || rankNum <= 0)) {
      Alert.alert('Invalid Rank', 'Please enter a valid NEET rank number');
      return;
    }

    setSaving(true);
    try {
      await api.updateProfile({
        neet_rank: rankNum || undefined,
        category,
      });
      
      // Refresh user data in auth context
      await refreshUser();
      
      Alert.alert('Success', 'Target updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update target');
    } finally {
      setSaving(false);
    }
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
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
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={COLORS.fg} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Target size={28} color={COLORS.primary} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Set NEET Target</Text>
            <Text style={styles.subtitle}>
              Add your target rank and category to get personalized college predictions
            </Text>
          </View>

          <View style={styles.form}>
            {/* NEET Rank Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target NEET Rank</Text>
              <View style={styles.inputContainer}>
                <GraduationCap size={18} color={COLORS.muted} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your target rank"
                  placeholderTextColor={COLORS.placeholder}
                  value={rank}
                  onChangeText={setRank}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <Text style={styles.hintText}>
                Your All India NEET rank from the entrance exam
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryItem,
                      category === cat && styles.categoryItemSelected,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.categoryTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                    {category === cat && (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Target</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 16 },
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
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.fg, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  
  form: { gap: 24, marginBottom: 24 },
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
  hintText: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: { fontSize: 14, fontWeight: '500', color: COLORS.fg },
  categoryTextSelected: { color: '#fff' },
  
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
