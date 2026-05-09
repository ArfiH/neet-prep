import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Clock, Image as ImageIcon, CheckCircle, ShoppingCart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '@/constants/colors';
import { api } from '@/lib/api';
import { addRecentlyViewed } from '@/lib/recentlyViewed';
import { SafeAreaView } from 'react-native-safe-area-context';

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
  file_url: string;
};

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function getTileBg(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes('anat')) return COLORS.tileAnatomy;
  if (lower.includes('phys')) return COLORS.tilePhysics;
  if (lower.includes('chem')) return COLORS.tileChemistry;
  if (lower.includes('bot')) return COLORS.tileBotany;
  if (lower.includes('zoo')) return COLORS.tileZoology;
  if (lower.includes('pyq') || lower.includes('prev')) return COLORS.tilePYQ;
  if (subject === 'Biology') return COLORS.tileBotany;
  if (subject === 'Physics') return COLORS.tilePhysics;
  if (subject === 'Chemistry') return COLORS.tileChemistry;
  return COLORS.tileAnatomy;
}

function getGlyphColor(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes('anat')) return COLORS.glyphAnatomy;
  if (lower.includes('phys')) return COLORS.glyphPhysics;
  if (lower.includes('chem')) return COLORS.glyphChemistry;
  if (lower.includes('bot')) return COLORS.glyphBotany;
  if (lower.includes('zoo')) return COLORS.glyphZoology;
  if (lower.includes('pyq') || lower.includes('prev')) return COLORS.glyphPYQ;
  if (subject === 'Biology') return COLORS.glyphBotany;
  if (subject === 'Physics') return COLORS.glyphPhysics;
  if (subject === 'Chemistry') return COLORS.glyphChemistry;
  return COLORS.glyphAnatomy;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

export default function PDFDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPdf();
  }, [id]);

  async function fetchPdf() {
    try {
      const data = await api.getPdfById(id);
      if (data) {
        setPdf(data);
        addRecentlyViewed(id);
      }
    } catch (e) {
      // ignore
    }
    setLoading(false);
  }

  function handleReadPdf() {
    if (!pdf?.file_url) {
      Alert.alert('Unavailable', 'This PDF file is not uploaded yet.');
      return;
    }
    router.push(`/pdf/viewer/${pdf.id}`);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!pdf) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={{ color: COLORS.fg }}>PDF not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const tileBg = getTileBg(pdf.subject);
  const glyphColor = getGlyphColor(pdf.subject);
  const gradientEnd = darkenColor(glyphColor, 40);
  const subjectLabel = pdf.subject.toUpperCase();
  const availLabel = pdf.is_free ? 'FREE' : `₹${pdf.price}`;

  const titleParts = pdf.title.split(' — ');
  const titleMain = titleParts[0];
  const titleAccent = titleParts.length > 1 ? titleParts.slice(1).join(' — ') : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
          </TouchableOpacity>
          <Text style={styles.topbarText}>PDF DETAIL · {subjectLabel}</Text>
        </View>

        {/* Hero Card */}
        <LinearGradient
          colors={[tileBg, gradientEnd + '66']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pdfHero}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>— {subjectLabel} · {availLabel}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {titleMain}
            {titleAccent ? <Text style={styles.heroAccent}> — {titleAccent}</Text> : null}
          </Text>
          <Text style={styles.heroDesc} numberOfLines={3}>{pdf.description || 'No description available.'}</Text>
        </LinearGradient>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>SUMMARY</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>What you'll cover</Text>
            <Text style={styles.summaryCardDesc}>{pdf.description || 'Comprehensive study material aligned with the latest NEET syllabus.'}</Text>
          </View>

          {/* Meta Pills */}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <BookOpen size={12} color={COLORS.muted} strokeWidth={1.2} />
              <Text style={styles.metaPillText}>{pdf.pages_count} pages</Text>
            </View>
            <View style={styles.metaPill}>
              <Clock size={12} color={COLORS.muted} strokeWidth={1.2} />
              <Text style={styles.metaPillText}>~{Math.ceil(pdf.pages_count / 2)} min read</Text>
            </View>
            <View style={styles.metaPill}>
              <ImageIcon size={12} color={COLORS.muted} strokeWidth={1.2} />
              <Text style={styles.metaPillText}>Diagrams</Text>
            </View>
            <View style={styles.metaPill}>
              <CheckCircle size={12} color={COLORS.muted} strokeWidth={1.2} />
              <Text style={styles.metaPillText}>NEET 2024 aligned</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={pdf.is_free ? styles.startBtn : styles.startBtnPaid}
          onPress={handleReadPdf}
        >
          {pdf.is_free ? (
            <Text style={styles.startBtnText}>Start reading — Free</Text>
          ) : (
            <>
              <ShoppingCart size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.startBtnText}>Buy Now — ₹{pdf.price}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 6 },
  backCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  topbarText: { fontSize: 12, fontWeight: '600', color: COLORS.muted, fontFamily: monoFont, letterSpacing: 0.14 },

  pdfHero: { marginHorizontal: 14, marginVertical: 8, paddingVertical: 20, paddingHorizontal: 18, borderRadius: 24, overflow: 'hidden' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.08)' },
  badgeText: { fontSize: 10, fontFamily: monoFont, letterSpacing: 0.14, color: COLORS.fg },
  heroTitle: { fontSize: 26, fontWeight: '700', color: COLORS.fg, lineHeight: 30, letterSpacing: -0.01, marginTop: 12, marginBottom: 6 },
  heroAccent: { fontFamily: serifFont, fontStyle: 'italic', color: COLORS.primaryDark },
  heroDesc: { fontSize: 12.5, color: COLORS.muted, lineHeight: 20, maxWidth: 280 },

  summary: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 10 },
  summaryLabel: { fontSize: 10.5, fontWeight: '700', fontFamily: monoFont, letterSpacing: 0.16, color: COLORS.muted, marginTop: 10, marginBottom: 10 },
  summaryCard: { padding: 14, borderRadius: 14, backgroundColor: COLORS.stage, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  summaryCardTitle: { fontSize: 13, fontWeight: '600', color: COLORS.fg, marginBottom: 6 },
  summaryCardDesc: { fontSize: 12, color: COLORS.muted, lineHeight: 18.6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  metaPillText: { fontSize: 10.5, fontFamily: monoFont, color: COLORS.muted },

  startBtn: { marginHorizontal: 18, marginVertical: 10, paddingVertical: 14, borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  startBtnPaid: { marginHorizontal: 18, marginVertical: 10, paddingVertical: 14, borderRadius: 999, backgroundColor: COLORS.fg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  startBtnText: { fontSize: 14, fontWeight: '600', color: '#fff', letterSpacing: 0.04 },
});
