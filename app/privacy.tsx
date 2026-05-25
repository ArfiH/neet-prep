import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const sections = [
  {
    label: 'DATA WE COLLECT',
    items: [
      { title: 'Account Info', body: 'We collect your email address, name, and NEET rank when you register.' },
      { title: 'Purchase Records', body: 'We store records of PDFs you purchase to grant and maintain your access.' },
    ],
  },
  {
    label: 'HOW WE USE YOUR DATA',
    items: [
      { title: 'App Functionality', body: 'Your data is used solely for authentication, purchase history, and college predictions.' },
      { title: 'No Third-Party Selling', body: 'We do not sell or share your personal data with third parties.' },
    ],
  },
  {
    label: 'PAYMENTS & SECURITY',
    items: [
      { title: 'Razorpay', body: 'Payments are processed securely by Razorpay. We never store your card or UPI details.' },
      { title: 'Password Security', body: 'Passwords are hashed using bcrypt and never stored in plain text. Access tokens expire after a short period.' },
    ],
  },
  {
    label: 'YOUR RIGHTS',
    items: [
      { title: 'Password Reset', body: 'You can reset your password at any time via the login screen.' },
      { title: 'Account Deletion', body: 'To delete your account and all data, email us at support@neetzymee.com. We\'ll process it within 7 business days.' },
    ],
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
        </TouchableOpacity>
        <Text style={styles.topbarText}>PRIVACY & SECURITY</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Privacy & Security</Text>
        <Text style={styles.subheading}>Last updated: May 2026</Text>

        {sections.map((section) => (
          <View key={section.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <View key={item.title} style={[styles.row, i < section.items.length - 1 && styles.rowBorder]}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowBody}>{item.body}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 6 },
  backCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  topbarText: { fontSize: 12, fontWeight: '600', color: COLORS.muted, fontFamily: monoFont, letterSpacing: 0.14 },

  content: { paddingHorizontal: 16, paddingTop: 12 },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.fg, letterSpacing: -0.01, marginBottom: 4, paddingHorizontal: 6 },
  subheading: { fontSize: 12, color: COLORS.muted, marginBottom: 20, paddingHorizontal: 6 },

  section: { marginBottom: 8 },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', fontFamily: monoFont, letterSpacing: 0.16, color: COLORS.muted, marginBottom: 10, paddingHorizontal: 6 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  row: { paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowTitle: { fontSize: 14, fontWeight: '600', color: COLORS.fg, marginBottom: 4 },
  rowBody: { fontSize: 13, color: COLORS.muted, lineHeight: 19 },
});
