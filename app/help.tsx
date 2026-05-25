import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useState } from 'react';

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const faqs = [
  {
    q: 'How do I access a free PDF?',
    a: 'Tap any PDF marked FREE and press "Start reading". Free PDFs are available instantly without any payment.',
  },
  {
    q: 'How do I purchase a paid PDF?',
    a: 'Tap the PDF you want, then press "Buy Now". You\'ll be taken to a secure Razorpay checkout. After payment, the PDF is permanently added to your library.',
  },
  {
    q: 'Where can I find my purchased PDFs?',
    a: 'Go to Profile → My Purchased PDFs. All your purchases are listed there and available to read anytime.',
  },
  {
    q: 'Can I read PDFs offline?',
    a: 'Currently PDFs require an internet connection to load. Offline support may be added in a future update.',
  },
  {
    q: 'How does the College Predictor work?',
    a: 'Enter your NEET rank and category in the College tab. The predictor compares your rank against historical cutoffs to estimate your admission chances.',
  },
  {
    q: 'I paid but can\'t access the PDF. What do I do?',
    a: 'First, check your internet connection and reopen the app. If the issue persists, contact us at support@neetzymee.com with your payment ID and we\'ll resolve it promptly.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, tap "Forgot Password". Enter your email and we\'ll send a reset link.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. Payments are handled entirely by Razorpay. We never see or store your card or UPI details.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
        </TouchableOpacity>
        <Text style={styles.topbarText}>HELP & FAQ</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Help & FAQ</Text>
        <Text style={styles.subheading}>Tap a question to expand the answer.</Text>

        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.item, isOpen && styles.itemOpen]}
              onPress={() => setOpenIndex(isOpen ? null : i)}
              activeOpacity={0.8}
            >
              <View style={styles.itemRow}>
                <Text style={styles.question}>{item.q}</Text>
                {isOpen
                  ? <ChevronUp size={16} color={COLORS.muted} strokeWidth={2} />
                  : <ChevronDown size={16} color={COLORS.muted} strokeWidth={2} />
                }
              </View>
              {isOpen && <Text style={styles.answer}>{item.a}</Text>}
            </TouchableOpacity>
          );
        })}

        <Text style={styles.contact}>Still need help? Email us at{'\n'}
          <Text style={styles.contactEmail}>support@neetzymee.com</Text>
        </Text>

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
  content: { paddingHorizontal: 22, paddingTop: 12 },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.fg, letterSpacing: -0.01, marginBottom: 4 },
  subheading: { fontSize: 12, color: COLORS.muted, marginBottom: 20 },
  item: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: COLORS.surface },
  itemOpen: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  question: { fontSize: 13, fontWeight: '600', color: COLORS.fg, flex: 1, lineHeight: 19 },
  answer: { fontSize: 13, color: COLORS.muted, lineHeight: 20, marginTop: 10 },
  contact: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 24, lineHeight: 20 },
  contactEmail: { color: COLORS.primary, fontWeight: '600' },
});
