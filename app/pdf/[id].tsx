import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Lock, Download, User, FileText, Tag, ShoppingCart, CircleCheck as CheckCircle } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { supabase } from '@/backend/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  author: string;
  price: number;
  is_free: boolean;
  cover_image_url: string;
  pages_count: number;
  tags: string[];
  downloads: number;
  created_at: string;
};

const SAMPLE_CONTENTS = [
  'Chapter 1: Introduction & Fundamentals',
  'Chapter 2: Core Concepts & Definitions',
  'Chapter 3: Important Diagrams & Illustrations',
  'Chapter 4: Previous Year Questions Analysis',
  'Chapter 5: Practice Questions with Solutions',
  'Chapter 6: Quick Revision Notes',
  'Chapter 7: High-Yield Topics for NEET',
];

export default function PDFDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPdf();
  }, [id]);

  async function fetchPdf() {
    const { data } = await supabase.from('pdfs').select('*').eq('id', id).maybeSingle();
    if (data) setPdf(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!pdf) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <Text style={{ color: COLORS.text }}>PDF not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={22} color={COLORS.text} strokeWidth={2.5} />
      </TouchableOpacity>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: pdf.cover_image_url || 'https://images.pexels.com/photos/4855428/pexels-photo-4855428.jpeg' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={[styles.subjectBadge]}>
              <Text style={styles.subjectBadgeText}>{pdf.subject}</Text>
            </View>
          </View>
        </View>

        {/* Main Info */}
        <View style={styles.mainCard}>
          <Text style={styles.title}>{pdf.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <User size={13} color={COLORS.textSecondary} strokeWidth={2} />
              <Text style={styles.metaText}>{pdf.author || 'Unknown Author'}</Text>
            </View>
            <View style={styles.metaItem}>
              <FileText size={13} color={COLORS.textSecondary} strokeWidth={2} />
              <Text style={styles.metaText}>{pdf.pages_count} pages</Text>
            </View>
            <View style={styles.metaItem}>
              <Download size={13} color={COLORS.textSecondary} strokeWidth={2} />
              <Text style={styles.metaText}>{pdf.downloads} downloads</Text>
            </View>
          </View>

          {/* Tags */}
          {pdf.tags && pdf.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {pdf.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.sectionLabel}>About this PDF</Text>
            <Text style={styles.description}>{pdf.description || 'No description available.'}</Text>
          </View>

          {/* Table of Contents Preview */}
          <View style={styles.tocSection}>
            <Text style={styles.sectionLabel}>Contents Preview</Text>
            {SAMPLE_CONTENTS.map((chapter, idx) => (
              <View key={idx} style={styles.tocItem}>
                <View style={styles.tocNumber}>
                  <Text style={styles.tocNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.tocText}>{chapter}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.priceBlock}>
          {pdf.is_free ? (
            <>
              <Text style={styles.freeLabel}>FREE</Text>
              <Text style={styles.freeHint}>Watch ad to access</Text>
            </>
          ) : (
            <>
              <Text style={styles.price}>₹{pdf.price}</Text>
              <Text style={styles.priceHint}>One-time purchase</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.ctaBtn, pdf.is_free ? styles.freeCta : styles.paidCta]}
          activeOpacity={0.85}
        >
          {pdf.is_free ? (
            <>
              <BookOpen size={18} color="#fff" strokeWidth={2.5} />
              <Text style={styles.ctaBtnText}>Read Free PDF</Text>
            </>
          ) : (
            <>
              <ShoppingCart size={18} color="#fff" strokeWidth={2.5} />
              <Text style={styles.ctaBtnText}>Buy Now ₹{pdf.price}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  backBtn: {
    position: 'absolute',
    top: 54,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 12,
    ...SHADOWS.md,
  },

  container: { flex: 1 },

  heroContainer: { height: 240, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  subjectBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subjectBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  mainCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, lineHeight: 28 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { backgroundColor: COLORS.primarySurface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  descSection: { marginTop: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },

  tocSection: { marginTop: 20 },
  tocItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  tocNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tocNumberText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  tocText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 19 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },
  priceBlock: {},
  price: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  priceHint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  freeLabel: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  freeHint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  freeCta: { backgroundColor: COLORS.primary },
  paidCta: { backgroundColor: '#D97706' },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
